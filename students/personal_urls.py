from django.urls import path
from students.components import sis_manager
from students.components import enrollment_manager

urlpatterns = [
    path('sis_form/', sis_manager.show_sis_form, name='show_sis_form'),
    path('save_sis_form/', sis_manager.save_sis_form, name='save_sis_form'),
    path('update_sis_form/', sis_manager.update_sis_form, name='update_sis_form'),
    # Enrollment URLs
    path('enrollment/', enrollment_manager.show_enrollment_page, name='show_enrollment_page'),
    path('enrollment/get_batches/', enrollment_manager.get_batches_for_term, name='get_batches_for_term'),
    path('enrollment/get_courses/', enrollment_manager.get_courses_for_batch, name='get_courses_for_batch'),
    path('enrollment/submit/', enrollment_manager.save_enrollment, name='submit_enrollment'),
    path('profile/', sis_manager.show_profile, name='show_profile'),
]