# Email Configuration Guide

## Overview
This application supports email functionality for:
- **Automatic email verification** for new user accounts (sent immediately after registration)
- Password reset emails
- General email notifications

## Required Environment Variables

Add these variables to your `.env` file:

```env
# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

## SMTP Provider Setup

### Gmail Setup
1. Enable 2-factor authentication on your Google account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. Use the app password (not your regular password) in `SMTP_PASSWORD`

### Other Providers

#### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

#### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
```

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USERNAME=your-mailgun-username
SMTP_PASSWORD=your-mailgun-password
```

## Testing Email Functionality

### 1. Check SMTP Connection
When you start the application, check the logs for:
- ✅ `Connected to email server` - SMTP is working
- ❌ `Unable to connect to email server` - Check your SMTP configuration

### 2. Test Email Verification
1. Register a new user - verification email is sent automatically
2. Check your email for the verification link
3. **Two ways to verify:**
   - **Option A**: Click the frontend link and implement verification in your frontend app
   - **Option B**: Click the direct API link to verify immediately
4. (Optional) You can also manually request verification email by calling `POST /v1/auth/send-verification-email` with Bearer token

#### Frontend Implementation
Your frontend should handle the verification token:
```javascript
// Extract token from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

// Call backend API to verify
fetch(`http://localhost:3000/v1/auth/verify-email?token=${token}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(response => {
  if (response.ok) {
    alert('Email verified successfully!');
  } else {
    alert('Email verification failed');
  }
});
```

### 3. Test Password Reset
1. Call `POST /v1/auth/forgot-password` with an email address
2. Check your email for the reset link

## Troubleshooting

### Common Issues

1. **"Unable to connect to email server"**
   - Verify SMTP credentials are correct