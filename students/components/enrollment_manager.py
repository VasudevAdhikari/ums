from django.shortcuts import render, redirect
from django.http import JsonResponse
from authorization.models import EnrollmentStatus, Term, Batch, Course, SISForm, Enrollment
from django.views.decorators.csrf import csrf_exempt
from django.core import serializers
from django.core.cache import cache
from django.contrib import messages
import json

# Enrollment page view

def show_enrollment_page(request):
    sis_form = SISForm.objects.filter(
        student__user__email=request.COOKIES.get('my_user')
    )
    if not sis_form.exists():
        messages.warning(request, 'You cannot enroll without filling SISForm')
        return redirect('/students/personal/sis_form')
    term = Term.objects.all().order_by('-id').first()
    return render(request, 'students/personal/enrollment.html', {'term': term})

# AJAX: Get batches for a selected term
@csrf_exempt
def get_batches_for_term(request):
    term_id = request.GET.get('term_id')

    enrollments = Enrollment.objects.filter(
        enrollment_status=EnrollmentStatus.APPROVED,
        sis_form=SISForm.objects.filter(student__user__email=request.COOKIES.get('my_user')).first()
    ).select_related(
        'batch', 'batch__semester'
    )

    if not term_id:
        return JsonResponse({'success': False, 'error': 'No term_id provided'})
    
    batches = None
    if enrollments.exists():
        last_enrollment = enrollments.last()
        fail_count = 0
        failed_subjects = []
        results = last_enrollment.result

        if not results or not results.get('data'):
            batches = list(
                Batch.objects.filter(
                    term_id=term_id,
                    semester=last_enrollment.batch.semester
                ).values('id', 'name', 'semester__degree__code')
            )
            return JsonResponse({'success': True, 'batches': batches})
        
        results = results.get('data')
        for result in results:
            if result.get('grade_score') < 2:
                fail_count += 1
                if fail_count > 3:
                    batches = list(
                        Batch.objects.filter(
                            term_id=term_id,
                            semester=last_enrollment.batch.semester
                        ).values('id', 'name', 'semester__degree__code')
                    )
                    cache.set(f"{request.COOKIES.get('my_user')}:failed", [])
                    return JsonResponse({'success': True, 'batches': batches})
                else:
                    failed_subjects.append(Course.objects.filter(
                        course_code=result.get('course_code')
                    ).first().pk)
                    cache.set(f"{request.COOKIES.get('my_user')}:failed", failed_subjects)

        batches = list(
            Batch.objects.filter(
                term_id=term_id,
                semester__semester_name=f"Semester {int(last_enrollment.batch.semester.semester_name.split()[-1]) + 1}",
                semester__degree__pk=last_enrollment.batch.semester.degree.pk
            ).values('id', 'name', 'semester__degree__code')
        )

    else:
        batches = list(Batch.objects.filter(term_id=term_id, semester__semester_name='Semester 1').values('id', 'name', 'semester__degree__code'))
    print(batches)
    return JsonResponse({'success': True, 'batches': batches})

# AJAX: Get courses for a selected batch
@csrf_exempt
def get_courses_for_batch(request):
    batch_id = request.GET.get('batch_id')
    if not batch_id:
        return JsonResponse({'success': False, 'error': 'No batch_id provided'})
    
    try:
        batch = Batch.objects.select_related('semester').get(id=batch_id)
        syllabus = batch.semester.syllabus_structure

        # Group courses by type
        grouped = {'Core': [], 'Supportive': [], 'Elective': [], 'Extracurricular': [], 'Retake': []}

        # Add regular courses
        for course_info in syllabus:
            course_code = course_info.get('course_code')
            subject_type = course_info.get('type', 'Core').capitalize()
            try:
                course = Course.objects.get(course_code=course_code)
                grouped.setdefault(subject_type, []).append({
                    'course_id': course.id,
                    'course_code': course.course_code,
                    'course_name': course.course_name,
                    'description': course.description,
                    'credits': course.course_credits,
                    'total_hours': course.course_hours,
                    'type': subject_type,
                })
            except Course.DoesNotExist:
                continue

        # Add failed/retake courses from cache
        course_ids = cache.get(f"{request.COOKIES.get('my_user')}:failed")
        if course_ids:
            failed_courses = Course.objects.filter(pk__in=course_ids)
            for course in failed_courses:
                grouped['Retake'].append({
                    'course_id': course.id,
                    'course_code': course.course_code,
                    'course_name': course.course_name,
                    'description': course.description,
                    'credits': course.course_credits,
                    'total_hours': course.course_hours,
                    'type': 'RETAKE',
                })

        return JsonResponse({'success': True, 'courses': grouped})

    except Batch.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Batch not found'})

def save_enrollment(request): 
    if request.method!='POST':
        return JsonResponse({'success': False, 'error': 'Post Method Required'})
    
    try:
        data = json.loads(request.body)
        term_id, batch_id, courses = data.get('term_id'), data.get('batch_id'), data.get('course_ids')

        batch = Batch.objects.filter(
            pk=int(batch_id),
        ).first()

        user_email = request.COOKIES.get('my_user')
        if not user_email:
            return JsonResponse({'success': False, 'error': 'User not authenticated'})
        
        sis_form = SISForm.objects.filter(
            student__user__email=user_email
        ).first()

        if not sis_form:
            return JsonResponse({
                'success': False,
                'error': 'First fill Student Information System (SIS) Form',
            })
        
        Enrollment.objects.create(
            batch=batch,
            sis_form=sis_form,
            selected_subjects={'ids': courses}
        )

        return JsonResponse({'success': True, 'message': 'Enrollment Requested Successfully'})

    except Exception as e:
        return JsonResponse({'success': False, 'error': f'{e}'})
