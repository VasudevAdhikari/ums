import json
from django.http import JsonResponse, HttpResponseNotAllowed
from django.core.exceptions import PermissionDenied
from authorization.models import EnrollmentCourse


def _handle_enrollment_action(request, batch_instructor_id, field_name, success_message):
    """Helper to handle review/rating submission for an enrollment course."""
    if request.method != 'POST':
        return HttpResponseNotAllowed(["POST"])
    
    data = json.loads(request.body)
    email = request.COOKIES.get('my_user')

    enrollment_course = EnrollmentCourse.objects.filter(
        batch_instructor_id=batch_instructor_id,
        enrollment__sis_form__student__user__email=email,
    ).first()

    if not enrollment_course:
        raise PermissionDenied(f"You are not allowed to {success_message.lower()}")

    # Dynamically set the field (e.g., 'review' or 'rating')
    setattr(enrollment_course, field_name, data)
    enrollment_course.save()

    return JsonResponse({
        'success': True,
        'status': 'ok',
        'message': f'{success_message} Successfully'
    })


def review_enrollment_course(request, batch_instructor_id):
    return _handle_enrollment_action(
        request, 
        batch_instructor_id, 
        field_name='review', 
        success_message='Review Submitted'
    )


def rate_enrollment_course(request, batch_instructor_id):
    return _handle_enrollment_action(
        request, 
        batch_instructor_id, 
        field_name='rating',   # assumes you have a `rating` field in EnrollmentCourse
        success_message='Rating Submitted'
    )