from django.shortcuts import render
from authorization.models import Instructor, EmploymentStatus, Enrollment, EnrollmentStatus, Student,  StudentStatus, Course, Faculty, Department, UniversityDetails, Term, Gender
from django.db.models import Count, Q, F
from django.db.models.functions import Coalesce
import json

def show_dashboard(request):
    # Aggregate counts in single queries where possible
    lecturer_count = Instructor.objects.filter(employment_status=EmploymentStatus.ACTIVE).count()
    enrollment_count = Enrollment.objects.filter(enrollment_status=EnrollmentStatus.APPROVED).count()
    graduate_count = Student.objects.filter(status=StudentStatus.GRADUATED).count()
    course_count = Course.objects.count()
    faculty_count = Faculty.objects.count()
    department_count = Department.objects.count()

    # University Details
    uni_details_dict = {ud.name: ud.details for ud in UniversityDetails.objects.only('name', 'details')}
    lab_count = len(uni_details_dict.get('labs', []))
    collaborator_count = len(uni_details_dict.get('partnerships', []))

    # Latest 5 years in Term table
    latest_years = list(Term.objects.order_by('-year').values_list('year', flat=True).distinct()[:5])
    latest_years = sorted(latest_years)  # ascending

    # Get approved enrollments grouped by term year in a single query
    enrollments_per_year_qs = (
        Enrollment.objects.filter(enrollment_status=EnrollmentStatus.APPROVED, batch__term__year__in=latest_years)
        .values(year=F('batch__term__year'))
        .annotate(count=Count('id'))
    )
    enrollments_count_dict = {item['year']: item['count'] for item in enrollments_per_year_qs}

    # Prepare final dict
    enrollment_per_year = {
        "years": latest_years,
        "enrollments": [enrollments_count_dict.get(year, 0) for year in latest_years]
    }


    # Query approved enrollments grouped by year and gender
    enrollment_gender_qs = (
        Enrollment.objects.filter(
            enrollment_status=EnrollmentStatus.APPROVED,
            batch__term__year__in=latest_years
        )
        .values(year=F('batch__term__year'))
        .annotate(
            males=Count('id', filter=Q(sis_form__student__user__gender=Gender.MALE)),
            females=Count('id', filter=Q(sis_form__student__user__gender=Gender.FEMALE))
        )
    )

    # Convert to dictionary for easy lookup
    enrollment_gender_dict = {item['year']: {'males': item['males'], 'females': item['females']} for item in enrollment_gender_qs}

    # Prepare final structure
    enrollment_gender_ratio = {
        "years": latest_years,
        "males": [enrollment_gender_dict.get(year, {}).get('males', 0) for year in latest_years],
        "females": [enrollment_gender_dict.get(year, {}).get('females', 0) for year in latest_years],
    }



    approved_enrollments = Enrollment.objects.filter(enrollment_status=EnrollmentStatus.APPROVED)

    # Count enrollments grouped by degree
    degree_counts_qs = approved_enrollments.values(degree=F('batch__semester__degree__name')) \
        .annotate(count=Count('id'))

    # Total approved enrollments
    total_enrollments = approved_enrollments.count()

    # Prepare the enrollment percentages in required format
    enrollment_percent_by_degree = {
        "degrees": [],
        "percentages": []
    }

    for item in degree_counts_qs:
        degree_name = item['degree'] or 'Unknown'
        count = item['count']
        percentage = (count / total_enrollments) * 100 if total_enrollments > 0 else 0
        enrollment_percent_by_degree["degrees"].append(degree_name)
        enrollment_percent_by_degree["percentages"].append(round(percentage, 2))

    average_gpa_per_year = get_average_gpa_per_year()

    context = {
        'lecturer_count': lecturer_count,
        'enrollment_count': enrollment_count,
        'graduate_count': graduate_count,
        'course_count': course_count,
        'faculty_count': faculty_count,
        'department_count': department_count,
        'lab_count': lab_count,
        'collaborator_count': collaborator_count,
        'enrollment_per_year': json.dumps(enrollment_per_year),
        'enrollment_gender_ratio': json.dumps(enrollment_gender_ratio),
        'enrollment_percent_by_degree': json.dumps(enrollment_percent_by_degree),
        'average_gpa_per_year': json.dumps(average_gpa_per_year),
    }

    return render(request, 'executives/dashboard.html', context)


def get_average_gpa_per_year():
    # Get latest 5 years present in Term table
    latest_years = list(
        Term.objects.order_by('-year')
        .values_list('year', flat=True)
        .distinct()[:5]
    )
    latest_years = sorted(latest_years)  # ascending order

    average_gpa_per_year = {
        "years": latest_years,
        "gpas": []
    }

    for year in latest_years:
        enrollments = Enrollment.objects.filter(
            enrollment_status=EnrollmentStatus.APPROVED,
            batch__term__year=year,
            result__isnull=False
        )

        total_gpa = 0
        count = 0

        for enrollment in enrollments:
            result_data = enrollment.result.get("data", [])
            if not result_data:
                continue

            # average grade_score for this enrollment
            avg_grade_score = sum(item.get("grade_score", 0) for item in result_data) / len(result_data)
            total_gpa += avg_grade_score
            count += 1

        average_gpa_per_year["gpas"].append(round(total_gpa / count, 2) if count else 0)

    return average_gpa_per_year