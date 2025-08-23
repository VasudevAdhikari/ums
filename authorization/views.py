from django.shortcuts import render
from django.contrib.auth import login, authenticate
from .models import NotificationType, User, Student, EmergencyContact, OTP, LoginAttempt, Admin, Notification
from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import send_mail
from django.conf import settings
import json
import random
from datetime import timedelta
from django.utils import timezone
from django.core.files.storage import FileSystemStorage
from django.contrib.auth.hashers import check_password
from .models import StudentStatus, Student, Instructor, EmploymentStatus
from django.core.exceptions import PermissionDenied
from django.core.cache import cache

# Create your views here.

def register_view(request):
    if request.method == 'POST':
        # Handle form submission
        # This will be implemented later
        pass
    return render(request, 'htmls/register.html')

def login_view(request):
    return render(request, 'htmls/login.html')

def generate_otp():
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])

def generate_student_number():
    """Generate a unique student number in format: YYYYMMDD-XXXX"""
    while True:
        # Get current year and month
        now = timezone.now()
        year_month = now.strftime('%Y%m')
        
        # Generate random 4-digit number
        random_num = ''.join([str(random.randint(0, 9)) for _ in range(4)])
        
        # Combine to create student number
        student_number = f"{year_month}-{random_num}"
        
        # Check if this student number already exists
        if not Student.objects.filter(student_number=student_number).exists():
            return student_number

def send_verification_email(email, otp):
    print("The email is " + email + " and the otp is " + otp)
    subject = 'Email Verification OTP'
    message = f'''
    Hello,

    Your OTP for email verification is: {otp}
    
    This OTP will expire in 5 minutes.
    
    If you did not request this OTP, please ignore this email.
    
    Best regards,
    MM Logic Gallery
    '''
    from_email = settings.EMAIL_HOST_USER
    recipient_list = [email]
    
    try:
        send_mail(subject, message, from_email, recipient_list)
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False

@require_POST
@csrf_exempt
def verify_mail(request):
    try:
        data = json.loads(request.body)
        email = data.get('email')
        
        if not email:
            return JsonResponse({
                'success': False,
                'message': 'Email is required'
            }, status=400)
            
        # Check if email already exists
        if User.objects.filter(email=email).exists():
            return JsonResponse({
                'success': False,
                'message': 'Email already has an account'
            })
            
        # Generate 6-digit OTP
        otp = generate_otp()
        
        # Store OTP in database with 5-minute expiration
        expiration_time = timezone.now() + timedelta(minutes=5)
        otp_record = OTP.objects.create(
            email=email,  # Store email for verification
            otp_code=otp,
            generated_at=timezone.now(),
            expires_at=expiration_time,
            used=False
        )
        
        try:
            # Send OTP via email
            send_mail(
                'Email Verification OTP',
                f'Your OTP for email verification is: {otp}. This OTP will expire in 5 minutes.',
                settings.EMAIL_HOST_USER,
                [email],
                fail_silently=False,
            )
            
            return JsonResponse({
                'success': True,
                'message': 'OTP sent successfully to your email',
                'otp_id': otp_record.id  # Return the OTP record ID for later use
            })
            
        except Exception as e:
            # If email sending fails, delete the OTP record
            otp_record.delete()
            return JsonResponse({
                'success': False,
                'message': 'Failed to send OTP. Please try again.'
            })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@csrf_exempt
@require_POST
def verify_otp(request):
    try:
        data = json.loads(request.body)
        email = data.get('email')
        otp = data.get('otp')
        
        print(f"Received email: {email}, OTP: {otp}")  # Debug print
        
        if not email or not otp:
            return JsonResponse({'verified': False, 'error': 'Email and OTP are required'})
        
        # Get all non-expired OTPs for the email, ordered by creation time (newest first)
        valid_otps = OTP.objects.filter(
            email=email,  # Check email field
            otp_code=otp,
            expires_at__gt=timezone.now(),
            used=False
        ).order_by('-generated_at')
        
        print(f"Found {valid_otps.count()} valid OTPs")  # Debug print
        
        if not valid_otps.exists():
            return JsonResponse({'verified': False, 'error': 'No valid OTP found or OTP has expired'})
        
        # Get the latest OTP
        latest_otp = valid_otps.first()
        print(f"Latest OTP from DB: {latest_otp.otp_code}, Type: {type(latest_otp.otp_code)}")  # Debug print
        print(f"Provided OTP: {otp}, Type: {type(otp)}")  # Debug print
        
        # Convert both to string for comparison
        if str(latest_otp.otp_code) == str(otp):
            print("OTP matched!")  # Debug print
            # Mark OTP as used
            latest_otp.used = True
            latest_otp.save()
            return JsonResponse({'verified': True, 'message': 'OTP verified successfully'})
        else:
            print("OTP did not match!")  # Debug print
            return JsonResponse({'verified': False, 'error': 'Invalid OTP'})
            
    except json.JSONDecodeError:
        return JsonResponse({'verified': False, 'error': 'Invalid JSON data'})
    except Exception as e:
        print(f"Error in verify_otp: {str(e)}")  # Debug print
        return JsonResponse({'verified': False, 'error': str(e)})

