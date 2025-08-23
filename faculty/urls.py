from django.urls import path, re_path
from .views import faculty_dashboard, show_profile
from .components import course_management
from faculty.components import document_manager, quiz_manager, assignment_manager

urlpatterns = [
    path('', faculty_dashboard, name='faculty_dashboard'),
    path('course_management/<str:batch_instructor_id>/', course_management.show_course_management, name='course_management'),
    path('api/assessment_scheme/<int:batch_id>/', course_management.marking_scheme_api, name='marking_scheme_api'),
    path('api/assessments/<int:batch_id>/', course_management.assessments_api, name='assessments_api'),
    path('api/assessments/delete/<int:assessment_id>/', course_management.delete_assessment, name='assessments_api'),
    path('api/documents/<int:course_id>/', document_manager.documents_api, name='documents_api'),
    path('document/add/', document_manager.add_document, name='document_add'),
    path('api/documents/add/', document_manager.add_document_api, name='add_document_api'),
    path('api/refer_document/<int:batch_instructor_id>/', document_manager.refer_document_api, name='refer_document_api'),
    path('api/referred_documents/<int:batch_instructor_id>/', document_manager.referred_documents_api, name='referred_documents_api'),
    path('batch_instructor_document/delete/<int:batch_instructor_document_id>/', document_manager.delete_batch_instructor_document, name='delete_batch_instructor_document'),
    path('document/delete/<int:document_id>/', document_manager.delete_document, name='delete_document'),


    path('quiz_creation/<int:assessment_id>/', quiz_manager.show_quiz_creation, name='show_quiz_creation'),
    path('create_quiz/', quiz_manager.create_quiz, name='creat_quiz'),

    re_path(
        r'^(assignment|midterm|final|project|labtest|practical|thesis|labproject|labassessment)_creation/(?P<assessment_id>\d+)/$',
        assignment_manager.show_assignment_creation,
        name='show_assignment_creation'
    ),
    path('create_assignment/', assignment_manager.create_assignment, name='create_assignment'),

    path('quiz_results/<int:quiz_id>/', quiz_manager.show_quiz_results, name='show_quiz_results'),

    path('assessment_submissions/<int:assessment_id>/', assignment_manager.show_assessment_submissions, name='show_assessment_submissions'),

    path('assessment_mark/update/<int:assessment_id>/<int:mark>/', assignment_manager.update_assessment_mark, name='update_assessment_mark'),

    path('all_results/<int:batch_instructor_id>/', course_management.show_all_results, name='all_results'),

    path('profile/', show_profile, name='profile'),
]