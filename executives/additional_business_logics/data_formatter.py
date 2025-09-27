from authorization.models import Student, Instructor, Department, UniversityDetails
from executives.additional_business_logics.additionals import *

def get_student_for_approval(student: Student):
    user = student.user
    return {
        "id": user.pk,
        "name": user.full_name,
        "email": user.email,
        "profile": user.profile_picture.url,
        "phone": user.phone,
        "city": user.city,
        "date_of_birth": user.date_of_birth,
        "telegram_username": user.telegram_username,
        "outlook_mail": user.outlook_email,
        "gender": user.get_gender_display(),
        "emergency_contact": (
            {
                "name": user.emergency_contact.contact_name,
                "email": user.emergency_contact.email,
                "phone": user.emergency_contact.phone,
            }
            if user and user.emergency_contact
            else ''
        ),
    }

def get_instructor_for_approval(instructor: Instructor):
    user = instructor.user
    return {
        "id": user.pk,
        "name": user.full_name,
        "email": user.email,
        "profile": user.profile_picture.url,
        "phone": user.phone,
        "city": user.city,
        "date_of_birth": user.date_of_birth,
        "telegram_username": user.telegram_username,
        "outlook_mail": user.outlook_email,
        "gender": user.get_gender_display(),
        "degree": instructor.degree,
        "specialization": instructor.specialization,
        "emergency_contact": (
            {
                "name": user.emergency_contact.contact_name,
                "email": user.emergency_contact.email,
                "phone": user.emergency_contact.phone,
            }
            if user and user.emergency_contact
            else ''
        ),
    }


def get_course_type(course_code, course_list):
    for course in course_list:
        if course['course_code'] == course_code:
            return course['type']
    return None  # or raise an error if not found


def get_lab_details_data(request, lab_name):
    """Fetch and format lab details with optimized queries."""
    labs = UniversityDetails.objects.filter(name="labs").values_list("details", flat=True).first()
    if not labs:
        return {}

    current_lab = labs.get(lab_name, {})
    if not current_lab:
        return {}

    # TODO: Replace with proper filters: e.g. User.objects.filter(role="project_leader")
    project_leaders = User.objects.select_related("instructor").all()
    lab_heads = None
    try:
        lab_heads = User.objects.select_related("instructor").filter(instructor__department__name=current_lab.get('department').get('name'))
    except Exception as e:
        print(e)
        pass
    project_members = User.objects.select_related("instructor").all()

    departments = list(Department.objects.values("id", "name"))

    head_of_lab = None
    if current_lab.get("head_of_lab"):
        head_of_lab = User.objects.filter(pk=current_lab["head_of_lab"]).first()

    return {
        "lab_data": current_lab,
        "lab_key": lab_name,
        "all_project_leaders": get_formatted_lab_members(project_leaders),
        "all_project_members": get_formatted_lab_members(project_members),
        "all_lab_heads": get_formatted_lab_members(lab_heads),
        "head_of_lab": head_of_lab,
        "lab_head_dept": get_head_of_labs_department(head_of_lab),
        "projects": current_lab.get("projects", {}),
        "departments": departments,
        "current_lab_dept": current_lab.get("department", {}),
    }
