from django.shortcuts import render, redirect
from django.http import JsonResponse
from authorization.models import Student, Enrollment, EnrollmentStatus
import json

def show_result_sheets(request, student_id):
    student = Student.objects.filter(
        user__id = student_id,
    ).first()
    if not student:
        return JsonResponse({'success': False, 'error': 'You are not allowed to enter this page'})
    enrollments = Enrollment.objects.filter(
        sis_form__student__user__id = student_id,
        enrollment_status=EnrollmentStatus.APPROVED,
    ).select_related(
        'batch__term', 
        'batch__semester__degree', 
        'batch__semester'
    )

    results = []
    for enrollment in enrollments:
        results.append({
            'term': enrollment.batch.term.term_name,
            'degree': enrollment.batch.semester.degree.name,
            'semester': enrollment.batch.semester.semester_name,
            'image': f"/media/{enrollment.result.get('image')}"
        })

    data = {
        'results': json.dumps(results)
    }
    return render(request, 'students/academic/result_sheets.html', context=data)