from django.views import View
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.utils.decorators import method_decorator
from django.core.files.storage import default_storage
from django.conf import settings
from authorization.models import UniversityDetails, User
import json
import base64
import uuid
from .additional_business_logics.additionals import extract_filename_from_url

def get_labs_obj():
    labs_obj, _ = UniversityDetails.objects.get_or_create(name='labs')
    labs = labs_obj.details if labs_obj.details else {}
    if isinstance(labs, str):
        try:
            labs = json.loads(labs)
        except Exception:
            labs = {}
    return labs_obj, labs

def save_labs_obj(labs_obj, labs):
    labs_obj.details = labs
    labs_obj.save()

@method_decorator(csrf_exempt, name='dispatch')
class LabListAPI(View):
    def get(self, request):
        _, labs = get_labs_obj()
        return JsonResponse(labs, safe=False)

@method_decorator(csrf_exempt, name='dispatch')
class LabCreateAPI(View):
    def post(self, request):
        labs_obj, labs = get_labs_obj()
        data = json.loads(request.body)
        lab_name = data.get('lab_name')
        location = data.get('location', '')
        description = data.get('description', '')
        head_of_lab = data.get('head_of_lab', '')
        images = data.get('images', [])
        photos = data.get('photos', {})
        projects = data.get('projects', {})
        # Optionally handle base64 images
        if images and isinstance(images[0], str) and images[0].startswith('data:image'):
            img_urls = []
            for img_b64 in images:
                fmt, imgstr = img_b64.split(';base64,')
                ext = fmt.split('/')[-1]
                filename = f"lab_{uuid.uuid4().hex}.{ext}"
                img_data = base64.b64decode(imgstr)
                path = default_storage.save(f"labs/{filename}", img_data)
                img_urls.append(f"/media/{path}")
            images = img_urls
        lab_id = f"lab{len(labs)+1}"
        labs[lab_id] = {
            "lab_name": lab_name,
            "location": location,
            "images": images,
            "description": description,
            "head_of_lab": head_of_lab,
            "photos": photos,
            "projects": projects
        }
        save_labs_obj(labs_obj, labs)
        return JsonResponse({"success": True, "lab_id": lab_id})

@method_decorator(csrf_exempt, name='dispatch')
class LabEditAPI(View):
    def post(self, request, lab_id):
        labs_obj, labs = get_labs_obj()
        if lab_id not in labs:
            return JsonResponse({"success": False, "error": "Lab not found"})
        data = json.loads(request.body)
        for key in ["lab_name", "location", "images", "description", "head_of_lab", "photos"]:
            if key in data:
                labs[lab_id][key] = data[key]
        save_labs_obj(labs_obj, labs)
        return JsonResponse({"success": True})

@method_decorator(csrf_exempt, name='dispatch')
class LabDeleteAPI(View):
    def post(self, request, lab_id):
        labs_obj, labs = get_labs_obj()
        if lab_id in labs:
            labs.pop(lab_id)
            save_labs_obj(labs_obj, labs)
            return JsonResponse({"success": True})
        return JsonResponse({"success": False, "error": "Lab not found"})

@method_decorator(csrf_exempt, name='dispatch')
class LabAddPhotoAPI(View):
    def post(self, request, lab_id):
        print("Got into lab add photo api \n\n\n\n\n===========\n\n\n\n\n\n")
        labs_obj, labs = get_labs_obj()
        if lab_id not in labs:
            return JsonResponse({"success": False, "error": "Lab not found"})
        photo_file = request.FILES.get('photo')
        if not photo_file:
            return JsonResponse({"success": False, "error": "No photo uploaded"})
        photo_url = default_storage.save(f"labs/{photo_file.name}", photo_file)
        photo_key = f"photo{len(labs[lab_id].get('photos', {})) + 1}"
        labs[lab_id].setdefault('photos', {})[photo_key] = f"/media/{photo_url}"
        save_labs_obj(labs_obj, labs)
        return JsonResponse({"success": True, "photo_key": photo_key, "photo_url": f"/media/{photo_url}"})

