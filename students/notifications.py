import json
from django.utils import timezone
from authorization.models import Notification, NotificationType 
from django.db import DatabaseError
from django.core.exceptions import ValidationError

def notify_new_comment(user, post_id, commenter_name, post_text):
    print("got into the notify_new_comment function")
    
    try:
        # Fetch unseen comment-related notifications for the user
        unseen_comment_notis = Notification.objects.filter(seen=False, user=user)

        for noti in unseen_comment_notis:
            print(noti)
            try:
                notification = json.loads(noti.notification)
            except json.JSONDecodeError:
                continue  # Skip bad JSON notifications

            # Match comment notification for the same post
            if notification.get('post') == post_id and notification.get('is_new_comment'):
                commenters = notification.get('commenters', [])

                # If user already commented in this notification, skip update
                if commenter_name in commenters:
                    return

                # Add commenter and update message/count
                commenters.append(user.username)
                count = len(commenters)

                if count == 1:
                    notification['text'] = f"{commenter_name} commented on your post: \"{post_text}\""
                else:
                    notification['text'] = f"{commenter_name} + {count - 1} others commented on your post: \"{post_text}\""

                notification['commenter_count'] = count
                notification['commenters'] = commenters

                # Save the updated notification
                noti.notification = json.dumps(notification)
                noti.updated_at = timezone.now()
                noti.save()
                return

        # No matching unseen comment notification — create a new one
        new_notification = {
            "is_new_comment": True,
            "post": post_id,
            "commenter_count": 1,
            "commenters": [commenter_name],
            "text": f"{commenter_name} commented on your post: \"{post_text[:30]}...\""
        }

        notification = Notification(
            user=user,
            type=NotificationType.STUDENT_MAILBOX,
            notification=json.dumps(new_notification),
            created_at=timezone.now(),
            updated_at=timezone.now(),
        )

        notification.full_clean()  # Validate model before saving
        notification.save()

    except (DatabaseError, ValidationError) as db_err:
        print(f"Database error: {db_err}")
    except Exception as e:
        print(f"Unexpected error in notify_new_comment: {e}")


def notify_new_post_reaction(user, post_id, reactor_name, reaction_type):
    try:
        unseen_notis = Notification.objects.filter(seen=False, user=user)

        for noti in unseen_notis:
            try:
                notification = json.loads(noti.notification)
            except json.JSONDecodeError:
                continue  # skip if the notification content is not valid JSON

            if notification.get('post') == post_id and notification.get('is_post_reaction'):
                # Get or initialize list of reactor usernames or IDs
                reactors = notification.get('reactors', [])

                # If this user already reacted, do not update
                if reactor_name in reactors:
                    return  # Do not increment or modify anything

                # Add new reactor
                reactors.append(reactor_name)

                count = len(reactors)
                if count == 1:
                    notification['text'] = f"{reactor_name} reacted to your post with {reaction_type}"
                else:
                    if reaction_type not in notification.get('reactions'):
                        print('reaction not in notification')
                        notification['reactions'].append(reaction_type)
                    notification['text'] = f"{reactor_name} + {count - 1} others reacted to your post with {', '.join(notification.get('reactions'))}"

                notification['reactor_count'] = count
                notification['reactors'] = reactors

                # Save updated notification
                noti.notification = json.dumps(notification)
                noti.updated_at = timezone.now()
                noti.save()
                return

        # No matching notification found — create a new one
        new_notification = {
            "is_post_reaction": True,
            "post": post_id,
            "reactor_count": 1,
            "reactors": [reactor_name],
            "reactions": [reaction_type],
            "text": f"{reactor_name} reacted to your post with {reaction_type}"
        }

        notification = Notification(
            user=user,
            type=NotificationType.STUDENT_MAILBOX,
            notification=json.dumps(new_notification),
            created_at=timezone.now(),
            updated_at=timezone.now()
        )

        notification.full_clean()  # Validate model fields
        notification.save()

    except (DatabaseError, ValidationError) as db_err:
        # Log or handle database-related errors here
        print(f"Database error: {db_err}")
    except Exception as e:
        # Catch-all for unexpected errors
        print(f"Unexpected error in notify_new_post_reaction: {e}")


def notify_trending_post(user, post_id, post_text, view_count):
    if view_count == 1000:
        Notification.objects.create (
            user = user,
            type = NotificationType.STUDENT_MAILBOX,
            notification = json.dumps({
                "is_trending": True,
                "post": post_id,
                "text": f"Great news! Your post, '{post_text}.....', just hit {view_count} views in the mailbox!",
                "view_count": view_count
            }),
        )

