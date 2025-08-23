from django.urls import path
from .components import quiz_manager, batch_instructor_manager, assessment_manager, result_sheet_manager, rating_review_manager
from django.conf import settings

urlpatterns = [
    path('quiz/<int:quiz_id>/', quiz_manager.show_quiz, name='show_quiz'),
    path('quiz_answer/<int:quiz_id>/', quiz_manager.show_quiz_answer, name='show_quiz_answer'),
    path('quiz/submit/', quiz_manager.submit_quiz, name='submit_quiz'),

    path('assessment/<int:assessment_id>/', assessment_manager.show_assessment_submission, name='show_assessment_submission'),
    path('assessment/submit/', assessment_manager.submit_assessment, name='submit_assessment'),

    path('course/<int:batch_instructor_id>/', batch_instructor_manager.show_course_details, name='show_course_details'),

    path('submitted_assessment/<int:assessment_id>/', assessment_manager.show_submitted_assessment, name='show_submitted_assessment'),

    path('home/', batch_instructor_manager.show_home_page, name='show_home_page'),

    path('batch_instructor/<int:batch_instructor_id>/', batch_instructor_manager.show_course_page, name='show_course_page'),

    path('results/<int:student_id>/', result_sheet_manager.show_result_sheets, name='show_result_sheets'),

    path('enrollment_course_review/<int:batch_instructor_id>/', rating_review_manager.review_enrollment_course, name='review_enrollment_course'),
    path('enrollment_course_rating/<int:batch_instructor_id>/', rating_review_manager.rate_enrollment_course, name='rate_enrollment_course'),

    path('all_results/<int:batch_instructor_id>/', assessment_manager.show_all_assessment_results, name='show_all_assessment_results')
]