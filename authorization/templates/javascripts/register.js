// Email validation
function validateEmail(input) {
    if (!input.value) {
      return true;
    } // Optional field
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail|yahoo|hotmail|outlook|aol|[a-zA-Z0-9.-]+)\.(com|net|org|jp|de|uk|fr|br|it|ru|es|th|io|xyz)$/;
    const errorElement = document.getElementById('emailError');
    const verifyButton = document.getElementById('verifyButton');
    
    if (!emailRegex.test(input.value)) {
        input.classList.add('invalid-input');
        input.classList.remove('valid-input');
        errorElement.style.display = 'block';
        verifyButton.disabled = true;
        return false;
    } else {
        input.classList.add('valid-input');
        input.classList.remove('invalid-input');
        errorElement.style.display = 'none';
        verifyButton.disabled = false;
        return true;
    }
}

// OTP validation
function validateOTP(input) {
    const otpRegex = /^\d{6}$/;
    if (!otpRegex.test(input.value)) {
        input.classList.add('invalid-input');
        input.classList.remove('valid-input');
        return false;
    } else {
        document.getElementById('verifyButton1').disabled = false;
        return true;
    }
}

// Phone validation
function validatePhone(input) {
    if (!input.value) {
      return true;
    } // Optional field
    const phoneRegex = /^(?=.*[0-9])[\d+\s-]{10,}$/;
    const errorElement = document.getElementById('phoneError');
    
    if (!phoneRegex.test(input.value)) {
        input.classList.add('invalid-input');
        input.classList.remove('valid-input');
        errorElement.style.display = 'block';
        errorElement.textContent = 'Please enter a valid phone number (minimum 10 digits, may include +, spaces, or hyphens)';
        return false;
    } else {
        input.classList.add('valid-input');
        input.classList.remove('invalid-input');
        errorElement.style.display = 'none';
        return true;
    }
}

