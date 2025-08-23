from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseNotAllowed
from django.views.decorators.csrf import csrf_exempt
from authorization.models import Document, BatchInstructorDocument, BatchInstructor, User, Course, Instructor, DocumentType
from django.core.files.storage import default_storage
from django.conf import settings
import os
from django.contrib import messages
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.shortcuts import render, redirect

def documents_api(request, course_id):
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])
    # Get all public documents for this course, grouped by instructor
    docs = Document.objects.filter(access_status='A', course__id=course_id)
    print(docs)
    instructors = {}
    by_instructor = {}
    you = None
    for doc in docs:
        uid = doc.uploaded_by.id
        if not you and doc.uploaded_by.email == request.COOKIES.get('my_user'):
            you = uid
        instructors[uid] = doc.uploaded_by.get_full_name() or doc.uploaded_by.username
        by_instructor.setdefault(uid, []).append({
            'id': doc.id,
            'name': doc.name,
            'file_link': doc.file_link,
            'uploader_name': doc.uploaded_by.full_name if doc.uploaded_by else None,
            'access_status': doc.get_access_status_display(),
        })
    print(by_instructor, instructors, you, sep="\n===================\n")
    return JsonResponse({'by_instructor': by_instructor, 'instructors': instructors, 'you': you})

@csrf_exempt
def add_document_api(request):
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])
    name = request.POST.get('name')
    access_status = request.POST.get('access_status', 'A')
    course_id = request.POST.get('course_id')
    file = request.FILES.get('file')
    if not name or not file or not course_id:
        return HttpResponseBadRequest('Missing parameters')
    # Save file
    file_path = default_storage.save(f'documents/{file.name}', file)
    file_url = os.path.join(settings.MEDIA_URL, file_path)
    # Find uploader
    uploader = request.user if request.user.is_authenticated else None
    doc = Document.objects.create(
        name=name,
        file_link=file_url,
        uploaded_by=uploader,
        access_status=access_status
    )
    return JsonResponse({'success': True, 'id': doc.id})

@csrf_exempt
def refer_document_api(request, batch_instructor_id):
    if request.method != 'POST':
        return HttpResponseNotAllowed(['POST'])
    import json
    data = json.loads(request.body.decode('utf-8'))
    document_id = data.get('document_id')
    if not document_id:
        return HttpResponseBadRequest('Missing document_id')
    try:
        doc = Document.objects.get(id=document_id)
        batch_instructor = BatchInstructor.objects.get(id=batch_instructor_id)

        if BatchInstructorDocument.objects.filter(batch_instructor=batch_instructor, document=doc).exists():
            return JsonResponse({'success': False, 'error': 'You have already referred this document to this batch'})
        BatchInstructorDocument.objects.create(batch_instructor=batch_instructor, document=doc)
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

def referred_documents_api(request, batch_instructor_id):
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])
    referred = BatchInstructorDocument.objects.filter(batch_instructor_id=batch_instructor_id)
    docs = []
    for ref in referred:
        doc = ref.document
        docs.append({
            'id': doc.id,
            'name': doc.name,
            'file_link': doc.file_link,
            'uploader_name': doc.uploaded_by.full_name if doc.uploaded_by else '',
            'access_status': doc.access_status,
            'batch_instructor_document_id': doc.pk,
        })
    print(docs)
    return JsonResponse(docs, safe=False)

def add_document(request):
    if request.method != 'POST':
        messages.error(request, 'Request invalid')
        return redirect('previous_page')  # Replace with your intended redirect

    user_id = request.COOKIES.get('my_user')
    try:
        instructor = Instructor.objects.get(user__email=user_id)
    except Instructor.DoesNotExist:
        messages.error(request, 'Requested source is not an instructor')
        return redirect('previous_page')

    data = request.POST
    document_file = request.FILES.get('document')
    document_name = data.get('document_name')
    course_id = data.get('course_id')  # If needed for linking
    batch_instructor_id = data.get('batch_instructor_id')

    if not document_file or not document_name:
        messages.error(request, 'Missing document or document name')
        return redirect('previous_page')

    # Save file to MEDIA and generate URL
    file_path = default_storage.save(f'documents/{document_file.name}', ContentFile(document_file.read()))
    file_url = default_storage.url(file_path)

    Document.objects.create(
        name=document_name,
        description=data.get('description', ''),
        file_link=file_url,
        uploaded_by=instructor.user,
        course=Course.objects.get(id=int(course_id)),
        access_status=data.get('access_status', DocumentType.PUBLIC),
    )

    messages.success(request, 'Document uploaded successfully')
    return redirect(f'/faculty/course_management/{batch_instructor_id}')



def delete_batch_instructor_document(request, batch_instructor_document_id):
    print('delete batch instructor document')
    try:
        batch_instructor_document = BatchInstructorDocument.objects.filter(
            document__id=int(batch_instructor_document_id),
        ).first()
        print(f"batch_instructor_document{batch_instructor_document}")
        batch_instructor_document.delete()
        return JsonResponse({'success': True, 'message': 'Document unreferred successfully'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': e})
    
def delete_document(request, document_id):
    try:
        document = Document.objects.get(
            pk=int(document_id)
        )
        document.delete()
        return JsonResponse({'success': True, 'message': 'Document deleted successfully'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': e})