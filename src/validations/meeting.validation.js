import Joi from 'joi';

const createMeeting = {
  body: Joi.object().keys({
    title: Joi.string().required().min(1).max(200).description('Meeting title'),
    description: Joi.string().max(1000).optional().description('Meeting description'),
    scheduledAt: Joi.date().optional().description('Scheduled meeting time'),
    duration: Joi.number().integer().min(5).max(480).default(60).description('Meeting duration in minutes'),
    maxParticipants: Joi.number().integer().min(2).max(100).default(50).description('Maximum participants'),
    allowGuestJoin: Joi.boolean().default(true).description('Allow guest participants'),
    requireApproval: Joi.boolean().default(false).description('Require approval for joining'),
    isRecurring: Joi.boolean().default(false).description('Is recurring meeting'),
  }),
};

const getMeeting = {
  params: Joi.object().keys({
    meetingId: Joi.string().required().description('Meeting ID'),
  }),
};

const joinMeeting = {
  params: Joi.object().keys({
    meetingId: Joi.string().required().description('Meeting ID'),
  }),
  body: Joi.object().keys({
    joinToken: Joi.string().required().description('Meeting join token'),
    name: Joi.string().required().min(1).max(100).description('Participant name'),
    email: Joi.string().required().email().description('Participant email'),
  }),
};

const leaveMeeting = {
  params: Joi.object().keys({
    meetingId: Joi.string().required().description('Meeting ID'),
  }),
  body: Joi.object().keys({
    email: Joi.string().required().email().description('Participant email'),
  }),
};

const getMeetingParticipants = {
  params: Joi.object().keys({
    meetingId: Joi.string().required().description('Meeting ID'),
  }),
};

const endMeeting = {
  params: Joi.object().keys({
    meetingId: Joi.string().required().description('Meeting ID'),
  }),
};

const getUserMeetings = {
  query: Joi.object().keys({
    status: Joi.string().valid('scheduled', 'active', 'ended', 'cancelled').optional().description('Meeting status filter'),
    limit: Joi.number().integer().min(1).max(100).default(20).description('Number of meetings to return'),
    page: Joi.number().integer().min(1).default(1).description('Page number'),
  }),
};

const updateMeeting = {
  params: Joi.object().keys({
    meetingId: Joi.string().required().description('Meeting ID'),
  }),
  body: Joi.object().keys({
    title: Joi.string().min(1).max(200).optional().description('Meeting title'),
    description: Joi.string().max(1000).optional().description('Meeting description'),
    scheduledAt: Joi.date().optional().description('Scheduled meeting time'),
    duration: Joi.number().integer().min(5).max(480).optional().description('Meeting duration in minutes'),
    maxParticipants: Joi.number().integer().min(2).max(100).optional().description('Maximum participants'),
    allowGuestJoin: Joi.boolean().optional().description('Allow guest participants'),
    requireApproval: Joi.boolean().optional().description('Require approval for joining'),
    notes: Joi.string().max(2000).optional().description('Meeting notes'),
    outcome: Joi.string().valid('successful', 'unsuccessful', 'rescheduled', 'cancelled').optional().description('Meeting outcome'),
  }),
};

const deleteMeeting = {
  params: Joi.object().keys({
    meetingId: Joi.string().required().description('Meeting ID'),
  }),
};

const getMeetingInfo = {
  params: Joi.object().keys({
    meetingId: Joi.string().required().description('Meeting ID'),
  }),
  query: Joi.object().keys({
    token: Joi.string().required().description('Meeting join token'),
  }),
};

export {
  createMeeting,
  getMeeting,
  joinMeeting,
  leaveMeeting,
  getMeetingParticipants,
  endMeeting,
  getUserMeetings,
  updateMeeting,
  deleteMeeting,
  getMeetingInfo,
};
