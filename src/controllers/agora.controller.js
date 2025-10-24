import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import { generateRtcToken, generateRtcTokenWithAccount, generateMultipleRtcTokens } from '../services/agora.service.js';

/**
 * Generate a single Agora RTC token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generateToken = catchAsync(async (req, res) => {
  const { channelName, uid, account, role, expirationTimeInSeconds } = req.body;

  let tokenData;
  if (account) {
    tokenData = generateRtcTokenWithAccount(channelName, account, role, expirationTimeInSeconds);
  } else {
    tokenData = generateRtcToken(channelName, uid, role, expirationTimeInSeconds);
  }

  res.status(httpStatus.OK).json({
    success: true,
    data: tokenData,
    message: 'Agora token generated successfully',
  });
});

/**
 * Generate multiple Agora RTC tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generateMultipleTokens = catchAsync(async (req, res) => {
  const { users, expirationTimeInSeconds } = req.body;

  const tokens = generateMultipleRtcTokens(users, expirationTimeInSeconds);

  res.status(httpStatus.OK).json({
    success: true,
    data: {
      tokens,
      count: tokens.length,
    },
    message: 'Agora tokens generated successfully',
  });
});

/**
 * Get Agora configuration (App ID)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAgoraConfig = catchAsync(async (req, res) => {
  res.status(httpStatus.OK).json({
    success: true,
    data: {
      appId: process.env.AGORA_APP_ID,
    },
    message: 'Agora configuration retrieved successfully',
  });
});

export {
  generateToken,
  generateMultipleTokens,
  getAgoraConfig,
};
