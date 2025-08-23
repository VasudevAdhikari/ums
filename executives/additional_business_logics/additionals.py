from urllib.parse import urlparse
import os
from authorization.models import User, Instructor

def extract_filename_from_url(url):
    """
    Extracts the filename from a given URL.
    
    Args:
        url (str): The URL containing the filename (e.g., 'http://127.0.0.1:8000/media/orange.png')
    
    Returns:
        str: The extracted filename (e.g., 'orange.png')
    """
    parsed_url = urlparse(url)
    path = parsed_url.path  # Gets '/media/orange.png'
    return os.path.basename(path)


def get_formatted_lab_members(project_leaders):
    print(f"DEBUG: get_formatted_lab_members called with {len(project_leaders)} users")
    all_project_leaders = []
    
    for i, project_leader in enumerate(project_leaders):
        if i < 3:  # Only log first 3 for debugging
            print(f"DEBUG: Processing user {i}: {project_leader.full_name}, has instructor: {hasattr(project_leader, 'instructor')}")
            if hasattr(project_leader, 'instructor') and project_leader.instructor:
                print(f"DEBUG: User {i} instructor dept: {getattr(project_leader.instructor, 'department_id', None)}")
    
    all_project_leaders.extend(
        {
            'name': project_leader.full_name,
            'img': f"/media/{project_leader.profile_picture}" if project_leader.profile_picture else "https://thumbs.dreamstime.com/b/anonymous-user-flat-icon-vector-illustration-long-shadow-anonymous-user-flat-icon-105446565.jpg",
            'id': project_leader.pk,
            'department_id': getattr(project_leader.instructor, 'department_id', None) if hasattr(project_leader, 'instructor') else None,
        }
        for project_leader in project_leaders
    )
    
    print(f"DEBUG: get_formatted_lab_members returning {len(all_project_leaders)} formatted users")
    return all_project_leaders


def get_head_of_labs_department(head_of_lab: User):
    try:
        return Instructor.objects.get(user=head_of_lab).department.name
    except Exception as e:
        return 'Not Known'
    
def get_labs(project_dict):
    projects = []
    for project in project_dict:
        pass