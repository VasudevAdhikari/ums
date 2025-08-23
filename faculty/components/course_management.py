from django.shortcuts import render
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseNotAllowed
from django.views.decorators.csrf import csrf_exempt
from authorization.models import BatchInstructor, AssessmentType, AssessmentScheme, Assessment, Instructor, Document, AssessmentResult, Student
from django.db.models import Q
from django.db import transaction
import json
from collections import defaultdict

def show_course_management(request, batch_instructor_id):
    batch_instructor = BatchInstructor.objects.filter(
        pk=int(batch_instructor_id)).select_related('batch__term', 'course', 'batch__semester'
    ).values(
        "id", 
        "course__id", 
        "course__course_code",
        "course__course_name",
        "course__description",
    ).first() 

    marking_types = [label for _, label in AssessmentType.choices]
    other_instructor_ids = list(
        Document.objects
        .exclude(uploaded_by__email=request.COOKIES.get('my_user'))
        .values_list('uploaded_by__id', flat=True)
        .distinct()
    )

    data = {
        'batch_instructor': batch_instructor,
        'assessment_types': marking_types,
        'instructor': Instructor.objects.filter(user__email=request.COOKIES.get('my_user')).select_related('user').first(),
        'other_instructor_ids': other_instructor_ids,
    }
    return render(request, 'faculty/instructor_course_management.html', context=data)

@csrf_exempt
def marking_scheme_api(request, batch_id):
    if request.method == 'GET':
        try:
            # Get batch instructor
            batch_instructor = BatchInstructor.objects.filter(pk=batch_id).first()
            if not batch_instructor:
                return JsonResponse({'scheme': {}}, status=404)

            # Get or create AssessmentScheme
            scheme_obj, created = AssessmentScheme.objects.get_or_create(
                batch_instructor=batch_instructor,
                defaults={'scheme': batch_instructor.course.marking_scheme or {}}
            )
            if not scheme_obj:
                scheme_obj = created

            # Return the scheme
            scheme = scheme_obj.scheme if scheme_obj.scheme else {}
            return JsonResponse({'scheme': scheme})

        except Exception as e:
            return JsonResponse({'scheme': {}}, status=500)

    elif request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            scheme = data.get('scheme', {})

            if not isinstance(scheme, dict):
                return HttpResponseBadRequest('Scheme must be a dictionary')

            # Get or create AssessmentScheme
            batch_instructor = BatchInstructor.objects.filter(pk=batch_id).first()
            if not batch_instructor:
                return JsonResponse({'success': False, 'error': 'BatchInstructor not found'}, status=404)

            scheme_obj, created = AssessmentScheme.objects.get_or_create(
                batch_instructor=batch_instructor,
                defaults={'scheme': {}}
            )

            # Update the scheme
            scheme_obj.scheme = scheme
            scheme_obj.save()

            return JsonResponse({'success': True, 'scheme': scheme_obj.scheme})

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)

    else:
        return HttpResponseNotAllowed(['GET', 'POST'])
    

