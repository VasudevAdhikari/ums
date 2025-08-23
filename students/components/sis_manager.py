from django.shortcuts import render, redirect
from authorization.models import Student, User, SISForm
from django.http import JsonResponse
from django.contrib import messages
from django.utils import timezone

def show_sis_form(request):
    user_email = request.COOKIES.get('my_user')
    if not user_email:
        return JsonResponse({'success': False})

    sis_form = SISForm.objects.filter(
        student__user__email=user_email
    ).select_related(
        'student', 'student__user'
    ).first()

    data = {
        'sis_form': sis_form,
    }

    return render(request, 'students/personal/sis.html', context=data)

def save_sis_form(request):
    if request.method == 'POST':
        user_email= request.COOKIES.get('my_user')
        user = User.objects.get(email=user_email)
        student = Student.objects.get(user=user)

         # Get data from request.POST (IDs from your form)
        blood_group = request.POST.get('blood_group')
        ethnicity = request.POST.get('ethnicity')
        religion = request.POST.get('religion')
        NRC = request.POST.get('nrc')
        birthplace = request.POST.get('birthplace')
        
        father_name = request.POST.get('father_name')
        father_NRC = request.POST.get('father_NRC')
        father_birthplace = request.POST.get('father_birthplace')
        father_city = request.POST.get('father_city')
        father_phone = request.POST.get('father_phone')
        father_profession = request.POST.get('father_profession')
        father_gmail = request.POST.get('father_gmail')
        father_ethnicity = request.POST.get('father_ethnicity')
        father_religion = request.POST.get('father_religion')
        
        mother_name = request.POST.get('mother_name')
        mother_NRC = request.POST.get('mother_NRC')
        mother_birthplace = request.POST.get('mother_birthplace')
        mother_city = request.POST.get('mother_city')
        mother_phone = request.POST.get('mother_phone')
        mother_profession = request.POST.get('mother_profession')
        mother_gmail = request.POST.get('mother_gmail')
        mother_ethnicity = request.POST.get('mother_ethnicity')
        mother_religion = request.POST.get('mother_religion')
        
        matric_roll_no = request.POST.get('matric_roll_no')
        exam_dept = request.POST.get('exam_dept')
        passed_year = request.POST.get('passed_year')
        total_marks = request.POST.get('total_marks')
        
        has_spouse = request.POST.get('has_spouse') == 'on'
        spouse_name = request.POST.get('spouse_name') if has_spouse else ''

        # Create SISForm instance
        sis_form = SISForm(
            created_at=timezone.now(),
            student=student,
            blood_group=blood_group,
            ethnicity=ethnicity,
            religion=religion,
            NRC=NRC,
            birthplace=birthplace,
            
            father_name=father_name,
            father_NRC=father_NRC,
            father_birthplace=father_birthplace,
            father_city=father_city,
            father_phone=father_phone,
            father_profession=father_profession,
            father_gmail=father_gmail,
            father_ethnicity=father_ethnicity,
            father_religion=father_religion,

            mother_name=mother_name,
            mother_NRC=mother_NRC,
            mother_birthplace=mother_birthplace,
            mother_city=mother_city,
            mother_phone=mother_phone,
            mother_profession=mother_profession,
            mother_gmail=mother_gmail,
            mother_ethnicity=mother_ethnicity,
            mother_religion=mother_religion,

            matric_roll_no=matric_roll_no,
            exam_dept=exam_dept,
            passed_year=passed_year,
            total_marks=total_marks,

            has_spouse=has_spouse,
            spouse_name=spouse_name,
        )
        
        sis_form.save()
        messages.info(request, 'SIS Form Filling Successful')
        return redirect('/students/mailbox/')
    else:
        return JsonResponse({'success': False, 'error': 'Only Post Requests are allowed'})
    
def update_sis_form(request):
    if request.method == 'POST':
        user_email = request.COOKIES.get('my_user')
        user = User.objects.get(email=user_email)
        student = Student.objects.get(user=user)

        sis_form = SISForm.objects.filter(student=student).first()
        if not sis_form:
            return JsonResponse({'success': False, 'error': 'No SIS Form found to update'})

        # Update fields
        sis_form.blood_group = request.POST.get('blood_group')
        sis_form.ethnicity = request.POST.get('ethnicity')
        sis_form.religion = request.POST.get('religion')
        sis_form.NRC = request.POST.get('nrc')
        sis_form.birthplace = request.POST.get('birthplace')

        sis_form.father_name = request.POST.get('father_name')
        sis_form.father_NRC = request.POST.get('father_NRC')
        sis_form.father_birthplace = request.POST.get('father_birthplace')
        sis_form.father_city = request.POST.get('father_city')
        sis_form.father_phone = request.POST.get('father_phone')
        sis_form.father_profession = request.POST.get('father_profession')
        sis_form.father_gmail = request.POST.get('father_gmail')
        sis_form.father_ethnicity = request.POST.get('father_ethnicity')
        sis_form.father_religion = request.POST.get('father_religion')

        sis_form.mother_name = request.POST.get('mother_name')
        sis_form.mother_NRC = request.POST.get('mother_NRC')
        sis_form.mother_birthplace = request.POST.get('mother_birthplace')
        sis_form.mother_city = request.POST.get('mother_city')
        sis_form.mother_phone = request.POST.get('mother_phone')
        sis_form.mother_profession = request.POST.get('mother_profession')
        sis_form.mother_gmail = request.POST.get('mother_gmail')
        sis_form.mother_ethnicity = request.POST.get('mother_ethnicity')
        sis_form.mother_religion = request.POST.get('mother_religion')

        sis_form.matric_roll_no = request.POST.get('matric_roll_no')
        sis_form.exam_dept = request.POST.get('exam_dept')
        sis_form.passed_year = request.POST.get('passed_year')
        sis_form.total_marks = request.POST.get('total_marks')

        has_spouse = request.POST.get('has_spouse') == 'on'
        sis_form.has_spouse = has_spouse
        sis_form.spouse_name = request.POST.get('spouse_name') if has_spouse else ''

        sis_form.save()
        messages.info(request, 'SIS Form Updated Successfully')
        return redirect('/students/mailbox/')
    else:
        return JsonResponse({'success': False, 'error': 'Only Post Requests are allowed'})
    

def show_profile(request):
    email = request.COOKIES.get('my_user')
    sis_form=None
    try:
        sis_form = SISForm.objects.filter(
            student__user__email=email,
        ).select_related(
            'student',
            'student__user', 
            'student__user__emergency_contact'
        ).first()
        student = sis_form.student
    except Exception as e:
        student = Student.objects.filter(
            user__email=email,
        ).first()
        sis_form = SISForm(student=student)
    return render(request, 'students/personal/profile.html', {'sis_form': sis_form})