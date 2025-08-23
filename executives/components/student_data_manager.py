from django.shortcuts import render, redirect
from authorization.models import Student, Enrollment, EnrollmentStatus, EnrollmentCourse, Course, SISForm, StudentStatus
from django.db.models import Q
from django.http import JsonResponse
from executives.additional_business_logics.data_formatter import get_course_type
from django.contrib import messages

def show_student_data(request, student_id):
    try:
        sis_form = SISForm.objects.filter(
            student__user__id=student_id,
        ).select_related(
            'student',
            'student__user', 
            'student__user__emergency_contact'
        ).first()
        student = sis_form.student
    except Exception as e:
        student = Student.objects.filter(
            user__id=student_id
        ).first()
        sis_form = SISForm(student=student)

    try:
        pending_enrollments = Enrollment.objects.filter(
            Q(sis_form__student=student) & 
            (Q(enrollment_status = EnrollmentStatus.PENDING) | Q(enrollment_status = EnrollmentStatus.REJECTED))
        ).select_related('batch__term', 'batch__semester__degree')

        approved_enrollments_raw = Enrollment.objects.filter(
            Q(sis_form__student=student) & 
            Q(enrollment_status=EnrollmentStatus.APPROVED)
        ).select_related('batch__term', 'batch__semester__degree')

        approved_enrollment_data = []

        for approved_enrollment in approved_enrollments_raw:
            approved_enrollments = EnrollmentCourse.objects.filter(
                enrollment=approved_enrollment,
            ).select_related(
                'enrollment__batch__term', 
                'enrollment__batch__semester',
                'enrollment__batch__semester__degree', 
                'batch_instructor__course', 
                'batch_instructor__course__department', 
                'batch_instructor__instructor__user',
            )

            if approved_enrollments.exists():
                for enrollment in approved_enrollments:
                    syllabus_structure = enrollment.enrollment.batch.semester.syllabus_structure
                    course_code = enrollment.batch_instructor.course.course_code
                    type = get_course_type(course_code, syllabus_structure)
                    enrollment.type = type

                approved_enrollment_data.append({
                    'details': approved_enrollments,
                    'name': f"{approved_enrollments[0].enrollment.batch.term.term_name} ({approved_enrollments[0].enrollment.batch.semester.degree.code} - {approved_enrollments[0].enrollment.batch.semester.semester_name})",
                    "enrolled_date": approved_enrollments[0].created_at
                })
        

        rejected_enrollment_data = []
        pending_enrollment_data = []
        i = 1
        for enrollment in pending_enrollments:
            enrollment_name = f"{enrollment.batch.term.term_name} ({enrollment.batch.semester.degree.code} - {enrollment.batch.semester.semester_name})"
            enrollment_date = enrollment.created_at

            courses = []
            for course in enrollment.selected_subjects.get("ids"):
                course = Course.objects.filter(
                    pk = int(course)
                ).first()

                course_list = enrollment.batch.semester.syllabus_structure
                course_type = get_course_type(course.course_code, course_list)
                courses.append({
                    'course_name': f'{course.course_code} - {course.course_name}',
                    'department': course.department.name,
                    'type': course_type.capitalize() if course_type else 'Selected',
                })
 
            if enrollment.enrollment_status == EnrollmentStatus.PENDING:
                pending_enrollment_data.append({
                    'id': enrollment.id,
                    'enrollment_name': enrollment_name,
                    'enrollment_date': enrollment_date,
                    'courses': courses,
                })
            elif enrollment.enrollment_status == EnrollmentStatus.REJECTED:
                rejected_enrollment_data.append({
                    'id': enrollment.id,
                    'enrollment_name': enrollment_name,
                    'enrollment_date': enrollment_date,
                    'courses': courses,
                })

    except Exception as e:
        print(e)
        return JsonResponse({'success': False, 'error': f"{e}"})


    data = {
        'sis_form': sis_form,
        'approved_enrollments': approved_enrollment_data,
        'pending_enrollments': pending_enrollment_data,
        'rejected_enrollments': rejected_enrollment_data,
    }

    return render(request, 'executives/student_data.html', data)


def update_student_status(request, action, user_id):
    try:
        student = Student.objects.filter(
            user__id=user_id
        ).select_related('user').first()
        status = None
        message = ''
        match action:
            case 'graduate': 
                status = StudentStatus.GRADUATED
                message = 'Student has been graduated successfully'
            case 'drop':
                status = StudentStatus.DROPPED
                message = 'Student has been dropped successfully'
            case 'suspend':
                status = StudentStatus.SUSPENDED
                message = 'Student has been suspended successfully'
            case _:
                raise ValueError("Invalid action")

        student.status = status
        student.save()
        messages.success(request, message=message)
    except Exception as e:
        messages.error(request, f"{e}")
    return redirect(f'/executives/student_data/{user_id}')