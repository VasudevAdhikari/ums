from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
from authorization.models import Degree, Semester, Faculty, Course
from django.shortcuts import render, redirect

def get_all_degrees():
    all_degrees = []
    for degree in Degree.objects.all():
        semesters = Semester.objects.filter(degree=degree).order_by('pk')
        syllabus = []
        total_hours = 0
        for idx, sem in enumerate(semesters):
            courses = []
            sem_weeks = getattr(sem, 'duration_weeks', 16)
            for course in sem.syllabus_structure:
                hours = (course.get("course_hours", 0) or 0) * sem_weeks
                total_hours += hours
                courses.append({
                    "code": course.get("course_code", ""),
                    "title": course.get("course_name", ""),
                    "credit": course.get("course_credits", 0),
                    "hours": course.get("course_hours", 0),
                    "type": course.get("type", "Core")
                })
            syllabus.append({
                "semester": idx + 1,
                "courses": courses,
                "weeks": sem_weeks
            })
        all_degrees.append({
            "id": degree.pk,
            "title": degree.name,
            "code": degree.code,
            "faculty": {
                "name": degree.faculty.name if degree.faculty else '',
                "id": degree.faculty.pk if degree.faculty else '',
            },
            "faculty_id": degree.faculty.pk if degree.faculty else '',
            "duration": degree.duration,
            "description": degree.description or """
                Backend Python: all_degrees now includes faculty, description, and total_hours for each degree, and calculates total study hours.
                JS: The card layout uses clear text hierarchy, icons, and truncates long descriptions. All key info (name, code, faculty, duration, description, credits, courses, hours) is shown with appropriate styling.
                CSS: The card, image, and all text levels are styled for clarity, contrast, and modern look, with different font sizes and shades for each info type.
                You now have a beautiful, information-rich degree card grid. Let me know if you want further tweaks or a dark mode!
            """,
            "credit": degree.total_credits,
            "courses": degree.total_courses,
            "total_hours": total_hours or degree.total_hours,
            "image": degree.degree_image.url if hasattr(degree.degree_image, 'url') else './img/bachelor.png',
            "syllabus": syllabus
        })
    return all_degrees  # Moved here





@csrf_exempt
def add_degree_api(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'POST required'}, status=405)
    try:
        # For image upload, use request.FILES and multipart form
        if request.content_type and request.content_type.startswith('multipart'):
            data = request.POST
            image_file = request.FILES.get('degree_image', None)
        else:
            data = json.loads(request.body)
            image_file = None

        faculty = Faculty.objects.get(id=data['faculty'])

        # Handle image upload
        from django.core.files.storage import default_storage
        from django.core.files.base import ContentFile
        import os
        image_name = 'default.jpg'
        if image_file:
            # Save to /media/degree/
            folder = 'degree/'
            if not os.path.exists(os.path.join('media', folder)):
                os.makedirs(os.path.join('media', folder), exist_ok=True)
            image_name = default_storage.save(folder + image_file.name, ContentFile(image_file.read()))
        elif data.get('degree_image') and data.get('degree_image').startswith('data:image/'):
            # If base64 image is sent (from JS), decode and save
            import base64, re
            imgstr = re.sub('^data:image/.+;base64,', '', data['degree_image'])
            ext = data['degree_image'].split(';')[0].split('/')[1]
            folder = 'degree/'
            if not os.path.exists(os.path.join('media', folder)):
                os.makedirs(os.path.join('media', folder), exist_ok=True)
            image_name = f"{folder}{data['code']}_{data['name']}.{ext}"
            with open(os.path.join('media', image_name), 'wb') as f:
                f.write(base64.b64decode(imgstr))

        degree = Degree(
            name=data['name'],
            code=data['code'],
            faculty=faculty,
            description=data.get('description', ''),
            total_credits=data.get('total_credits', 0),
            total_courses=data.get('total_courses', 0),
            total_hours=data.get('total_hours', 0),
            degree_image=image_name,
        )
        degree.save()
        # Save semesters
        # If multipart, semesters is a JSON string, parse it
        semesters_data = data.get('semesters', [])
        if isinstance(semesters_data, str):
            import json as _json
            semesters_data = _json.loads(semesters_data)
        for sem in semesters_data:
            Semester.objects.create(
                semester_name=sem['semester_name'],
                degree=degree,
                duration_weeks=sem.get('duration_weeks', 16),
                syllabus_structure=sem.get('syllabus_structure', []),
            )
        return JsonResponse({'success': True, 'degree_id': degree.id})
    except Faculty.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Faculty not found'}, status=400)
    except Exception as e:
        print(e)
        return JsonResponse({'success': False, 'message': str(e)}, status=500)


