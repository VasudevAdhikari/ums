from django.shortcuts import render
from authorization.models import BatchInstructor, Instructor
from django.http import JsonResponse
from executives.components.instructor_data_manager import get_instructor_data

# Create your views here.
def faculty_dashboard(request):

    instructor = Instructor.objects.filter(
        user__email = request.COOKIES.get('my_user'),
    ).first()
    if not instructor:
        return render(request, 'htmls/access_denied.html')
    
    batch_instructors = (
        BatchInstructor.objects 
        .filter(instructor=instructor)
        .select_related('batch__term', 'course', 'batch__semester')
        .order_by('batch__term__year', 'batch__term__term_name')  # optional: for nicer grouping
    )

    return render(request, 'faculty/faculty_home.html', {'batch_instructors': batch_instructors})

def show_profile(request):
    instructor = get_instructor_data(instructor_id=None, request=request)
    data = {
        'instructor': instructor,
    }
    return render(request, 'faculty/profile.html', context=data)
