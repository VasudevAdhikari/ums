import contextlib
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.text import Truncator
from django.utils import timezone
import json
from django.db import DatabaseError, transaction
from django.core.exceptions import ValidationError

class Gender(models.TextChoices):
    MALE = 'M', 'Male'
    FEMALE = 'F', 'Female'
    OTHER = 'O', 'Other' 

class AdminLevel(models.TextChoices):
    READ = 'R', 'Read'
    WRITE = 'W', 'Write'

class EmploymentStatus(models.TextChoices):
    UNAPPROVED = 'U', 'Unapproved'
    TRANSFERRED = 'T', 'Transferred'
    REJECTED = 'R', 'Rejected'
    ACTIVE = 'A', 'Active'
    ON_LEAVE = 'L', 'OnLeave'
    RETIRED = 'E', 'Retired'

class DegreeType(models.TextChoices):
    BACHELORS = 'B', 'Bachelors'
    MASTERS = 'M', 'Masters'
    PHD = 'P', 'PhD'

class AssessmentType(models.TextChoices):
    QUIZ = 'Q', 'Quiz'
    ASSIGNMENT = 'A', 'Assignment'
    MIDTERM = 'M', 'Midterm'
    FINAL = 'F', 'Final(Lab)'
    FINAL_ONPAPER = 'D', 'Final(On Paper)'
    PROJECT = 'P', 'Project'
    LABTEST = 'L', 'Lab Test'
    PRACTICAL = 'V', 'Practical'
    THESIS = 'H', 'Thesis'
    LABPROJECT = 'B', 'Lab Project'
    LABASSESSMENT = 'J', 'Lab Assessment'
    CLASS_PARTICIPATION = 'C', 'Class Participation'
    TUTORIAL = 'Z', 'Tutorial'


class StudentStatus(models.TextChoices):
    UNAPPROVED = 'U', 'Unapproved'
    REJECTED = 'R', 'Rejected'
    ACTIVE = 'A', 'Active' 
    GRADUATED = 'G', 'Graduated'
    SUSPENDED = 'S', 'Suspended'
    DROPPED = 'D', 'Dropped'

class MailboxPostStatus(models.TextChoices):
    PENDING = 'P', 'Pending'
    APPROVED = 'A', 'Approved'
    REJECTED = 'R', 'Rejected'
    DISQUALIFIED = 'D', 'Disqualified'

class NotificationType(models.TextChoices):
    STUDENT = 'S', 'Student'
    EXECUTIVE = 'E', 'Executive'
    INSTRUCTOR = 'I', 'Instructor'
    STUDENT_MAILBOX = 'M', 'Student Mailbox'

class BloodGroup(models.TextChoices):
    A = 'A', 'A'
    B = 'B', 'B'
    O = 'O', 'O'
    AB = 'X', 'AB'

class DocumentType(models.TextChoices):
    PUBLIC = 'A', 'Public'
    PRIVATE = 'B', 'Private'
    PROTECTED = 'C', 'Protected'

class EnrollmentStatus(models.TextChoices):
    APPROVED = 'A', 'Approved'
    PENDING = 'P', 'Pending'
    REJECTED = 'R', 'Rejected'

class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

# Emergency Contact
class EmergencyContact(BaseModel):
    contact_name = models.CharField(max_length=100, default='')
    email = models.EmailField(default='')
    phone = models.CharField(max_length=20, default='')
    relation_to_user = models.CharField(max_length=50, default='')

    def __str__(self):
        return f"{self.contact_name} ({self.relation_to_user})"

# User Model
class User(AbstractUser, BaseModel):
    email = models.EmailField(unique=True, db_index=True, default='')
    full_name = models.CharField(max_length=100, default='')
    phone = models.CharField(max_length=20, default='')
    city = models.CharField(max_length=100, default='')
    date_of_birth = models.DateField(default=timezone.now)
    telegram_username = models.CharField(max_length=50, default='')
    outlook_email = models.EmailField(blank=True, null=True, default='')
    profile_picture = models.ImageField(upload_to='profile_pictures/', default='default_profile.png')
    emergency_contact = models.ForeignKey(EmergencyContact, on_delete=models.SET_NULL, null=True, default=None)
    password_last_changed_at = models.DateTimeField(auto_now_add=True)
    password_reset_token = models.CharField(max_length=100, null=True, blank=True, default='')
    gender = models.CharField(max_length=1, choices=Gender.choices, default=Gender.OTHER)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_dean = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    last_login = models.DateTimeField(null=True, default=None)
    date_joined = models.DateTimeField(default=timezone.now)

    # Fix clashing reverse accessors
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_set',
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_set',
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )
    
    def save(self, *args, **kwargs):
        if not self.full_name:
            self.full_name = f"{self.first_name} {self.last_name}".strip()
        super().save(*args, **kwargs)

