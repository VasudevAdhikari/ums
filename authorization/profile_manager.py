from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpResponseRedirect
from authorization.models import User, Admin, Student, Instructor
# from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import make_password
import json
import os
from django.core.files.storage import FileSystemStorage
from django.conf import settings

def show_profile_management(request, user_id):
    user = User.objects.get(pk=user_id, email=request.COOKIES.get('my_user'))
    role = 'Student'
    editable = False
    if Instructor.objects.filter(user=user).exists():
        role = 'Instructor'
    elif Admin.objects.filter(user=user).exists():
        role = 'Executive'
        editable = True
    data = {
        'user': user,
        'role': role,
        'editable': editable,
    }
    return render(request, 'htmls/profile.html', context=data)

def check_password(request, user_id, password):
    user = User.objects.get(pk=user_id)
    # print(user)
    # print(user.is_active)
    # authenticated_user = authenticate(request, username=user.username, password=password)
    # print(authenticated_user)
    print('got')
    if user.check_password(password):
        print('true')
        return JsonResponse({'success': True})
    else:
        return JsonResponse({'success': False})
    
def save_profile(request, user_id):
    if request.method != 'POST': 
        return JsonResponse({'success': False, 'error': 'Post method required'})
    try:
        user_data = json.loads(request.body)
        user = User.objects.get(pk=int(user_id))
        user.full_name = user_data.get('name') or user.full_name
        user.phone = user_data.get('phone') or user.phone
        user.email = user_data.get('email') or user.email
        user.outlook_email = user_data.get('outlook_mail') or user.outlook_email
        user.city = user_data.get('city') or user.city
        user.telegram_username = user_data.get('telegram_username') or user.telegram_username
        user.save()
        return JsonResponse({'success': True, 'message': 'Profile Info changed successfully'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': f"{e}"})

@csrf_exempt
def change_password(request, user_id):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'POST method required'})
    
    try:
        data = json.loads(request.body)
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        user = User.objects.get(email=request.COOKIES.get('my_user'), id=int(user_id))
        
        # Check if current password is correct
        if not user.check_password(current_password):
            return JsonResponse({'success': False, 'error': 'Current password is incorrect'})
        
        # Validate new password
        if len(new_password) < 8:
            return JsonResponse({'success': False, 'error': 'New password must be at least 8 characters long'})
        
        # Update password
        user.password = make_password(new_password)
        user.save()
        
        return JsonResponse({'success': True, 'message': 'Password changed successfully'})
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'User not found'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@csrf_exempt
def upload_profile_picture(request, user_id):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'POST method required'})
    
    try:
        user = User.objects.get(pk=int(user_id))
        
        if 'profile_picture' not in request.FILES:
            return JsonResponse({'success': False, 'error': 'No profile picture provided'})
        
        profile_picture = request.FILES['profile_picture']
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
        if profile_picture.content_type not in allowed_types:
            return JsonResponse({'success': False, 'error': 'Invalid file type. Please upload JPEG, PNG, or GIF'})
        
        # Validate file size (max 5MB)
        if profile_picture.size > 5 * 1024 * 1024:
            return JsonResponse({'success': False, 'error': 'File size too large. Maximum size is 5MB'})
        
        # Save the file
        fs = FileSystemStorage(location=settings.MEDIA_ROOT)
        filename = fs.save(f'profile_pictures/{profile_picture.name}', profile_picture)
        
        # Update user's profile picture
        user.profile_picture = f'profile_pictures/{profile_picture.name}'
        user.save()
        
        return JsonResponse({
            'success': True, 
            'message': 'Profile picture updated successfully',
            'profile_picture_url': f'/media/{filename}'
        })
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'User not found'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})
    

def logout(request):
    response = HttpResponseRedirect('/public/')
    response.delete_cookie('my_user')
    return response
    

def register_admin(request):
    if request.method != "POST":
        return render(request, 'htmls/admin_registration.html')
    try:
        data = json.loads(request.body)
        user = User(
            email = data.get('email'),
            username = data.get('email'),
        )
        print(data)
        print(user)
        user.set_password(
            data.get('password')
        )
        admin = Admin(
            user = user,
            admin_level = data.get('permission'),
            position_in_university = data.get('role'),
            degree = data.get('degree')
        )
        user.save()
        admin.save()
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': f"{e}"})
