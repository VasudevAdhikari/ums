from django.shortcuts import render
from authorization.models import User, Student, Enrollment, BatchInstructor, Assessment, Course, AssessmentScheme, AssessmentType, EnrollmentStatus, EnrollmentCourse, Instructor, Document
from django.utils import timezone
from django.http import JsonResponse
from dateutil.relativedelta import relativedelta
import json
from executives.additional_business_logics.data_formatter import get_course_type
from django.db.models import Q

def show_course_details(request, batch_instructor_id):
    user_email = request.COOKIES.get('my_user')
    user = User.objects.get(username=user_email)
    student = Student.objects.get(user=user)

    batch_instructor = BatchInstructor.objects.get(id=batch_instructor_id)
    course = batch_instructor.course

    instructor = batch_instructor.instructor
    diff = relativedelta(timezone.now(), instructor.created_at)

    assessment_scheme = AssessmentScheme.objects.get(batch_instructor__id=batch_instructor_id)
    scheme = []
    assessments = []
    for assessment, percent in assessment_scheme.scheme.items():
        scheme.append({
            'type': assessment, 
            'mark': percent,
        })
        type = next(
            (member for member in AssessmentType if member.label == assessment),
            None
        )
        inner_assessment = Assessment.objects.filter(
            assessment_type=type, 
            assessment_scheme=assessment_scheme
        )
        
        assessments.append(inner_assessment)

    data = {
        'student_name': user.full_name,
        'course': course,
        'instructor': instructor.user,
        'instructor_role': instructor.position_in_university,
        'experience': diff.years,
        'scheme': json.dumps(scheme),
        'assessments': assessments,
    }
    print(data)
    return render(request, 'students/academic/batch_instructor.html', context=data)

def show_home_page(request):
    try:
        user_email = request.COOKIES.get('my_user')
        pending_enrollments = Enrollment.objects.filter(
            Q(sis_form__student__user__email = user_email) & 
            (Q(enrollment_status = EnrollmentStatus.PENDING) | Q(enrollment_status = EnrollmentStatus.REJECTED))
        )

        approved_enrollments_raw = Enrollment.objects.filter(
            Q(sis_form__student__user__email = user_email) & 
            (Q(enrollment_status = EnrollmentStatus.APPROVED))
        )

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

        data = {
            'pending_enrollments': pending_enrollment_data,
            'rejected_enrollments': rejected_enrollment_data,
            'approved_enrollments': approved_enrollment_data,
        }

        return render(request, 'students/academic/home.html', context=data)
    except Exception as e:
        print(e)
        return JsonResponse({'success': False, 'error': f"{e}"})
    

def show_course_page(request, batch_instructor_id):
    batch_instructor = BatchInstructor.objects.filter(
        pk=int(batch_instructor_id)).select_related('batch__term', 'course', 'batch__semester'
    ).values(
        "id", 
        "course__id", 
        "course__course_code",
        "course__course_name",
        "course__description",
    ).first() 

    instructor = BatchInstructor.objects.filter(
        pk=int(batch_instructor_id)
    ).select_related(
        'instructor', 
        'instructor__user', 
        'instructor__department'
    ).first()

    marking_types = [label for _, label in AssessmentType.choices]
    other_instructor_ids = list(
        Document.objects
        .exclude(uploaded_by__email=request.COOKIES.get('my_user'))
        .values_list('uploaded_by__id', flat=True)
        .distinct()
    )

    enrollment_course = EnrollmentCourse.objects.filter(
        batch_instructor_id=batch_instructor_id,
        enrollment__sis_form__student__user__email=request.COOKIES.get('my_user'),
    ).first()
    print(enrollment_course)
    has_review = bool(enrollment_course and enrollment_course.review)
    has_rating = bool(enrollment_course and enrollment_course.rating)
            
    data = {
        'batch_instructor': batch_instructor,
        'assessment_types': marking_types,
        'instructor': instructor,
        'has_review': has_review,
        'has_rating': has_rating,
    }
    print(data)
    return render(request, 'students/academic/course_management.html', context=data)