# Admin Model
class Admin(BaseModel): 
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    degree = models.CharField(max_length=100, default='')
    position_in_university = models.CharField(max_length=100, default='')
    admin_level = models.CharField(max_length=1, choices=AdminLevel.choices, default=AdminLevel.READ)

# Faculty Model
class Faculty(BaseModel):
    id = models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID', default=1)
    name = models.CharField(max_length=100, default='')
    description = models.TextField(default='')
    contact_email = models.EmailField(default='')
    contact_phone = models.CharField(max_length=20, default='')
    location = models.CharField(max_length=30, default='')
    head_of_faculty = models.ForeignKey(User, on_delete=models.CASCADE, default=None, null=True)
    faculty_photo = models.ImageField(upload_to='profile_pictures/', default='default_profile.png')

# Department Model
class Department(BaseModel):
    name = models.CharField(max_length=100, default='')
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE)
    description = models.TextField(default='')
    location = models.CharField(max_length=100, default='')
    contact_email = models.EmailField(default='')
    contact_phone = models.CharField(max_length=20, default='')
    head_of_department = models.ForeignKey(User, on_delete=models.CASCADE, default=None, null=True)
    department_photo = models.ImageField(upload_to='departments/', default='default.jpg')

# Instructor Model
class Instructor(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    degree = models.CharField(max_length=100, default='')
    position_in_university = models.CharField(max_length=100, default='')
    department = models.ForeignKey(Department, default='', null=True, on_delete=models.CASCADE)
    joined_date = models.DateField(default=timezone.now)
    specialization = models.CharField(max_length=100, default='')
    employment_status = models.CharField(max_length=1, choices=EmploymentStatus.choices, default=EmploymentStatus.UNAPPROVED)

# Degree Model
class Degree(BaseModel):
    name = models.CharField(max_length=100, default='')
    code = models.CharField(max_length=20, default='')
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE)
    duration = models.PositiveIntegerField(default=4) # duration in years
    description = models.TextField(default='')
    total_credits = models.PositiveIntegerField(default=120) # derived attribute
    total_courses = models.PositiveIntegerField(default=48) # derived attribute
    total_hours = models.PositiveBigIntegerField(default=260) #derived_attribute
    degree_type = models.CharField(max_length=1, choices=DegreeType.choices, default=DegreeType.BACHELORS)
    degree_image = models.ImageField(upload_to='degrees/', default='default.jpg')
    
  
# Semester Model
class Semester(BaseModel):
    semester_name = models.CharField(max_length=100, default='')
    degree = models.ForeignKey(Degree, on_delete=models.CASCADE)
    # Duration in weeks
    duration_weeks = models.PositiveSmallIntegerField(default=4, null=False)
    syllabus_structure = models.JSONField(default=dict, null=False)
    # Example syllabus_structure:
    # [
    #   {
    #     "course_code": "CS101",
    #     "course_name": "Intro to CS",
    #     "course_credits": 3,
    #     "course_hours": 45,
    #     "type": "Core"
    #   },
    #   ...
    # ]

# Course Model
class Course(BaseModel):
    course_code = models.CharField(max_length=20, unique=True, default='')
    course_name = models.CharField(max_length=100, default='')
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    course_hours = models.PositiveIntegerField(default=30)
    course_credits = models.PositiveSmallIntegerField(default=3)
    description = models.TextField(default='')
    marking_scheme = models.JSONField(default=dict)

