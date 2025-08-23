from django.shortcuts import redirect
from django.core.cache import cache

class ExecutiveAccessMiddleware:
    """
    Middleware to restrict access to /executive/ URLs.
    Only users with role 'executive' can access.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path
        print(request.path)

        # Only process paths under /executive/
        if path.startswith('/executive/'):
            for _ in range(100):
                print('*')
            # Get cached role
            user_email = request.COOKIES.get('my_user')
            cache_key = f"user_role:{user_email}"
            role = cache.get(cache_key)

            # If role is missing or not 'executive', redirect to access denied
            if role != 'executive':
                return redirect('/public/access_denied/')

        return self.get_response(request)