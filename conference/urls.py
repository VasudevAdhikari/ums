from django.urls import path
from . import views

urlpatterns = [
    path('create_conference/', views.create_conference, name='create_conference'),
    path("delete/<int:vc_id>/", views.delete_conference, name="delete_conference"),
    path("meeting/<int:meeting_id>/", views.meeting, name="join_meeting"),
    path("save_meeting_code/<int:vc_id>/", views.save_meeting_code, name="save_meeting_code"),
]