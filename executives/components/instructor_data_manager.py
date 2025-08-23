import json
from django.shortcuts import render, redirect
from authorization.models import Department, Instructor, BatchInstructor, EnrollmentCourse, EmploymentStatus
from collections import defaultdict
from django.shortcuts import get_object_or_404
from django.contrib import messages

def get_instructor_data(instructor_id=None, request=None):
    if instructor_id:
        return get_object_or_404(
            Instructor.objects.select_related('user', 'user__emergency_contact', 'department'),
            pk=instructor_id
        )
    email = request.COOKIES.get('my_user')
    return get_object_or_404(
        Instructor.objects.select_related('user', 'user__emergency_contact', 'department'),
        user__email=email
    )
        


def show_instructor_data(request, instructor_id):
    # Fetch instructor with related user, department, emergency contact
    instructor = get_instructor_data(instructor_id)

    # Total courses taught
    total_courses_taught = BatchInstructor.objects.filter(instructor=instructor).count()

    # Total students taught (via EnrollmentCourse)
    total_students_taught = EnrollmentCourse.objects.filter(
        batch_instructor__instructor=instructor
    ).count()

    # Fetch all BatchInstructor entries for this instructor with related info
    batch_instructors = BatchInstructor.objects.filter(
        instructor=instructor
    ).select_related(
        'course',
        'batch__semester__degree',
        'batch__term'
    )

    # Group courses by Term
    terms_dict = defaultdict(list)
    for bi in batch_instructors:
        term = bi.batch.term
        terms_dict[term].append(bi)

    # Convert to a sorted list for template
    terms_list = sorted(terms_dict.items(), key=lambda x: x[0].start_date)

    # Prepare context for template
    terms = []
    for term, courses in terms_list:
        term_courses = []
        for bi in courses:
            term_courses.append({
                'id': bi.course.id,
                'batch_instructor_id': bi.id,
                'course_code': bi.course.course_code,
                'course_name': bi.course.course_name,
                'batch': {
                    'degree_name': bi.batch.semester.degree.name,
                    'semester_name': bi.batch.semester.semester_name
                }
            })
        terms.append({
            'name': term.term_name,
            'start_date': term.start_date,
            'end_date': term.end_date,
            'courses': term_courses
        })
        
    departments = Department.objects.all()
    department_data = []
    for department in departments:
        department_data.append({
            "name": department.name,
            "id": department.pk,
        })

    data = {
        'instructor': instructor,
        'total_courses_taught': total_courses_taught,
        'total_students_taught': total_students_taught,
        'terms': terms,
        'departments': json.dumps(department_data),
    }

    return render(request, 'executives/instructor_data.html', context=data)

def transfer_instructor(request, instructor_id):
    return change_instructor_status(request, instructor_id, EmploymentStatus.TRANSFERRED)


def retire_instructor(request, instructor_id):
    return change_instructor_status(request, instructor_id, EmploymentStatus.RETIRED)


def leave_instructor(request, instructor_id):
    return change_instructor_status(request, instructor_id, EmploymentStatus.ON_LEAVE)

def approve_instructor(request, instructor_id):
    return change_instructor_status(request, instructor_id, EmploymentStatus.ACTIVE)


def change_instructor_status(request, instructor_id, status):
    try:
        instructor = Instructor.objects.filter(
            user__id=instructor_id
        ).first()

        if not instructor:
            messages.error(request, "Instructor not found.")
            return redirect(f"/executives/instructor_data/{instructor_id}/")

        instructor.employment_status = status
        instructor.save()

        # dynamic message
        messages.success(
            request,
            f"Selected instructor's status has been successfully changed to **{status.label if hasattr(status, 'label') else status}**."
        )
    except Exception as e:
        messages.error(request, "An error occurred while changing the instructor's status.")
        print("Error:", e)

    return redirect(f"/executives/instructor_data/{instructor_id}/")

def change_instructor_department(request, instructor_id, department_id):
    instructor = Instructor.objects.filter(
        user__id=instructor_id
    ).first()
    instructor.department=Department.objects.get(pk=department_id)
    instructor.save()
    return redirect(f'/executives/instructor_data/{instructor_id}')