@csrf_exempt
def assessments_api(request, batch_id):
    if request.method == 'GET':
        # Group assessments by type
        assessments = Assessment.objects.filter(
            assessment_scheme__batch_instructor__id=batch_id
        )

        result = {}
        for a in assessments:
            result.setdefault(a.get_assessment_type_display(), []).append({
                'id': a.id,
                'title': a.assessment.get('title'),
                'end_time': a.due_date.strftime("%d.%m.%Y (%H:%M)") if a.due_date else None,
                'type': a.get_assessment_type_display(),
                'type_id': a.assessment_type,
                # Add other fields as needed
            })
        return JsonResponse(result)
    elif request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            type_ = data.get('type')

            if not type_:
                return HttpResponseBadRequest('Missing assessment type')
            
            scheme = AssessmentScheme.objects.filter(
                batch_instructor_id=batch_id
            ).first()

            if not scheme:
                return HttpResponseBadRequest('No assessment scheme found')
            
            assessment_type = next(
                (member for member in AssessmentType if member.label == type_),
                None
            )

            assessment = {
                "title": f"{type_} {Assessment.objects.filter(assessment_scheme=scheme, assessment_type=assessment_type).count() + 1}"
            }

            with transaction.atomic():
                # Create new assessment
                assessment = Assessment.objects.create(
                    assessment_scheme=scheme,
                    assessment_type=assessment_type,
                    assessment=assessment,
                )

                batch_inst = assessment.assessment_scheme.batch_instructor
                if assessment.assessment_type in (
                    AssessmentType.CLASS_PARTICIPATION, 
                    AssessmentType.FINAL_ONPAPER, 
                    AssessmentType.MIDTERM, 
                    AssessmentType.TUTORIAL
                ):
                    students = Student.objects.filter(
                        Q(sisform__enrollment__enrollmentcourse__batch_instructor=batch_inst)
                    ).distinct()
                    assessment_results = []
                    for student in students:
                        assessment_results.append(AssessmentResult(
                            assessment=assessment,
                            student=student,
                            answer={},
                            mark=0,
                        ))
                    AssessmentResult.objects.bulk_create(assessment_results)
                
            return JsonResponse({'success': True, 'id': assessment.id})
        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'error': str(e)}, status=400)
    else:
        return HttpResponseNotAllowed(['GET', 'POST'])
    


def delete_assessment(request, assessment_id):
    print(assessment_id)
    try:
        assessment = Assessment.objects.get(id=assessment_id)
        print(assessment)
        assessment.delete()
        return JsonResponse({'success': True})
    except Assessment.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'There is no assessment with the provided id'})
    
def show_all_results(request, batch_instructor_id):
    # Fetch results with all necessary joins
    assessment_results = (
        AssessmentResult.objects
        .filter(assessment__assessment_scheme__batch_instructor__pk=batch_instructor_id)
        .select_related(
            'assessment',
            'assessment__assessment_scheme__batch_instructor',
            'student',
            'student__user',
            'assessment__assessment_scheme__batch_instructor__batch__term',
            'assessment__assessment_scheme__batch_instructor__batch__semester',
            'assessment__assessment_scheme__batch_instructor__batch__semester__degree'
        )
        .order_by('student__user__pk', 'assessment__assessment_type')
    )
    batch = assessment_results.first().assessment.assessment_scheme.batch_instructor.batch if assessment_results.first() else None
    semester = batch.semester if batch else None
    degree = semester.degree if semester else None

    batch_name = ""
    if batch and semester and degree:
        batch_name = f"{degree.name} ({semester.semester_name})"

    # Group results by student
    grouped_data = defaultdict(lambda: {
        "name": "",
        "roll_no": "",
        "phone": "",
        "email": "",
        "assessments": []
    })

    for result in assessment_results:
        student_id = result.student.user.pk
        grouped_data[student_id]["name"] = result.student.user.full_name
        grouped_data[student_id]["roll_no"] = result.student.roll_no
        grouped_data[student_id]["phone"] = getattr(result.student.user, "phone", "")
        grouped_data[student_id]["email"] = result.student.user.email

        grouped_data[student_id]["assessments"].append({
            "title": result.assessment.assessment.get('title'),
            "score": result.mark,
            "total": result.assessment.assessment.get('total_mark')
        })

    students_list = list(grouped_data.values())

    course = assessment_results.first().assessment.assessment_scheme.batch_instructor.course if assessment_results else None
    course_name = ""
    if course:
        course_name = f"{course.course_code} ({course.course_name})"
    # Render the template with data
    data = {
        "students": students_list,
        "course_title": course_name,
        "term": assessment_results.first().assessment.assessment_scheme.batch_instructor.batch.term.term_name if assessment_results else "",
        "batch": batch_name,
    }
    return render(request, "faculty/all_results.html", context=data)