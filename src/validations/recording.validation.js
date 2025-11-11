import Joi from 'joi';

const getRecordingStatus = {
  params: Joi.object().keys({
    meetingId: Joi.string().required().description('Meeting ID'),
  }),
};

const startRecording = {
  params: Joi.object().keys({
    meetingId: Joi.string().required().description('Meeting ID'),
  }),
  body: Joi.object().keys({
    format: Joi.string().valid('mp4', 'webm', 'm3u8').optional().description('Recording format'),
    resolution: Joi.string().optional().description('Recording resolution (e.g., 1280x720)'),
    fps: Joi.number().integer().min(15).max(60).optional().description('Recording FPS'),
    bitrate: Joi.number().integer().min(500).max(10000).optional().description('Recording bitrate in kbps'),
  }),
};

const stopRecording = {
  params: Joi.object().keys({
    meetingId: Joi.string().required().description('Meeting ID'),
  }),
};

const getRecordingDownloadUrl = {
  params: Joi.object().keys({
    meetingId: Joi.string().required().description('Meeting ID'),
  }),
};

const uploadRecording = {
  params: Joi.object().keys({
    meetingId: Joi.string().required().description('Meeting ID'),
  }),
  // File validation is handled by multer middleware
  // No body validation needed for multipart/form-data
};

export {
  getRecordingStatus,
  startRecording,
  stopRecording,
  getRecordingDownloadUrl,
  uploadRecording,
};

