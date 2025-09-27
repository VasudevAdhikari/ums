def add_sample_images():
    import random
    from authorization.models import User  # adjust app name
    from django.db import transaction

    male_images = ["male1.jpg", "male2.jpg", "male3.jpg", "male4.jpg"]
    female_images = ["female1.jpg", "female2.jpg", "female3.jpg", "female4.jpg"]

    users_to_update = []

    for user in User.objects.all():
        if user.gender == "M":
            user.profile_picture = f"profile_pictures/{random.choice(male_images)}"
            users_to_update.append(user)
        elif user.gender == "F":
            user.profile_picture = f"profile_pictures/{random.choice(female_images)}"
            users_to_update.append(user)

    with transaction.atomic():
        User.objects.bulk_update(users_to_update, ["profile_picture"])
    print(f"✅ Updated {len(users_to_update)} users in bulk")