// Email Verification Script
// Get the token from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (!token) {
    showError('No verification token provided', 'Please check your email and click the verification link again.');
} else {
    // Verify the email
    verifyEmail(token);
}

async function verifyEmail(token) {
    try {
        const response = await fetch('/v1/auth/verify-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: token })
        });
        
        if (response.ok) {
            showSuccess();
        } else {
            const errorData = await response.json();
            showError('Verification failed', errorData.message || 'An error occurred during verification.');
        }
    } catch (error) {
        showError('Network error', 'Unable to connect to the server. Please check your internet connection and try again.');
    }
}

function showSuccess() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('success').style.display = 'flex';
    document.getElementById('title').textContent = 'Email Verified Successfully!';
    document.getElementById('message').textContent = 'Your email has been verified successfully. Redirecting to login...';
    document.getElementById('actions').style.display = 'block';
    
    // Auto-redirect to frontend after 3 seconds
    setTimeout(() => {
        window.location.href = 'http://localhost:3001/';
    }, 3000);
}

function showError(title, message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'flex';
    document.getElementById('title').textContent = title;
    document.getElementById('message').textContent = message;
    document.getElementById('error-details').textContent = `Token: ${token}`;
    document.getElementById('error-details').style.display = 'block';
}
