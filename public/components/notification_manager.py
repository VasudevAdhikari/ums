from django.shortcuts import render
from authorization.models import User, Notification
from django.db.models import Q
import json

def show_notifications(request, user_id=None):
    user=None
    if user_id:
        user = User.objects.filter(pk=user_id).first()
    else:
        user = User.objects.filter(email=request.COOKIES.get('my_user')).first()
    notifications = Notification.objects.filter(
        Q(user=user) & ~Q(type='M')
    )
    notification_data = []
    for notification in notifications:
        notification_data.append({
            "text": notification.notification.get("text"),
            "time": notification.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "seen": notification.seen,
            "destination": notification.notification.get("destination"),
        })
        notification.seen = True
        notification.save()
    data = {
        'notifications': json.dumps(notification_data),
    }
    return render(request, 'htmls/notifications.html', context=data)