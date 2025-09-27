from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.core.files.storage import default_storage
from django.shortcuts import get_object_or_404, render, redirect
from authorization.models import AcademicStatus, Department, Faculty, Instructor, User
import json

def department_to_dict(dept: Department):
    return {
        "id": dept.id,
        "name": dept.name,
        "email": getattr(dept, "contact_email", ""),
        "phone": getattr(dept, "contact_phone", ""),
        "location": getattr(dept, "location", ""),
        "description": getattr(dept, "description", ""),
        "head": dept.head_of_department.full_name,
        "photo": dept.department_photo.url if getattr(dept, "department_photo", None) else "",
        "faculty_id": dept.faculty.id if getattr(dept, "faculty", None) else "",
        "faculty_name": dept.faculty.name if getattr(dept, "faculty", None) else "",
        "status": dept.status.strip().capitalize()
    }

def show_department_management(request):
    faculties = Faculty.objects.all().order_by('id')
    departments = Department.objects.all().order_by('status', 'name')
    departments_data = [department_to_dict(d) for d in departments]
    instructor_data = Instructor.objects.select_related('user', 'department').all()
    instructors = [{'name': u.user.full_name, 'img': u.user.profile_picture.url if u.user.profile_picture else '', 'id': u.user.pk, 'department_id': u.department.id} for u in instructor_data]
    data = {
        'faculties': faculties,
        'departments': departments_data,
        'instructors': instructors,
    }
    return render(request, 'executives/department_management.html', context=data)

@csrf_exempt
@require_http_methods(["GET"])
def department_list(request):
    departments = Department.objects.all().order_by('id')
    data = [department_to_dict(d) for d in departments]
    return JsonResponse({"success": True, "departments": data})

@csrf_exempt
@require_http_methods(["POST"])
def department_add(request):
    print('\n\n\n\n\n\n=================\n\n\n\n\n\nGot into add dept\n\n\n\n\n============')
    try:
        if request.content_type and request.content_type.startswith("application/json"):
            data = json.loads(request.body)
            photo = None
        else:
            data = request.POST
            photo = request.FILES.get("photo")
        print(data)
        dept = Department()
        dept.name = data.get("name", "")
        if hasattr(dept, "contact_email"):
            dept.contact_email = data.get("email", "")
        if hasattr(dept, "contact_phone"):
            dept.contact_phone = data.get("phone", "")
        if hasattr(dept, "location"):
            dept.location = data.get("location", "")
        if hasattr(dept, "description"):
            dept.description = data.get("description", "")
        if hasattr(dept, "head_of_department"):
            dept.head_of_department = User.objects.get(pk = int(data.get("head", ""))) if data.get("head") else None
        faculty_id = data.get("faculty")
        if faculty_id:
            dept.faculty = get_object_or_404(Faculty, pk=faculty_id)
        if photo:
            dept.department_photo = default_storage.save(f"department/{photo.name}", photo)
        dept.save()
        return JsonResponse({"success": True})
        # return redirect('/executives/show_department_management')
    except Exception as e:
        print(e)
        return JsonResponse({"success": False, "error": str(e)})

@csrf_exempt
@require_http_methods(["POST"])
def department_edit(request, department_id):
    try:
        dept = get_object_or_404(Department, pk=department_id)
        if request.content_type and request.content_type.startswith("application/json"):
            data = json.loads(request.body)
            photo = None
        else:
            data = request.POST
            photo = request.FILES.get("photo")
        print(data)
        if "name" in data:
            dept.name = data.get("name", dept.name)
        if hasattr(dept, "contact_email") and "email" in data:
            dept.contact_email = data.get("email", dept.contact_email)
        if hasattr(dept, "contact_phone") and "phone" in data:
            dept.contact_phone = data.get("phone", dept.contact_phone)
        if hasattr(dept, "location") and "location" in data:
            dept.location = data.get("location", dept.location)
        if hasattr(dept, "description") and "description" in data:
            dept.description = data.get("description", dept.description)
        print('success')
        if hasattr(dept, "head_of_department") and "head" in data:
            dept.head_of_department = User.objects.get(pk = int(data.get
            ("head"))) if data.get('head') else dept.head_of_department
        print('success')
        if faculty_id := data.get("faculty"):
            dept.faculty = get_object_or_404(Faculty, pk=faculty_id)
        if photo:
            dept.department_photo = default_storage.save(f"department/{photo.name}", photo)
        dept.save()
        print('success')
        return JsonResponse({"success": True})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)})

@csrf_exempt
@require_http_methods(["POST"])
def department_delete(request, department_id):
    try:
        dept = get_object_or_404(Department, pk=department_id)
        if dept.status == AcademicStatus.ACTIVE:
            dept.status = AcademicStatus.INACTIVE
        else:
            dept.status = AcademicStatus.ACTIVE
        dept.save()
        return JsonResponse({"success": True})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)})
