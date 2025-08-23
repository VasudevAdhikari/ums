from django.urls import path
from . import views
from public.components import notification_manager

urlpatterns = [
    path('', views.show_public_page, name='home'),

    path('notifications/<int:user_id>/', notification_manager.show_notifications, name='show_notifications'),
    path('notifications/', notification_manager.show_notifications, name='show_notifications'),
    path('terms/', views.show_terms, name='terms'),
    path('degrees/', views.show_degrees, name='degrees'),
    path('courses/', views.show_courses, name='courses'),
    path('lab_details/<str:lab_name>/', views.show_lab_details, name='lab_details'),
    path('access_denied/', views.say_access_denied, name='access_denied'),
] 