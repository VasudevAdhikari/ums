from django.urls import path
from . import views

app_name = 'noticeboard'

urlpatterns = [
    path('', views.home, name='home'),
    path('manage-post/', views.manage_post, name='manage_post'),
    path('pending/', views.pending, name='pending'),
    # API endpoints
    path('api/posts/', views.create_post, name='create_post'),
    path('api/posts/list/', views.list_posts, name='list_posts'),
    path('api/posts/my/', views.list_my_posts, name='list_my_posts'),
    path('api/posts/pending/', views.list_pending_posts, name='list_pending_posts'),
    path('api/posts/<int:post_id>/approve/', views.approve_post, name='approve_post'),
    path('api/posts/<int:post_id>/reject/', views.reject_post, name='reject_post'),
    path('api/posts/<int:post_id>/delete/', views.delete_post, name='delete_post'),
]
