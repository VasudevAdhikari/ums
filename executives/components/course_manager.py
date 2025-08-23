from django.shortcuts import render, redirect
from authorization.models import Course, Department, AssessmentType
from django.views.decorators.csrf import csrf_exempt
import json
from django.http import JsonResponse

def get_course_page_data(request):
    departments = Department.objects.all()
    courses = {}
    for department in departments:
        courses[department] = []
        for course in Course.objects.filter(department=department):
            courses[department].append(course)

    assessments = [{"id": label, "name": label} for _, label in AssessmentType.choices]
    data = {
        'departments': departments,
        'courses_by_departments': courses,
        'assessments': json.dumps(assessments),
    }
    return data

def show_course_management(request):
    data = get_course_page_data(request)
    return render(request, 'executives/course_management.html', context=data)

@csrf_exempt
def add_course(request):
    if request.method != 'POST':
        return redirect('/executives/show_course_management')

    department_id = request.POST.get('department')
    code = request.POST.get('code')
    hours = request.POST.get('hours')
    name = request.POST.get('name')
    credits = request.POST.get('credits')
    description = request.POST.get('description')

    # Extract marking scheme data
    assessments = request.POST.getlist('assessments[]')  # list of assessment IDs as strings
    percentages = request.POST.getlist('percentages[]')  # list of percentages as strings

    # Build dict for marking scheme: {AssessmentName: percentage}
    # Assuming you have a way to get assessment name from ID
    marking_scheme = {}
    try:
        percentages_float = [float(p) for p in percentages]
        total_percentage = sum(percentages_float)
        if total_percentage > 100:
            # handle error, e.g. reject or alert
            return redirect('/executives/show_course_management')

        for assessment_id, percentage in zip(assessments, percentages_float):
            marking_scheme[assessment_id] = percentage
    except Exception as e:
        return JsonResponse({'success': False, 'error': f"{e}"})

    # Create new Course object
    new_course = Course(
        department=Department.objects.get(pk=int(department_id)) if department_id else None,
        course_code=code or '',
        course_hours=int(hours) if hours else 30,
        course_name=name or '',
        course_credits=int(credits) if credits else 3,
        description=description or '',
        marking_scheme=marking_scheme  # assuming this is a JSONField on Course model
    )
    new_course.save()

    return redirect('/executives/show_course_management')



@csrf_exempt
def edit_course(request, course_id):
    if request.method != 'POST':
        return redirect('/executives/show_course_management')

    try:
        course = Course.objects.get(pk=course_id)
    except Course.DoesNotExist:
        return redirect('/executives/show_course_management')

    department_id = request.POST.get('department')
    code = request.POST.get('code')
    hours = request.POST.get('hours')
    name = request.POST.get('name')
    credits = request.POST.get('credits')
    description = request.POST.get('description')

    # Extract marking scheme data
    assessments = request.POST.getlist('assessments[]')  # list of assessment IDs as strings
    percentages = request.POST.getlist('percentages[]')  # list of percentages as strings

    marking_scheme = {}
    try:
        percentages_float = [float(p) for p in percentages]
        total_percentage = sum(percentages_float)
        if total_percentage > 100:
            # handle error, e.g. reject or alert
            return redirect('/executives/show_course_management')

        for assessment_id, percentage in zip(assessments, percentages_float):
            marking_scheme[assessment_id] = percentage
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

    # Update course fields
    course.department = Department.objects.get(pk=int(department_id)) if department_id else None
    course.course_code = code or ''
    course.course_hours = int(hours) if hours else 30
    course.course_name = name or ''
    course.course_credits = int(credits) if credits else 3
    course.description = description or ''
    course.marking_scheme = marking_scheme

    course.save()
    return redirect('/executives/show_course_management')

@csrf_exempt
def delete_course(request, course_id):
    print('something')
    if request.method != 'POST':
        return redirect('/executives/show_course_management')
    print(course_id)
    course = Course.objects.get(pk=int(course_id))
    course.delete()
    return redirect('/executives/show_course_management')