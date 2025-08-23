from django.shortcuts import render, get_object_or_404
from authorization.models import Degree, Semester, Batch, Term, Course, BatchInstructor, Instructor
from django.core import serializers
from django.http import JsonResponse
import json
from django.db.models import Prefetch

def show_batch_management(request, term_id):
    degrees = Degree.objects.all()
    semesters = Semester.objects.all()
    term=Term.objects.get(pk=int(term_id))
    batches = Batch.objects.filter(term=term)
    instructors = Instructor.objects.all()
    all_instructors = []
    all_instructors.extend([
        {
            "id": instructor.pk,
            "name": instructor.user.full_name,
            "profile": instructor.user.profile_picture.url if instructor.user.profile_picture else None,
            "department": instructor.department.pk if instructor.department else None,
        }
        for instructor in instructors
    ])
    print(all_instructors)

    
    data = {
        'term_name': term.term_name,
        'degrees': degrees,
        'semesters': serializers.serialize('json', semesters),
        'all_instructors': json.dumps(all_instructors),
        'batches': batches,
        'term_id': term_id,
    }
    return render(request, 'executives/batch_management.html', context=data)


def edit_batch(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request method'}, status=405)

    print('got into edit batch')

    # Load JSON data from the request body
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    term_id = data.get('term_id')
    semester_ids = data.get('semesters')

    # Validate term_id
    term = get_object_or_404(Term, pk=int(term_id))

    batches = []
    batch_instructors = []

    for semester_id in semester_ids:
        # Validate semester_id
        semester = get_object_or_404(Semester, pk=int(semester_id))

        # Check if the batch already exists
        if not Batch.objects.filter(term=term, semester=semester).exists():
            batch = Batch(
                name=f"{term.term_name} {semester.semester_name}",
                term=term,
                semester=semester,
            )
            batches.append(batch)

            # Assuming syllabus_structure is a list of dictionaries
            syllabi = semester.syllabus_structure
            for syllabus in syllabi:
                print(syllabus)
                if course := Course.objects.filter(
                    course_code=syllabus.get('course_code')
                ).first():
                    print(course)
                    batch_instructors.append(BatchInstructor(
                        batch=batch,
                        course=course,
                    ))

    # Create batches in bulk
    if batches:
        Batch.objects.bulk_create(batches)

    # Create batch instructors in bulk if there are any
    if batch_instructors:
        for batch_instructor in batch_instructors:
            batch_instructor.save()
        # BatchInstructor.objects.bulk_create(batch_instructors)

    return JsonResponse({'success': True, 'created_batches': len(batches), 'created_instructors': len(batch_instructors), 'message': 'Batch Data Edited Successfully'})


def list_batches(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    term_id = data.get('term_id')
    # print(request.body)
    if not term_id:
        return JsonResponse({"error": "term_id is required"}, status=400)

    try:
        term = Term.objects.get(pk=int(term_id))
    except Term.DoesNotExist:
        return JsonResponse({"error": "Term not found"}, status=404)

    batches = Batch.objects.filter(term=term).select_related('semester__degree')
    degrees = Degree.objects.filter(semester__batch__term=term).distinct()

    
    batch_data = {
        "term_id": term.pk,
        "term_name": term.term_name,
        "majors": [],
    }

    for degree in degrees:
        degree_batches = [batch for batch in batches if batch.semester.degree.pk == degree.pk]

        seen_courses = set()
        semesters_list = []

        for batch in degree_batches:

            batch_instructors = BatchInstructor.objects.filter(batch=batch).select_related('course', 'instructor__user')
            courses = []
            for batch_instructor in batch_instructors:
                course = batch_instructor.course

                if course.course_code in seen_courses:
                    continue  # prevent duplicates

                seen_courses.add(course.course_code)

                instructor = batch_instructor.instructor
                instructor_data = {
                    "id": instructor.pk,
                    "name": instructor.user.full_name,
                    "profile": instructor.user.profile_picture.url if instructor.user.profile_picture else None,
                } if instructor else {}

                courses.append({
                    "course_name": course.course_name,
                    "course_credits": course.course_credits,
                    "course_hours": course.course_hours,
                    "course_code": course.course_code,
                    "department_id": course.department.pk,
                    "instructor": instructor_data,
                    "rooms": batch_instructor.room_data,
                    "batch_instructor_id": batch_instructor.pk,
                })

                semester = batch.semester
                if semester.pk not in [s["semester_id"] for s in semesters_list]:
                    semesters_list.append({
                        "semester_id": semester.pk,
                        "semester_name": semester.semester_name,
                        "courses": courses,
                        "batch_instructor_id": batch.pk,
                    })
                # print(courses)

        batch_data["majors"].append({
            "degree_id": degree.pk,
            "degree_name": degree.name,
            "semesters": semesters_list,
        })

    return JsonResponse(batch_data)


def edit_batch_instructor(request):
    if request.method!='POST':
        return JsonResponse({'success': False})
    
    data = json.loads(request.body)
    batch_instructor = BatchInstructor.objects.get(pk=int(data.get('batch_instructor_id')))
    batch_instructor.instructor = Instructor.objects.get(pk=int(data.get('instructor_id')) if data.get('instructor_id') else None)
    batch_instructor.room_data = {
        'room1': data.get('classroom1'), 
        'times1': data.get('class_time1'),
        'room2': data.get('classroom2'), 
        'times2': data.get('class_time2'),
    }

    batch_instructor.save()
    return JsonResponse({'success': True})

def delete_batch_instructor(request):
    if request.method != 'POST':
        return JsonResponse({'success': False})
    
    print('posted')
    
    data = json.loads(request.body)
    term_id, degree_id = data.get('term_id'), data.get('degree_id')
    
    batch_instructors = BatchInstructor.objects.filter(
        batch__term__id=term_id,
        batch__semester__degree__id=degree_id
    )
    batches = Batch.objects.filter(
        term__id=term_id,
        semester__degree__id=degree_id
    )

    if batch_instructors: batch_instructors.delete()
    if batches: batches.delete()
    
    return JsonResponse({'success': True})

    



