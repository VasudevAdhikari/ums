"""
URL configuration for course_management project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/', include('authorization.urls')),
    path('courses/', include('course_manager.urls')),
    path('public/', include('public.urls')),
    path('executives/', include('executives.urls')),
    path('students/', include('students.urls')),
    path('faculty/', include('faculty.urls')),
    path('noticeboard/', include('noticeboard.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


from django.shortcuts import render

def custom_error(request, exception):
    return render(request, "htmls/access_denied.html", {'message': 'An error occurred. Please contact the development team.'})

def custom_error_without_exception(request):
    return render(
        request, "htmls/access_denied.html", 
        {'message': 'An error occurred. Please contact the development team.'}
    )

# Register global error handlers
handler404 = "course_management.urls.custom_error"
handler500 = "course_management.urls.custom_error_without_exception"
handler403 = "course_management.urls.custom_error"
handler400 = "course_management.urls.custom_error"