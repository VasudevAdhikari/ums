document.addEventListener('DOMContentLoaded', function() {
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('emailError');
    const loginForm = document.getElementById('loginForm');
    const loginButton = document.getElementById('loginButton');
    const accountSuspended = document.getElementById('accountSuspended');
    const loginError = document.getElementById('loginError');

    // Initially hide all error messages
    emailError.style.display = 'none';
    accountSuspended.style.display = 'none';
    loginError.style.display = 'none';

    // Email validation on input
    emailInput.addEventListener('input', function() {
        const email = this.value.trim();
        if (email) {
            validateEmail(email);
        } else {
            emailError.style.display = 'none';
            accountSuspended.style.display = 'none';
            loginButton.disabled = true;
        }
    });

    function validateEmail(email) {
        fetch('/auth/check_email/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: JSON.stringify({ email: email })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Response data:', data);
            if (data.exists) {
                emailError.style.display = 'none';
                if (data.suspended) {
                    accountSuspended.style.display = 'block';
                    loginButton.disabled = true;
                } else {
                    accountSuspended.style.display = 'none';
                    loginButton.disabled = false;
                }
            } else {
                emailError.style.display = 'block';
                accountSuspended.style.display = 'none';
                loginButton.disabled = true;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            emailError.style.display = 'none';
            accountSuspended.style.display = 'none';
            loginButton.disabled = true;
        });
    }

    // Handle form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        fetch('/auth/login_submit/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                url = data.role=='student'? '/students/academics/home': data.role=='instructor'? '/faculty/': '/executives/dashboard/';
                window.location.href = url;
            } else {
                loginError.style.display = 'block';
                loginError.textContent = data.error || 'Login failed. Please try again.';
                
                if (data.attempts_remaining !== undefined) {
                    loginError.textContent += ` ${data.attempts_remaining} attempts remaining.`;
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            loginError.style.display = 'block';
            loginError.textContent = 'Unable to connect to the server. Please try again later.';
        });
    });
}); 