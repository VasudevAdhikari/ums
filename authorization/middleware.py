from django.shortcuts import redirect
from django.core.cache import cache
from django.template.response import TemplateResponse
from django.shortcuts import HttpResponse
from authorization.models import UniversityDetails
from django.http import JsonResponse, HttpResponseForbidden
import time
from django.utils.deprecation import MiddlewareMixin
import geoip2.database

class UserRoleMiddleware:
    PUBLIC_PATHS = [
        '/auth/logout/',
        '/auth/login/',
        '/auth/login_submit/',
        '/auth/register/',
        '/auth/check_email/',
        '/auth/verify_mail/',
        '/auth/verify_otp/',
        '/auth/save_emergency_contact/',
        '/auth/save_student/',
        '/auth/otp_login/',
        '/auth/recovery/',
        '/auth/recovery/check_email/',
        '/auth/recovery/send_otp/',
        '/auth/recovery/verify_otp/',
        '/auth/recovery/new_password/',
        '/auth/recovery/change_password/',
        '/auth/credential_login/',
        '/auth/credential_login/submit/',
        '/auth/emergency_contact_login/',
        '/auth/mail_verification/',
        '/public/',
        '/public/degrees/',
        '/public/terms/',
        '/public/courses/',
        '/public/acces_denied/',
        '/public/lab_details/',
        '/executives/terms/'
        # Add more public URLs as needed
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path

        # Step 2: Check cache for user role
        user_email = request.COOKIES.get('my_user')
        cache_key = f"user_role:{user_email}"
        role = cache.get(cache_key)

        cache_key = "uni_logo_lagjagale"
        uni_logo = None
        if not cache.get(cache_key):
            uni_logo = UniversityDetails.objects.filter(
                name='university_info'
            ).first()
            if uni_logo:
                uni_photo = uni_logo.details.get('profile')
            cache.set(cache_key, f"/media/{uni_photo}", 60*60)
            cache.set('uni_name_lagjagale', uni_logo.details.get('name'), 60*60*24)
            
        # Step 4: Store role in request
        request.user_role = role
        request.uni_logo = cache.get(cache_key)

        # Step 1: Skip middleware for public paths
        for p in self.PUBLIC_PATHS:
            if path.startswith(p):
                return self.get_response(request)

        # Step 3: Redirect to login if role not found
        if not role:
            return redirect('/auth/login/')
        
        if request.path.startswith('/executives/') and role!='executive':
            return redirect('/public/access_denied/')

        # Step 5: Process response
        response = self.get_response(request)
        return response
    

    from django.utils.deprecation import MiddlewareMixin

class ImgFallbackMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if isinstance(response, TemplateResponse):
            response.add_post_render_callback(self.inject_script)
        elif isinstance(response, HttpResponse):
            response = self.inject_script(response, request)

        return response

    def inject_script(self, response, request):
        content_type = response.get('Content-Type', '')
        if hasattr(response, 'content') and content_type.startswith('text/html'):
            content_lower = response.content.lower()
            head_index = content_lower.find(b'<head>')

            if head_index != -1:
                # Move index after <head> tag
                insert_index = head_index + len(b'<head>')
                script = b"""
                <!-- SweetAlert2 + custom styles -->
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
                <style>
                /* Global SweetAlert2 styling */
                .swal2-popup.swal2-modal.swal2-show {
                    border-top: 5px solid #FFD700;
                    box-shadow: 1px 1px 10px #003366;
                    border-radius: 20px;
                    font-family: 'Poppins', sans-serif;
                }
                .swal2-title {
                    color: #003366;
                    font-weight: 600;
                    font-size: 1.5rem;
                }
                .swal2-html-container {
                    color: #333333;
                    font-size: 1rem;
                    margin-top: 0.5rem;
                }
                .swal2-confirm {
                    background-color: #003366;
                    color: #fff;
                    border-radius: 0.5rem;
                    padding: 0.5rem 1.5rem;
                    font-family: 'Poppins', sans-serif;
                }
                .swal2-confirm:hover {
                    background-color: #1a4d80;
                }
                .swal2-cancel {
                    border-radius: 0.5rem;
                }
                </style>
                <script>
                window.alert = async function(message) {
                    await Swal.fire({
                        html: '<i class="fas fa-comment-dots fa-3x" style="color:#003366;"></i><p>' + message + '</p>',
                        showConfirmButton: true,
                        confirmButtonText: 'OK',
                        allowOutsideClick: false,
                        allowEscapeKey: false
                    });
                };

                window.confirm = async function(message) {
                    const res = await Swal.fire({
                        html: '<i class="fas fa-question-circle fa-3x" style="color:#003366;"></i><p>' + message + '</p>',
                        showCancelButton: true,
                        confirmButtonText: 'OK',
                        cancelButtonText: 'Cancel',
                        allowOutsideClick: false,
                        allowEscapeKey: false
                    });
                    return res.isConfirmed;
                };
                document.addEventListener("DOMContentLoaded", function() {
                    document.querySelectorAll("img").forEach(img => {
                        img.addEventListener("error", function handler() {
                            this.removeEventListener("error", handler);
                            this.src = "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_hybrid&w=740&q=80";
                        });
                    });

                    const btnLogout = document.getElementById("btnLogoutLagjagale");
                    if(btnLogout) {
                        btnLogout.addEventListener('click', async (e) => {
                            e.stopPropagation();
                            if (!await confirm('Are you sure to logout?')) return;
                            window.location.href='/auth/logout/';
                        });
                    }
                });
                </script>
                """
                script += f'<link rel="icon" type="image/jpeg" href="{request.uni_logo}">'.encode("utf-8")
                response.content = (response.content[:insert_index] + script +
                                    response.content[insert_index:])
                response['Content-Length'] = len(response.content)

        return response


class RateLimitMiddleware(MiddlewareMixin):
    RATE_LIMIT = 40         # max requests allowed
    WINDOW = 60             # in seconds (1 minute)
    BLOCK_TIME = 300        # in seconds (5 minutes)

    def process_request(self, request):
        ip = self.get_ip(request)

        if not ip:
            return None

        # Key names
        block_key = f"block:{ip}"
        req_key = f"req:{ip}"

        # Check if IP is blocked
        if cache.get(block_key):
            return JsonResponse(
                {"error": "Too many requests. You are blocked for 5 minutes."},
                status=429
            )

        # Track request count
        req_data = cache.get(req_key, {"count": 0, "start": time.time()})
        elapsed = time.time() - req_data["start"]

        if elapsed < self.WINDOW:
            req_data["count"] += 1
        else:
            # reset window
            req_data = {"count": 1, "start": time.time()}

        cache.set(req_key, req_data, timeout=self.WINDOW)

        # Check if limit exceeded
        if req_data["count"] > self.RATE_LIMIT:
            cache.set(block_key, True, timeout=self.BLOCK_TIME)
            return JsonResponse(
                {"error": "Too many requests. You are blocked for 5 minutes."},
                status=429
            )

        return None

    def get_ip(self, request):
        """Helper to extract client IP even behind reverse proxy."""
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR")
    
# class CustomErrorMiddleware(MiddlewareMixin):
#     def process_exception(self, request, exception):
#         # Here you could log the error if you want
#         return render(request, "htmls/access_denied.html", {"message": str(exception)}, status=500)




class PayloadSizeLimitMiddleware(MiddlewareMixin):
    """
    Middleware to reject requests with a payload larger than MAX_PAYLOAD_SIZE.
    """

    # Maximum allowed payload size in bytes (50MB here)
    MAX_PAYLOAD_SIZE = 50 * 1024 * 1024  # 50 MB

    def process_request(self, request):
        # Only check requests with body content
        if request.method in ("POST", "PUT", "PATCH"):
            content_length = request.META.get("CONTENT_LENGTH")
            if content_length:
                try:
                    content_length = int(content_length)
                except (ValueError, TypeError):
                    return JsonResponse(
                        {"error": "Invalid Content-Length header."},
                        status=400
                    )

                if content_length > self.MAX_PAYLOAD_SIZE:
                    return JsonResponse(
                        {"error": f"Payload too large. Maximum allowed is {self.MAX_PAYLOAD_SIZE / (1024*1024)} MB."},
                        status=413  # 413 Payload Too Large
                    )
        return None
    