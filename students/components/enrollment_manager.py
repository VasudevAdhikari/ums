from django.shortcuts import render
from django.http import JsonResponse
from authorization.models import Term, Batch, Course, SISForm, Enrollment
from django.views.decorators.csrf import csrf_exempt
from django.core import serializers
import json

# Enrollment page view

def show_enrollment_page(request):
    terms = Term.objects.all().order_by('-year', 'term_name')
    return render(request, 'students/personal/enrollment.html', {'terms': terms})

# AJAX: Get batches for a selected term
@csrf_exempt
def get_batches_for_term(request):
    term_id = request.GET.get('term_id')
    if not term_id:
        return JsonResponse({'success': False, 'error': 'No term_id provided'})
    batches = list(Batch.objects.filter(term_id=term_id).values('id', 'name', 'semester__degree__code'))
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
        grouped = {'Core': [], 'Supportive': [], 'Elective': [], 'Extracurricular': []}
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
