# Authorization App

## Overview
Authorization App is a Django-based authentication and authorization system designed for secure user management. It supports robust registration, login, password recovery, and account protection features, making it suitable for modern web applications requiring strong security.

## Features
- User registration with email and OTP verification
- Secure login with password strength validation
- Multiple password recovery methods (OTP, security questions, emergency contact)
- Profile and session management
- Login attempt tracking and account suspension
- Secure password hashing and CSRF protection
- Rate limiting for authentication endpoints

## Installation

1. **Prerequisites:**  
   - Python 3.8+
   - MySQL server

2. **Install dependencies:**
   ```bash
   pip install django mysqlclient
   ```

3. **Configure the project:**
   - Update `settings.py` with your MySQL and SMTP credentials.
   - Set environment variables as needed:
     ```python
     DEBUG=True
     SECRET_KEY='your-secret-key'
     DB_PASSWORD='your-database-password'
     EMAIL_HOST_USER='your-email@example.com'
     EMAIL_HOST_PASSWORD='your-email-password'
     ```

## Usage

### Registration
1. User submits email.
2. System sends OTP for verification.
3. After OTP verification, user completes profile.
4. Account is created.

### Login
1. User enters email and password.
2. Credentials are validated.
3. On success, user is redirected to dashboard.
4. Failed attempts are tracked and may result in suspension.

### Password Recovery
1. User selects a recovery method (OTP or security questions).
2. Identity is verified.
3. User sets a new password.
4. Account is unlocked if previously suspended.

## API Endpoints

- `POST /auth/register/` — Register a new user
- `POST /auth/login/` — User login
- `POST /auth/verify_mail/` — Email verification
- `POST /auth/otp_verification/` — OTP verification
- `POST /auth/recovery/` — Password recovery
- `GET/POST /auth/profile/` — Profile management

## Security

- Passwords hashed using Django's default hasher
- CSRF and session protection enabled
- Rate limiting on authentication endpoints
- Password requirements:
  - Minimum 8 characters
  - Uppercase and lowercase letters
  - Numbers and special characters

## Project Structure

```
authorization/
├── migrations/
├── templates/
│   ├── htmls/
│   ├── stylesheets/
│   └── javascripts/
├── __init__.py
├── admin.py
├── apps.py
├── models.py
├── recovery_views.py
├── urls.py
└── views.py
```

## Testing

Run the test suite with:
```bash
python manage.py test authorization
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit and push your changes
4. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Django Documentation
- Bootstrap Documentation
- MySQL Documentation