@method_decorator(csrf_exempt, name='dispatch')
class LabDeletePhotoAPI(View):
    def post(self, request, lab_id):
        labs_obj, labs = get_labs_obj()
        data = json.loads(request.body)
        photo_key = data.get('photo_key')
        if lab_id in labs and photo_key in labs[lab_id].get('photos', {}):
            labs[lab_id]['photos'].pop(photo_key)
            save_labs_obj(labs_obj, labs)
            return JsonResponse({"success": True})
        return JsonResponse({"success": False, "error": "Photo not found"})

@method_decorator(csrf_exempt, name='dispatch')
class LabAddProjectAPI(View):
    def post(self, request, lab_id):
        labs_obj, labs = get_labs_obj()
        if lab_id not in labs:
            return JsonResponse({"success": False, "error": "Lab not found"})
        try:
            if request.content_type and request.content_type.startswith('application/json'):
                data = json.loads(request.body)
                projects = labs[lab_id].setdefault('projects', {})
                project_id = f"project{len(projects)+1}"
                # Tags
                tags = data.get("tags", "")
                tags_obj = {}
                if isinstance(tags, str):
                    tag_list = [t.strip() for t in tags.split(",") if t.strip()]
                    tags_obj = {f"tag{i+1}": tag for i, tag in enumerate(tag_list)}
                elif isinstance(tags, dict):
                    tags_obj = tags
                # Project leader (id or dict)
                project_lead = data.get("project_lead", {})
                if isinstance(project_lead, int) or (isinstance(project_lead, str) and project_lead.isdigit()):
                    user = User.objects.filter(pk=int(project_lead)).first()
                    if user:
                        project_lead = {
                            "name": user.get_full_name() or user.username,
                            "profile_picture": getattr(user, "profile_picture", "")
                        }
                    else:
                        project_lead = {}
                elif isinstance(project_lead, dict) and "id" in project_lead:
                    user = User.objects.filter(pk=int(project_lead["id"])).first()
                    if user:
                        project_lead = {
                            "name": user.get_full_name() or user.username,
                            "profile_picture": getattr(user, "profile_picture", "")
                        }
                    else:
                        project_lead = {}
                # Members (list of ids or dicts)
                members = data.get("members", [])
                members_list = []
                if isinstance(members, list):
                    for m in members:
                        if isinstance(m, int) or (isinstance(m, str) and m.isdigit()):
                            user = User.objects.filter(pk=int(m)).first()
                            if user:
                                members_list.append({
                                    "name": user.get_full_name() or user.username,
                                    "profile_picture": getattr(user, "profile_picture", "")
                                })
                        elif isinstance(m, dict) and "id" in m:
                            user = User.objects.filter(pk=int(m["id"])).first()
                            if user:
                                members_list.append({
                                    "name": user.get_full_name() or user.username,
                                    "profile_picture": getattr(user, "profile_picture", "")
                                })
                projects[project_id] = {
                    "title": data.get("name") or data.get("title"),
                    "description": data.get("desc") or data.get("description"),
                    "project_lead": project_lead,
                    "members": members_list,
                    "tags": tags_obj,
                    "project_photo": data.get("project_photo", ""),
                    "attachment": data.get("attachment", ""),
                    "project_demo": data.get("live") or data.get("project_demo", ""),
                    "project_link": data.get("external") or data.get("project_link", "")
                }
                save_labs_obj(labs_obj, labs)
                return JsonResponse({"success": True, "project_id": project_id})
            else:
                post = request.POST
                files = request.FILES
                projects = labs[lab_id].setdefault('projects', {})
                project_id = f"project{len(projects)+1}"
                # Tags
                tags = post.get("tags", "")
                tags_obj = {}
                if tags:
                    tag_list = [t.strip() for t in tags.split(",") if t.strip()]
                    tags_obj = {f"tag{i+1}": tag for i, tag in enumerate(tag_list)}
                # Project leader
                project_lead = post.get("project_lead", "")
                if project_lead.isdigit():
                    user = User.objects.filter(pk=int(project_lead)).first()
                    if user:
                        project_lead = {
                            "name": user.get_full_name() or user.username,
                            "profile_picture": getattr(user, "profile_picture", "")
                        }
                    else:
                        project_lead = {}
                # Members
                members = post.get("members", "[]")
                import json as _json
                try:
                    members = _json.loads(members)
                except Exception:
                    members = []
                members_list = []
                for m in members:
                    if isinstance(m, int) or (isinstance(m, str) and m.isdigit()):
                        user = User.objects.filter(pk=int(m)).first()
                        if user:
                            members_list.append({
                                "name": user.get_full_name() or user.username,
                                "profile_picture": getattr(user, "profile_picture", "")
                            })
                    elif isinstance(m, dict) and "id" in m:
                        user = User.objects.filter(pk=int(m["id"])).first()
                        if user:
                            members_list.append({
                                "name": user.get_full_name() or user.username,
                                "profile_picture": getattr(user, "profile_picture", "")
                            })
                # Save files
                project_photo_path = ""
                attachment_path = ""
                if 'project_photo' in files:
                    project_photo_path = default_storage.save(f"labs/{files['project_photo'].name}", files['project_photo'])
                if 'attachment' in files:
                    attachment_path = default_storage.save(f"labs/{files['attachment'].name}", files['attachment'])
                projects[project_id] = {
                    "title": post.get("name") or post.get("title"),
                    "description": post.get("desc") or post.get("description"),
                    "project_lead": project_lead,
                    "members": members_list,
                    "tags": tags_obj,
                    "project_photo": project_photo_path,
                    "attachment": attachment_path,
                    "project_demo": post.get("live") or post.get("project_demo", ""),
                    "project_link": post.get("external") or post.get("project_link", "")
                }
                save_labs_obj(labs_obj, labs)
                return JsonResponse({"success": True, "project_id": project_id})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})