# Term Model
class Term(BaseModel):
    year = models.PositiveIntegerField(default=timezone.now().year, null=True)
    term_name =models.CharField(max_length=100, default='', null=True)
    start_date = models.DateField(default=timezone.now, null=True)
    end_date = models.DateField(default=timezone.now, null=True)
    result_date = models.DateField(default=timezone.now, null=True)

    def save(self, *args, **kwargs):
        with transaction.atomic():
            super().save(*args, **kwargs)
            
            if self.start_date and self.end_date and self.result_date:
                notifications=[]
                users=User.objects.filter(
                    student__status=StudentStatus.ACTIVE,
                ).distinct()

                for user in users:
                    notifications.append(Notification(
                        user=user,
                        type=NotificationType.STUDENT,
                        notification={
                            "text": f"A new term is starting on {self.start_date} having END DATE: {self.end_date} and  RESULT DATE : {self.result_date}. If it concerns you, you should consider an enrollment",
                            "destination": f"/students/academics/home"
                        }
                    ))
                Notification.objects.bulk_create(notifications)


class Batch(BaseModel):
    name = models.CharField(max_length=100, default='')
    term = models.ForeignKey(Term, on_delete=models.CASCADE)
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE)

# Term Instructor Model
class BatchInstructor(BaseModel):
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE)
    instructor = models.ForeignKey(Instructor, on_delete=models.CASCADE, null=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    room_data = models.JSONField(default=None, null=True, blank=True)
    assigned_date = models.DateField(default=timezone.now)

    def save(self, *args, **kwargs):
        # Call the original save method
        is_new = self.pk is None
        with transaction.atomic():
            super().save(*args, **kwargs)
            # Create AssessmentScheme after saving BatchInstructor
            if is_new:
                assessment_scheme = AssessmentScheme(batch_instructor=self, scheme=self.course.marking_scheme)
                assessment_scheme.save()
                for i in range(1000):
                    print('*')
                    print(assessment_scheme)

            if self.instructor:
                Notification.objects.create(
                    user=self.instructor.user,
                    type=NotificationType.INSTRUCTOR,
                    notification={
                        "text": f"An admin has assigned you to teach {self.course.course_code} ({self.course.course_name}) for {self.batch.semester.degree.code} ({self.batch.semester.semester_name}) in {self.batch.term.term_name}. Go and check that out!!"
                    }
                )

# Student Model
class Student(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    roll_no = models.TextField(blank=True)  # No default here
    student_number = models.CharField(max_length=20, unique=True, default='')
    degree = models.ForeignKey(Degree, on_delete=models.CASCADE, null=True, blank=True)
    enrollment_date = models.DateField(default=timezone.now)
    status = models.CharField(max_length=1, choices=StudentStatus.choices, default=StudentStatus.ACTIVE)

    def save(self, *args, **kwargs):
        # Save first to generate pk if it doesn't exist
        is_new = self._state.adding and not self.pk
        super().save(*args, **kwargs)

        # Generate roll_no based on pk if not already set
        if is_new and not self.roll_no:
            self.roll_no = f'STU-{self.pk}'
            # Save again with roll_no
            super().save(update_fields=['roll_no'])

class SISForm(BaseModel):
    # Student's information
    student = models.OneToOneField(Student, on_delete=models.CASCADE, primary_key=True)
    blood_group = models.CharField(max_length=1, choices=BloodGroup.choices, default=None, null=True, blank=True)
    ethnicity = models.TextField(max_length=30, default='Burmese', )
    religion = models.TextField(max_length=30, default='Buddhist')
    NRC = models.TextField(max_length=20, default='9/MKN(N)191305', null=False)
    birthplace = models.TextField(max_length=30, default='Yangon', null=False)

    # Father's information 
    father_name = models.TextField(max_length=40, default='U Ba', null=False)
    father_NRC = models.TextField(max_length=20, default='9/MKN(N)191305', null=False)
    father_birthplace = models.TextField(max_length=30, default='Yangon', null=False)
    father_city = models.TextField(max_length=30, default='Yangon', null=False)
    father_phone = models.TextField(max_length=18, default='0', null=False)
    father_profession = models.TextField(max_length=20, default='Businessman', null=False)
    father_gmail = models.EmailField(max_length=50, default='uba@gmail.com', null=False)
    father_ethnicity = models.TextField(max_length=30, default='Burmese')
    father_religion = models.TextField(max_length=30, default='Buddhist')

    #Mother's Information
    mother_name = models.TextField(max_length=40, default='Daw Hla', null=False)
    mother_NRC = models.TextField(max_length=20, default='9/MKN(N)191305', null=False)
    mother_birthplace = models.TextField(max_length=30, default='Yangon', null=False)
    mother_city = models.TextField(max_length=30, default='Yangon', null=False)
    mother_phone = models.TextField(max_length=18, default='0', null=False)
    mother_profession = models.TextField(max_length=20, default='Businessman', null=False)
    mother_gmail = models.EmailField(max_length=50, default='dawhla@gmail.com', null=False)
    mother_ethnicity = models.TextField(max_length=30, default='Burmese')
    mother_religion = models.TextField(max_length=30, default='Buddhist')

    # Matriculation Information
    matric_roll_no = models.TextField(max_length=10, default='မမ-၉၂၉', null=False)
    # စာစစ်ဌာန
    exam_dept = models.TextField(max_length=60, default='ထ(၃)၊ပြင်ဦးလွင်', null=False)
    passed_year = models.PositiveSmallIntegerField(default=2022, null=False)
    total_marks = models.PositiveSmallIntegerField(default=516, null=False)
    
    # Spouse Information
    has_spouse = models.BooleanField(default=False, null=False)
    spouse_name = models.TextField(max_length=50, null=False)


class Enrollment(BaseModel):
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, default=None, null=True, blank=True)
    sis_form = models.ForeignKey(SISForm, on_delete=models.SET_NULL, default=None, null=True, blank=True)
    selected_subjects = models.JSONField(default=dict)
    result = models.JSONField(default=dict)
    is_approved = models.BooleanField(default=False)
    enrollment_status = models.CharField(max_length=1, choices=EnrollmentStatus.choices, default=EnrollmentStatus.PENDING)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_status = None

        if not is_new:
            # fetch old status before saving
            old_status = Enrollment.objects.filter(pk=self.pk).values_list("enrollment_status", flat=True).first()

        super().save(*args, **kwargs)

        # Only trigger if status changed
        if old_status != self.enrollment_status:
            student = getattr(self.sis_form, "student", None)  # assuming SISForm links to Student
            if student and student.user:  # ensure student has a User account
                if self.enrollment_status == EnrollmentStatus.APPROVED:
                    msg = "Your enrollment has been approved. 🎉"
                elif self.enrollment_status == EnrollmentStatus.REJECTED:
                    msg = "Your enrollment has been rejected. Please contact admin."
                else:
                    msg = None

                if msg:
                    Notification.objects.create(
                        user=student.user,
                        type=NotificationType.STUDENT,
                        notification={
                            "text": msg,
                            "destination": "/student/academics/home"
                        }
                    )



# Student Term Model
class EnrollmentCourse(BaseModel): 
    batch_instructor = models.ForeignKey(BatchInstructor, on_delete=models.CASCADE, default=None, null=True)
    enrollment = models.ForeignKey(Enrollment, on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField(default=0, null=False)
    review = models.TextField(default=None, blank=True, null=True)

    
# Document Model
class Document(BaseModel):
    name = models.CharField(max_length=100, default='')
    description = models.TextField(default='')
    file_link = models.URLField(default='')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, null=True, blank=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    access_status = models.CharField(max_length=1, choices=DocumentType.choices, default=DocumentType.PUBLIC)

class BatchInstructorDocument(BaseModel):
    batch_instructor = models.ForeignKey(BatchInstructor, on_delete=models.CASCADE, null=True)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, null=True)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)

        if is_new and self.batch_instructor:
            batch = self.batch_instructor.batch
            # assuming Enrollment links students to batches
            enrollments = Enrollment.objects.filter(batch=batch, enrollment_status=EnrollmentStatus.APPROVED).select_related("sis_form__student__user")

            notifications = []
            for enrollment in enrollments:
                student = getattr(enrollment.sis_form, "student", None)
                if student and student.user:
                    notifications.append(Notification(
                        user=student.user,
                        type=NotificationType.STUDENT,
                        notification={
                            "text": f"New document has been uploaded for your batch {batch.name}.",
                            "destination": "/student/documents/"
                        }
                    ))
            Notification.objects.bulk_create(notifications)

