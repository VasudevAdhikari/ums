from django.shortcuts import render
from authorization.models import User, Student, Instructor, Admin
from django.http import Http404, JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
import json
import os
from .models import Notice, NoticeStatus
from django.conf import settings
from django.core.files.storage import default_storage


def home(request):
    try:
        # Get the logged-in user from cookies (same pattern as mailbox)
        username = request.COOKIES.get('my_user')
        if not username:
            raise Http404("Page not found")
        
        user = User.objects.get(username=username)
        
        # Determine user type and get appropriate object
        user_type = None
        user_obj = None
        
        # Check if user is a student
        try:
            student = Student.objects.get(user=user)
            if student.status == 'U':  # Unapproved
                raise Http404("Page not found")
            user_type = 'student'
            user_obj = student
        except Student.DoesNotExist:
            pass
        
        # Check if user is an instructor
        if not user_type:
            try:
                instructor = Instructor.objects.get(user=user)
                if instructor.employment_status == 'U':  # Unapproved
                    raise Http404("Page not found")
                user_type = 'instructor'
                user_obj = instructor
            except Instructor.DoesNotExist:
                pass
        
        # Check if user is an admin
        if not user_type:
            try:
                admin = Admin.objects.get(user=user)
                user_type = 'admin'
                user_obj = admin
            except Admin.DoesNotExist:
                pass
        
        # If no user type found, raise 404
        if not user_type:
            raise Http404("Page not found")
            
        context = {
            'user': user_obj,
            'user_type': user_type,
            'current_page': 'noticeboard'
        }
        return render(request, 'noticeboard/noticeboard.html', context)
    except (User.DoesNotExist, KeyError):
        raise Http404("Page not found")


def manage_post(request):
    try:
        # Get the logged-in user from cookies
        username = request.COOKIES.get('my_user')
        if not username:
            raise Http404("Page not found")
        
        user = User.objects.get(username=username)
        
        # Determine user type and get appropriate object
        user_type = None
        user_obj = None
        
        # Check if user is a student
        try:
            student = Student.objects.get(user=user)
            if student.status == 'U':  # Unapproved
                raise Http404("Page not found")
            user_type = 'student'
            user_obj = student
        except Student.DoesNotExist:
            pass
        
        # Check if user is an instructor
        if not user_type:
            try:
                instructor = Instructor.objects.get(user=user)
                if instructor.employment_status == 'U':  # Unapproved
                    raise Http404("Page not found")
                user_type = 'instructor'
                user_obj = instructor
            except Instructor.DoesNotExist:
                pass
        
        # Check if user is an admin
        if not user_type:
            try:
                admin = Admin.objects.get(user=user)
                user_type = 'admin'
                user_obj = admin
            except Admin.DoesNotExist:
                pass
        
        # If no user type found, raise 404
        if not user_type:
            raise Http404("Page not found")
            
        context = {
            'user': user_obj,
            'user_type': user_type,
            'current_page': 'manage_post'
        }
        return render(request, 'noticeboard/manage_post.html', context)
    except (User.DoesNotExist, KeyError):
        raise Http404("Page not found")


def pending(request):
    try:
        # Get the logged-in user from cookies
        username = request.COOKIES.get('my_user')
        if not username:
            raise Http404("Page not found")
        
        user = User.objects.get(username=username)
        
        # Determine user type and get appropriate object
        user_type = None
        user_obj = None
        
        # Check if user is a student
        try:
            student = Student.objects.get(user=user)
            if student.status == 'U':  # Unapproved
                raise Http404("Page not found")
            user_type = 'student'
            user_obj = student
        except Student.DoesNotExist:
            pass
        
        # Check if user is an instructor
        if not user_type:
            try:
                instructor = Instructor.objects.get(user=user)
                if instructor.employment_status == 'U':  # Unapproved
                    raise Http404("Page not found")
                user_type = 'instructor'
                user_obj = instructor
            except Instructor.DoesNotExist:
                pass
        
        # Check if user is an admin
        if not user_type:
            try:
                admin = Admin.objects.get(user=user)
                user_type = 'admin'
                user_obj = admin
            except Admin.DoesNotExist:
                pass
        
        # If no user type found, raise 404
        if not user_type:
            raise Http404("Page not found")
            
        context = {
            'user': user_obj,
            'user_type': user_type,
            'current_page': 'pending'
        }
        return render(request, 'noticeboard/pending.html', context)
    except (User.DoesNotExist, KeyError):
        raise Http404("Page not found")


def _get_logged_in_user(request):
    username = request.COOKIES.get('my_user')
    if not username:
        return None
    try:
        return User.objects.get(username=username)
    except User.DoesNotExist:
        return None

def _user_role(user: User) -> str:
    if not user:
        return ''
    if Admin.objects.filter(user=user).exists():
        return 'admin'
    if Instructor.objects.filter(user=user).exists():
        return 'instructor'
    if Student.objects.filter(user=user).exists():
        return 'student'
    return ''

