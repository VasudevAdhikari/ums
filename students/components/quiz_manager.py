from django.shortcuts import render, redirect
from authorization.models import Assessment, AssessmentResult, Student, User
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json, random
import unicodedata
from django.utils.timezone import now
from django.core.cache import cache


def clean_cookie_email(cookie_value):
    if not cookie_value:
        return ''
    return unicodedata.normalize("NFKC", cookie_value.strip())

def get_random_questions(questions, n):
    # Copy the list so the original isn't modified
    shuffled_questions = questions.copy()
    
    # Shuffle the questions
    random.shuffle(shuffled_questions)
    
    # Shuffle the options for each question
    for question in shuffled_questions:
        random.shuffle(question['options'])
    
    # Return only the first n questions
    return shuffled_questions[:n]

def get_quiz_cache(quiz_id, email):
    quiz_cache =  cache.get(f'quiz:{quiz_id}:{email}')
    if not quiz_cache:
        cache.set(f'quiz:{quiz_id}:{email}', now())
        quiz_cache =  cache.get(f'quiz:{quiz_id}:{email}')
    return quiz_cache

def get_timer(total_time, quiz_cache):
    diff = now()-quiz_cache
    seconds = int(diff.total_seconds())
    return total_time*60 - seconds

def show_quiz(request, quiz_id):
    assessment = Assessment.objects.get(id=int(quiz_id))
    user_email = request.COOKIES.get('my_user')
    
    # Get or set quiz cache timestamp
    quiz_cache = get_quiz_cache(quiz_id, user_email)
    
    # Get total time from quiz JSON
    total_time = assessment.assessment.get('time_limit', 0)
    timer = get_timer(total_time, quiz_cache)
    if timer<0:
        AssessmentResult.objects.create(
            assessment=assessment,
            student=Student.objects.get(user__email=user_email),
            answer={},
            mark=0
        )
        cache.delete(f'quiz:{quiz_id}:{user_email}')
        return render(
            request,
            'htmls/access_denied.html',
            {'message': f'Your allotted time for this quiz has already expired. Since the time limit of {total_time} minutes was exceeded, a blank submission has been recorded automatically. You cannot reattempt this quiz.'}
        )

    user = User.objects.get(username=user_email)
    student = Student.objects.get(user=user)
    
    assessment_result = AssessmentResult.objects.filter(
        assessment=assessment, student=student
    ).first() 
    if assessment_result:
        return redirect(f"/students/academics/quiz_answer/{quiz_id}/")

    quiz_data = assessment.assessment  # JSONField dict
    number_of_questions_per_student = quiz_data.get('questions_per_student', 0)
    quiz_data['questions'] = get_random_questions(
        quiz_data.get('questions', []),
        number_of_questions_per_student
    )
    quiz_data['time_limit'] = timer
    
    return render(request, 'students/academic/quiz.html', {
        'assessment': assessment,
        'quiz_data': json.dumps(quiz_data),
    })

def show_quiz_answer(request, quiz_id):
    assessment = AssessmentResult.objects.filter(
        assessment__id=quiz_id
    ).select_related(
        'assessment'
    ).first()
    if assessment.assessment.due_date > now():
        return render(request, 'htmls/access_denied.html', {'message': f'You can view this quiz after the due date and time only which is {assessment.assessment.due_date}'})

    quiz_data = assessment.answer  # This is already a dict if using JSONField

    return render(request, 'students/academic/quiz_answer.html', {
        'assessment': assessment,
        'quiz_data': json.dumps(quiz_data),  # Pass as JSON string for JS
    })

@csrf_exempt
def submit_quiz(request):
    if request.method == 'POST':
        data = json.loads(request.body.decode('utf-8'))
        print(data)
        assessment_id = data.get('assessment_id')
        answer = data.get('answer')
        mark = answer.get('total_score', 0)
        assessment = Assessment.objects.get(id=assessment_id)
        user_email = clean_cookie_email(request.COOKIES.get('my_user').strip())
        print(user_email, end='\n\n========================\n\n')
        user = User.objects.get(username=user_email)
        print(user)
        student = Student.objects.get(user=user)
        print(user)

        AssessmentResult.objects.create(
            assessment=assessment,
            student=student,
            answer=answer,
            mark=mark
        )
        cache.delete(f'quiz:{assessment_id}:{user_email}')
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Invalid request'}, status=400)