from django.shortcuts import render, redirect
from authorization.models import BatchInstructor, EnrollmentCourse
import json

def show_rating_review(request, batch_instructor_id):
    batch_instructor = BatchInstructor.objects.filter(
        pk=int(batch_instructor_id)
    ).select_related(
        'batch__term', 
        'batch__semester', 
        'batch__semester__degree', 
        'instructor__department',
        'instructor__user',
        'course'
    ).first()
    
    enrollment_courses = EnrollmentCourse.objects.filter(
        batch_instructor_id=batch_instructor_id,
    )
    ratings = []
    for enrollment_course in enrollment_courses:
        ratings.append({
            'rating': enrollment_course.rating,
            'review': enrollment_course.review,
        })

    data = {
        'bi': batch_instructor,
        'ratings': json.dumps(ratings),
    }
    return render(request, 'executives/rating_reviews.html', context=data)