def get_degree_page_data(request):
    course_models = Course.objects.all()
    all_courses = []
    for course in course_models:
        all_courses.append({
            "course_name": course.course_name,
            "course_code": course.course_code,
            "course_credits": course.course_credits,
            "course_hours": course.course_hours,
        })

    faculty_models = Faculty.objects.all()
    all_faculties = []
    for faculty in faculty_models:
        all_faculties.append({
            "id": faculty.pk,
            "name": faculty.name,
            "photo": faculty.faculty_photo.url,
        })
    

    # Query all degrees and structure as required
    all_degrees = get_all_degrees()

    data = {
        "all_courses": all_courses,
        "all_faculties": all_faculties,
        "all_degrees": all_degrees,
    }
    return data


def show_degree_management(request):
    data = get_degree_page_data(request)
    return render(request, 'executives/degree_management.html', context=data)


def delete_degree(request, degree_id):
    degree_id = int(degree_id)
    try:
        Semester.objects.filter(degree_id=degree_id).delete()
        Degree.objects.get(pk=degree_id).delete()
    except Exception as e:
        print(e)
    return redirect('/executives/show_degree_management')

@csrf_exempt
def edit_degree_api(request, degree_id):
    print('got into edit degree api')
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'POST required'}, status=405)
    try:
        # For image upload, use request.FILES and multipart form
        if request.content_type and request.content_type.startswith('multipart'):
            data = request.POST
            print(data)
            image_file = request.FILES.get('degree_image', None)
        else:
            data = json.loads(request.body)
            print(data)
            image_file = None

        degree = Degree.objects.get(pk=degree_id)
        faculty = Faculty.objects.get(id=data['faculty'])
        print(degree, faculty, sep='\n')
        # Handle image upload
        from django.core.files.storage import default_storage
        from django.core.files.base import ContentFile
        import os
        image_name = degree.degree_image.name if hasattr(degree.degree_image, 'name') else degree.degree_image
        if image_file:
            folder = 'degree/'
            if not os.path.exists(os.path.join('media', folder)):
                os.makedirs(os.path.join('media', folder), exist_ok=True)
            image_name = default_storage.save(f"{folder}{image_file.name}", ContentFile(image_file.read()))
        elif data.get('degree_image') and str(data.get('degree_image')).startswith('data:image/'):
            import base64, re
            imgstr = re.sub('^data:image/.+;base64,', '', data['degree_image'])
            ext = data['degree_image'].split(';')[0].split('/')[1]
            folder = 'degree/'
            if not os.path.exists(os.path.join('media', folder)):
                os.makedirs(os.path.join('media', folder), exist_ok=True)
            image_name = f"{folder}{data['code']}_{data['name']}.{ext}"
            with open(os.path.join('media', image_name), 'wb') as f:
                f.write(base64.b64decode(imgstr))

        # Update degree fields
        degree.name = data.get('name', degree.name)
        degree.code = data.get('code', degree.code)
        degree.faculty = faculty if faculty else degree.faculty
        degree.description = data.get('description', degree.description)
        degree.total_credits = data.get('total_credits', degree.total_credits)
        degree.total_courses = data.get('total_courses', degree.total_courses)
        degree.total_hours = data.get('total_hours', degree.total_hours)
        degree.duration = data.get('duration', degree.duration)
        degree.degree_image = image_name
        degree.save()
        print(f"degree is {degree} with duration {degree.duration}")
        print(degree.duration, degree.total_hours, sep='\n==================\n')
        # Update semesters: delete old, add new
        Semester.objects.filter(degree=degree).delete()
        semesters_data = data.get('semesters', [])
        if isinstance(semesters_data, str):
            import json as _json
            semesters_data = _json.loads(semesters_data)
        for sem in semesters_data:
            Semester.objects.create(
                semester_name=sem['semester_name'],
                degree=degree,
                duration_weeks=sem.get('duration_weeks', 16),
                syllabus_structure=sem.get('syllabus_structure', []),
            )
        return JsonResponse({'success': True, 'degree_id': degree.id, 'all_degrees': get_all_degrees()})
    except Degree.DoesNotExist:
        print('does not exist')
        return JsonResponse({'success': False, 'message': 'Degree not found'}, status=404)
    except Faculty.DoesNotExist:
        print('faculty does not exist')
        return JsonResponse({'success': False, 'message': 'Faculty not found'}, status=400)
    except Exception as e:
        print(e)
        return JsonResponse({'success': False, 'message': str(e)}, status=500)
    