@csrf_exempt
@require_POST
def save_emergency_contact(request):
    try:
        data = json.loads(request.body)
        
        name = data.get('name')
        phone = data.get('phone')
        email = data.get('email')
        relation_to_user = data.get('relation', '')  # Default to empty string
        
        print(name, phone, email, relation_to_user)
        
        emergency_contact = EmergencyContact.objects.create(
            contact_name=name,
            phone=phone,
            email=email,
            relation_to_user=relation_to_user
        )

        return JsonResponse({
            'success': True,
            'emergency_id': emergency_contact.id
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@csrf_exempt
@require_POST
def save_student(request):
    try:
        # Get emergency contact ID
        emergency_contact_id = request.POST.get('emergency_contact_id')
        if not emergency_contact_id:
            print("there is no emergency contact id")
            return JsonResponse({'success': False, 'error': 'Emergency contact ID is required'})
        
        # Get emergency contact
        try:
            print("gonna get emergency contact")
            emergency_contact = EmergencyContact.objects.get(id=emergency_contact_id)
            print("got emergency contact")
        except EmergencyContact.DoesNotExist:
            print("emergency contact not found")
            return JsonResponse({'success': False, 'error': 'Emergency contact not found'})
        
        # Handle profile picture
        profile_picture = request.FILES.get('profile_picture')
        if not profile_picture:
            print("there is no profile picture")
            return JsonResponse({'success': False, 'error': 'Profile picture is required'})
        
        # Save profile picture
        fs = FileSystemStorage(location=settings.MEDIA_ROOT)
        filename = fs.save(f'profile_pictures/{profile_picture.name}', profile_picture)
        
        # Get form data
        full_name = request.POST.get('full_name', '')
        email = request.POST.get('email', '')
        phone = request.POST.get('phone', '')
        city = request.POST.get('city', '')
        gender = request.POST.get('gender', '')
        date_of_birth = request.POST.get('date_of_birth', '')
        telegram_username = request.POST.get('telegram_username', '')
        outlook_email = request.POST.get('outlook_email', '')
        password = request.POST.get('password', '')
        role = request.POST.get('role', 'student')  # Default to student if not specified

        # Create User first
        user = User.objects.create_user(
            username=email,  # Using email as username
            email=email,
            password=password,
            full_name=full_name,
            phone=phone,
            city=city,
            gender=gender,
            date_of_birth=date_of_birth,
            telegram_username=telegram_username,
            outlook_email=outlook_email,
            profile_picture=filename,
            emergency_contact=emergency_contact
        )

        if role.lower() == 'instructor':
            # Create Instructor
            user.is_staff = True
            user.save()
            instructor = Instructor.objects.create(
                user=user,
                # is_hod=False,  # Default to not HOD
                # is_hof=False,  # Default to not HOF
                degree=request.POST.get('degree'),
                specialization=request.POST.get('specialization'),
                employment_status=EmploymentStatus.UNAPPROVED
            )
            return JsonResponse({
                'success': True,
                'message': 'Instructor registered successfully',
                'role': 'instructor'
            })
        else:
            # Create Student
            student_number = generate_student_number()
            student = Student.objects.create(
                user=user,
                student_number=student_number,
                status=StudentStatus.UNAPPROVED
            )
            return JsonResponse({
                'success': True,
                'message': 'Student registered successfully',
                'student_number': student_number,
                'role': 'student'
            })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@require_http_methods(["POST"])
def check_email(request):
    try:
        data = json.loads(request.body)
        email = data.get('email')
        
        if not email:
            return JsonResponse({'error': 'Email is required'}, status=400)
            
        # Check if email exists
        if User.objects.filter(email=email).exists():
            return JsonResponse({'exists': True})
            
        return JsonResponse({'exists': False})
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_POST
def login(request):
    try:
        print(request)
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return JsonResponse({'success': False, 'error': 'Email and password are required'})
            
        # Try to get the user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Invalid email or password'})
            
        # Check for suspension based on login attempts in the last 3 days
        three_days_ago = timezone.now() - timedelta(days=3)
        recent_attempts = LoginAttempt.objects.filter(
            user=user,
            attempt_time__gte=three_days_ago,
            success=False
        ).count()

        if recent_attempts >= 5:
            return JsonResponse({
                'success': False,
                'error': 'Account is suspended for 3 days due to multiple failed login attempts.'
            })
            
        # Check if the password is correct
        if not user.check_password(password):
            # Record failed login attempt
            LoginAttempt.objects.create(
                user=user,
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                success=False
            )
            
            attempts_remaining = 5 - (recent_attempts + 1)
            if attempts_remaining > 0:
                return JsonResponse({
                    'success': False,
                    'error': f'Invalid email or password. {attempts_remaining} attempts remaining.'
                })
            else:
                return JsonResponse({
                    'success': False,
                    'error': 'Account has been suspended for 3 days due to multiple failed login attempts.'
                })
            
        # Check if user is a student
        try:
            if not user.is_staff:
                print(user)
                student = Student.objects.get(user=user)
                print(f'student is {student.student_number}')
                if student.status == StudentStatus.UNAPPROVED:
                    return JsonResponse({
                        'success': False,
                        'error': 'Your account is pending approval. Please wait for admin approval.'
                    })
            elif user.is_staff:
                print(user)
                instructor = Instructor.objects.get(user=user)
                if instructor.employment_status == EmploymentStatus.UNAPPROVED:
                    return JsonResponse({
                        'success': False,
                        'error': 'Your account is pending approval. Please wait for admin approval.'
                    })
        except Student.DoesNotExist:
            pass  # Not a student, proceed with login
        except Instructor.DoesNotExist:
            pass # Not an instructor, proceed with login
            
        print('before login')
        # Login successful
        from django.contrib import auth
        auth.login(request, user)
        
        print('after-login')
        
        # Record successful login attempt
        login_attempt = LoginAttempt(
            user=user,
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            success=True
        )
        login_attempt.save()

        Notification.objects.create(
            user=user,
            type=NotificationType.STUDENT,
            notification={
                "text": "There is a login attempt to your account. If that was not you, you should consider changing your password",
                "destination": f"/auth/profile/{user.pk}"
            }
        )

        role = ""
        if Student.objects.filter(user=user).exists():
            role="student"
        elif Instructor.objects.filter(user=user).exists():
            role="instructor"
        elif Admin.objects.filter(user=user).exists():
            role="executive"
        else:
            raise PermissionDenied('You are not allowed to access this page')
        
        role_cache = cache.get(f"user_role:{user.email}")
        if not role_cache:
            cache.set(f"user_role:{user.email}", role, timeout=60*60*24*30*2)
        
        response = JsonResponse({'success': True, 'is_instructor': user.is_staff, 'role': role})
        response.set_cookie('my_user', user, max_age=60*24*60*60)
        return response
            
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON data'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@require_POST
@csrf_exempt
def verify_email(request):
    try:
        data = json.loads(request.body)
        email = data.get('email')
        
        if not email:
            return JsonResponse({
                'success': False,
                'message': 'Email is required'
            }, status=400)
            
        # Check if email already exists
        if Student.objects.filter(email=email).exists():
            return JsonResponse({
                'success': False,
                'message': 'Email already registered'
            })
            
        # Generate 6-digit OTP
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
        # Store OTP in database with 5-minute expiration
        expiration_time = timezone.now() + timedelta(minutes=5)
        OTP.objects.create(
            email=email,
            otp=otp,
            otp_expiry=expiration_time
        )
        
        # Send OTP via email
        send_mail(
            'Email Verification OTP',
            f'Your OTP for email verification is: {otp}. This OTP will expire in 5 minutes.',
            settings.EMAIL_HOST_USER,
            [email],
            fail_silently=False,
        )
        
        return JsonResponse({
            'success': True,
            'message': 'OTP sent successfully'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)