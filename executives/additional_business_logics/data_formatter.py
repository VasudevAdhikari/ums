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
    labs = UniversityDetails.objects.filter(name='labs').first().details
    current_lab = labs.get(lab_name)

    # project_leader ORM query has to be fixed to all admins and instructors
    project_leaders = User.objects.all()
    print(f"DEBUG: User.objects.all() count: {project_leaders.count()}")
    print(f"DEBUG: First few users: {list(project_leaders[:3].values('id', 'full_name'))}")
    
    all_project_leaders = get_formatted_lab_members(project_leaders)

    project_members = User.objects.all()
    all_project_members = get_formatted_lab_members(project_members)

    departments = list(Department.objects.all().values('id', 'name'))
    print(f"DEBUG: Department.objects.all() count: {len(departments)}")
    print(f"DEBUG: First few departments: {departments[:3]}")

    # lab_heads ORM query has to be fixed to all admins
    lab_heads = User.objects.all()
    all_lab_heads = get_formatted_lab_members(lab_heads)

    head_of_lab = User.objects.get(pk=int(current_lab.get('head_of_lab'))) if current_lab.get('head_of_lab') else None
    lab_head_dept = get_head_of_labs_department(head_of_lab)
    projects = current_lab.get('projects')
    
    # Debug project structure
    if projects:
        print(f"DEBUG: Projects found: {len(projects)}")
        for project_key, project_data in list(projects.items())[:2]:  # Show first 2 projects
            print(f"DEBUG: Project {project_key}:")
            print(f"  - Title: {project_data.get('title', 'N/A')}")
            print(f"  - Leader: {project_data.get('leader', project_data.get('project_lead', 'N/A'))}")
            print(f"  - Members: {project_data.get('members', 'N/A')}")
            print(f"  - Members type: {type(project_data.get('members', 'N/A'))}")
    else:
        print("DEBUG: No projects found")
    
    # Get current lab department
    current_lab_dept = current_lab.get('department', {})
    
    # Debug logging
    print(f"DEBUG: all_project_leaders count: {len(all_project_leaders)}")
    print(f"DEBUG: all_project_members count: {len(all_project_members)}")
    print(f"DEBUG: all_lab_heads count: {len(all_lab_heads)}")
    print(f"DEBUG: departments count: {len(departments)}")
    print(f"DEBUG: current_lab_dept: {current_lab_dept}")
    
    return {
        'lab_data': current_lab,
        'lab_key': lab_name,
        'all_project_leaders': all_project_leaders,
        'all_project_members': all_project_members,
        'all_lab_heads': all_lab_heads,
        'head_of_lab': head_of_lab,
        'lab_head_dept': lab_head_dept,
        'projects': projects or {},
        'departments': departments,
        'current_lab_dept': current_lab_dept,
    }
