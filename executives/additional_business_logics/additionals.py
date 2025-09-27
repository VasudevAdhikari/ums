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


def get_formatted_lab_members(users):
    """Format lab members with safe defaults."""
    default_img = (
        "https://thumbs.dreamstime.com/b/anonymous-user-flat-icon-vector-illustration-long-shadow-anonymous-user-flat-icon-105446565.jpg"
    )
    return [
        {
            "name": user.full_name,
            "img": f"/media/{user.profile_picture}" if user.profile_picture else default_img,
            "id": user.pk,
            "department_id": getattr(user.instructor, "department_id", None)
            if hasattr(user, "instructor")
            else None,
        }
        for user in users
    ]

def get_head_of_labs_department(head_of_lab: User):
    """Return department name for a given lab head user."""
    if not head_of_lab:
        return "Not Known"
    try:
        instructor = Instructor.objects.select_related("department").get(user=head_of_lab)
        return instructor.department.name if instructor.department else "Not Known"
    except Instructor.DoesNotExist:
        return "Not Known"

    
def get_labs(project_dict):
    projects = []
    for project in project_dict:
        pass