from django.urls import path
from . import views, recovery_views, profile_manager

urlpatterns = [
    path('logout/', profile_manager.logout, name='logout'),
    path('login/', views.login_view, name='login'),
    path('login_submit/', views.login, name='login_submit'),
    path('register/', views.register_view, name='register'),
    path('check_email/', views.check_email, name='check_email'),
    path('verify_mail/', views.verify_mail, name='verify_mail'),
    path('verify_otp/', views.verify_otp, name='verify_otp'),
    path('save_emergency_contact/', views.save_emergency_contact, name='save_emergency_contact'),
    path('save_student/', views.save_student, name='save_student'),
    
    # Recovery URLs
    path('otp_login/', recovery_views.otp_login_view, name='otp_login'),
    path('recovery/', recovery_views.recovery_view, name='recovery'),
    path('recovery/check_email/', recovery_views.check_email, name='recovery_check_email'),
    path('recovery/send_otp/', recovery_views.send_otp, name='recovery_send_otp'),
    path('recovery/verify_otp/', recovery_views.verify_otp, name='recovery_verify_otp'),
    path('recovery/new_password/<str:email>/', recovery_views.new_password_view, name='new_password'),
    path('recovery/change_password/', recovery_views.change_password, name='change_password'),
    path('credential_login/', recovery_views.credential_login_view, name='credential_login'),
    path('credential_login/submit/', recovery_views.credential_login, name='credential_login_submit'),
    path('emergency_contact_login/', recovery_views.emergency_contact_login_view, name='emergency_contact_login'),
    path('mail_verification/', views.verify_email, name='mail_verification'),

    # Profile Management URLs
    path('profile/<int:user_id>/', profile_manager.show_profile_management, name='profile'),
    path('profile/check_pwd/<int:user_id>/<str:password>/', profile_manager.check_password, name='check_password'),
    path('profile/save/<int:user_id>/', profile_manager.save_profile, name='save_profile'),
    path('profile/change_password/<int:user_id>/', profile_manager.change_password, name='change_password'),
    path('profile/upload_picture/<int:user_id>/', profile_manager.upload_profile_picture, name='upload_profile_picture'),

    path('register_admin/', profile_manager.register_admin, name='register_admin'),
]