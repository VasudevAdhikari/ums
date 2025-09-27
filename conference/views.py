import json
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from authorization.models import User, VideoConference, BatchInstructor

def create_conference(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            print(data)

            meeting_name = data.get('meetingName')
            start_time_str = data.get('startTime')
            end_time_str = data.get('endTime')
            batch_instructor_id = data.get('batchInstructorId')

            # Parse datetime strings
            start_time = parse_datetime(start_time_str)
            end_time = parse_datetime(end_time_str)

            if not start_time or not end_time:
                return JsonResponse({'success': False, 'error': 'Invalid datetime format'})

            # If datetime is naive, make it timezone-aware
            if timezone.is_naive(start_time):
                start_time = timezone.make_aware(start_time, timezone.get_current_timezone())
            if timezone.is_naive(end_time):
                end_time = timezone.make_aware(end_time, timezone.get_current_timezone())

            batch_instructor = BatchInstructor.objects.filter(pk=batch_instructor_id).first()
            if not batch_instructor:
                return JsonResponse({'success': False, 'error': 'Invalid batchInstructorId'})

            conference = VideoConference(
                meeting_name=meeting_name,
                start_time=start_time,
                end_time=end_time,
                batch_instructor=batch_instructor,
            )
            conference.save()

            return JsonResponse({'success': True, 'message': 'Conference scheduled successfully'})

        except Exception as e:
            print(e)
            raise


def delete_conference(request, vc_id):
    if request.method == "DELETE":
        try:
            conference = VideoConference.objects.filter(pk=vc_id).first()
            if not conference:
                return JsonResponse({"success": False, "error": "Conference not found"}, status=404)

            conference.delete()
            return JsonResponse({"success": True, "message": "Conference deleted successfully"})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)
    return JsonResponse({"success": False, "error": "Invalid request"}, status=405)


def meeting(request, meeting_id):
    vc = VideoConference.objects.filter(
        pk=meeting_id
    ).select_related(
        'batch_instructor__instructor__user'
    ).first()
    is_correct_instructor = request.COOKIES.get('my_user') == vc.batch_instructor.instructor.user.email
    if not vc.meeting_code and is_correct_instructor:
        data = {
            'vc': vc,
        }
        return render(request, 'conference/conference.html', context=data)
    elif vc.meeting_code:
        user = User.objects.get(email=request.COOKIES.get('my_user'))
        return render(request, 'conference/student_conference.html', {'user': user, 'room_id': vc.meeting_code})
    else:
        return render(request, 'htmls/access_denied.html')
    

def save_meeting_code(request, vc_id):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            meeting_code = data.get("meeting_code")

            vc = get_object_or_404(VideoConference, pk=vc_id)
            vc.meeting_code = meeting_code
            vc.save(update_fields=["meeting_code"])

            return JsonResponse({"success": True, "message": "Meeting code saved"})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)

    return JsonResponse({"success": False, "error": "Invalid request"}, status=405)


