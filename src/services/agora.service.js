import pkg from 'agora-access-token';
const { RtcTokenBuilder, RtcRole } = pkg;
import config from '../config/config.js';
import ApiError from '../utils/ApiError.js';
import httpStatus from 'http-status';

/**
 * Generate Agora RTC token
 * @param {string} channelName - The channel name
 * @param {string} uid - User ID (0 for auto-generated)
 * @param {number} role - User role (1 for publisher, 2 for subscriber)
 * @param {number} expirationTimeInSeconds - Token expiration time in seconds (default: 3600)
 * @returns {Object} Token information
 */
const generateRtcToken = (channelName, uid, role = RtcRole.PUBLISHER, expirationTimeInSeconds = 3600) => {
  try {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      config.agora.appId,
      config.agora.appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs
    );

    return {
      token,
      channelName,
      uid,
      role,
      expirationTime: privilegeExpiredTs,
      appId: config.agora.appId,
    };
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to generate Agora token');
  }
};

/**
 * Generate Agora RTC token with account
 * @param {string} channelName - The channel name
 * @param {string} account - User account
 * @param {number} role - User role (1 for publisher, 2 for subscriber)
 * @param {number} expirationTimeInSeconds - Token expiration time in seconds (default: 3600)
 * @returns {Object} Token information
 */
const generateRtcTokenWithAccount = (channelName, account, role = RtcRole.PUBLISHER, expirationTimeInSeconds = 3600) => {
  try {
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithAccount(
      config.agora.appId,
      config.agora.appCertificate,
      channelName,
      account,
      role,
      privilegeExpiredTs
    );

    return {
      token,
      channelName,
      account,
      role,
      expirationTime: privilegeExpiredTs,
      appId: config.agora.appId,
    };
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to generate Agora token');
  }
};

/**
 * Generate multiple Agora RTC tokens for different users
 * @param {Array} users - Array of user objects with channelName, uid/account, role
 * @param {number} expirationTimeInSeconds - Token expiration time in seconds (default: 3600)
 * @returns {Array} Array of token information objects
 */
const generateMultipleRtcTokens = (users, expirationTimeInSeconds = 3600) => {
  try {
    const tokens = users.map(user => {
      if (user.account) {
        return generateRtcTokenWithAccount(
          user.channelName,
          user.account,
          user.role || RtcRole.PUBLISHER,
          expirationTimeInSeconds
        );
      } else {
        return generateRtcToken(
          user.channelName,
          user.uid,
          user.role || RtcRole.PUBLISHER,
          expirationTimeInSeconds
        );
      }
    });

    return tokens;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to generate Agora tokens');
  }
};

export {
  generateRtcToken,
  generateRtcTokenWithAccount,
  generateMultipleRtcTokens,
};
