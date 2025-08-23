// Global state variables
let currentAction = null;
let pendingAction = null;

// Global DOM element references (will be set when DOM loads)
let profileFieldsView, profileFieldsEdit, viewActions, editActions, profileName, profilePicture, profilePictureInput;
let passwordModal, changePasswordModal, confirmationModal;

// Password verification for actions
function requestPasswordForAction(action) {
    currentAction = action;
    document.getElementById('passwordInput').value = '';
    document.getElementById('passwordError').textContent = '';
    document.getElementById('passwordModal').style.display = 'block';
}

async function verifyPassword() {
    const password = document.getElementById('passwordInput').value;
    const errorElement = document.getElementById('passwordError');

    if (!password) {
        errorElement.textContent = 'Please enter your password';
        return;
    }

    try {
        const response = await fetch(`/auth/profile/check_pwd/${window.userId}/${encodeURIComponent(password)}/`);
        const data = await response.json();

        if (data.success) {
            closePasswordModal();
            enableEdit();
            document.getElementById('profilePictureInput').click();
        } else {
            errorElement.textContent = 'Incorrect password';
        }
    } catch (error) {
        errorElement.textContent = 'Failed to verify password';
    }
}

function closePasswordModal() {
    document.getElementById('passwordModal').style.display = 'none';
    currentAction = null;
}

// Enable Edit Mode
function enableEdit() {
    console.log('Enabling edit mode...'); // Debug log
    document.getElementById('profileFieldsView').classList.add('hidden');
    document.getElementById('profileFieldsEdit').classList.remove('hidden');
    document.getElementById('viewActions').classList.add('hidden');
    document.getElementById('editActions').classList.remove('hidden');
    // Enable all input fields
    const inputs = document.querySelectorAll('#profileFieldsEdit input');
    inputs.forEach(input => {
        input.disabled = false;
        console.log('Enabled input:', input.id); // Debug log
    });
    if (!window.editable) {
        document.getElementById('fullNameInput').disabled = true;
        document.getElementById('emailInput').disabled = true;
        document.getElementById('outlookInput').disabled = true;
    }
}

// Cancel Edit
function cancelEdit() {
    document.getElementById('profileFieldsEdit').classList.add('hidden');
    document.getElementById('profileFieldsView').classList.remove('hidden');
    document.getElementById('editActions').classList.add('hidden');
    document.getElementById('viewActions').classList.remove('hidden');
    
    // Disable all input fields
    const inputs = document.querySelectorAll('#profileFieldsEdit input');
    inputs.forEach(input => input.disabled = true);
    
    // Reset form values
    document.getElementById('fullNameInput').value = document.getElementById('fullNameValue').textContent;
    document.getElementById('emailInput').value = document.getElementById('emailValue').textContent;
    document.getElementById('outlookInput').value = document.getElementById('outlookValue').textContent;
    document.getElementById('phoneInput').value = document.getElementById('phoneValue').textContent;
    document.getElementById('telegramInput').value = document.getElementById('telegramValue').textContent;
    document.getElementById('cityInput').value = document.getElementById('cityValue').textContent;
}

// Confirm Save Profile
function confirmSaveProfile() {
    showConfirmationModal(
        'Save Profile Changes',
        'Are you sure you want to save these profile changes?',
        saveProfile
    );
}

