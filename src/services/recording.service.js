import httpStatus from 'http-status';
import Meeting from '../models/meeting.model.js';
import ApiError from '../utils/ApiError.js';
import config from '../config/config.js';
import { uploadRecordingToS3, getPresignedDownloadUrl, generateRecordingS3Key } from './recording-upload.service.js';
import logger from '../config/logger.js';
import { startTranscription } from './transcription.service.js';

/**
 * Generate unique recording ID
 * @returns {string}
 */
const generateRecordingId = async () => {
  const crypto = await import('crypto');
  return `rec_${crypto.randomBytes(8).toString('hex')}_${Date.now()}`;
};

/**
 * Get recording status for a meeting
 * @param {string} meetingId - Meeting ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>}
 */
const getRecordingStatus = async (meetingId, userId) => {
  const meeting = await Meeting.findOne({ meetingId });
  
  if (!meeting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meeting not found');
  }
  
  // Only authenticated users can view recording status
  // No need to check if user is creator - any authenticated user can view
  
  return {
    meetingId: meeting.meetingId,
    recording: meeting.recording,
  };
};

/**
 * Start recording for a meeting
 * @param {string} meetingId - Meeting ID
 * @param {string} userId - User ID (for authorization)
 * @param {Object} options - Recording options
 * @returns {Promise<Object>}
 */
const startRecording = async (meetingId, userId, options = {}) => {
  const meeting = await Meeting.findOne({ meetingId });
  
  if (!meeting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meeting not found');
  }
  
  // Check if user is the meeting creator
  if (String(meeting.createdBy) !== String(userId)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only meeting creator can start recording');
  }
  
  // Check if meeting is active
  if (meeting.status !== 'active') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Recording can only be started for active meetings');
  }
  
  // Check if recording is already in progress
  if (meeting.recording.status === 'recording' || meeting.recording.status === 'starting') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Recording is already in progress');
  }
  
  // Generate recording ID
  const recordingId = await generateRecordingId();
  
  // Prepare recording options
  const recordingOptions = {
    format: options.format || config.recording.defaultFormat,
    resolution: options.resolution || config.recording.defaultResolution,
    fps: options.fps || config.recording.defaultFps,
    bitrate: options.bitrate || config.recording.defaultBitrate,
  };
  
  // Update meeting with recording status
  meeting.recording = {
    ...meeting.recording,
    enabled: true,
    status: 'starting',
    recordingId,
    startedAt: new Date(),
    format: recordingOptions.format,
    resolution: recordingOptions.resolution,
    fps: recordingOptions.fps,
    bitrate: recordingOptions.bitrate,
    error: null,
  };
  
  // Update recording status to recording (frontend will handle actual recording)
  meeting.recording.status = 'recording';
  
  await meeting.save();
  
  logger.info(`Recording started for meeting ${meetingId} - Frontend will handle recording`, {
    recordingId,
    channelName: meeting.channelName,
    appId: meeting.appId,
  });
  
  return {
    meetingId: meeting.meetingId,
    recording: meeting.recording,
    agoraConfig: {
      appId: meeting.appId,
      channelName: meeting.channelName,
    },
    message: 'Recording started. Frontend should start recording using Agora SDK.',
  };
};

/**
 * Stop recording for a meeting
 * @param {string} meetingId - Meeting ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>}
 */
const stopRecording = async (meetingId, userId) => {
  const meeting = await Meeting.findOne({ meetingId });
  
  if (!meeting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meeting not found');
  }
  
  // Check if user is the meeting creator
  if (String(meeting.createdBy) !== String(userId)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only meeting creator can stop recording');
  }
  
  // Check if recording is in progress
  if (meeting.recording.status !== 'recording' && meeting.recording.status !== 'starting') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No recording in progress');
  }
  
  // Update meeting with recording status
  meeting.recording.status = 'stopping';
  meeting.recording.stoppedAt = new Date();
  
  // Calculate duration
  if (meeting.recording.startedAt) {
    meeting.recording.duration = Math.floor(
      (meeting.recording.stoppedAt - meeting.recording.startedAt) / 1000
    );
  }
  
  await meeting.save();
  
  logger.info(`Recording stopped for meeting ${meetingId} - Waiting for frontend to upload recording`, {
    recordingId: meeting.recording.recordingId,
    duration: meeting.recording.duration,
  });
  
  return {
    meetingId: meeting.meetingId,
    recording: meeting.recording,
    message: 'Recording stopped. Please upload the recording file using the upload endpoint.',
    uploadEndpoint: `/api/v1/meetings/${meetingId}/recording/upload`,
  };
};

/**
 * Get recording download URL (presigned S3 URL)
 * @param {string} meetingId - Meeting ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>}
 */
