from django.shortcuts import render, redirect
from authorization.models import Enrollment, Degree, Course, EnrollmentStatus, BatchInstructor, EnrollmentCourse
from django.forms.models import model_to_dict
from executives.additional_business_logics.data_formatter import get_course_type
from django.db.models import Prefetch
from django.contrib import messages
import json

def get_course_type(course_code, course_list):
    for course in course_list:
        if course['course_code'] == course_code:
            return course['type']
    return None

def show_enrollments(request):
    pending_enrollments = Enrollment.objects.filter(
        enrollment_status = 'P'
    ).select_related(
        'sis_form__student__user', 'batch__semester'
    )

    # Gather all course IDs across enrollments
    all_course_ids = set()
    for enrollment in pending_enrollments:
        course_id_list = enrollment.selected_subjects.get('ids', [])
        all_course_ids.update(int(cid) for cid in course_id_list if str(cid).isdigit())

    # Query all courses at once
    course_objs = Course.objects.filter(id__in=all_course_ids)
    course_dict = {course.id: model_to_dict(course) for course in course_objs}

    pending_enrollment_data = []

    for enrollment in pending_enrollments:
        semester = enrollment.batch.semester
        syllabus_structure = semester.syllabus_structure  # expected to be a list of dicts
        sis_form = model_to_dict(enrollment.sis_form)
        student = model_to_dict(enrollment.sis_form.student.user)
        emergency_contact = model_to_dict(enrollment.sis_form.student.user.emergency_contact)

        course_list = []
        for course_id in enrollment.selected_subjects.get('ids', []):
            if not str(course_id).isdigit():
                continue
            course = course_dict.get(int(course_id))
            if not course:
                continue
            course_type = get_course_type(course.get('course_code'), syllabus_structure)
            course['type'] = course_type
            course_list.append(course)

        pending_enrollment_data.append({
            'enrollment': f"{enrollment.batch.term.term_name} - {semester.semester_name}({semester.degree.code})",
            'id': enrollment.pk,
            'sis_form': sis_form,
            'student': student,
            'courses': course_list,
            'emergency_contact': emergency_contact,
        })

        print(emergency_contact)

    data = {
        'enrollments': pending_enrollment_data,
    }

    return render(request, 'executives/enrollment_approval.html', {'enrollments': pending_enrollment_data})


def approve_enrollment(request, student_id):
    print('approve enrollment')
    try:
        enrollment = Enrollment.objects.filter(
            pk=int(student_id)
        ).first()
        enrollment.enrollment_status = EnrollmentStatus.APPROVED

        enrollment_courses = []
        course_ids = enrollment.selected_subjects.get('ids')
        for course_id in course_ids:
            enrollment_courses.append(
                EnrollmentCourse(
                    batch_instructor=BatchInstructor.objects.filter(
                        batch=enrollment.batch, 
                        course__id=int(course_id)
                    ).first(),
                    enrollment=enrollment,
                )
            )

        EnrollmentCourse.objects.bulk_create(enrollment_courses)
        enrollment.save()
        messages.success(request, "Enrollment Approved Successfully")
    except Exception as e:
        print(e)
        messages.error(request, f"{e}")
    return redirect('/executives/enrollments/')


def reject_enrollment(request, student_id):
    print('reject enrollment')
    try:
        enrollment = Enrollment.objects.filter(
            pk = int(student_id)
        ).first()
        enrollment.enrollment_status = EnrollmentStatus.REJECTED
        enrollment.save()
        messages.success(request, "Enrollment Rejected Successfully")
    except Exception as e:
        print(e)
        messages.error(request, f"{e}")
    return redirect('/executives/enrollments/')

