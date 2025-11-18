import httpStatus from 'http-status';
import Meeting from '../models/meeting.model.js';
import ApiError from '../utils/ApiError.js';
import pkg from 'agora-access-token';
const { RtcTokenBuilder, RtcRole } = pkg;
import config from '../config/config.js';
import { sendMeetingInvitationEmail } from './email.service.js';
import logger from '../config/logger.js';

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
 * Create a new meeting
 * @param {Object} meetingData - Meeting data
 * @param {string} userId - User ID who created the meeting
 * @returns {Promise<Meeting>}
 */
const createMeeting = async (meetingData, userId) => {
  const { host, hosts, ...rest } = meetingData || {};
  const normalizedHosts = [];
  if (host && host.email) {
    normalizedHosts.push({ name: host.name, email: String(host.email).toLowerCase() });
  }
  if (Array.isArray(hosts)) {
    for (const h of hosts) {
      if (h && h.email) {
        normalizedHosts.push({ name: h.name, email: String(h.email).toLowerCase() });
      }
    }
  }
  const meeting = await Meeting.create({
    ...rest,
    createdBy: userId,
    ...(normalizedHosts.length
      ? {
          hostParticipants: normalizedHosts.map((h) => ({
            name: h.name,
            email: h.email,
            role: 'host',
            joinedAt: undefined,
            isActive: false,
          })),
        }
      : {}),
  });
  
  return meeting;
};

/**
 * Get meeting by ID
 * @param {string} meetingId - Meeting ID
 * @returns {Promise<Meeting>}
 */
const getMeetingById = async (meetingId) => {
  const meeting = await Meeting.findOne({ meetingId });
  if (meeting && meeting.autoEndIfExpired()) {
    await meeting.save();
  }
  return meeting;
};

/**
 * Get meeting by join token
 * @param {string} joinToken - Join token
 * @returns {Promise<Meeting>}
 */
const getMeetingByJoinToken = async (joinToken) => {
  const meeting = await Meeting.findOne({ joinToken });
  if (meeting && meeting.autoEndIfExpired()) {
    await meeting.save();
  }
  return meeting;
};

/**
 * Join meeting with name and email
 * @param {string} meetingId - Meeting ID
 * @param {string} joinToken - Join token
 * @param {string} name - Participant name
 * @param {string} email - Participant email
 * @returns {Promise<Object>}
 */
const joinMeeting = async (meetingId, joinToken, name, email) => {
  const meeting = await getMeetingByJoinToken(joinToken);
  
  if (!meeting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meeting not found or invalid token');
  }
  
  if (meeting.meetingId !== meetingId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid meeting ID');
  }
  
  if (!meeting.canJoin()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Meeting is not available for joining');
  }
  
  if (meeting.currentParticipants >= meeting.maxParticipants) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Meeting is full');
  }
  
  // Add participant to meeting
  const participant = meeting.addParticipant(name, email, 'participant');
  
  // Generate Agora token for the participant
  const agoraToken = generateRtcTokenWithAccount(
    meeting.channelName,
    email, // Use email as account identifier
    1, // Publisher role
    3600 // 1 hour expiration
  );
  
  // Update meeting status to active if it's the first participant
  if (meeting.status === 'scheduled' && meeting.currentParticipants === 1) {
    meeting.status = 'active';
    meeting.startedAt = new Date();
    meeting.calculateExpiryTime();
  }
  
  await meeting.save();
  
  return {
    meeting: meeting,
    participant: participant,
    agoraToken: agoraToken,
    meetingUrl: meeting.meetingUrl
  };
};

/**
 * Leave meeting
 * @param {string} meetingId - Meeting ID
 * @param {string} email - Participant email
 * @returns {Promise<Meeting>}
 */
const leaveMeeting = async (meetingId, email) => {
  const meeting = await getMeetingById(meetingId);
  
  if (!meeting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meeting not found');
  }
  
  const participant = meeting.removeParticipant(email);
  
  if (!participant) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Participant not found in meeting');
  }
  
  // If no active participants, end the meeting
  if (meeting.currentParticipants === 0 && meeting.status === 'active') {
    meeting.status = 'ended';
    meeting.endedAt = new Date();
  }
  
  await meeting.save();
  return meeting;
};

/**
 * Get meeting participants
 * @param {string} meetingId - Meeting ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>}
 */
const getMeetingParticipants = async (meetingId, userId) => {
  const meeting = await getMeetingById(meetingId);
  
  if (!meeting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meeting not found');
  }
  
  // Check if user is the meeting creator
  if (String(meeting.createdBy) !== String(userId)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only meeting creator can view participants');
  }
  
  return {
    meetingId: meeting.meetingId,
    title: meeting.title,
    status: meeting.status,
    currentParticipants: meeting.currentParticipants,
    totalJoined: meeting.totalJoined,
    participants: meeting.participants,
    hostParticipants: meeting.hostParticipants
  };
};

/**
 * End meeting
 * @param {string} meetingId - Meeting ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Meeting>}
 */