const getRecordingDownloadUrl = async (meetingId, userId) => {
  const meeting = await Meeting.findOne({ meetingId });
  
  if (!meeting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meeting not found');
  }
  
  // Check if user is the meeting creator
  if (String(meeting.createdBy) !== String(userId)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only meeting creator can download recording');
  }
  
  // Check if recording exists
  if (!meeting.recording.fileKey || meeting.recording.status !== 'completed') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Recording not available for download');
  }
  
  try {
    // Generate presigned S3 URL
    const presignedUrl = await getPresignedDownloadUrl(meeting.recording.fileKey, 3600); // 1 hour expiration
    
    logger.info(`Generated presigned download URL for meeting ${meetingId}`, {
      fileKey: meeting.recording.fileKey,
    });
    
    return {
      meetingId: meeting.meetingId,
      downloadUrl: presignedUrl,
      expiresIn: 3600, // 1 hour
      fileSize: meeting.recording.fileSize,
      format: meeting.recording.format,
    };
  } catch (error) {
    logger.error(`Failed to generate presigned URL for meeting ${meetingId}:`, error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to generate download URL: ${error.message}`
    );
  }
};

/**
 * Upload recording file from frontend
 * @param {string} meetingId - Meeting ID
 * @param {string} userId - User ID (for authorization)
 * @param {Object} file - Uploaded file (from multer)
 * @returns {Promise<Object>}
 */
const uploadRecordingFile = async (meetingId, userId, file) => {
  const meeting = await Meeting.findOne({ meetingId });
  
  if (!meeting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meeting not found');
  }
  
  // Check if user is the meeting creator
  if (String(meeting.createdBy) !== String(userId)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only meeting creator can upload recording');
  }
  
  // Check if recording exists
  if (!meeting.recording.recordingId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No recording session found for this meeting');
  }
  
  // Check if recording is in stopping or completed state
  if (meeting.recording.status !== 'stopping' && meeting.recording.status !== 'completed') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Recording must be stopped before uploading');
  }
  
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No file provided');
  }
  
  // Validate file type (supports both video and audio)
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
  const allowedAudioTypes = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/x-m4a'];
  const allowedTypes = [...allowedVideoTypes, ...allowedAudioTypes];
  
  if (!allowedTypes.includes(file.mimetype)) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
  }
  
  try {
    // Determine format from file extension or mimetype
    let format = 'mp4';
    if (file.originalname) {
      const ext = file.originalname.split('.').pop().toLowerCase();
      if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'mp3', 'm4a', 'wav', 'ogg'].includes(ext)) {
        // Normalize formats
        if (ext === 'mov') format = 'mp4';
        else if (ext === 'm4a') format = 'mp4'; // M4A is MP4 container
        else format = ext;
      }
    } else if (file.mimetype) {
      // Determine format from MIME type
      const mimeToFormat = {
        'video/mp4': 'mp4',
        'video/webm': 'webm',
        'video/quicktime': 'mp4',
        'video/x-msvideo': 'avi',
        'video/x-matroska': 'mkv',
        'audio/mpeg': 'mp3',
        'audio/mp4': 'm4a',
        'audio/wav': 'wav',
        'audio/ogg': 'ogg',
        'audio/webm': 'webm',
        'audio/x-m4a': 'm4a',
      };
      format = mimeToFormat[file.mimetype] || 'mp4';
    }
    
    // Generate S3 key
    const s3Key = generateRecordingS3Key(meeting.meetingId, meeting.recording.recordingId, format);
    
    // Upload to S3
    logger.info(`Uploading recording file to S3 for meeting ${meetingId}`, {
      fileName: file.originalname,
      fileSize: file.size,
      format,
      s3Key,
    });
    
    const uploadResult = await uploadRecordingToS3(
      file.buffer, // Use buffer directly (from multer memory storage)
      meeting.meetingId,
      meeting.recording.recordingId,
      format
    );
    
    // Update meeting with S3 info
    meeting.recording.status = 'completed';
    meeting.recording.fileKey = uploadResult.s3Key;
    meeting.recording.fileUrl = uploadResult.s3Url;
    meeting.recording.fileSize = uploadResult.fileSize;
    meeting.recording.format = format;
    meeting.recording.error = null; // Clear any previous errors
    
    await meeting.save();
    
    logger.info(`Recording uploaded to S3 successfully for meeting ${meetingId}`, {
      s3Key: uploadResult.s3Key,
      fileSize: uploadResult.fileSize,
    });
    
    // Auto-start transcription if enabled
    if (config.transcription.autoStart && meeting.transcription.autoTranscribe !== false) {
      try {
        logger.info(`Auto-starting transcription for meeting ${meetingId}`);
        // Start transcription in background (don't await)
        startTranscription(meetingId, userId, {
          language: config.transcription.language,
        }).catch((error) => {
          logger.error(`Auto-transcription failed for meeting ${meetingId}:`, error);
        });
      } catch (error) {
        logger.error(`Failed to auto-start transcription for meeting ${meetingId}:`, error);
        // Don't fail the upload if transcription fails
      }
    }
    
    return {
      meetingId: meeting.meetingId,
      recording: meeting.recording,
      message: 'Recording uploaded successfully',
      transcriptionStarted: config.transcription.autoStart && meeting.transcription.autoTranscribe !== false,
    };
  } catch (error) {
    logger.error(`Failed to upload recording for meeting ${meetingId}:`, error);
    meeting.recording.error = `Upload failed: ${error.message}`;
    await meeting.save();
    
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to upload recording: ${error.message}`
    );
  }
};

export {
  getRecordingStatus,
  startRecording,
  stopRecording,
  getRecordingDownloadUrl,
  uploadRecordingFile,
};

