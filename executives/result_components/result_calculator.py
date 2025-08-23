from authorization.models import User, Student, Assessment, AssessmentResult, AssessmentScheme, Course, Term,  Batch, Semester, Degree, EnrollmentCourse, BatchInstructor
from django.db.models.query import QuerySet

def get_result_for_a_course(enrollment_course: EnrollmentCourse):
    student = enrollment_course.enrollment.sis_form.student
    batch_instructor = enrollment_course.batch_instructor
    assessment_scheme = AssessmentScheme.objects.filter(
        batch_instructor=batch_instructor
    ).first()
    assessment_results = AssessmentResult.objects.filter(
        assessment__assessment_scheme=assessment_scheme,
        student=student,
    )
    if assessment_scheme:
        scheme = assessment_scheme.scheme
    else: return 0
    print(scheme)
    types = {}
    for type, percent in scheme.items():
        types[type] = {
            "given_percent": percent,
            "given_total": 0,
            "got_marks": 0,
            "got_percent": 0,
        }

    for assessment_result in assessment_results:
        assessment = assessment_result.assessment
        assessment_type = assessment.get_assessment_type_display()
        if assessment_type in scheme:
            types[assessment_type]["given_total"] += int(assessment.assessment.get('total_mark', 1))
            types[assessment_type]["got_marks"] += assessment_result.mark

    total = 0
    print(types)
    for type,details in types.items():
        details['got_percent'] = details['got_marks']*details['given_percent']/details['given_total'] if details['given_total']>0 else 0
        total += details['got_percent']
    
    return total

def get_credits_and_score(total_marks):
    letter_grade = 'F'
    grade_score = 0.00
    if total_marks>=90:
        letter_grade, grade_score = 'A+', 4.00
    elif 80<=total_marks<=89:
        letter_grade, grade_score = 'A', 4
    elif 75<=total_marks<=79:
        letter_grade, grade_score = 'A-', 3.67
    elif 70<=total_marks<=74:
        letter_grade, grade_score = 'B+', 3.33
    elif 65<=total_marks<=69:
        letter_grade, grade_score = 'B', 3
    elif 60<=total_marks<=64:
        letter_grade, grade_score = 'B-', 2.67
    elif 55<=total_marks<=59:
        letter_grade, grade_score = 'C+', 2.33
    elif 50<=total_marks<=54:
        letter_grade, grade_score = 'C', 2.00
    elif 40<=total_marks<=49:
        letter_grade, grade_score = 'D', 1.00
    return {
        "letter_grade": letter_grade,
        "grade_score": grade_score,
    }


def get_result_for_all_courses(enrollment_courses: QuerySet[EnrollmentCourse]):
    results = []
    for enrollment_course in enrollment_courses:
        total = get_result_for_a_course(enrollment_course)
        result = get_credits_and_score(total)
        course = enrollment_course.batch_instructor.course
        results.append({
            "course_name": course.course_name,
            "course_code": course.course_code,
            "credits": course.course_credits,
            "letter_grade": result.get("letter_grade"),
            "grade_score": result.get("grade_score"),
            "grade_point": result.get("grade_score")*course.course_credits
        })
    return results


def run():
    enrollment_courses = EnrollmentCourse.objects.filter(enrollment__id=2)
    results = get_result_for_all_courses(enrollment_courses)
    print(results)