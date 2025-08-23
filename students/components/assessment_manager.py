from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from authorization.models import Assessment, AssessmentResult, Student, AssessmentType, User, BatchInstructor
import json, os
from datetime import datetime
from django.utils.timezone import now
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from datetime import datetime

def show_assessment_submission(request, assessment_id):
    type = request.GET.get('type')
    if type in (
        AssessmentType.CLASS_PARTICIPATION, 
        AssessmentType.FINAL_ONPAPER, 
        AssessmentType.MIDTERM, 
        AssessmentType.TUTORIAL
    ):
        return render(request, 'htmls/access_denied.html', {'message': 'You cannot view or submit this assessment'})

    assessment = Assessment.objects.get(id=assessment_id)
    # Assigned date check
    if not assessment.assigned_date or assessment.assigned_date > now():
        return render(request, 'htmls/access_denied.html', {
            'message': 'You cannot view or submit this assessment. The assessment time has not started yet.'
        })
    
    email = request.COOKIES.get('my_user')
    student = User.objects.filter(
        email=email
    ).first()
    if student.pk not in assessment.assessment.get('students'):
        return render(request, 'htmls/access_denied.html', {'message': 'You cannot view or submit this assessment. This assessment is not assigned for you.'})
    
    if type==AssessmentType.QUIZ:
        return redirect(f'/students/academics/quiz/{assessment.id}')
    
    if AssessmentResult.objects.filter(student__user=student,assessment=assessment).exists():
        return redirect(f'/students/academics/submitted_assessment/{assessment.id}')
        # Due date check
    if assessment.due_date < now():
        return render(request, 'htmls/access_denied.html', {
            'message': f'You cannot view or submit this assessment. The assignment was due by {assessment.due_date.strftime("%d.%m.%Y (%H:%M)")}'
        })
    data = {
        'assessment': assessment,
    }
    return render(request, 'students/academic/assessment.html', context=data)

# @login_required
@csrf_exempt
def submit_assessment(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid request method'})
    
    try:
        assessment_id = request.POST.get('assessment_id')
        start_time = request.POST.get('start_time')
        total_time_taken = request.POST.get('total_time_taken')
        
        if not assessment_id:
            return JsonResponse({'success': False, 'message': 'Assessment ID is required'})
        
        # Get the assessment
        assessment = Assessment.objects.get(id=assessment_id)
        
        # Get the student
        student = Student.objects.get(user__username=request.COOKIES.get('my_user'))
        
        # Check if assessment result already exists
        existing_result = AssessmentResult.objects.filter(
            assessment=assessment,
            student=student
        ).first()

        print(existing_result)
        
        if existing_result:
            return JsonResponse({'success': False, 'message': 'Assessment already submitted'})
        
        # Handle file uploads
        uploaded_files = []
        uploaded_images = []
        
        # Process uploaded images
        for key in request.FILES:
            if key.startswith('images['):
                file = request.FILES[key]
                if file.content_type.startswith('image/'):
                    file_path = f'assessment_submissions/images/{assessment_id}_{student.pk}_{file.name.replace(" ", "")}'
                    saved_path = default_storage.save(file_path, ContentFile(file.read()))
                    uploaded_images.append(saved_path)
        
        # Process uploaded files
        for key in request.FILES:
            if key.startswith('files['):
                file = request.FILES[key]
                file_path = f'assessment_submissions/files/{assessment_id}_{student.pk}_{file.name.replace(" ", "")}'
                saved_path = default_storage.save(file_path, ContentFile(file.read()))
                uploaded_files.append(saved_path)
        
        # Create assessment result with timing data
        answer_data = {
            'images': uploaded_images,
            'files': uploaded_files,
            'submitted_at': datetime.now().isoformat(),
            'start_time': start_time,
            'total_time_taken': int(total_time_taken) if total_time_taken else 0,
            'total_time_taken_formatted': formatTimeTaken(int(total_time_taken)) if total_time_taken else '0 minutes'
        }

        print(answer_data)
        
        assessment_result = AssessmentResult.objects.create(
            assessment=assessment,
            student=student,
            answer=answer_data,
            mark=0  # Default mark, will be updated by instructor
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Assessment submitted successfully',
            'result_id': assessment_result.id
        })
        
    except Assessment.DoesNotExist as e:
        print(e)
        return JsonResponse({'success': False, 'message': 'Assessment not found'})
    except Student.DoesNotExist as e:
        print(e)
        return JsonResponse({'success': False, 'message': 'Student not found'})
    except Exception as e:
        print(e)
        return JsonResponse({'success': False, 'message': f'Error: {str(e)}'})
def formatTimeTaken(milliseconds):
    """Format time taken in milliseconds to human readable format"""
    if milliseconds < 60000:  # Less than 1 minute
        seconds = milliseconds // 1000
        return f"{seconds} seconds"
    elif milliseconds < 3600000:  # Less than 1 hour
        minutes = milliseconds // 60000
        seconds = (milliseconds % 60000) // 1000
        return f"{minutes} minutes {seconds} seconds"
    else:  # 1 hour or more
        hours = milliseconds // 3600000
        minutes = (milliseconds % 3600000) // 60000
        return f"{hours} hours {minutes} minutes"
    

def show_submitted_assessment(request, assessment_id):
    try:
        print('something')
        result = AssessmentResult.objects.filter(
            pk=assessment_id
        ).select_related('student', 'student__user', 'assessment').first()
        print(result)
        return render(request, 'students/academic/submitted_assessment.html', {'result': result})
    except Student.DoesNotExist:
        return render(request, 'students/academic/submitted_assessment.html', {'result': None, 'error': 'Student not found.'})
    except AssessmentResult.DoesNotExist:
        return render(request, 'students/academic/submitted_assessment.html', {'result': None, 'error': 'Assessment result not found.'})
    except Exception as e:
        return render(request, 'students/academic/submitted_assessment.html', {'result': None, 'error': str(e)})
    

def show_all_assessment_results(request, batch_instructor_id):
    batch_instructor = BatchInstructor.objects.filter(
        pk=int(batch_instructor_id),
    ).select_related(
        'instructor__user',
        'course',
        'instructor__department',
        'batch__term',
        'batch__semester',
        'batch__semester__degree'
    ).first()

    assessment_results = AssessmentResult.objects.filter(
        assessment__assessment_scheme__batch_instructor_id=batch_instructor_id,
        student__user__email=request.COOKIES.get('my_user'),
    ).select_related(
        'assessment'
    )
    given_total = 0
    marking_scheme = batch_instructor.course.marking_scheme
    for assessment, percent in marking_scheme.items():
        if assessment != "Final":
            given_total+=percent

    all_results = {}
    for ar in assessment_results:
        assessment_type = ar.assessment.get_assessment_type_display()
        if all_results.get(assessment_type):
            all_results[assessment_type]+=ar.mark
        else:
            all_results[assessment_type]=ar.mark

    got_total = 0
    for _, marks in all_results.items():
        got_total+=marks

    data = {
        'batch_instructor': batch_instructor,
        'assessment_results': assessment_results,
        'got_total': got_total,
        'given_total': given_total,
        'percentage': got_total * 100 / given_total,
    }
    return render(request, 'students/academic/all_results.html', context=data)