def notify_trending_post_by_reactions(user, post_id, post_text, reaction_count):
    if reaction_count == 100:
        Notification.objects.create (
            user = user,
            type = NotificationType.STUDENT_MAILBOX,
            notification = json.dumps({
                "is_trending": True,
                "post": post_id,
                "text": f"Great news! Your post, '{post_text}.....', just hit {reaction_count} reactions in the mailbox!",
                "reaction_count": reaction_count
            }),
        )

def notify_post_1001_views(user, post_id, post_text):
    """Notify post uploader when post gets exactly 1001 views"""
    try:
        # Check if notification already exists for this post
        existing_notification = Notification.objects.filter(
            user=user,
            type=NotificationType.STUDENT_MAILBOX,
            seen=False
        ).first()

        if existing_notification:
            try:
                notification_data = json.loads(existing_notification.notification)
                if notification_data.get("is_1001_views") and notification_data.get("post") == post_id:
                    # Notification already exists for this post
                    return
            except json.JSONDecodeError:
                pass

        # Create new notification
        Notification.objects.create(
            user=user,
            type=NotificationType.STUDENT_MAILBOX,
            notification=json.dumps({
                "is_1001_views": True,
                "post": post_id,
                "text": f"🎉 Congratulations! Your post '{post_text[:50]}...' just reached 1001 views!",
                "view_count": 1001
            }),
            created_at=timezone.now(),
            updated_at=timezone.now()
        )

    except (DatabaseError, ValidationError) as db_err:
        print(f"Database error in notify_post_1001_views: {db_err}")
    except Exception as e:
        print(f"Unexpected error in notify_post_1001_views: {e}")

def notify_new_comment_on_post(user, post_id, commenter_name, post_text, is_anonymous=False):
    """Notify post uploader when post gets new comment or reply"""
    try:
        # Find existing unseen comment notification for this post
        existing_notifications = Notification.objects.filter(
            user=user,
            type=NotificationType.STUDENT_MAILBOX,
            seen=False
        )

        for notification in existing_notifications:
            try:
                notification_data = json.loads(notification.notification)
                if (notification_data.get("is_new_comment_on_post") and
                    notification_data.get("post") == post_id):

                    # Update existing notification
                    comment_count = notification_data.get("comment_count", 1) + 1
                    commenters = notification_data.get("commenters", [])

                    # Add new commenter if not anonymous and not already in list
                    if not is_anonymous and commenter_name not in commenters:
                        commenters.append(commenter_name)

                    # Update notification text
                    if is_anonymous:
                        if comment_count == 2:
                            text = f"Someone and 1 other commented on your post '{post_text[:30]}...'"
                        else:
                            text = f"Someone and {comment_count - 1} others commented on your post '{post_text[:30]}...'"
                    else:
                        if comment_count == 2:
                            text = f"{commenter_name} and 1 other commented on your post '{post_text[:30]}...'"
                        else:
                            first_commenter = commenters[0] if commenters else "Someone"
                            text = f"{first_commenter} and {comment_count - 1} others commented on your post '{post_text[:30]}...'"

                    notification_data.update({
                        "comment_count": comment_count,
                        "commenters": commenters,
                        "text": text,
                        "latest_commenter": "Anonymous" if is_anonymous else commenter_name
                    })

                    notification.notification = json.dumps(notification_data)
                    notification.updated_at = timezone.now()
                    notification.save()
                    return

            except json.JSONDecodeError:
                continue

        # Create new notification if none exists
        commenter_display = "Someone" if is_anonymous else commenter_name
        Notification.objects.create(
            user=user,
            type=NotificationType.STUDENT_MAILBOX,
            notification=json.dumps({
                "is_new_comment_on_post": True,
                "post": post_id,
                "comment_count": 1,
                "commenters": [] if is_anonymous else [commenter_name],
                "text": f"{commenter_display} commented on your post '{post_text[:30]}...'",
                "latest_commenter": "Anonymous" if is_anonymous else commenter_name
            }),
            created_at=timezone.now(),
            updated_at=timezone.now()
        )

    except (DatabaseError, ValidationError) as db_err:
        print(f"Database error in notify_new_comment_on_post: {db_err}")
    except Exception as e:
        print(f"Unexpected error in notify_new_comment_on_post: {e}")