// Password validation
function validatePassword(input) {
    const password = input.value;
    const errorElement = document.getElementById('passwordError');
    const strengthBar = document.getElementById('passwordStrength');
    
    // Reset classes
    strengthBar.className = 'password-strength';
    
    if (password.length < 8) {
        input.classList.add('invalid-input');
        input.classList.remove('valid-input');
        errorElement.style.display = 'block';
        return false;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;

    if (strength <= 2) {
        strengthBar.classList.add('strength-weak');
    } else if (strength <= 4) {
        strengthBar.classList.add('strength-medium');
    } else {
        strengthBar.classList.add('strength-strong');
    }

    input.classList.add('valid-input');
    input.classList.remove('invalid-input');
    errorElement.style.display = 'none';
    return true;
}

// Telegram username validation
function validateTelegramUsername(input) {
    const telegramRegex = /^@[a-zA-Z0-9_]+$/;
    const errorElement = document.getElementById('telegramError');
    if (!telegramRegex.test(input.value)) {
        input.classList.add('invalid-input');
        input.classList.remove('valid-input');
        errorElement.style.display = 'block';
        return false;
    } else {
        input.classList.add('valid-input');
        input.classList.remove('invalid-input');
        errorElement.style.display = 'none';
        return true;
    }
}

// Outlook email validation
function validateOutlookEmail(input) {
    if (!input.value) return true; // Optional field
    const outlookRegex = /^[^\s@]+@[^\s@]+\.edu\.mm$/i;
    const errorElement = document.getElementById('outlookError');
    errorElement.style.display = 'none';
    input.classList.add('valid-input');
    input.classList.remove('invalid-input');
    return true;
}

// Emergency contact name validation
function validateContactName(input) {
    const nameRegex = /^[a-zA-Z\s]{2,}$/;
    const errorElement = document.getElementById('contactNameError');
    if (!nameRegex.test(input.value)) {
        input.classList.add('invalid-input');
        input.classList.remove('valid-input');
        errorElement.style.display = 'block';
        return false;
    } else {
        input.classList.add('valid-input');
        input.classList.remove('invalid-input');
        errorElement.style.display = 'none';
        return true;
    }
}

// Emergency contact phone validation
function validateContactPhone(input) {
    return validatePhone(input); // Reuse phone validation
}

// Emergency contact email validation
function validateContactEmail(input) {
    return validateEmail(input); // Reuse email validation
}

// Form validation
function validateForm() {
    const emailValid = validateEmail(document.getElementById('email'));
    const otpValid = validateOTP(document.getElementById('otp'));
    const phoneValid = validatePhone(document.getElementById('phone'));
    const passwordValid = validatePassword(document.getElementById('password'));
    const telegramValid = validateTelegramUsername(document.getElementById('telegram_username'));
    const outlookValid = validateOutlookEmail(document.getElementById('outlook_email'));
    const contactNameValid = validateContactName(document.getElementById('emergency_name'));
    const contactPhoneValid = validateContactPhone(document.getElementById('emergency_phone'));
    const contactEmailValid = validateContactEmail(document.getElementById('emergency_email'));

    const submitButton = document.getElementById('submitButton');
    submitButton.disabled = !(emailValid && otpValid && phoneValid && passwordValid && telegramValid && 
                            outlookValid && contactNameValid && contactPhoneValid && contactEmailValid);
}

// Image preview function
function previewImage(input) {
    const preview = document.getElementById('preview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// Function to enable/disable all inputs except email
function toggleInputs(enable) {
    const inputs = document.querySelectorAll('input:not(#email)');
    inputs.forEach(input => {
        input.disabled = !enable;
    });
}

// Function to verify email
async function verifyEmail() {
    const email = document.getElementById('email').value;
    const emailError = document.getElementById('emailError');
    
    if (!email) {
        emailError.textContent = 'Email is required';
        emailError.style.display = 'block';
        return;
    }
    
    try {
        const response = await fetch('/auth/verify_mail/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: JSON.stringify({ email: email })
        });
        
        const data = await response.json();
        console.log(data);
        
        if (data.success) {
            // Show success message
            await alert(data.message);
            // Disable email field and show OTP section
            document.getElementById('email').disabled = true;
            document.getElementById('otp').disabled = false;  // Enable OTP input
            document.getElementById('otp').focus();
            emailError.style.display = 'none';
            
            // Enable the OTP verify button
            document.getElementById('verifyButton1').disabled = false;
        } else {
            // Show error message
            emailError.textContent = data.message;
            emailError.style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
        await alert('An error occurred while verifying email');
        emailError.textContent = 'An error occurred while verifying email';
        emailError.style.display = 'block';
    }
}

// function to verify OTP
function verifyOTP() {
    const otp = document.getElementById('otp').value;
    const email = document.getElementById('email').value;
    
    // Make AJAX request to verify email
    fetch('/auth/verify_otp/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        },
        body: JSON.stringify({ otp: otp, email: email})
    })
    .then(response => response.json())
    .then(async data => {
        if (data.verified) {
            toggleInputs(true);
            await alert('OTP verification successful. You can fill the other information now');
            document.getElementById('otp-group').style.display = 'none';
        } else {
            await alert('OTP verification failed. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Image compression function
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(blob => {
                if (blob) {
                    resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                } else {
                    reject(new Error('Compression failed'));
                }
            }, 'image/jpeg', 0.7);
        };
        img.onerror = reject;
    });
}

// Terms and Conditions Modal Functionality
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registerForm');
    const agreeButton = document.getElementById('agreeButton');
    const termsModal = new bootstrap.Modal(document.getElementById('termsModal'));
    let countdownInterval;

    // Prevent form submission and show modal
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        startTermsCountdown();
        termsModal.show();
    });

    // Handle agree button click
    agreeButton.addEventListener('click', async function() {
        const fileInput = document.getElementById('profile_picture');
        const file = fileInput.files[0];
        let compressedFile = null;
        const email = document.getElementById('email').value;  // Get email value

        if (file) {
            try {
                compressedFile = await compressImage(file);
            } catch (error) {
                console.error('Image compression failed:', error);
                await alert('Failed to compress image. Please try again.');
                return;
            }
        }

        // Create FormData object
        const formData = new FormData(form);
        if (compressedFile) {
            formData.set('profile_picture', compressedFile);
        }
        formData.set('email', email);  // Explicitly set email value
        console.log('FormData:', Object.fromEntries(formData.entries()));  // Better logging

        // First save emergency contact
        const emergencyData = {
            name: formData.get('emergency_name'),
            phone: formData.get('emergency_phone'),
            email: formData.get('emergency_email')
        };

        console.log(formData);

        try {
            // Save emergency contact
            const emergencyResponse = await fetch('/auth/save_emergency_contact/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                },
                body: JSON.stringify(emergencyData)
            });

            const emergencyResult = await emergencyResponse.json();
            console.log('Emergency Response:', emergencyResult);
            
            if (!emergencyResult.success) {
                throw new Error(emergencyResult.error || 'Failed to save emergency contact');
            }

            // Add emergency contact ID to student data
            formData.append('emergency_contact_id', emergencyResult.emergency_id);

            // Now save student data
            const studentResponse = await fetch('/auth/save_student/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                },
                body: formData
            });

            const studentResult = await studentResponse.json();
            console.log('Student Response:', studentResult);
            if (studentResult.success) {
                termsModal.hide();
                window.location.href = '/auth/login/';
            } else {
                throw new Error(studentResult.error || 'Failed to save student information');
            }
        } catch (error) {
            console.error('Registration failed:', error);
            await alert('Registration failed: ' + error.message);
        }
    });

    // Handle modal close/cancel
    document.getElementById('termsModal').addEventListener('hidden.bs.modal', function () {
        stopTermsCountdown();
        agreeButton.disabled = true;
        document.getElementById('countdown').textContent = '10';
    });

    function startTermsCountdown() {
        let seconds = 3;
        const countdownElement = document.getElementById('countdown');
        agreeButton.disabled = true;

        countdownInterval = setInterval(function() {
            seconds--;
            countdownElement.textContent = seconds;

            if (seconds <= 0) {
                stopTermsCountdown();
                agreeButton.disabled = false;
            }
        }, 1000);
    }

    function stopTermsCountdown() {
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
        }
    }
});

// Add event listeners when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners for real-time validation
    document.getElementById('email').addEventListener('input', () => validateForm());
    document.getElementById('otp').addEventListener('input', () => validateForm());
    document.getElementById('phone').addEventListener('input', () => validateForm());
    document.getElementById('password').addEventListener('input', () => validateForm());
    document.getElementById('telegram_username').addEventListener('input', () => validateForm());
    document.getElementById('outlook_email').addEventListener('input', () => validateForm());
    document.getElementById('emergency_name').addEventListener('input', () => validateForm());
    document.getElementById('emergency_phone').addEventListener('input', () => validateForm());
    document.getElementById('emergency_email').addEventListener('input', () => validateForm());
    
    // Add click event listener for verify button
    document.getElementById('verifyButton').addEventListener('click', verifyEmail);
    document.getElementById('verifyButton1').addEventListener('click', verifyOTP);
    
    // Initially disable all inputs except email
    toggleInputs(false);
    if (localStorage.getItem('role') == 'student') {
        document.getElementById('instructor-role').style.display = 'none';
        document.getElementById('degree-input').innerHTML = '';
        document.getElementById('specialization-input').innerHTML = '';
    } else if (localStorage.getItem('role') == 'instructor') {
        document.getElementById('student-role').style.display = 'none';
        document.getElementById('role').value = 'instructor';
    }
}); 