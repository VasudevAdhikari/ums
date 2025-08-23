from django.shortcuts import render, redirect
from authorization.models import Assessment, Student, AssessmentResult
from django.contrib import messages
from django.core.files.storage import FileSystemStorage
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.db import transaction
import json, os
from course_management import settings
from datetime import datetime
# from additional_business_logic.formatter import get_avatar

def save_specific_image(images, target_filename):
    # images: list of InMemoryUploadedFile
    for image in images:
        if image.name == target_filename:
            fs = FileSystemStorage(location=os.path.join(settings.MEDIA_ROOT, 'quiz'))
            filename = fs.save(image.name, image)  # automatically handles conflicts
            return filename  # returns saved file name like 'question_0_option_0_img_cybersecurity.jpg'
    return None  # if not found


def get_quiz_data(assessment: Assessment):
    quiz_data = assessment.assessment
    quiz_data['start_time'] = assessment.assigned_date.strftime('%Y-%m-%dT%H:%M:%S') if assessment.assigned_date else None
    quiz_data['end_time'] = assessment.due_date.strftime('%Y-%m-%dT%H:%M:%S') if assessment.due_date else None
    print(quiz_data)
    return quiz_data


def show_quiz_creation(request, assessment_id):
    try:
        assessment = Assessment.objects.get(id=int(assessment_id))
        batch_instructor = assessment.assessment_scheme.batch_instructor
        
        semester_name = batch_instructor.batch.semester.semester_name

        # to fix (select all the students related to this batch)
        students = Student.objects.filter(
            sisform__enrollment__enrollmentcourse__batch_instructor=batch_instructor
        ).select_related(
            'user',
        )
        student_data = []
        for student in students:
            avatar = "".join(word[0] for word in student.user.full_name.split()).upper()[:2]
            student_data.append({
                'id': student.user.pk,
                'name': student.user.full_name,
                'email': student.user.email,
                'roll_no': student.roll_no,
                'avatar': avatar,
            })

        data = {
            'assessment': assessment,
            'semester_name': semester_name,
            'students': student_data,
            'batch_instructor_id': batch_instructor.id,
            'quiz_data': json.dumps(get_quiz_data(assessment)),
        }
        return render(request, 'faculty/quiz_creation.html', context=data)
    except Exception as e:
        print(e)
        messages.error(request, f"error showing quiz {e}")
        return redirect(f'/faculty/course_management/{batch_instructor.id}')
    
@csrf_exempt
def create_quiz(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'POST request required.'}, status=400)

    try:
        if 'multipart/form-data' in request.content_type:
            quiz_json = request.POST.get('quiz')
            quiz_data = json.loads(quiz_json) if quiz_json else {}
        else:
            quiz_data = json.loads(request.body.decode('utf-8'))

        questions = quiz_data.get('questions', [])
        images = request.FILES.getlist('images')

        # Use atomic transaction for consistency
        with transaction.atomic():
            for question in questions:
                # Handle question image
                orig_question_image = question.get('question_image')
                saved_question_image = save_specific_image(images, orig_question_image)
                if orig_question_image is None or orig_question_image == 'null':
                    # Image deleted
                    question['question_image'] = None
                elif saved_question_image:
                    # New image uploaded
                    question['question_image'] = saved_question_image
                else:
                    # Keep old image filename
                    question['question_image'] = orig_question_image

                for option in question.get('options', []):
                    orig_option_image = option.get('option_image')
                    saved_option_image = save_specific_image(images, orig_option_image)
                    if orig_option_image is None or orig_option_image == 'null':
                        option['option_image'] = None
                    elif saved_option_image:
                        option['option_image'] = saved_option_image
                    else:
                        option['option_image'] = orig_option_image

            start_time = request.POST.get('start_time')
            end_time = request.POST.get('end_time')
            print(start_time, end_time, sep='\n==============\n')

            # Parse ISO format safely if needed
            if start_time:
                start_time = timezone.make_aware(datetime.fromisoformat(start_time))
            if end_time:
                end_time = timezone.make_aware(datetime.fromisoformat(end_time))

            

            print(quiz_data)
            assessment = Assessment.objects.get(id=int(request.POST.get('assessment_id')))
            assessment.assessment = quiz_data
            assessment.due_date = end_time
            assessment.assigned_date = start_time
            assessment.save()

            print(assessment.due_date, assessment.assigned_date, sep='\n==============\n')

        return JsonResponse({'success': True, 'message': 'Quiz saved successfully.'})

    except Exception as e:
        print("Error in create_quiz:", e)
        return JsonResponse({'success': False, 'error': str(e)}, status=500) 
    
def show_quiz_results(request, quiz_id):
    quiz_results = AssessmentResult.objects.filter(
        assessment__id=quiz_id
    ).select_related('assessment', 'student', 'student__user')

    quiz_name = quiz_results[0].assessment.assessment.get('title') if quiz_results else ''

    data = {
        'quiz_results': quiz_results,
        'quiz_name': quiz_name,
    }
    return render(request, 'faculty/quiz_results.html', context=data)

