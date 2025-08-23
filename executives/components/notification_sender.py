from authorization.models import Notification

def notify_students_new_assessment(assessment):
    # For all students
    if not assessment.assessment.get('students'):
        user = assessment.assessment_scheme.batch_instructor.instructor.user
        batch = assessment.assessment_scheme.batch_instructor.batch
        semester = batch.semester
        semester_name = semester.semester_name
        degree_name = semester.degree.name
        term_name = batch.term.term_name
        notification = Notification(
            user=user,
            notification = {
                "text": f"You have created a {assessment.get_assessment_type_display} ({assessment.assessment.get('title')}) for {term_name} - {degree_name} ({semester_name})",
                "destination": f""
            },
            seen=False
        )

def notify_student_assessment_submission(user, assessment):
    # only one student
    pass

def notify_student_assessment_mark(user, assessment):
    # only one student
    pass

def notify_new_notice(user, notice):
    pass

def notify_new_login(user):
    pass

def notify_wrong_login_attempt(user):
    pass

def notify_enrollment_approval(user):
    pass

def notify_enrollment_rejection(user):
    pass

def notify_student_registration_success(user):
    pass

def notify_instructors_registration_success(user):
    pass

def notify_students_document_referral(user):
    pass

def notify_student_new_term(user):
    pass

def notify_instructor_course_assignment_by_executive(user):
    pass

def notify_admin_new_registration(user):
    pass

def notify_admin_new_enrollment(user):
    pass

def notify_student_batch_result(user):
    pass
