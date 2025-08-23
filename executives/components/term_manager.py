from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
import json
from authorization.models import Term, User
from executives.result_components.result_email_sender import send_result_to_all_students
import threading
from django.contrib import messages

def show_term_management(request):
    return render(request, 'executives/term_management.html')

def list_terms(request):
    terms = Term.objects.all().order_by('-id')
    data = [
        {
            'id': term.pk,
            'name': term.term_name,
            'year': term.year,
            'semStart': term.start_date.isoformat() if getattr(term, 'start_date', None) else '',
            'endDate': term.end_date.isoformat() if getattr(term, 'end_date', None) else '',
            'resultDate': term.result_date.isoformat() if getattr(term, 'result_date', None) else ''
        }
        for term in terms
    ]
    return JsonResponse({'terms': data})

@csrf_exempt
def create_term(request):
    print('got into create term')
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            term = Term.objects.create(
                term_name=data.get('name', ''),
                start_date=data.get('startDate') or None,
                end_date=data.get('endDate') or None,
                year=data.get('year') or 0,
                result_date=data.get('resultDate') or None
            )
            return JsonResponse({'success': True, 'id': term.id})
        except Exception as e:
            print(e)
            return HttpResponseBadRequest(str(e))
    return HttpResponseBadRequest('Invalid method')

@csrf_exempt
def update_term(request, term_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            term = get_object_or_404(Term, id=term_id)
            term.term_name = data.get('name', term.term_name)
            term.year = data.get('year', term.year)
            term.start_date = data.get('semStart') or term.start_date
            term.end_date = data.get('endDate') or term.end_date
            term.result_date = data.get('resultDate') or term.result_date
            term.save()
            return JsonResponse({'success': True})
        except Exception as e:
            return HttpResponseBadRequest(str(e))
    return HttpResponseBadRequest('Invalid method')

@csrf_exempt
def delete_term(request, term_id):
    if request.method == 'POST':
        try:
            term = get_object_or_404(Term, id=term_id)
            term.delete()
            return JsonResponse({'success': True})
        except Exception as e:
            return HttpResponseBadRequest(str(e))
    return HttpResponseBadRequest('Invalid method')

def send_results(request, term_id):
    term = Term.objects.filter(pk=int(term_id)).first()
    if not term:
        return redirect('/public/access_denied/')

    # Run the long task in a separate thread
    executive = User.objects.filter(
        email=request.COOKIES.get('my_user'),
    )
    threading.Thread(target=send_result_to_all_students, args=(term,executive,)).start()

    # Immediately redirect
    messages.info(request, 'The process of sending term results is running in the background. You will receive notifications upon completion or if any issues arise.')
    return redirect('/executives/show_term_management')