@require_http_methods(["POST"])
@csrf_exempt
def create_post(request):
    user = _get_logged_in_user(request)
    if not user:
        return JsonResponse({'error': 'Unauthenticated'}, status=401)
    role = _user_role(user)

    # Support both JSON and multipart/form-data
    if request.content_type.startswith('multipart/form-data'):
        caption = (request.POST.get('caption') or '').strip()
        files = []
        for f in request.FILES.getlist('files'):
            # Save file to /media/noticeboard/
            noticeboard_dir = os.path.join(settings.MEDIA_ROOT, 'noticeboard')
            os.makedirs(noticeboard_dir, exist_ok=True)
            filename = default_storage.get_available_name(os.path.join('noticeboard', f.name))
            file_path = os.path.join(settings.MEDIA_ROOT, filename)
            with open(file_path, 'wb+') as destination:
                for chunk in f.chunks():
                    destination.write(chunk)
            files.append(os.path.join(settings.MEDIA_URL, filename).replace('\\', '/'))
    else:
        try:
            data = json.loads(request.body or '{}')
        except Exception:
            data = {}
        caption = (data.get('caption') or '').strip()
        files = data.get('files') or []

    if not caption:
        return JsonResponse({'error': 'Caption is required'}, status=400)
    notice_data = {"caption": caption, "files": files}
    if role == 'admin':
        status = NoticeStatus.UNAPPROVED
        handled_by = Admin.objects.filter(user=user).first()
    elif role == 'instructor':
        status = NoticeStatus.PENDING
        handled_by = None
    else:
        return JsonResponse({'error': 'Forbidden'}, status=403)
    post = Notice.objects.create(
        uploaded_by=user,
        handled_by=handled_by,
        notice=notice_data,
        status=status,
    )
    return JsonResponse({'id': post.id, 'status': post.status, 'role': role}, status=201)

@require_http_methods(["GET"])
def list_posts(request):
    # Show all approved posts to everyone
    posts = (
        Notice.objects
        .filter(status=NoticeStatus.UNAPPROVED)
        .order_by('-created_at')
        .values('id', 'notice', 'created_at', 'uploaded_by_id')
    )
    # Add username for display
    results = []
    for p in posts:
        user = User.objects.filter(id=p['uploaded_by_id']).first()
        role = _user_role(user)
        results.append({
            'id': p['id'],
            'notice': p['notice'],
            'created_at': p['created_at'],
            'username': user.full_name if user and user.full_name else (user.username if user else ''),
            'role': role,
        })
    return JsonResponse({'results': results}, status=200)

@require_http_methods(["GET"])
def list_my_posts(request):
    user = _get_logged_in_user(request)
    if not user:
        return JsonResponse({'error': 'Unauthenticated'}, status=401)
    role = _user_role(user)
    posts = (
        Notice.objects
        .filter(uploaded_by=user)
        .order_by('-created_at')
        .values('id', 'notice', 'created_at', 'status')
    )
    # Add role for poster (always current user)
    results = []
    for p in posts:
        results.append({
            'id': p['id'],
            'notice': p['notice'],
            'created_at': p['created_at'],
            'status': p['status'],
            'role': role,
        })
    return JsonResponse({'results': results}, status=200)

@require_http_methods(["GET"])
def list_pending_posts(request):
    user = _get_logged_in_user(request)
    if not user or not Admin.objects.filter(user=user).exists():
        return JsonResponse({'error': 'Forbidden'}, status=403)
    posts = (
        Notice.objects
        .filter(status=NoticeStatus.PENDING)
        .order_by('-created_at')
        .values('id', 'notice', 'created_at', 'uploaded_by_id')
    )
    # Add username for display
    results = []
    for p in posts:
        u = User.objects.filter(id=p['uploaded_by_id']).first()
        role = _user_role(u)
        results.append({
            'id': p['id'],
            'notice': p['notice'],
            'created_at': p['created_at'],
            'username': u.full_name if u and u.full_name else (u.username if u else ''),
            'role': role,
        })
    return JsonResponse({'results': results}, status=200)

@require_http_methods(["POST"])
@csrf_exempt
def approve_post(request, post_id):
    user = _get_logged_in_user(request)
    if not user or not Admin.objects.filter(user=user).exists():
        return JsonResponse({'error': 'Forbidden'}, status=403)
    try:
        post = Notice.objects.get(id=post_id)
    except Notice.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)
    post.status = NoticeStatus.UNAPPROVED
    post.handled_by = Admin.objects.filter(user=user).first()
    post.save(update_fields=['status', 'handled_by', 'updated_at'])
    return JsonResponse({'success': True})

@require_http_methods(["POST"])
@csrf_exempt
def reject_post(request, post_id):
    user = _get_logged_in_user(request)
    if not user or not Admin.objects.filter(user=user).exists():
        return JsonResponse({'error': 'Forbidden'}, status=403)
    try:
        post = Notice.objects.get(id=post_id)
    except Notice.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)
    post.status = NoticeStatus.REJECTED
    post.handled_by = Admin.objects.filter(user=user).first()
    post.save(update_fields=['status', 'handled_by', 'updated_at'])
    return JsonResponse({'success': True})

@require_http_methods(["DELETE"])
@csrf_exempt
def delete_post(request, post_id):
    user = _get_logged_in_user(request)
    if not user:
        return JsonResponse({'error': 'Unauthenticated'}, status=401)
    try:
        post = Notice.objects.get(id=post_id)
    except Notice.DoesNotExist:
        return JsonResponse({'error': 'Not found'}, status=404)
    if post.uploaded_by != user and not Admin.objects.filter(user=user).exists():
        return JsonResponse({'error': 'Forbidden'}, status=403)
    post.delete()
    return JsonResponse({'success': True})
