# executives/components/faculty_manager.py
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.core.files.storage import default_storage
from django.shortcuts import get_object_or_404
from authorization.models import AcademicStatus, Faculty, UniversityDetails, Instructor, User
import json
from django.shortcuts import render

def faculty_to_dict(faculty):
    return {
        "id": faculty.id,
        "name": faculty.name,
        "email": faculty.contact_email,
        "phone": faculty.contact_phone,
        "location": faculty.location,
        "description": faculty.description,
        "head": faculty.head_of_faculty.full_name if faculty.head_of_faculty else None,
        "photo": faculty.faculty_photo.url if faculty.faculty_photo else "",
        "status": faculty.status.strip().capitalize()
    }

def show_faculty_management(request):
    uni_info = UniversityDetails.objects.filter(name='university_info').first().details if UniversityDetails.objects.filter(name='university_info').exists() else {}
    photos = UniversityDetails.objects.filter(name='photos').first().details.keys() if UniversityDetails.objects.filter(name='photos').exists() else []
    fac = Faculty.objects.all().order_by('status', 'id')
    faculties = [faculty_to_dict(f) for f in fac]

    # to fix. List all the user details of instructors
    # instructors_details = Instructor.objects.all()
    # instructors = []
    # for instructor in instructors_details:
    #     # instructors.append(instructor.u)
    #     instructors.append({'name': instructor.user.full_name, 'img': instructor.user.profile_picture})

    users = Instructor.objects.select_related(
        'user', 'department__faculty'
    ).all()
    instructors = []
    for instructor in users:
        instructors.append({'name': instructor.user.full_name, 'img': instructor.user.profile_picture.url, 'id': instructor.user.pk, 'faculty_id': instructor.department.faculty.id})
    # print(instructors)
    data = {
        'photos': photos,
        'university_name': uni_info.get('name'),
        'university_profile': uni_info.get('profile'),
        'faculties': faculties,
        'instructors': instructors,
    }
    return render(request, 'executives/faculty_management.html', context=data)


@csrf_exempt
@require_http_methods(["POST"])
def faculty_add(request):
    try:
        if request.content_type.startswith("application/json"):
            data = json.loads(request.body)
            photo = None
        else:
            data = request.POST
            photo = request.FILES.get("photo")
        print(data)
        print(f'head is {User.objects.get(pk=int(data.get("head")))}')

        faculty = Faculty(
            pk= int(Faculty.objects.all().last().pk) + 1 if Faculty.objects.all() else int(1),
            name=data.get("name", ""),
            contact_email=data.get("email", ""),
            contact_phone=data.get("phone", ""),
            location=data.get("location", ""),
            description=data.get("description", ""),
            head_of_faculty= User.objects.get(pk=int(data.get("head"))) if data.get("head") else None
        )
        if photo:
            faculty.faculty_photo = default_storage.save(f"faculty/{photo.name}", photo)
        faculty.save()
        return JsonResponse({"success": True, "faculty": faculty_to_dict(faculty)})
    except Exception as e:
        print(e)
        return JsonResponse({"success": False, "error": str(e)})

@csrf_exempt
@require_http_methods(["POST"])
def faculty_edit(request, faculty_id):
    try:
        faculty = get_object_or_404(Faculty, pk=faculty_id)
        if request.content_type.startswith("application/json"):
            data = json.loads(request.body)
            photo = None
        else:
            data = request.POST
            photo = request.FILES.get("photo")
        print(data)
        faculty.name = data.get("name", faculty.name)
        faculty.contact_email = data.get("email", faculty.contact_email)
        faculty.contact_phone = data.get("phone", faculty.contact_phone)
        faculty.location = data.get("location", faculty.location)
        faculty.description = data.get("description", faculty.description)
        faculty.head_of_faculty = User.objects.get(pk=int(data.get("head"))) if data.get("head") else faculty.head_of_faculty
        if photo:
            faculty.faculty_photo = default_storage.save(f"faculty/{photo.name}", photo)
        faculty.save()
        return JsonResponse({"success": True, "faculty": faculty_to_dict(faculty)})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)})

@csrf_exempt
@require_http_methods(["POST"])
def faculty_delete(request, faculty_id):
    try:
        faculty = get_object_or_404(Faculty, pk=int(faculty_id))
        if faculty.status == AcademicStatus.ACTIVE:
            faculty.status = AcademicStatus.INACTIVE
        else:
            faculty.status = AcademicStatus.ACTIVE
        faculty.save()
        return JsonResponse({"success": True})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)})
