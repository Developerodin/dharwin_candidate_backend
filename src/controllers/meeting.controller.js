import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';
import {
  createMeeting,
  getMeetingById,
  joinMeeting,
  leaveMeeting,
  getMeetingParticipants,
  endMeeting,
  getUserMeetings,
  updateMeeting,
  deleteMeeting,
  getScreenShareToken as getScreenShareTokenService,
  shareMeeting as shareMeetingService,
} from '../services/meeting.service.js';
import { logActivity } from '../services/recruiterActivity.service.js';

/**
 * Create a new meeting
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const create = catchAsync(async (req, res) => {
  const meeting = await createMeeting(req.body, req.user.id);
  
  // Log activity if user is a recruiter and meeting is scheduled (interview)
  if (req.user.role === 'recruiter' && meeting.scheduledAt) {
    await logActivity(req.user.id, 'interview_scheduled', {
      meetingId: meeting._id,
      description: `Scheduled interview: ${meeting.title}`,
      metadata: {
        title: meeting.title,
        scheduledAt: meeting.scheduledAt,
        duration: meeting.duration,
      },
    });
  }
  
  res.status(httpStatus.CREATED).json({
    success: true,
    data: meeting,
    message: 'Meeting created successfully',
  });
});

/**
 * Get meeting details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const get = catchAsync(async (req, res) => {
  const meeting = await getMeetingById(req.params.meetingId);
  
  if (!meeting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meeting not found');
  }
  
  res.status(httpStatus.OK).json({
    success: true,
    data: meeting,
    message: 'Meeting retrieved successfully',
  });
});

/**
 * Join meeting with name and email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const join = catchAsync(async (req, res) => {
  const { meetingId } = req.params;
  const { joinToken, name, email } = req.body;
  
  const result = await joinMeeting(meetingId, joinToken, name, email);
  
  res.status(httpStatus.OK).json({
    success: true,
    data: {
      meeting: result.meeting,
      participant: result.participant,
      agoraToken: result.agoraToken,
      meetingUrl: result.meetingUrl,
    },
    message: 'Successfully joined the meeting',
  });
});

/**
 * Leave meeting
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const leave = catchAsync(async (req, res) => {
  const { meetingId } = req.params;
  const { email } = req.body;
  
  const meeting = await leaveMeeting(meetingId, email);
  
  res.status(httpStatus.OK).json({
    success: true,
    data: meeting,
    message: 'Successfully left the meeting',
  });
});

/**
 * Get meeting participants (meeting creator only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getParticipants = catchAsync(async (req, res) => {
  const { meetingId } = req.params;
  
  const participants = await getMeetingParticipants(meetingId, req.user.id);
  
  res.status(httpStatus.OK).json({
    success: true,
    data: participants,
    message: 'Meeting participants retrieved successfully',
  });
});

/**
 * End meeting (meeting creator only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const end = catchAsync(async (req, res) => {
  const { meetingId } = req.params;
  
  const meeting = await endMeeting(meetingId, req.user.id);
  
  res.status(httpStatus.OK).json({
    success: true,
    data: meeting,
    message: 'Meeting ended successfully',
  });
});

/**
 * Get user's meetings (or all meetings for admin)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserMeetingsList = catchAsync(async (req, res) => {
  const { status, limit = 20, page = 1 } = req.query;
  
  // If user is admin, get all meetings; otherwise get only user's meetings
  const getAll = req.user.role === 'admin';
  
  const result = await getUserMeetings(req.user.id, { status, limit, page, getAll });
  
  res.status(httpStatus.OK).json({
    success: true,
    data: result,
    message: getAll ? 'All meetings retrieved successfully' : 'User meetings retrieved successfully',
  });
});

/**
 * Update meeting
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const update = catchAsync(async (req, res) => {
  const { meetingId } = req.params;
  
  const meeting = await updateMeeting(meetingId, req.body, req.user.id);
  
  res.status(httpStatus.OK).json({
    success: true,
    data: meeting,
    message: 'Meeting updated successfully',
  });
});

/**
 * Delete meeting
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const remove = catchAsync(async (req, res) => {
  const { meetingId } = req.params;
  
  await deleteMeeting(meetingId, req.user.id);
  
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Get meeting info for joining (public endpoint)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMeetingInfo = catchAsync(async (req, res) => {
  const { meetingId } = req.params;
  const { token } = req.query;
  
  if (!token) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Join token is required');
  }
  
  const meeting = await getMeetingById(meetingId);
  
  if (!meeting || meeting.joinToken !== token) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meeting not found or invalid token');
  }
  
  // Return only public meeting info
  const publicInfo = {
    meetingId: meeting.meetingId,
    title: meeting.title,
    description: meeting.description,
    status: meeting.status,
    scheduledAt: meeting.scheduledAt,
    duration: meeting.duration,
    maxParticipants: meeting.maxParticipants,
    currentParticipants: meeting.currentParticipants,
    canJoin: meeting.canJoin(),
    meetingUrl: meeting.meetingUrl,
    appId: meeting.appId,
    channelName: meeting.channelName,
  };
  
  res.status(httpStatus.OK).json({
    success: true,
    data: publicInfo,
    message: 'Meeting info retrieved successfully',
  });
});

/**
 * Get screen share token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getScreenShareToken = catchAsync(async (req, res) => {
  const { meetingId } = req.params;
  const { joinToken, screenShareUid, email } = req.body;
  
  const result = await getScreenShareTokenService(meetingId, joinToken, screenShareUid, email);
  
  res.status(httpStatus.OK).json({
    success: true,
    data: {
      agoraToken: result.agoraToken,
    },
    message: 'Screen share token generated successfully',
  });
});

/**
 * Share meeting via email
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const share = catchAsync(async (req, res) => {
  const { meetingId } = req.params;
  const { emails, message } = req.body;
  
  const result = await shareMeetingService(meetingId, emails, req.user.id, message);
  
  res.status(httpStatus.OK).json({
    success: true,
    data: result,
    message: `Meeting invitations sent to ${result.sent} out of ${result.totalEmails} recipients`,
  });
});

export {
  create,
  get,
  join,
  leave,
  getParticipants,
  end,
  getUserMeetingsList,
  update,
  remove,
  getMeetingInfo,
  getScreenShareToken,
  share,
};