// Save Profile
async function saveProfile() {
    const profileData = {
        name: document.getElementById('fullNameInput').value,
        email: document.getElementById('emailInput').value,
        outlook_mail: document.getElementById('outlookInput').value,
        phone: document.getElementById('phoneInput').value,
        telegram_username: document.getElementById('telegramInput').value,
        city: document.getElementById('cityInput').value,
    };

    try {
        const response = await fetch(`/auth/profile/save/${window.userId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': window.CSRFToken,
            },
            body: JSON.stringify(profileData)
        });

        const data = await response.json();
        
        if (data.success) {
            // Update display values
            document.getElementById('fullNameValue').textContent = profileData.name;
            document.getElementById('emailValue').textContent = profileData.email;
            document.getElementById('outlookValue').textContent = profileData.outlook_mail;
            document.getElementById('phoneValue').textContent = profileData.phone;
            document.getElementById('telegramValue').textContent = profileData.telegram_username;
            document.getElementById('cityValue').textContent = profileData.city;
            document.getElementById('profileName').textContent = profileData.name;
            
            // Switch back to view mode
            cancelEdit();
            await alert("Profile Updated Successfully");
            window.location.reload();
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Failed to update profile', 'error');
    }
}

// Password Change Functions
function showPasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'block';
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('changePasswordError').textContent = '';
}

function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'none';
}

async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorElement = document.getElementById('changePasswordError');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        errorElement.textContent = 'All fields are required';
        return;
    }

    if (newPassword.length < 8) {
        errorElement.textContent = 'New password must be at least 8 characters long';
        return;
    }

    if (newPassword !== confirmPassword) {
        errorElement.textContent = 'New passwords do not match';
        return;
    }

    try {
        const response = await fetch(`/auth/profile/change_password/${window.userId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': window.CSRFToken,
            },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });

        const data = await response.json();
        
        if (data.success) {
            closeChangePasswordModal();
            await alert('Password changed successfully');
        } else {
            errorElement.textContent = data.error;
        }
    } catch (error) {
        errorElement.textContent = 'Failed to change password';
    }
}

// Confirmation Modal Functions
function showConfirmationModal(title, message, action) {
    document.getElementById('confirmationTitle').textContent = title;
    document.getElementById('confirmationMessage').textContent = message;
    pendingAction = action;
    document.getElementById('confirmationModal').style.display = 'block';
}

function closeConfirmationModal() {
    document.getElementById('confirmationModal').style.display = 'none';
    pendingAction = null;
}

function executeConfirmedAction() {
    if (pendingAction) {
        pendingAction();
    }
    closeConfirmationModal();
}

// Utility Functions
function showMessage(message, type) {
    // Create a temporary message element
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 500;
        z-index: 1001;
        animation: slideIn 0.3s ease;
        background: ${type === 'success' ? 'var(--success)' : 'var(--error)'};
        max-width: 300px;
        word-wrap: break-word;
    `;

    document.body.appendChild(messageElement);

    // Remove after 3 seconds
    setTimeout(() => {
        messageElement.remove();
    }, 3000);
}

// Wait for DOM to be fully loaded before setting up event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Set up DOM element references
    profileFieldsView = document.getElementById('profileFieldsView');
    profileFieldsEdit = document.getElementById('profileFieldsEdit');
    viewActions = document.getElementById('viewActions');
    editActions = document.getElementById('editActions');
    profileName = document.getElementById('profileName');
    profilePicture = document.getElementById('profilePicture');
    profilePictureInput = document.getElementById('profilePictureInput');
    passwordModal = document.getElementById('passwordModal');
    changePasswordModal = document.getElementById('changePasswordModal');
    confirmationModal = document.getElementById('confirmationModal');

    // Profile Picture Upload
    profilePictureInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            showConfirmationModal(
                'Upload Profile Picture',
                'Are you sure you want to upload this profile picture?',
                () => uploadProfilePicture(file)
            );
        }
    });

    // Close modals when clicking outside
    window.onclick = function(event) {
        if (event.target === passwordModal) {
            closePasswordModal();
        }
        if (event.target === changePasswordModal) {
            closeChangePasswordModal();
        }
        if (event.target === confirmationModal) {
            closeConfirmationModal();
        }
    }

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    document.getElementById('logoutBtn').addEventListener('click', async () => {
        if (! await confirm('Are you sure to log out')) return;
        window.location.href = `/auth/logout/`;
    })
});

// Profile Picture Upload Function
async function uploadProfilePicture(file) {
    const formData = new FormData();
    formData.append('profile_picture', file);

    try {
        const response = await fetch(`/auth/profile/upload_picture/${window.userId}/`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (data.success) {
            document.getElementById('profilePicture').src = data.profile_picture_url;
            await alert('Profile Picture Updated Successfully');
            window.location.reload();
        } else {
            showMessage(data.error, 'error');
        }
    } catch (error) {
        showMessage('Failed to upload profile picture', 'error');
    }
}