# Video Conference Model
class VideoConference(BaseModel):
    meeting_name = models.CharField(max_length=100, default='')
    meeting_code = models.CharField(max_length=50, unique=True, default='')
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField(default=timezone.now)
    attendees = models.JSONField(default=list)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

# Assessment Scheme Model
class AssessmentScheme(BaseModel):
    batch_instructor = models.OneToOneField(BatchInstructor, on_delete=models.CASCADE)
    scheme = models.JSONField(default=dict)

# Assessment Model
class Assessment(BaseModel):
    assessment_scheme = models.ForeignKey(AssessmentScheme, on_delete=models.CASCADE, null=True, blank=True)
    assessment_type = models.TextField(max_length=1, choices=AssessmentType.choices, default=AssessmentType.QUIZ)
    assessment = models.JSONField(default=dict)
    assigned_date = models.DateTimeField(auto_now_add=False, default=None, null=True, blank=True)
    due_date = models.DateTimeField(auto_now_add=False, default=None, null=True, blank=True)

    def save(self, *args, **kwargs):
        with transaction.atomic():
            super().save(*args, **kwargs)

            if not self.assessment.get('students'):
                user = self.assessment_scheme.batch_instructor.instructor.user
                batch_instructor = self.assessment_scheme.batch_instructor
                batch = batch_instructor.batch
                semester = batch.semester
                semester_name = semester.semester_name
                degree_name = semester.degree.name
                term_name = batch.term.term_name
                notification = Notification(
                    user=user, 
                    notification = {
                        "text": f"You have created a {self.get_assessment_type_display()} ({self.assessment.get('title')}) for {term_name} - {degree_name} ({semester_name})",
                        "destination": f"/faculty/course_management/{batch_instructor.pk}/"
                    },
                    seen=False,
                    type=NotificationType.INSTRUCTOR
                )
                notification.save()
            else:
                users = User.objects.filter(pk__in=self.assessment.get('students'))
                batch_instructor = self.assessment_scheme.batch_instructor
                course = batch_instructor.course
                instructor = batch_instructor.instructor.user
                course_name, course_code = course.course_name, course.course_code
                notifications = []
                for user in users:
                    notifications.append( Notification(
                        user=user,
                        notification = {
                            "text": f"{instructor.full_name} has created a {self.get_assessment_type_display()} named {self.assessment.get('title')} with due date {self.due_date}",
                            "destination": f"students/academics/batch_instructor/{batch_instructor.pk}"
                        },
                        seen=False,
                        type=NotificationType.STUDENT,
                    ))
                Notification.objects.bulk_create(notifications)