# @method_decorator(csrf_exempt, name='dispatch')
# class LabEditProjectAPI(View):
#     def post(self, request, lab_id, project_id):
#         labs_obj, labs = get_labs_obj()
#         if lab_id not in labs or project_id not in labs[lab_id].get('projects', {}):
#             return JsonResponse({"success": False, "error": "Project not found"})
#         project = labs[lab_id]['projects'][project_id]
#         try:
#             if request.content_type and request.content_type.startswith('application/json'):
#                 data = json.loads(request.body)
#                 # Editable fields
#                 if "title" in data:
#                     project["title"] = data["title"]
#                 if "description" in data:
#                     project["description"] = data["description"]
#                 if "tags" in data:
#                     project["tags"] = data["tags"]
#                 if "project_photo" in data:
#                     project["project_photo"] = data["project_photo"]
#                 if "attachment" in data:
#                     project["attachment"] = data["attachment"]
#                 if "project_demo" in data:
#                     project["project_demo"] = data["project_demo"]
#                 if "project_link" in data:
#                     project["project_link"] = data["project_link"]
#                 # Project leader (id or dict)
#                 if "project_lead" in data:
#                     pl = data["project_lead"]
#                     if isinstance(pl, int) or (isinstance(pl, str) and pl.isdigit()):
#                         user = User.objects.filter(pk=int(pl)).first()
#                         if user:
#                             project["project_lead"] = {
#                                 "name": user.get_full_name() or user.username,
#                                 "profile_picture": getattr(user, "profile_picture", "")
#                             }
#                     elif isinstance(pl, dict) and "id" in pl:
#                         user = User.objects.filter(pk=int(pl["id"])).first()
#                         if user:
#                             project["project_lead"] = {
#                                 "name": user.get_full_name() or user.username,
#                                 "profile_picture": getattr(user, "profile_picture", "")
#                             }
#                     elif isinstance(pl, dict) and "name" in pl and "profile_picture" in pl:
#                         project["project_lead"] = pl
#                 # Members (add/remove)
#                 if "add_members" in data:
#                     if not isinstance(project["members"], list):
#                         project["members"] = []
#                     for m in data["add_members"]:
#                         if isinstance(m, int) or (isinstance(m, str) and m.isdigit()):
#                             user = User.objects.filter(pk=int(m)).first()
#                             if user:
#                                 mem_obj = {
#                                     "name": user.get_full_name() or user.username,
#                                     "profile_picture": getattr(user, "profile_picture", "")
#                                 }
#                                 if not any(mem["name"] == mem_obj["name"] for mem in project["members"]):
#                                     project["members"].append(mem_obj)
#                         elif isinstance(m, dict) and "id" in m:
#                             user = User.objects.filter(pk=int(m["id"])).first()
#                             if user:
#                                 mem_obj = {
#                                     "name": user.get_full_name() or user.username,
#                                     "profile_picture": getattr(user, "profile_picture", "")
#                                 }
#                                 if not any(mem["name"] == mem_obj["name"] for mem in project["members"]):
#                                     project["members"].append(mem_obj)
#                 if "remove_member" in data:
#                     if isinstance(project["members"], list):
#                         project["members"] = [mem for mem in project["members"] if mem["name"] != data["remove_member"]]
#                 if "members" in data:
#                     # Overwrite all members (list of ids or dicts)
#                     members = data["members"]
#                     members_list = []
#                     if isinstance(members, list):
#                         for m in members:
#                             if isinstance(m, int) or (isinstance(m, str) and m.isdigit()):
#                                 user = User.objects.filter(pk=int(m)).first()
#                                 if user:
#                                     members_list.append({
#                                         "name": user.get_full_name() or user.username,
#                                         "profile_picture": getattr(user, "profile_picture", "")
#                                     })
#                             elif isinstance(m, dict) and "id" in m:
#                                 user = User.objects.filter(pk=int(m["id"])).first()
#                                 if user:
#                                     members_list.append({
#                                         "name": user.get_full_name() or user.username,
#                                         "profile_picture": getattr(user, "profile_picture", "")
#                                     })
#                             elif isinstance(m, dict) and "name" in m and "profile_picture" in m:
#                                 members_list.append(m)
#                     project["members"] = members_list
#                 save_labs_obj(labs_obj, labs)
#                 return JsonResponse({"success": True})
#             else:
#                 files = request.FILES
#                 changed = False
#                 if 'project_photo' in files:
#                     file = files['project_photo']
#                     path = default_storage.save(f"labs/{file.name}", file)
#                     project['project_photo'] = path
#                     changed = True
#                 if 'attachment' in files:
#                     file = files['attachment']
#                     path = default_storage.save(f"labs/{file.name}", file)
#                     project['attachment'] = path
#                     changed = True
#                 if changed:
#                     save_labs_obj(labs_obj, labs)
#                     return JsonResponse({'success': True})
#                 return JsonResponse({'success': False, 'error': 'No file uploaded'})
#         except Exception as e:
#             return JsonResponse({"success": False, "error": str(e)})

