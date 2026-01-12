import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import logger from '../config/logger.js';
import { createUser, getUserByEmail, updateUserById, deleteUserById } from '../services/user.service.js';
import { createCandidate } from '../services/candidate.service.js';
import { generateAuthTokens,generateResetPasswordToken,generateVerifyEmailToken } from '../services/token.service.js';
import { loginUserWithEmailAndPassword,logout as logout2,refreshAuth,resetPassword as resetPassword2,verifyEmail as verifyEmail2  } from '../services/auth.service.js';
import { sendResetPasswordEmail,sendVerificationEmail as sendVerificationEmail2,sendCandidateInvitationEmail,sendAdminRegistrationEmail  } from '../services/email.service.js';
import { createLoginLog } from '../services/loginLog.service.js';

// Helper function to get IP address from request
const getIpAddress = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip ||
         'Unknown';
};

// Helper function to get user agent from request
const getUserAgent = (req) => {
  return req.headers['user-agent'] || 'Unknown';
};
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
  
  // Create login log entry
  const ipAddress = getIpAddress(req);
  const userAgent = getUserAgent(req);
  const loginLog = await createLoginLog({
    user: user._id,
    email: user.email,
    role: user.role,
    ipAddress,
    userAgent,
  });
  
  // Generate tokens with login log ID
  const tokens = await generateAuthTokens(user, loginLog._id);
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

const registerSupervisor = catchAsync(async (req, res) => {
  const userData = {
    ...req.body,
    role: 'supervisor',
    isEmailVerified: true,
  };
  const user = await createUser(userData);
  
  res.status(httpStatus.CREATED).send({ user });
});

const registerRecruiter = catchAsync(async (req, res) => {
  const userData = {
    ...req.body,
    role: 'recruiter',
    isEmailVerified: true,
  };
  const user = await createUser(userData);
  
  res.status(httpStatus.CREATED).send({ user });
});

const registerUser = catchAsync(async (req, res) => {
  const userData = {
    ...req.body,
    role: 'admin',
    isEmailVerified: true,
  };
  
  // Store navigation structure if provided
  if (req.body.navigation) {
    userData.navigation = req.body.navigation;
  }
  
  const user = await createUser(userData);
  
  // Send email with login credentials
  try {
    await sendAdminRegistrationEmail(user.email, user.name, user.email, req.body.password);
  } catch (emailError) {
    // Log error but don't fail the registration
    logger.error('Failed to send admin registration email:', emailError.message);
  }
  
  res.status(httpStatus.CREATED).send({ user });
});

const updateRegisteredUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  
  // Exclude email and password from update
  const updateData = { ...req.body };
  delete updateData.email;
  delete updateData.password;
  
  const user = await updateUserById(userId, updateData);
  
  res.send(user);
});

const deleteRegisteredUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  
  await deleteUserById(userId);
  
  res.status(httpStatus.NO_CONTENT).send();
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
  registerSupervisor,
  registerRecruiter,
  registerUser,
  updateRegisteredUser,
  deleteRegisteredUser,
};
