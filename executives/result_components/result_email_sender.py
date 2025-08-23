from executives.result_components.result_image_generator import create_result_image_dynamic
from executives.result_components.result_calculator import get_result_for_all_courses
from authorization.models import Term, Enrollment, EnrollmentCourse, Notification, NotificationType, User
from django.core.mail import EmailMessage
from django.conf import settings
import os


def send_result_email_to_user(email: str, image_path: str, full_name: str, term_name: str):
    subject = f"Exam Result - {term_name}"
    body = f"Dear {full_name},\n\nPlease find attached your result for {term_name}.\n\nRegards,\nUniversity Admin"

    # Full absolute path for attachment
    full_image_path = os.path.join(settings.MEDIA_ROOT, image_path)

    email_message = EmailMessage(
        subject=subject,
        body=body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[email],
    )

    # Attach the image
    if os.path.exists(full_image_path):
        email_message.attach_file(full_image_path)
        email_message.send()
        print(f"Result email sent to {email}")
    else:
        print(f"Failed to attach image: {full_image_path} not found")


def send_result_to_all_students(term: Term, executive: User):
    # get all enrollments related to the term
    try:
        enrollments = Enrollment.objects.filter(batch__term=term)

        for enrollment in enrollments:
            enrollment_courses = EnrollmentCourse.objects.filter(enrollment=enrollment)

            if not enrollment_courses.exists():
                continue

            result = get_result_for_all_courses(enrollment_courses=enrollment_courses)

            semester = enrollment.batch.semester
            student = enrollment.sis_form.student
            user = student.user

            # Create the result image
            image = create_result_image_dynamic(
                courses=result,
                semester=semester.semester_name,
                degree=semester.degree.name,
                term=term.term_name,
                student_name=user.full_name,
                student_id=student.roll_no,
            )

            enrollment.result = {
                'data': result,
                'image': image
            }
            enrollment.save()

            # Send result email
            send_result_email_to_user(
                email=user.email,
                image_path=image,
                full_name=user.full_name,
                term_name=term.term_name
            )

            notification = Notification(
                notification={
                    "text": f"Exam results for {term.term_name} are out now. Check it out in email or in the results page",
                    "destination": f"/students/academics/results/{user.id}",
                },
                user=user,
                type=NotificationType.STUDENT,
                seen=False,
            )
            notification.save()

    except Exception as e:
        notification = Notification(
            notification={
                "text": f"There was a problem sending the term results. Please review the error details and take appropriate action. It is recommended to resend the result!!",
                "destination": f"/executives/show_term_management/"
            },
            user=executive,
            type=NotificationType.EXECUTIVE,
            seen=False,
        )
        notification.save()
