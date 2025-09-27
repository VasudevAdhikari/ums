import random
from django.core.management.base import BaseCommand
from authorization.models import Enrollment, EnrollmentCourse, Term
from executives.result_components.result_calculator import get_credits_and_score, get_result_for_a_course  # import your helper functions
from django.db import transaction
from typing import Dict, List


def addSampleResults():
    with transaction.atomic():
        # Get all EnrollmentCourse objects
        all_courses = EnrollmentCourse.objects.select_related('batch_instructor__course', 'enrollment').filter(batch_instructor__batch__term=Term.objects.all().last(),enrollment__sis_form__student__user__email='user39@example.com')

        # Group by enrollment
        enrollment_groups = {}
        for ec in all_courses:
            enrollment_id = ec.enrollment.id
            enrollment_groups.setdefault(enrollment_id, []).append(ec)

        for enrollment_id, enrollment_courses in enrollment_groups.items():
            results = []
            for ec in enrollment_courses:
                # Generate a random total marks between 35 and 100 for sample
                total_marks = random.randint(60, 80)
                grade_data = get_credits_and_score(total_marks)
                course = ec.batch_instructor.course
                results.append({
                    "course_name": course.course_name,
                    "course_code": course.course_code,
                    "credits": course.course_credits,
                    "letter_grade": grade_data.get("letter_grade"),
                    "grade_score": grade_data.get("grade_score"),
                    "grade_point": grade_data.get("grade_score") * course.course_credits
                })

            # Save the sample result to the enrollment's result field
            enrollment = Enrollment.objects.get(pk=enrollment_id)
            enrollment.result = {"data": results}
            enrollment.save()
            print(f"Added sample result for Enrollment ID {enrollment_id}")

        print("All sample results generated successfully!")


def categorize_students_by_failures():
    """
    Returns a dictionary with two keys:
    - 'less_than_3_fails': list of Enrollment objects with <3 failed courses
    - 'more_than_3_fails': list of Enrollment objects with >=3 failed courses
    """
    less_than_3_fails = []
    more_than_3_fails = []
    no_fail = []
    term = Term.objects.all().order_by('-id')[1]
    enrollments = Enrollment.objects.filter(batch__term=term).select_related('sis_form__student__user')

    for enrollment in enrollments:
        data = enrollment.result.get('data') if enrollment.result else []
        fail_count = 0
        for course_result in data:
            grade_score = course_result.get('grade_score', 0)
            if grade_score < 2:  # Assuming grade_score < 2 means failed
                fail_count += 1

        if fail_count == 0:
            no_fail.append(enrollment)
        elif fail_count < 3:
            less_than_3_fails.append(enrollment)
        else:
            more_than_3_fails.append(enrollment)

    return {
        "less_than_3_fails": less_than_3_fails,
        "more_than_3_fails": more_than_3_fails,
        "no_fail": no_fail,
    }