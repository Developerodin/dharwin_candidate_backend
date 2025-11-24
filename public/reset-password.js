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
    const passwordInfoIcon = document.getElementById('passwordInfoIcon');
    const passwordRequirements = document.getElementById('passwordRequirements');
    const requirements = {
        length: document.getElementById('req-length'),
        letter: document.getElementById('req-letter'),
        number: document.getElementById('req-number')
    };
    
    // Tooltip functionality
    let tooltipTimeout;
    
    function showTooltip() {
        clearTimeout(tooltipTimeout);
        passwordRequirements.classList.add('show');
    }
    
    function hideTooltip() {
        tooltipTimeout = setTimeout(() => {
            passwordRequirements.classList.remove('show');
        }, 200);
    }
    
    // Show tooltip on hover or click
    passwordInfoIcon.addEventListener('mouseenter', showTooltip);
    passwordInfoIcon.addEventListener('mouseleave', hideTooltip);
    passwordInfoIcon.addEventListener('click', function(e) {
        e.preventDefault();
        if (passwordRequirements.classList.contains('show')) {
            hideTooltip();
        } else {
            showTooltip();
        }
    });
    
    // Keep tooltip open when hovering over it
    passwordRequirements.addEventListener('mouseenter', showTooltip);
    passwordRequirements.addEventListener('mouseleave', hideTooltip);
    
    // Hide tooltip when clicking outside
    document.addEventListener('click', function(e) {
        if (!passwordInfoIcon.contains(e.target) && !passwordRequirements.contains(e.target)) {
            hideTooltip();
        }
    });
    
    // Password visibility toggle
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const togglePasswordShow = document.getElementById('togglePasswordShow');
    const togglePasswordHide = document.getElementById('togglePasswordHide');
    const toggleConfirmPasswordShow = document.getElementById('toggleConfirmPasswordShow');
    const toggleConfirmPasswordHide = document.getElementById('toggleConfirmPasswordHide');
    
    function togglePasswordVisibility(input, showIcon, hideIcon) {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        
        if (isPassword) {
            // Show password - hide show icon, display hide icon
            showIcon.classList.add('hidden');
            hideIcon.classList.remove('hidden');
        } else {
            // Hide password - show show icon, hide hide icon
            showIcon.classList.remove('hidden');
            hideIcon.classList.add('hidden');
        }
    }
    
    togglePassword.addEventListener('click', function() {
        togglePasswordVisibility(passwordInput, togglePasswordShow, togglePasswordHide);
    });
    
    toggleConfirmPassword.addEventListener('click', function() {
        togglePasswordVisibility(confirmPasswordInput, toggleConfirmPasswordShow, toggleConfirmPasswordHide);
    });
    
    function validatePassword(password) {
        const hasLength = password.length >= 8;
        const hasLetter = /[a-zA-Z]/.test(password);
        const hasNumber = /\d/.test(password);
        
        // Update length requirement
        requirements.length.classList.toggle('valid', hasLength);
        requirements.length.classList.toggle('invalid', !hasLength);
        requirements.length.querySelector('.requirement-icon').textContent = hasLength ? '✅' : '❌';
        
        // Update letter requirement
        requirements.letter.classList.toggle('valid', hasLetter);
        requirements.letter.classList.toggle('invalid', !hasLetter);
        requirements.letter.querySelector('.requirement-icon').textContent = hasLetter ? '✅' : '❌';
        
        // Update number requirement
        requirements.number.classList.toggle('valid', hasNumber);
        requirements.number.classList.toggle('invalid', !hasNumber);
        requirements.number.querySelector('.requirement-icon').textContent = hasNumber ? '✅' : '❌';
        
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
