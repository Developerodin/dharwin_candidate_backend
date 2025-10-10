import nodemailer from 'nodemailer';
import config from '../config/config.js';
import logger from '../config/logger.js';


const transport = nodemailer.createTransport(config.email.smtp);
/* istanbul ignore next */
if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch((error) => {
      logger.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env');
      logger.error('SMTP connection error:', error.message);
    });
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @param {string} html
 * @returns {Promise}
 */
const sendEmail = async (to, subject, text, html = null) => {
  try {
    const msg = { from: config.email.from, to, subject, text };
    if (html) {
      msg.html = html;
    }
    await transport.sendMail(msg);
    logger.info(`Email sent successfully to ${to}`);
  } catch (error) {
    logger.error('Failed to send email:', error.message);
    throw new Error('Failed to send email. Please check your SMTP configuration.');
  }
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {
  const subject = 'Reset password';
  const backendUrl = 'https://crm-apis.dharwinbusinesssolutions.com';
  const resetPasswordUrl = `${backendUrl}/reset-password?token=${token}`;
  const text = `Dear user,
To reset your password, click on this link: ${resetPasswordUrl}
If you did not request any password resets, then ignore this email.`;
  await sendEmail(to, subject, text);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token) => {
  const subject = 'Email Verification';
  const backendUrl = 'https://crm-apis.dharwinbusinesssolutions.com';
  const verificationEmailUrl = `${backendUrl}/verify-email?token=${token}`;
  const text = `Dear user,
To verify your email, click on this link: ${verificationEmailUrl}
If you did not create an account, then ignore this email.`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: #ffffff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                color: #2c3e50;
            }
            .content {
                margin-bottom: 30px;
            }
            .button {
                display: inline-block;
                padding: 12px 30px;
                background-color: #3498db;
                color: #ffffff;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                text-align: center;
                margin: 20px 0;
            }
            .button:hover {
                background-color: #2980b9;
            }
            .footer {
                text-align: center;
                font-size: 12px;
                color: #7f8c8d;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ecf0f1;
            }
            .warning {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                padding: 15px;
                border-radius: 5px;
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">
                    <img src="https://main.d17v4yz0vw03r0.amplifyapp.com/assets/images/company-logos/logo.jpeg" alt="Dharwin" class="logo-image">
                </div>
            </div>
            
            <div class="content">
                <h2>Welcome! Please verify your email address</h2>
                <p>Thank you for registering with us. To complete your registration and activate your account, please verify your email address by clicking the button below:</p>
                
                <div style="text-align: center;">
                    <a href="${verificationEmailUrl}" class="button">Verify Email Address</a>
                </div>
                
                <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">
                    ${verificationEmailUrl}
                </p>
                
                <div class="warning">
                    <strong>Important:</strong> This verification link will expire in 24 hours for security reasons.
                </div>
            </div>
            
            <div class="footer">
                <p>If you did not create an account with us, please ignore this email.</p>
                <p>This is an automated message, please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
  `;
  
  await sendEmail(to, subject, text, html);
};

/**
 * Send candidate invitation email
 * @param {string} to
 * @param {string} onboardUrl
 * @returns {Promise}
 */
const sendCandidateInvitationEmail = async (to, onboardUrl) => {
  const subject = 'You\'re Invited to Join Our Platform';
  const text = `Dear Candidate,
You have been invited to join our platform. Please complete your onboarding by clicking the link below:
${onboardUrl}

IMPORTANT: This invitation link will expire in 24 hours for security reasons. Please complete your onboarding as soon as possible.

If you have any questions, please contact our support team.

Best regards,
The Dharwin Team`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Candidate Invitation - Dharwin</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #1a202c;
                background-color: #f8fafc;
                margin: 0;
                padding: 20px;
            }
            
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                overflow: hidden;
            }
            
            .header {
                background: linear-gradient(135deg, #093464 0%, #0d4a7a 100%);
                padding: 40px 30px;
                text-align: center;
                position: relative;
            }
            
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
                opacity: 0.3;
            }
            
            .logo {
                position: relative;
                z-index: 1;
                margin-bottom: 8px;
            }
            
            .logo-image {
                max-height: 50px;
                max-width: 180px;
                width: auto;
                height: auto;
            }
            
            .tagline {
                color: rgba(255, 255, 255, 0.9);
                font-size: 16px;
                font-weight: 400;
                position: relative;
                z-index: 1;
            }
            
            .content {
                padding: 50px 40px;
            }
            
            .welcome-section {
                text-align: center;
                margin-bottom: 40px;
            }
            
            .welcome-icon {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #36af4c 0%, #2d8f3f 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
                font-size: 36px;
                color: white;
                box-shadow: 0 8px 25px rgba(54, 175, 76, 0.3);
            }
            
            h1 {
                color: #1a202c;
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 16px;
                letter-spacing: -0.5px;
            }
            
            .subtitle {
                color: #4a5568;
                font-size: 18px;
                margin-bottom: 30px;
            }
            
            .cta-section {
                text-align: center;
                margin: 40px 0;
            }
            
            .button {
                display: inline-block;
                padding: 18px 40px;
                background: linear-gradient(135deg, #36af4c 0%, #2d8f3f 100%);
                color: #ffffff;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                transition: all 0.3s ease;
                box-shadow: 0 4px 14px rgba(54, 175, 76, 0.3);
                border: none;
                cursor: pointer;
            }
            
            .button:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(54, 175, 76, 0.4);
                background: linear-gradient(135deg, #2d8f3f 0%, #27a745 100%);
            }
            
            .steps-section {
                background-color: #f8fafc;
                border-radius: 12px;
                padding: 30px;
                margin: 40px 0;
                border: 1px solid #e2e8f0;
            }
            
            .steps-title {
                color: #093464;
                font-size: 20px;
                font-weight: 600;
                margin-bottom: 20px;
                text-align: center;
            }
            
            .step {
                display: flex;
                align-items: center;
                margin: 16px 0;
                padding: 16px;
                background-color: white;
                border-radius: 8px;
                border-left: 4px solid #36af4c;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
            }
            
            .step-number {
                width: 32px;
                height: 32px;
                background: linear-gradient(135deg, #093464 0%, #0d4a7a 100%);
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 14px;
                margin-right: 16px;
                flex-shrink: 0;
            }
            
            .step-content {
                flex: 1;
            }
            
            .step-title {
                font-weight: 600;
                color: #1a202c;
                margin-bottom: 4px;
            }
            
            .step-description {
                color: #4a5568;
                font-size: 14px;
            }
            
            .highlight-box {
                background: linear-gradient(135deg, rgba(54, 175, 76, 0.1) 0%, rgba(9, 52, 100, 0.1) 100%);
                border: 1px solid rgba(54, 175, 76, 0.2);
                border-radius: 8px;
                padding: 20px;
                margin: 30px 0;
                text-align: center;
            }
            
            .highlight-icon {
                font-size: 24px;
                margin-bottom: 8px;
            }
            
            .highlight-text {
                color: #093464;
                font-weight: 600;
                font-size: 16px;
            }
            
            .security-note {
                background-color: #fef2f2;
                border: 1px solid #fecaca;
                border-radius: 8px;
                padding: 16px;
                margin: 30px 0;
                font-size: 14px;
                color: #dc2626;
                text-align: center;
            }
            
            .security-note::before {
                content: '🔒 ';
                margin-right: 8px;
            }
            
            .link-fallback {
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 16px;
                margin: 20px 0;
                font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
                font-size: 12px;
                color: #4a5568;
                word-break: break-all;
                text-align: center;
            }
            
            .footer {
                background-color: #f8fafc;
                padding: 30px 40px;
                border-top: 1px solid #e2e8f0;
                text-align: center;
            }
            
            .footer p {
                color: #64748b;
                font-size: 14px;
                margin-bottom: 8px;
            }
            
            .footer a {
                color: #093464;
                text-decoration: none;
                font-weight: 500;
            }
            
            .footer a:hover {
                color: #36af4c;
                text-decoration: underline;
            }
            
            .divider {
                height: 1px;
                background: linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%);
                margin: 30px 0;
            }
            
            @media (max-width: 640px) {
                .email-container {
                    margin: 10px;
                    border-radius: 8px;
                }
                
                .header {
                    padding: 30px 20px;
                }
                
                .content {
                    padding: 30px 20px;
                }
                
                .footer {
                    padding: 20px;
                }
                
                .logo-image {
                    max-height: 40px;
                    max-width: 140px;
                }
                
                h1 {
                    font-size: 24px;
                }
                
                .subtitle {
                    font-size: 16px;
                }
                
                .button {
                    padding: 16px 32px;
                    font-size: 15px;
                }
                
                .steps-section {
                    padding: 20px;
                }
                
                .step {
                    flex-direction: column;
                    text-align: center;
                }
                
                .step-number {
                    margin-right: 0;
                    margin-bottom: 12px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">
                    <img src="https://main.d17v4yz0vw03r0.amplifyapp.com/assets/images/company-logos/logo.jpeg" alt="Dharwin" class="logo-image">
                </div>
                <div class="tagline">Candidate Onboard Portal</div>
            </div>
            
            <div class="content">
                <div class="welcome-section">
                    <div class="welcome-icon">🎉</div>
                    <h1>Welcome to Dharwin!</h1>
                    <p class="subtitle">You've been invited to join our candidate management platform</p>
                </div>
                
                <p style="color: #4a5568; font-size: 16px; margin-bottom: 30px;">
                    Hello! We're excited to have you join our platform. You've been invited to complete your candidate profile and start your journey with us.
                </p>
                
                <div class="cta-section">
                    <a href="${onboardUrl}" class="button">Start Your Onboarding</a>
                </div>
                
                <div class="highlight-box">
                    <div class="highlight-icon">✨</div>
                    <div class="highlight-text">Complete your profile in just a few simple steps</div>
                </div>
                
                <div class="steps-section">
                    <h3 class="steps-title">📋 Your Onboarding Journey</h3>
                    
                    <div class="step">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <div class="step-title">Click the Onboarding Link</div>
                            <div class="step-description">Start by clicking the button above to access your personalized onboarding portal</div>
                        </div>
                    </div>
                    
                    <div class="step">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <div class="step-title">Complete Personal Information</div>
                            <div class="step-description">Fill in your contact details, professional summary, and basic information</div>
                        </div>
                    </div>
                    
                    <div class="step">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <div class="step-title">Upload Documents</div>
                            <div class="step-description">Upload your resume, cover letter, and any relevant certificates or portfolios</div>
                        </div>
                    </div>
                    
                    <div class="step">
                        <div class="step-number">4</div>
                        <div class="step-content">
                            <div class="step-title">Review & Submit</div>
                            <div class="step-description">Review all your information and submit your complete candidate profile</div>
                        </div>
                    </div>
                </div>
                
                <div class="security-note">
                    <strong>Important:</strong> This invitation link will expire in 24 hours for security reasons. Please complete your onboarding as soon as possible.
                </div>
                
                <p style="color: #4a5568; font-size: 16px; margin: 30px 0;">
                    If you have any questions or need assistance during the onboarding process, please don't hesitate to contact our support team. We're here to help!
                </p>
                
                <div class="link-fallback">
                    If the button doesn't work, copy and paste this link into your browser:<br>
                    ${onboardUrl}
                </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="footer">
                <p>This invitation was sent to you by our platform administrator.</p>
                <p>If you believe you received this email in error, please ignore it.</p>
                <p>© 2024 Dharwin. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
  
  await sendEmail(to, subject, text, html);
};

export {
  transport,
  sendEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendCandidateInvitationEmail,
};

