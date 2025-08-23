from authorization.models import NotificationType, StudentStatus, User, Instructor, Admin, BaseModel, Student, Notification, EmploymentStatus
from django.db import models, transaction
from django.db.models import Q

class NoticeStatus(models.TextChoices):
    UNAPPROVED = 'U', 'Unapproved'
    REJECTED = 'R', 'Rejected'
    PENDING = 'P', 'Pending'

class Notice(BaseModel):
    notice = models.JSONField(default=dict)
    # notice = {
    #     "caption": "ldakjf",
    #     "files": "alfdjadakl",
    # }
    uploaded_by = models.ForeignKey(User, default=None, null=True, blank=True, on_delete=models.CASCADE)
    handled_by = models.ForeignKey(Admin, default=None, null=True, blank=True, on_delete=models.CASCADE)
    status = models.CharField(max_length=1, default=NoticeStatus.PENDING)

    def save(self, *args, **kwargs):
        with transaction.atomic():
            is_new = self.pk is None
            super().save(*args, **kwargs)

            if Instructor.objects.filter(user=self.uploaded_by).exists():
                if is_new:
                    notifications = []
                    admins = Admin.objects.all().select_related('user')
                    for admin in admins:
                        notifications.append(Notification(
                            user=admin.user,
                            type=NotificationType.EXECUTIVE,
                            notification={
                                "text": f"{self.uploaded_by.full_name} has uploaded a notice in noticeboard. Check it out!!",
                                "destination": f"/noticeboard/pending/"
                            }
                        ))
                    Notification.objects.bulk_create(notifications)

            if self.status==NoticeStatus.UNAPPROVED:
                Notification.objects.create(
                    user=self.uploaded_by,
                    type=NotificationType.INSTRUCTOR,
                    notification={
                        "text": f"An admin approved your notice {self.notice.get('caption')[:10] if self.notice.get('caption', None) else None}.... Check that out!!!"
                    }
                )

                users = User.objects.filter(
                    (Q(student__status=StudentStatus.ACTIVE) | 
                    Q(instructor__employment_status=EmploymentStatus.ACTIVE))
                    & (~Q(pk=self.uploaded_by.pk))
                ).distinct().select_related("student", "instructor")
                notifications = []

                for user in users:
                    if hasattr(user, "student") and user.student.status == StudentStatus.ACTIVE:
                        notif_type = NotificationType.STUDENT
                    else:
                        notif_type = NotificationType.INSTRUCTOR

                    notifications.append(Notification(
                        user=user,
                        type=notif_type,
                        notification={
                            "text": f"There is a new notice in the noticeboard. Check that out!!",
                            "destination": "/noticeboard",
                        }
                    ))
                Notification.objects.bulk_create(notifications)

               

    

