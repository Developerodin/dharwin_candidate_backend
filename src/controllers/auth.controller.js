import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import { createUser, getUserByEmail } from '../services/user.service.js';
import { createCandidate } from '../services/candidate.service.js';
import { generateAuthTokens,generateResetPasswordToken,generateVerifyEmailToken } from '../services/token.service.js';
import { loginUserWithEmailAndPassword,logout as logout2,refreshAuth,resetPassword as resetPassword2,verifyEmail as verifyEmail2  } from '../services/auth.service.js';
import { sendResetPasswordEmail,sendVerificationEmail as sendVerificationEmail2,sendCandidateInvitationEmail  } from '../services/email.service.js';
// import { authService, userService, tokenService, emailService } from '../services/index.js';
// import { authService, userService, tokenService, emailService } from '../services';


const register = catchAsync(async (req, res) => {
  const user = await createUser(req.body);
  const tokens = await generateAuthTokens(user);
  
  // If user role is "user", automatically create a candidate profile
  if (user.role === 'user') {
    // Calculate initial profile completion percentage
    // Basic info (name, email, phone) = 30%
    let completionPercentage = 30;
    
    const candidateData = {
      fullName: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      adminId: user.adminId, // Add adminId to candidate profile
      isProfileCompleted: completionPercentage,
    };
    
    await createCandidate(user._id, candidateData);
  }
  
  // Automatically send verification email after registration
  const verifyEmailToken = await generateVerifyEmailToken(user);
  await sendVerificationEmail2(user.email, verifyEmailToken);
  
  res.status(httpStatus.CREATED).send({ user, tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await loginUserWithEmailAndPassword(email, password);
  const tokens = await generateAuthTokens(user);
  res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  await logout2(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await generateResetPasswordToken(req.body.email);
  await sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  await resetPassword2(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await generateVerifyEmailToken(req.user);
  await sendVerificationEmail2(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await verifyEmail2(req.body.token);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendCandidateInvitation = catchAsync(async (req, res) => {
  const { email, onboardUrl, invitations } = req.body;
  
  // Check if it's a bulk invitation request
  if (invitations && Array.isArray(invitations)) {
    // Handle bulk invitations
    const results = {
      successful: [],
      failed: [],
      total: invitations.length
    };
    
    // Process invitations in parallel for better performance
    const emailPromises = invitations.map(async (invitation) => {
      try {
        await sendCandidateInvitationEmail(invitation.email, invitation.onboardUrl);
        results.successful.push({
          email: invitation.email,
          onboardUrl: invitation.onboardUrl
        });
      } catch (error) {
        results.failed.push({
          email: invitation.email,
          onboardUrl: invitation.onboardUrl,
          error: error.message
        });
      }
    });
    
    // Wait for all emails to be processed
    await Promise.allSettled(emailPromises);
    
    res.status(httpStatus.OK).json({
      message: `Bulk invitation processing completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
      results: results
    });
  } else {
    // Handle single invitation
    await sendCandidateInvitationEmail(email, onboardUrl);
    
    res.status(httpStatus.OK).json({
      message: 'Candidate invitation email sent successfully',
      email: email
    });
  }
});

export {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
  sendCandidateInvitation,
};