const endMeeting = async (meetingId, userId) => {
  const meeting = await getMeetingById(meetingId);
  
  if (!meeting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meeting not found');
  }
  
  // Check if user is the meeting creator
  if (String(meeting.createdBy) !== String(userId)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only meeting creator can end the meeting');
  }
  
  meeting.status = 'ended';
  meeting.endedAt = new Date();
  meeting.endedBy = userId;
  
  // Mark all participants as inactive
  meeting.participants.forEach(participant => {
    if (participant.isActive) {
      participant.isActive = false;
      participant.leftAt = new Date();
    }
  });
  
  meeting.currentParticipants = 0;
  
  await meeting.save();
  return meeting;
};

/**
 * Get user's meetings
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>}
 */
const getUserMeetings = async (userId, options = {}) => {
  const filter = { createdBy: userId };
  const { limit = 20, page = 1, status } = options;
  
  if (status) {
    filter.status = status;
  }
  
  const meetings = await Meeting.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();
  
  const total = await Meeting.countDocuments(filter);
  
  return {
    meetings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Update meeting
 * @param {string} meetingId - Meeting ID
 * @param {Object} updateData - Update data
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Meeting>}
 */
const updateMeeting = async (meetingId, updateData, userId) => {
  const meeting = await getMeetingById(meetingId);
  
  if (!meeting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meeting not found');
  }
  
  // Check if user is the meeting creator
  if (String(meeting.createdBy) !== String(userId)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only meeting creator can update the meeting');
  }
  
  // Don't allow updating if meeting is ended
  if (meeting.status === 'ended') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update ended meeting');
  }
  
  Object.assign(meeting, updateData);
  await meeting.save();
  
  return meeting;
};

/**
 * Delete meeting
 * @param {string} meetingId - Meeting ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<void>}
 */
const deleteMeeting = async (meetingId, userId) => {
  const meeting = await getMeetingById(meetingId);
  
  if (!meeting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meeting not found');
  }
  
  // Check if user is the meeting creator
  if (String(meeting.createdBy) !== String(userId)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only meeting creator can delete the meeting');
  }
  
  await meeting.deleteOne();
};

/**
 * Get screen share token
 * @param {string} meetingId - Meeting ID
 * @param {string} joinToken - Join token
 * @param {string|number} screenShareUid - Screen share UID
 * @param {string} email - Participant email
 * @returns {Promise<Object>}
 */
const getScreenShareToken = async (meetingId, joinToken, screenShareUid, email) => {
  const meeting = await getMeetingByJoinToken(joinToken);
  
  if (!meeting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meeting not found or invalid token');
  }
  
  if (meeting.meetingId !== meetingId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid meeting ID');
  }
  
  // Validate that the participant with this email exists in the meeting
  const participant = meeting.participants.find(p => p.email === email.toLowerCase());
  if (!participant) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Participant not found in meeting');
  }
  
  // Convert screenShareUid to string for Agora token generation
  const account = String(screenShareUid);
  
  // Generate Agora token for screen sharing (publisher role)
  const agoraToken = generateRtcTokenWithAccount(
    meeting.channelName,
    account,
    RtcRole.PUBLISHER, // Publisher role for screen sharing
    3600 // 1 hour expiration
  );
  
  return {
    agoraToken: agoraToken,
  };
};

/**
 * Share meeting via email
 * @param {string} meetingId - Meeting ID
 * @param {Array<string>} emails - Array of email addresses
 * @param {string} userId - User ID (for authorization)
 * @param {string} customMessage - Optional custom message
 * @returns {Promise<Object>}
 */
const shareMeeting = async (meetingId, emails, userId, customMessage = null) => {
  const meeting = await getMeetingById(meetingId);
  
  if (!meeting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meeting not found');
  }
  
  // Check if user is the meeting creator
  if (String(meeting.createdBy) !== String(userId)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only meeting creator can share the meeting');
  }
  
  // Prepare meeting data for email
  const meetingData = {
    meetingId: meeting.meetingId,
    title: meeting.title,
    description: meeting.description,
    meetingUrl: meeting.meetingUrl,
    joinToken: meeting.joinToken,
    scheduledAt: meeting.scheduledAt,
    duration: meeting.duration,
    createdBy: meeting.createdBy,
  };
  
  // Send emails to all recipients
  const emailPromises = emails.map(async (email) => {
    try {
      await sendMeetingInvitationEmail(email, meetingData, customMessage);
      return { email, success: true };
    } catch (error) {
      logger.error(`Failed to send meeting invitation to ${email}:`, error);
      return { email, success: false, error: error.message };
    }
  });
  
  const results = await Promise.allSettled(emailPromises);
  
  const sent = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;
  
  return {
    meetingId: meeting.meetingId,
    totalEmails: emails.length,
    sent,
    failed,
    results: results.map(r => r.status === 'fulfilled' ? r.value : { email: 'unknown', success: false, error: r.reason?.message || 'Unknown error' }),
  };
};

export {
  generateRtcTokenWithAccount,
  createMeeting,
  getMeetingById,
  getMeetingByJoinToken,
  joinMeeting,
  leaveMeeting,
  getMeetingParticipants,
  endMeeting,
  getUserMeetings,
  updateMeeting,
  deleteMeeting,
  getScreenShareToken,
  shareMeeting,
};
