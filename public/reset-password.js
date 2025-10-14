// Reset Password Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (!token) {
        showError('Invalid or missing reset token. Please request a new password reset.');
        document.getElementById('resetPasswordForm').style.display = 'none';
        return;
    }
    
    // Password validation
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const requirements = {
        length: document.getElementById('req-length'),
        letter: document.getElementById('req-letter'),
        number: document.getElementById('req-number')
    };
    
    function validatePassword(password) {
        const hasLength = password.length >= 8;
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        
        requirements.length.classList.toggle('valid', hasLength);
        requirements.length.classList.toggle('invalid', !hasLength);
        requirements.letter.classList.toggle('valid', hasLetter);
        requirements.letter.classList.toggle('invalid', !hasLetter);
        requirements.number.classList.toggle('valid', hasNumber);
        requirements.number.classList.toggle('invalid', !hasNumber);
        
        return hasLength && hasLetter && hasNumber;
    }
    
    function validateConfirmPassword() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (confirmPassword && password !== confirmPassword) {
            confirmPasswordInput.setCustomValidity('Passwords do not match');
            return false;
        } else {
            confirmPasswordInput.setCustomValidity('');
            return true;
        }
    }
    
    passwordInput.addEventListener('input', function() {
        validatePassword(this.value);
    });
    
    confirmPasswordInput.addEventListener('input', validateConfirmPassword);
    
    function showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        document.getElementById('successMessage').style.display = 'none';
    }
    
    function showSuccess(message) {
        const successDiv = document.getElementById('successMessage');
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        document.getElementById('errorMessage').style.display = 'none';
    }
    
    function showLoading() {
        document.getElementById('submitButton').style.display = 'none';
        document.getElementById('loading').style.display = 'block';
    }
    
    function hideLoading() {
        document.getElementById('submitButton').style.display = 'block';
        document.getElementById('loading').style.display = 'none';
    }
    
    // Form submission
    document.getElementById('resetPasswordForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Validate password
        if (!validatePassword(password)) {
            showError('Please ensure your password meets all requirements.');
            return;
        }
        
        // Validate password match
        if (password !== confirmPassword) {
            showError('Passwords do not match.');
            return;
        }
        
        showLoading();
        
        try {
            const response = await fetch('/v1/auth/reset-password?token=' + encodeURIComponent(token), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    password: password
                })
            });
            
            if (response.ok) {
                showSuccess('Password reset successfully! You can now login with your new password.');
                document.getElementById('resetPasswordForm').style.display = 'none';
            } else {
                const errorData = await response.json();
                showError(errorData.message || 'Password reset failed. Please try again.');
            }
        } catch (error) {
            showError('Network error. Please check your connection and try again.');
        } finally {
            hideLoading();
        }
    });
});
