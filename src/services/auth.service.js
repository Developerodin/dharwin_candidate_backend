import httpStatus from 'http-status';
import {verifyToken,generateAuthTokens} from './token.service.js';
import {getUserByEmail,getUserById,updateUserById} from './user.service.js';
import Token from '../models/token.model.js';
import ApiError from '../utils/ApiError.js';
import { tokenTypes } from '../config/tokens.js';
import { updateLogoutTime } from './loginLog.service.js';
import logger from '../config/logger.js';
import Candidate from '../models/candidate.model.js';

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await getUserByEmail(email);
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  
  // Check if email is verified
  // Allow supervisors and recruiters to login without email verification (they are created by admin)
  const allowedRolesWithoutVerification = ['supervisor', 'recruiter', 'admin'];
  if (!user.isEmailVerified && !allowedRolesWithoutVerification.includes(user.role)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Please verify your email before logging in. Check your inbox for the verification link.');
  }
  
  // Check if candidate is active (not resigned) - only for users with role 'user'
  if (user.role === 'user') {
    const candidate = await Candidate.findOne({ email: user.email });
    if (candidate) {
      // Check if candidate has resign date that is today or in the past
      if (candidate.resignDate) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const resignDate = new Date(candidate.resignDate);
        resignDate.setHours(0, 0, 0, 0);
        
        // If resign date is today or in the past, candidate is inactive
        if (resignDate <= now) {
          throw new ApiError(
            httpStatus.FORBIDDEN,
            'Your account has been deactivated. Please contact your administrator for assistance.'
          );
        }
        // If resign date is in the future, candidate can still login
      } else if (!candidate.isActive) {
        // If isActive is false for other reasons, block login
        throw new ApiError(
          httpStatus.FORBIDDEN,
          'Your account has been deactivated. Please contact your administrator for assistance.'
        );
      }
    }
  }
  
  return user;
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise}
 */
const logout = async (refreshToken) => {
  const refreshTokenDoc = await Token.findOne({ token: refreshToken, type: tokenTypes.REFRESH, blacklisted: false });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
  }
  
  // Update logout time in login log if loginLogId exists
  if (refreshTokenDoc.loginLogId) {
    try {
      await updateLogoutTime(refreshTokenDoc.loginLogId);
    } catch (error) {
      // Log error but don't fail logout if login log update fails
      logger.error('Error updating login log logout time:', error);
    }
  }
  
  await refreshTokenDoc.remove();
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuth = async (refreshToken) => {
  try {
    const refreshTokenDoc = await verifyToken(refreshToken, tokenTypes.REFRESH);
    const user = await getUserById(refreshTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await refreshTokenDoc.remove();
    return generateAuthTokens(user);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise}
 */
const resetPassword = async (resetPasswordToken, newPassword) => {
  try {
    const resetPasswordTokenDoc = await verifyToken(resetPasswordToken, tokenTypes.RESET_PASSWORD);
    const user = await getUserById(resetPasswordTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await updateUserById(user.id, { password: newPassword });
    await Token.deleteMany({ user: user.id, type: tokenTypes.RESET_PASSWORD });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed');
  }
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise}
 */
const verifyEmail = async (verifyEmailToken) => {
  try {
    const verifyEmailTokenDoc = await verifyToken(verifyEmailToken, tokenTypes.VERIFY_EMAIL);
    const user = await getUserById(verifyEmailTokenDoc.user);
    if (!user) {
      throw new Error();
    }
    await Token.deleteMany({ user: user.id, type: tokenTypes.VERIFY_EMAIL });
    await updateUserById(user.id, { isEmailVerified: true });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed');
  }
};

export {
  loginUserWithEmailAndPassword,
  logout,
  refreshAuth,
  resetPassword,
  verifyEmail,
};