@csrf_exempt
@require_POST
def lab_edit_api(request, lab_key):
    labs_obj, labs = get_labs_obj()
    if lab_key not in labs:
        return JsonResponse({'success': False, 'error': 'Lab not found'})
    data = json.loads(request.body)
    
    # Handle head_of_lab update - convert profile object to user ID
    if 'head_of_lab' in data:
        head_data = data['head_of_lab']
        if isinstance(head_data, dict) and 'id' in head_data:
            data['head_of_lab'] = head_data['id']
    
    # Update fields if present
    for field in ['lab_name', 'location', 'description', 'head_of_lab', 'department']:
        if field in data:
            labs[lab_key][field] = data[field]
    
    save_labs_obj(labs_obj, labs)
    return JsonResponse({'success': True})

@csrf_exempt
@require_POST
def lab_delete_photo_api(request, lab_key):
    print('GOT INTO DELETE PHOTO API\n\n\n\n\n\n\n\n================\n\n\n\n\n\n')
    labs_obj, labs = get_labs_obj()
    if lab_key not in labs:
        return JsonResponse({'success': False, 'error': 'Lab not found'})
    data = json.loads(request.body)
    photo_key = data.get('photo_key')
    photo_key = extract_filename_from_url(photo_key)
    print(photo_key)
    if photo_key not in labs.get(lab_key).get('images'):
        print('photo not found')
        return JsonResponse({'success': False, 'error': 'Photo not found'})
    # Optionally delete file from storage here
    print(labs.get(lab_key).get('images'))
    labs.get(lab_key).get('images').remove(photo_key)
    save_labs_obj(labs_obj, labs)
    return JsonResponse({'success': True})

