from django.urls import path
from . import views, lab_api
from executives.components import faculty_manager, department_manager, course_manager, degree_manager, student_data_manager, term_manager, batch_manager, enrollment_manager, rating_review_manager, batch_statistics_manager, dashboard, instructor_data_manager

app_name = 'executives'

urlpatterns = [
    # Dashboard and Home
    path('', views.executive_home, name='executive_home'),
    path('all_students/', views.get_all_students, name='all_students'),
    path('unapproved_students/', views.get_unapproved_students, name='unapproved_students'),
    path('approve_student/<str:user_id>/', views.approve_student, name='approve_student'),
    path('reject_student/<str:user_id>/', views.reject_student, name='reject_student'),

    path('all_executives', views.show_all_executives, name='all_executives'),
    path('all_instructors/', views.show_all_instructors, name='all_instructors'),
    path('unapproved_instructors/', views.show_unapproved_instructors, name='unapproved_instructors'),
    path('approve_instructor/<str:user_id>/<str:dept_id>/<str:role>/', views.approve_instructor, name='approve_instructor'),
    path('reject_instructor/<str:user_id>/', views.reject_instructor, name='reject_instructor'),

    path('uni_info/', views.show_uni_info, name='show_uni_info'),
    path('uni_info_edit/', views.uni_info_edit, name='uni_info_edit'),


    path('show_lab_details/<str:lab_name>/', views.show_lab_details, name='show_lab_details'),


    path('show_degree_management', degree_manager.show_degree_management, name='show_degree_management'),


    path('show_course_management', course_manager.show_course_management, name='show_course_management'),
    path('course/add', course_manager.add_course, name='add_course'),
    path('course/edit/<str:course_id>', course_manager.edit_course, name='edit_course'),
    path('course/delete/<str:course_id>', course_manager.delete_course, name='delete_course'),

    # path('show_department_management', views.show_department_management, name='show_department_management'),
    path('show_faculty_management', faculty_manager.show_faculty_management, name='show_faculty_management'),

    # Degree API
    path('api/degree/add/', degree_manager.add_degree_api, name='add_degree_api'),
    path('api/degree/edit/<int:degree_id>/', degree_manager.edit_degree_api, name='edit_degree_api'),
    path('degree/delete/<str:degree_id>/', degree_manager.delete_degree, name='delete_degree'),

    # API Endpoints for Partnerships
    path('partnerships/add/', views.add_partnership_ajax, name='add_partnership_ajax'),
    path('partnerships/edit/', views.edit_partnership_ajax, name='edit_partnership_ajax'),
    path('partnerships/delete/', views.delete_partnership_ajax, name='delete_partnership_ajax'),

    # API Endpoints for Certificates
    path('certificates/add/', views.add_certificate_ajax, name='add_certificate_ajax'),
    path('certificates/edit/', views.edit_certificate_ajax, name='edit_certificate_ajax'),
    path('certificates/delete/', views.delete_certificate_ajax, name='delete_certificate_ajax'),

    # API Endpoints for University Photos
    path('photos/add/', views.add_photo_ajax, name='add_photo_ajax'),
    path('photos/edit/', views.edit_photo_ajax, name='edit_photo_ajax'),
    path('photos/delete/', views.delete_photo_ajax, name='delete_photo_ajax'),

    # API Endpoints for Labs
    path('labs/create/', views.add_lab_ajax, name='add_lab_ajax'),
    path('labs/delete/<str:lab_id>', views.delete_lab_ajax, name='delete_lab_ajax'),

    # API Endpoints for Lab Details
    path('labs/edit/<str:lab_name>', views.show_lab_details, name='show_lab_details'),

    # API Endpoints for Lab Details Editing
    path('api/labs/edit/<str:lab_key>/', lab_api.lab_edit_api, name='lab_edit_api'),
    path('api/labs/delete_photo/<str:lab_key>/', lab_api.lab_delete_photo_api, name='lab_delete_photo_api'),
    path('api/labs/edit_project/<str:lab_key>/<str:project_id>/', lab_api.lab_edit_project_api, name='lab_edit_project_api'),
    path('api/labs/add_photo/<str:lab_key>/', lab_api.lab_add_photo_api, name='lab_add_photo_api'),
    path('api/labs/add_project/<str:lab_id>/', lab_api.LabAddProjectAPI.as_view(), name='lab_add_project_api'),
    path('api/labs/update_department/<str:lab_name>/', views.update_lab_department, name='update_lab_department'),

    # API Endpoints for Faculty Management
    # path('api/faculty/list/', faculty_manager.faculty_list, name='faculty_list_api'),
    path('api/faculty/add/', faculty_manager.faculty_add, name='faculty_add_api'),
    path('api/faculty/edit/<int:faculty_id>/', faculty_manager.faculty_edit, name='faculty_edit_api'),
    path('api/faculty/delete/<int:faculty_id>/', faculty_manager.faculty_delete, name='faculty_delete_api'),

    # API Endpoints for Department Management
    path('show_department_management/', department_manager.show_department_management, name='show_department_management'),
    path('api/department/list/', department_manager.department_list, name='department_list_api'),
    path('api/department/add/', department_manager.department_add, name='department_add_api'),
    path('api/department/edit/<int:department_id>/', department_manager.department_edit, name='department_edit_api'),
    path('api/department/delete/<int:department_id>/', department_manager.department_delete, name='department_delete_api'),

    #API Endpoints for Term Management
    path('show_term_management/', term_manager.show_term_management, name='show_term_management'),
    path('terms/', term_manager.list_terms, name='list_terms'),
    path('terms/create/', term_manager.create_term, name='create_term'),
    path('terms/<int:term_id>/update/', term_manager.update_term, name='update_term'),
    path('terms/<int:term_id>/delete/', term_manager.delete_term, name='delete_term'),

    #API Endpoints for Batch Management
    path('batches/<int:term_id>/', batch_manager.show_batch_management, name='show_batch_management'),
    path('batches/edit/', batch_manager.edit_batch, name='edit_batch'),
    path('batches/list/', batch_manager.list_batches, name='list_batch'),
    path('batch_instructor/edit/', batch_manager.edit_batch_instructor, name='edit_batch_instructor'),
    path('batch_instructor/delete/', batch_manager.delete_batch_instructor, name='delete_batch_instructor'),

    # Endpoints for Enrollment Management
    path('enrollments/', enrollment_manager.show_enrollments, name='show_enrollments'),
    path('enrollment/reject/<int:student_id>/', enrollment_manager.reject_enrollment, name='reject_enrollment'),
    path('enrollment/approve/<int:student_id>/', enrollment_manager.approve_enrollment, name='appove_enrollment'),


    path('rating_review/<int:batch_instructor_id>/', rating_review_manager.show_rating_review, name='show_rating_review'),

    path('batch_statistics/<int:batch_id>/', batch_statistics_manager.show_batch_statistics, name='show_batch_statistics'),

    path('student_data/<int:student_id>/', student_data_manager.show_student_data, name='show_student_statistics'),
    path('instructor_data/<int:instructor_id>/', instructor_data_manager.show_instructor_data, name='show_instructor_data'),

    path('student/<str:action>/<int:user_id>/', student_data_manager.update_student_status, name='update_student_status'),

    path('dashboard/', dashboard.show_dashboard, name='dashboard'),

    path('send_results/<int:term_id>/', term_manager.send_results, name='send_results_to_a_term'),

    path("instructor/<int:instructor_id>/transfer/", instructor_data_manager.transfer_instructor, name="transfer_instructor"),
    path("instructor/<int:instructor_id>/retire/", instructor_data_manager.retire_instructor, name="retire_instructor"),
    path("instructor/<int:instructor_id>/leave/", instructor_data_manager.leave_instructor, name="leave_instructor"),
    path("instructor/<int:instructor_id>/active/", instructor_data_manager.approve_instructor, name="approve_instructor"),
    path("change_instructor_department/<int:instructor_id>/<int:department_id>/", instructor_data_manager.change_instructor_department, name="change_instructor_department"),
]
