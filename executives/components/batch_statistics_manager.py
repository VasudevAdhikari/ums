from django.shortcuts import render
from authorization.models import Student, EnrollmentCourse
from collections import defaultdict
import json

def show_batch_statistics(request, batch_id):
    # Get all EnrollmentCourse for the batch
    enrollment_courses = EnrollmentCourse.objects.filter(batch_instructor__batch__pk=batch_id).select_related('enrollment__sis_form__student__user')

    # Collect unique students from these enrollment courses
    students = Student.objects.filter(
        sisform__enrollment__in=[ec.enrollment for ec in enrollment_courses]
    ).select_related('user').distinct()
    box_plot = get_course_scores_for_batch(batch_id)

    data = {
        'students': students,
        'box_plot': json.dumps(box_plot),
    }
    return render(request, 'executives/batch_statistics.html', context=data)


def get_course_scores_for_batch(batch_id):
    # 1. Get all EnrollmentCourse in the batch with their enrollment and student
    enrollment_courses = EnrollmentCourse.objects.filter(
        batch_instructor__batch_id=batch_id
    ).select_related(
        'batch_instructor__course', 'enrollment__sis_form__student'
    ).prefetch_related(
        'enrollment'
    )

    # 2. Prepare a dict to hold course scores
    course_scores = defaultdict(list)

    # 3. Iterate over each enrollment course
    for ec in enrollment_courses:
        course_name = ec.batch_instructor.course.course_name
        enrollment_result = ec.enrollment.result or {}

        # Get the "data" field which contains per-course info
        course_data_list = enrollment_result.get('data', [])

        # Find the matching course in enrollment.result by course_code or course_name
        for course_data in course_data_list:
            if course_data.get('course_code') == ec.batch_instructor.course.course_code:
                grade_point = course_data.get('grade_point', 0.0)
                course_scores[course_name].append(grade_point)
                break  # found the course in result, no need to continue

    # 4. Convert to the required list of dicts format
    courses = [{'name': course, 'scores': scores} for course, scores in course_scores.items()]
    return courses