# Assessment Result Model
class AssessmentResult(BaseModel):
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, null=True, blank=True)
    answer = models.JSONField(default=dict)
    mark = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        with transaction.atomic():
            # Check if this instance already exists in DB
            old_instance = None
            if self.pk:
                try:
                    old_instance = AssessmentResult.objects.get(pk=self.pk)
                except AssessmentResult.DoesNotExist:
                    old_instance = None

            super().save(*args, **kwargs)  # Save current state

            # Notification for submission (your existing logic)
            if self.assessment.assessment_type in (
                AssessmentType.CLASS_PARTICIPATION, 
                AssessmentType.FINAL_ONPAPER, 
                AssessmentType.MIDTERM, 
                AssessmentType.TUTORIAL
            ):
                Notification.objects.create(
                    user=self.student.user,
                    type=NotificationType.STUDENT,
                    notification={
                        "text": f"You have attempted and submitted {self.assessment.assessment.get('title')} successfully on {self.created_at}",
                        "destination": f"/students/academics/batch_instructor/{self.assessment.assessment_scheme.batch_instructor.pk}"
                    }
                )

            # Trigger: mark changed
            if old_instance and old_instance.mark != self.mark:
                # Perform action when mark changes
                Notification.objects.create(
                    user=self.student.user,
                    type=NotificationType.STUDENT,
                    notification={
                        "text": f"{self.assessment.assessment_scheme.batch_instructor.instructor.user.full_name} provided you grades for {self.assessment.assessment.get('title')}. Check that out!!",
                        "destination": f"/students/academics/batch_instructor/{self.assessment.assessment_scheme.batch_instructor}"
                    }
                )

# Mailbox Admin Model
class MailboxAdmin(BaseModel):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    added_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, default=None, related_name='added_admins')
    appointed_date = models.DateField(default=timezone.now)