def notify_comment_reaction(user, comment_id, reactor_name, reaction_type, comment_text):
    """Notify commenter when their comment gets new reactions"""
    try:
        # Find existing unseen reaction notification for this comment
        existing_notifications = Notification.objects.filter(
            user=user,
            type=NotificationType.STUDENT_MAILBOX,
            seen=False
        )

        for notification in existing_notifications:
            try:
                notification_data = json.loads(notification.notification)
                if (notification_data.get("is_comment_reaction") and
                    notification_data.get("comment") == comment_id):

                    # Update existing notification
                    reaction_count = notification_data.get("reaction_count", 0) + 1
                    reactors = notification_data.get("reactors", [])
                    reactions = notification_data.get("reactions", [])

                    # Add new reactor if not already in list
                    if reactor_name not in reactors:
                        reactors.append(reactor_name)

                    # Add reaction type
                    reactions.append(reaction_type)

                    # Update notification text
                    if reaction_count == 1:
                        text = f"{reactor_name} reacted to your comment with {reaction_type}"
                    elif reaction_count == 2:
                        text = f"{reactors[0]} and 1 other reacted to your comment"
                    else:
                        text = f"{reactors[0]} and {reaction_count - 1} others reacted to your comment"

                    notification_data.update({
                        "reaction_count": reaction_count,
                        "reactors": reactors,
                        "reactions": reactions,
                        "text": text,
                        "latest_reactor": reactor_name,
                        "latest_reaction": reaction_type
                    })

                    notification.notification = json.dumps(notification_data)
                    notification.updated_at = timezone.now()
                    notification.save()
                    return

            except json.JSONDecodeError:
                continue

        # Create new notification if none exists
        Notification.objects.create(
            user=user,
            type=NotificationType.STUDENT_MAILBOX,
            notification=json.dumps({
                "is_comment_reaction": True,
                "comment": comment_id,
                "reaction_count": 1,
                "reactors": [reactor_name],
                "reactions": [reaction_type],
                "text": f"{reactor_name} reacted to your comment with {reaction_type}",
                "latest_reactor": reactor_name,
                "latest_reaction": reaction_type,
                "comment_text": comment_text[:50] + "..." if len(comment_text) > 50 else comment_text
            }),
            created_at=timezone.now(),
            updated_at=timezone.now()
        )

    except (DatabaseError, ValidationError) as db_err:
        print(f"Database error in notify_comment_reaction: {db_err}")
    except Exception as e:
        print(f"Unexpected error in notify_comment_reaction: {e}")

def notify_comment_reply(user, comment_id, replier_name, comment_text, is_anonymous=False):
    """Notify commenter when their comment gets replies"""
    try:
        # Find existing unseen reply notification for this comment
        existing_notifications = Notification.objects.filter(
            user=user,
            type=NotificationType.STUDENT_MAILBOX,
            seen=False
        )

        for notification in existing_notifications:
            try:
                notification_data = json.loads(notification.notification)
                if (notification_data.get("is_comment_reply") and
                    notification_data.get("comment") == comment_id):

                    # Update existing notification
                    reply_count = notification_data.get("reply_count", 1) + 1
                    repliers = notification_data.get("repliers", [])

                    # Add new replier if not anonymous and not already in list
                    if not is_anonymous and replier_name not in repliers:
                        repliers.append(replier_name)

                    # Update notification text
                    if is_anonymous:
                        if reply_count == 2:
                            text = f"Someone and 1 other replied to your comment"
                        else:
                            text = f"Someone and {reply_count - 1} others replied to your comment"
                    else:
                        if reply_count == 2:
                            text = f"{replier_name} and 1 other replied to your comment"
                        else:
                            first_replier = repliers[0] if repliers else "Someone"
                            text = f"{first_replier} and {reply_count - 1} others replied to your comment"

                    notification_data.update({
                        "reply_count": reply_count,
                        "repliers": repliers,
                        "text": text,
                        "latest_replier": "Anonymous" if is_anonymous else replier_name
                    })

                    notification.notification = json.dumps(notification_data)
                    notification.updated_at = timezone.now()
                    notification.save()
                    return

            except json.JSONDecodeError:
                continue

        # Create new notification if none exists
        replier_display = "Someone" if is_anonymous else replier_name
        Notification.objects.create(
            user=user,
            type=NotificationType.STUDENT_MAILBOX,
            notification=json.dumps({
                "is_comment_reply": True,
                "comment": comment_id,
                "reply_count": 1,
                "repliers": [] if is_anonymous else [replier_name],
                "text": f"{replier_display} replied to your comment",
                "latest_replier": "Anonymous" if is_anonymous else replier_name,
                "comment_text": comment_text[:50] + "..." if len(comment_text) > 50 else comment_text
            }),
            created_at=timezone.now(),
            updated_at=timezone.now()
        )

    except (DatabaseError, ValidationError) as db_err:
        print(f"Database error in notify_comment_reply: {db_err}")
    except Exception as e:
        print(f"Unexpected error in notify_comment_reply: {e}")