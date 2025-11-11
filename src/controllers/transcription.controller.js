import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import {
  startTranscription,
  getTranscriptionStatus,
  getTranscript,
  updateTranscript,
  getTranscriptDownloadUrl,
} from '../services/transcription.service.js';

/**
 * Start transcription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const start = catchAsync(async (req, res) => {
  const { meetingId } = req.params;
  const options = req.body;
  
  const result = await startTranscription(meetingId, req.user.id, options);
  
  res.status(httpStatus.OK).json({
    success: true,
    data: result,
    message: 'Transcription started successfully',
  });
});

/**
 * Get transcription status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getStatus = catchAsync(async (req, res) => {
  const { meetingId } = req.params;
  
  const result = await getTranscriptionStatus(meetingId, req.user.id);
  
  res.status(httpStatus.OK).json({
    success: true,
    data: result,
    message: 'Transcription status retrieved successfully',
  });
});

/**
 * Get transcript content
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTranscriptContent = catchAsync(async (req, res) => {
  const { meetingId } = req.params;
  
  const result = await getTranscript(meetingId, req.user.id);
  
  res.status(httpStatus.OK).json({
    success: true,
    data: result,
    message: 'Transcript retrieved successfully',
  });
});

/**
 * Update transcript (edit)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const update = catchAsync(async (req, res) => {
  const { meetingId } = req.params;
  const { transcript } = req.body;
  
  if (!transcript) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Transcript text is required',
    });
  }
  
  const result = await updateTranscript(meetingId, req.user.id, transcript);
  
  res.status(httpStatus.OK).json({
    success: true,
    data: result,
    message: 'Transcript updated successfully',
  });
});

/**
 * Get transcript download URL
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDownloadUrl = catchAsync(async (req, res) => {
  const { meetingId } = req.params;
  const { format = 'txt' } = req.query;
  
  const result = await getTranscriptDownloadUrl(meetingId, req.user.id, format);
  
  res.status(httpStatus.OK).json({
    success: true,
    data: result,
    message: 'Download URL generated successfully',
  });
});

export {
  start,
  getStatus,
  getTranscriptContent,
  update,
  getDownloadUrl,
};