# Mailbox Post Model
class MailboxPost(BaseModel):
    post = models.JSONField(default=None)
    uploaded_by = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, default=None)
    approved_by = models.ForeignKey(MailboxAdmin, on_delete=models.SET_NULL, null=True, default=None)
    approved_at = models.DateTimeField(null=True, default=None)
    reactions = models.JSONField(default=dict)
    status = models.CharField(max_length=1, choices=MailboxPostStatus.choices, default=MailboxPostStatus.PENDING)
    is_anonymous = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        with contextlib.suppress(Exception):
        # Retrieve the old status if the instance already exists in the database
            old_status = None
            if self.pk:
                with contextlib.suppress(MailboxPost.DoesNotExist):
                    old_status = MailboxPost.objects.get(pk=self.pk).status
            super().save(*args, **kwargs)  # Call the "real" save() method to save the new status

            # Check if the status has actually changed
            if old_status != self.status:
                # Ensure you have a field for the post text
                truncated_text = Truncator(json.loads(self.post).get('text', '')).chars(50, truncate='...')  # Adjust as needed

                if self.status == MailboxPostStatus.APPROVED:  # Use the enum value
                    self.notify_approved_post(self.uploaded_by, self.pk, truncated_text)
                elif self.status == MailboxPostStatus.REJECTED:
                    self.notify_rejected_post(self.uploaded_by, self.pk, truncated_text)
                elif self.status == MailboxPostStatus.DISQUALIFIED:
                    self.notify_disqualified_post(self.uploaded_by, self.pk, truncated_text)
                # Add other status checks if you have more notification types


    def notify_post_status(self, user, post_id, post_text, status):
        try:
            Notification.objects.create(
                user=user,
                type=NotificationType.STUDENT_MAILBOX,
                notification=json.dumps({
                    f"is_{status}": True,
                    "post": post_id,
                    "text": f"Your post '{post_text}...' has been {status} by an admin!",
                }),
                created_at=timezone.now(),
                updated_at=timezone.now()
            )
        except (DatabaseError, ValidationError) as db_err:
            print(f"Database error: {db_err}")
        except Exception as e:
            print(f"Unexpected error in notify_approved_post: {e}")

    def notify_approved_post(self, user, post_id, post_text):
        self.notify_post_status(user, post_id, post_text, "approved")

    def notify_rejected_post(self, user, post_id, post_text):
        self.notify_post_status(user, post_id, post_text, "rejected")

    def notify_disqualified_post(self, user, post_id, post_text):
        self.notify_post_status(user, post_id, post_text, "disqualified")
   

class Comment(BaseModel):
    post = models.ForeignKey(MailboxPost, on_delete=models.CASCADE)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, default=None, related_name='replies')
    comment = models.TextField(default='')
    reactions = models.JSONField(default=dict)
    commented_by = models.ForeignKey(User, on_delete=models.CASCADE)
    is_anonymous = models.BooleanField(default=False)

# Security Models
class LoginAttempt(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    ip_address = models.GenericIPAddressField(default='0.0.0.0')
    attempt_time = models.DateTimeField(default=timezone.now)
    success = models.BooleanField(default=False)
    user_agent = models.TextField(default='')
    location_info = models.JSONField(default=dict)

class OTP(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    email = models.EmailField(default='')  # For email verification before user creation
    otp_code = models.CharField(max_length=100, default='')  # Hashed
    generated_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(default=timezone.now)
    used = models.BooleanField(default=False)

class PasswordHistory(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    old_password_hash = models.CharField(max_length=100, default='')
    changed_at = models.DateTimeField(default=timezone.now)

class AuditLog(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField(max_length=50, default='')
    target_table = models.CharField(max_length=50, default='')
    target_id = models.PositiveIntegerField(default=0)
    action_timestamp = models.DateTimeField(default=timezone.now)
    ip_address = models.GenericIPAddressField(default='0.0.0.0')
    description = models.TextField(default='')

class UserSession(BaseModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    session_token = models.CharField(max_length=100, default='')
    login_time = models.DateTimeField(default=timezone.now)
    logout_time = models.DateTimeField(null=True, default=None)
    ip_address = models.GenericIPAddressField(default='0.0.0.0')
    user_agent = models.TextField(default='')

class MailboxReport(models.Model):
    reporter = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='reports_made')
    post = models.ForeignKey('MailboxPost', on_delete=models.CASCADE, related_name='reports')
    report_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    type = models.CharField(max_length=1, choices=NotificationType.choices, default=None)
    notification = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    seen = models.BooleanField(default=False)

class UniversityDetails(models.Model):
    name = models.CharField(max_length=100, default='')
    details = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
