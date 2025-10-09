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
  const frontendUrl = config.frontendUrl;
  const resetPasswordUrl = `${frontendUrl}/reset-password?token=${token}`;
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
  const frontendUrl = config.frontendUrl;
  const verificationEmailUrl = `${frontendUrl}/verify-email?token=${token}`;
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
                <div class="logo">Dharwin</div>
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
        <title>Candidate Invitation</title>
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
                padding: 15px 40px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #ffffff;
                text-decoration: none;
                border-radius: 25px;
                font-weight: bold;
                text-align: center;
                margin: 20px 0;
                font-size: 16px;
            }
            .button:hover {
                background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
            }
            .footer {
                text-align: center;
                font-size: 12px;
                color: #7f8c8d;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #ecf0f1;
            }
            .highlight {
                background-color: #e8f4fd;
                border-left: 4px solid #3498db;
                padding: 15px;
                margin: 20px 0;
                border-radius: 5px;
            }
            .steps {
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .step {
                margin: 10px 0;
                padding: 10px;
                background-color: white;
                border-radius: 5px;
                border-left: 3px solid #3498db;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">Dharwin</div>
            </div>
            
            <div class="content">
                <h2>Welcome! You're Invited to Join Our Platform</h2>
                <p>Hello there!</p>
                <p>You have been invited to join our platform and complete your candidate profile. We're excited to have you on board!</p>
                
                <div class="highlight">
                    <strong>🎉 What's Next?</strong><br>
                    Click the button below to start your onboarding process and create your candidate profile.
                </div>
                
                <div style="text-align: center;">
                    <a href="${onboardUrl}" class="button">Start Onboarding</a>
                </div>
                
                <div class="steps">
                    <h3>📋 Onboarding Steps:</h3>
                    <div class="step">
                        <strong>Step 1:</strong> Click the onboarding link above
                    </div>
                    <div class="step">
                        <strong>Step 2:</strong> Complete your personal information
                    </div>
                    <div class="step">
                        <strong>Step 3:</strong> Upload your resume and documents
                    </div>
                    <div class="step">
                        <strong>Step 4:</strong> Review and submit your profile
                    </div>
                </div>
                
                <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">
                    ${onboardUrl}
                </p>
                
                <div class="highlight">
                    <strong>⏰ Important:</strong> This invitation link will expire in 24 hours for security reasons. Please complete your onboarding as soon as possible.
                </div>
                
                <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            </div>
            
            <div class="footer">
                <p>This invitation was sent to you by our platform administrator.</p>
                <p>If you believe you received this email in error, please ignore it.</p>
                <p>This is an automated message, please do not reply to this email.</p>
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

