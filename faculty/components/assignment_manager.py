from django.shortcuts import render, redirect
from authorization.models import Assessment, AssessmentType, Student, AssessmentResult
from django.contrib import messages
from django.core.files.storage import FileSystemStorage
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
import json, os
from course_management import settings
from datetime import datetime

def save_specific_file(files, target_filename, subdir):
    for f in files:
        if f.name == target_filename:
            fs = FileSystemStorage(location=os.path.join(settings.MEDIA_ROOT, subdir))
            filename = fs.save(f.name, f)
            return filename
    return None

def get_assignment_data(assessment: Assessment):
    assignment_data = assessment.assessment
    assignment_data['start_time'] = assessment.assigned_date.strftime('%Y-%m-%dT%H:%M:%S') if assessment.assigned_date else None
    assignment_data['end_time'] = assessment.due_date.strftime('%Y-%m-%dT%H:%M:%S') if assessment.due_date else None
    return assignment_data

def show_assignment_creation(request, assessment_id):
    try:
        assessment = Assessment.objects.get(id=int(assessment_id))
        batch_instructor = assessment.assessment_scheme.batch_instructor
        semester_name = batch_instructor.batch.semester.semester_name


        # to fix later => Students related to the related batch
        students = Student.objects.all().select_related('user')
        students = Student.objects.filter(
            sisform__enrollment__enrollmentcourse__batch_instructor = batch_instructor
        ).select_related('user')
        student_data = []
        for student in students:
            avatar = "".join(word[0] for word in student.user.full_name.split()).upper()[:2]
            student_data.append({
                'id': student.user.pk,
                'name': student.user.full_name,
                'email': student.user.email,
                'semester': semester_name,
                'avatar': avatar,
            })

        data = {
            'assessment': assessment,
            'assessment_type': assessment.get_assessment_type_display(),
            'semester_name': semester_name,
            'students': student_data,
            'batch_instructor_id': batch_instructor.id,
            'assignment_data': json.dumps(get_assignment_data(assessment)),
        }
        return render(request, 'faculty/assignment_creation.html', context=data)
    
    except Exception as e:
        print(e)
        messages.error(request, f"error showing assignment {e}")
        return redirect(f'/faculty/course_management/{batch_instructor.id}')

@csrf_exempt
def create_assignment(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'POST request required.'}, status=400)

    try:
        if 'multipart/form-data' in request.content_type:
            assignment_json = request.POST.get('assignment')
            assignment_data = json.loads(assignment_json) if assignment_json else {}
        else:
            assignment_data = json.loads(request.body.decode('utf-8'))

        files = request.FILES.getlist('files')
        images = request.FILES.getlist('images')

        with transaction.atomic():
            # Handle files
            file_names = assignment_data.get('files', [])
            saved_files = []
            for fname in file_names:
                saved = save_specific_file(files, fname, 'assignment_files')
                if saved:
                    saved_files.append(saved)
                else:
                    saved_files.append(fname)  # keep old if not re-uploaded
            assignment_data['files'] = saved_files

            # Handle images
            image_names = assignment_data.get('images', [])
            saved_images = []
            for iname in image_names:
                saved = save_specific_file(images, iname, 'assignment_images')
                if saved:
                    saved_images.append(saved)
                else:
                    saved_images.append(iname)
            assignment_data['images'] = saved_images

            start_time = request.POST.get('start_time')
            end_time = request.POST.get('end_time')

            if start_time:
                start_time = timezone.make_aware(datetime.fromisoformat(start_time))
            if end_time:
                end_time = timezone.make_aware(datetime.fromisoformat(end_time))

            assessment = Assessment.objects.get(id=int(request.POST.get('assessment_id')))
            assessment.assessment = assignment_data
            assessment.due_date = end_time
            assessment.assigned_date = start_time

            assessment.save()
                        

        return JsonResponse({'success': True, 'message': 'Assignment saved successfully.'})

    except Exception as e:
        print("Error in create_assignment:", e)
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
    
def show_assessment_submissions(request, assessment_id):
    assessment_submissions = AssessmentResult.objects.filter(
        assessment__id=assessment_id
    ).select_related(
        'assessment',
        'student',
        'student__user',
    )

    data = {
        'assessment_submissions': assessment_submissions,
    }
    print(data)

    return render(request, 'faculty/assessment_submissions.html', context=data)


def update_assessment_mark(request, assessment_id, mark):
    try:
        assessment = AssessmentResult.objects.get(pk=assessment_id)
        assessment.mark = mark
        assessment.save()
        return JsonResponse({'success': True, 'message': 'Mark updated successfully'})
    except Exception as e:
        print(e)
        return JsonResponse({'success': False, 'error': f"{e}"})