@csrf_exempt
def lab_edit_project_api(request, lab_key, project_id):
    # sourcery skip: low-code-quality
    print("===================\n\n\n\n\ngot into lab_edit_project\n===============\n\n\n\n\n\n")
    labs_obj, labs = get_labs_obj()
    if lab_key not in labs or 'projects' not in labs[lab_key] or project_id not in labs[lab_key]['projects']:
        return JsonResponse({'success': False, 'error': 'Project not found'})
    project = labs[lab_key]['projects'][project_id]
    if request.method == 'POST':
        if request.content_type.startswith('application/json'):
            data = json.loads(request.body)
            print(f"Received project data: {data}")
            
            # Update simple fields
            for field in ['title', 'description', 'project_link', 'project_demo']:
                if field in data:
                    project[field] = data[field]
            
            # Update tags
            if 'tags' in data:
                project['tags'] = data['tags']
            
            # Update project leader
            if 'leader' in data:
                project['leader'] = data['leader']
                print(f"Updated project leader: {data['leader']}")
            
            # Update project members
            if 'members' in data:
                project['members'] = data['members']
                print(f"Updated project members: {data['members']}")
            
            # Handle legacy fields for backward compatibility
            if 'project_lead' in data:
                project['project_lead'] = data['project_lead']
            if 'add_members' in data:
                # Add new members (append to members dict)
                idx = len(project.get('members', {})) + 1
                if 'members' not in project:
                    project['members'] = {}
                for member_name in data['add_members']:
                    project['members'][f'member{idx}'] = {'id': member_name, 'role': ''}
                    idx += 1
            if 'remove_member' in data:
                print(data['remove_member'])
                project['members'] = [item for item in project['members'] if item["name"] != data['remove_member']]
            
            save_labs_obj(labs_obj, labs)
            return JsonResponse({'success': True})
        else:
            # Handle file uploads (project_photo, attachment)
            files = request.FILES
            changed = False
            if 'project_photo' in files:
                file = files['project_photo']
                path = default_storage.save(f"labs/{file.name}", file)
                project['project_photo'] = path
                changed = True
            if 'attachment' in files:
                file = files['attachment']
                path = default_storage.save(f"labs/{file.name}", file)
                project['attachment'] = path
                changed = True
            if changed:
                save_labs_obj(labs_obj, labs)
                return JsonResponse({'success': True})
            return JsonResponse({'success': False, 'error': 'No file uploaded'})
    return JsonResponse({'success': False, 'error': 'Invalid request'})

@csrf_exempt
def lab_add_photo_api(request, lab_key):
    """
    Add a photo to the lab's images list (for lab_data.images).
    Expects a POST with a file in request.FILES['photo'].
    """
    print("GOT INTO LAB_ADD_PHOTO_API\n\n\n\n\n\n\n\n=========================\n\n\n\n\n\n")
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'POST required'})
    labs_obj, labs = get_labs_obj()
    if lab_key not in labs:
        return JsonResponse({'success': False, 'error': 'Lab not found'})
    if 'photo' not in request.FILES:
        return JsonResponse({'success': False, 'error': 'No photo uploaded'})
    file = request.FILES['photo']
    path = default_storage.save(file.name, file)
    # Add to images list
    labs[lab_key].setdefault('images', [])
    labs[lab_key]['images'].append(path)
    save_labs_obj(labs_obj, labs)
    return JsonResponse({'success': True, 'image': path})
    labs[lab_key].setdefault('images', [])
    labs[lab_key]['images'].append(path)
    save_labs_obj(labs_obj, labs)
    return JsonResponse({'success': True, 'image': path})
