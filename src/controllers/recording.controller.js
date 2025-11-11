import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import {
  getRecordingStatus,
  startRecording,
  stopRecording,
  getRecordingDownloadUrl,
  uploadRecordingFile,
} from '../services/recording.service.js';

/**
 * Get recording status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getStatus = catchAsync(async (req, res) => {
  const { meetingId } = req.params;
  const result = await getRecordingStatus(meetingId, req.user.id);
  
  res.status(httpStatus.OK).json({
    success: true,
    data: result,
    message: 'Recording status retrieved successfully',
  });
});

/**
 * Start recording
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const start = catchAsync(async (req, res) => {
  const { meetingId } = req.params;
  const options = req.body;
  
  const result = await startRecording(meetingId, req.user.id, options);
  
  res.status(httpStatus.OK).json({
    success: true,
    data: result,
    message: 'Recording started successfully',
  });
});

/**
 * Stop recording
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const stop = catchAsync(async (req, res) => {
  const { meetingId } = req.params;
  
  const result = await stopRecording(meetingId, req.user.id);
  
  res.status(httpStatus.OK).json({
    success: true,
    data: result,
    message: 'Recording stopped successfully',
  });
});

/**
 * Get recording download URL
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDownloadUrl = catchAsync(async (req, res) => {
  const { meetingId } = req.params;
  
  const result = await getRecordingDownloadUrl(meetingId, req.user.id);
  
  res.status(httpStatus.OK).json({
    success: true,
    data: result,
    message: 'Download URL generated successfully',
  });
});

/**
 * Upload recording file from frontend
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const upload = catchAsync(async (req, res) => {
  const { meetingId } = req.params;
  
  if (!req.file) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'No file provided',
    });
  }
  
  const result = await uploadRecordingFile(meetingId, req.user.id, req.file);
  
  res.status(httpStatus.OK).json({
    success: true,
    data: result,
    message: 'Recording uploaded successfully',
  });
});

export {
  getStatus,
  start,
  stop,
  getDownloadUrl,
  upload,
};

