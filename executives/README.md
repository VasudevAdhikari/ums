# Executives Django App

The **Executives** app is a comprehensive administrative module for managing academic operations in an educational institution. It provides dashboards, CRUD interfaces, APIs, and business logic for handling faculties, departments, courses, degrees, terms, batches, enrollments, labs, students, instructors, notifications, and result processing.

---

## Features

- **Executive Dashboard:** Overview and analytics for executive users.
- **Faculty, Department, Course, Degree, and Term Management:** Full CRUD operations and management interfaces.
- **Batch & Enrollment Management:** Create and manage batches, assign instructors, approve/reject enrollments, and view batch statistics.
- **Student & Instructor Data:** Approve/reject users, view and update student/instructor data.
- **Lab Management:** Manage labs, lab projects, and lab photos via APIs and views.
- **Result Processing:** Calculate results, generate result images, and email results to students.
- **Notifications:** Send notifications to users.
- **Custom Middleware:** Handles user roles, image fallbacks, rate limiting, and payload size checks.

---

## Directory Structure

```
executives/
│
├── __init__.py
├── admin.py
├── apps.py
├── lab_api.py                # APIs for lab management
├── middleware.py             # Custom middleware for the app
├── models.py
├── tests.py
├── to_fix.txt
├── urls.py                   # URL routing for the app
├── views.py                  # Main views for executive operations
│
├── additional_business_logics/
│   ├── additionals.py        # Additional business logic helpers
│   └── data_formatter.py     # Data formatting utilities
│
├── components/
│   ├── batch_manager.py
│   ├── batch_statistics_manager.py
│   ├── course_manager.py
│   ├── dashboard.py
│   ├── degree_manager.py
│   ├── department_manager.py
│   ├── enrollment_manager.py
│   ├── faculty_manager.py
│   ├── instructor_data_manager.py
│   ├── notification_sender.py
│   ├── rating_review_manager.py
│   ├── student_data_manager.py
│   └── term_manager.py
│
├── result_components/
│   ├── result_calculator.py
│   ├── result_email_sender.py
│   └── result_image_generator.py
│
├── javascripts/
│   └── uni_info.js
│
├── migrations/
│   └── __init__.py
│
├── static/
│   └── executives/
│
└── templates/
    └── executives/
```

---

## Usage

1. **Add to `INSTALLED_APPS`** in your Django settings:
    ```python
    INSTALLED_APPS = [
        # ...
        'executives',
    ]
    ```

2. **Include URLs** in your project’s `urls.py`:
    ```python
    path('executives/', include('executives.urls')),
    ```

3. **Run migrations** to set up database tables:
    ```
    python manage.py migrate
    ```

4. **Access the executive dashboard** and management interfaces via the configured URLs.

---

## Dependencies

- Django (compatible version as per your project)
- Relies on user, student, and instructor models (typically from an `authorization` app)

---

## Contributing

- See `to_fix.txt` for known issues or TODOs.
- Write tests in `tests.py` for new features or bug fixes.

---

## License

This app is part of your Django project. See the project’s main LICENSE file for details.