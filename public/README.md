# Public Django App

The **Public** app is the main entry point for all users—authenticated or not—providing general information, course and degree listings, lab details, notifications, and a consistent navigation experience. It is designed to be the public-facing layer of UMS Django project, ensuring accessibility, usability, and a welcoming interface for visitors.

---

## Features

- **Home & Informational Pages**
  - Main landing page for the platform.
  - Informational content accessible to all users.

- **Course, Degree, and Term Listings**
  - Displays available courses, degrees, and academic terms.
  - Interactive filtering and searching via JavaScript.

- **Lab Information**
  - Presents details about labs, facilities, or schedules.

- **Public Notifications**
  - Shows announcements or notifications relevant to all users.
  - Managed via a dedicated notification manager component.

- **Navigation**
  - Consistent, reusable navigation bar across all public pages.

- **Access Control**
  - Handles restricted content gracefully with an access denied page.

---

## Directory Structure

```
public/
│
├── __init__.py
├── admin.py
├── apps.py
├── models.py
├── tests.py
├── urls.py
├── views.py
│
├── components/
│   └── notification_manager.py
│
├── migrations/
│   └── __init__.py
│
├── static/
│   └── public/
│       ├── images/
│       │   └── image.png
│       ├── javascripts/
│       │   ├── degrees.js
│       │   ├── home.js
│       │   └── term_management.js
│       └── stylesheets/
│           └── home.css
│
└── templates/
    ├── htmls/
    │   ├── access_denied.html
    │   ├── courses.html
    │   ├── degrees.html
    │   ├── home.html
    │   ├── lab.html
    │   ├── navbar.html
    │   ├── notifications.html
    │   └── terms.html
    └── public/
        └── navbar.html
```

---

## Usage

1. **Add to `INSTALLED_APPS`** in Django settings:
    ```python
    INSTALLED_APPS = [
        # ...
        'public',
    ]
    ```

2. **Include URLs** in project’s `urls.py`:
    ```python
    path('', include('public.urls')),
    ```

3. **Run migrations** if the app defines any models:
    ```
    python manage.py migrate
    ```

4. **Access the public pages** via the configured URLs.

---

## Customization & Extensibility

- **Templates** can be extended or overridden to match project’s branding.
- **Static assets** (CSS/JS/images) can be customized for additional interactivity or styling.
- **Notification logic** can be extended in `components/notification_manager.py` for richer features.
- **Additional public pages** can be added easily by creating new views and templates.

---

## Security & Best Practices

- **Access Control:** Ensures restricted content is not exposed to unauthorized users.
- **Separation of Concerns:** Keeps public-facing logic separate from internal or restricted features.
- **Performance:** Static assets are organized for efficient loading and caching.