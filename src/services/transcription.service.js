import httpStatus from 'http-status';
import Meeting from '../models/meeting.model.js';
import ApiError from '../utils/ApiError.js';
import config from '../config/config.js';
import logger from '../config/logger.js';
import { s3Client, generatePresignedDownloadUrl } from '../config/s3.js';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { uploadRecordingToS3, generateRecordingS3Key } from './recording-upload.service.js';

/**
 * Generate S3 key for transcript file
 * @param {string} meetingId - Meeting ID
 * @param {string} recordingId - Recording ID
 * @param {string} format - File format (txt, docx, pdf)
 * @returns {string} S3 key
 */
const generateTranscriptS3Key = (meetingId, recordingId, format = 'txt') => {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `transcripts/${timestamp}/${meetingId}/${recordingId}.${format}`;
};

/**
 * Download file from S3 to buffer
 * @param {string} s3Key - S3 key
 * @returns {Promise<Buffer>} File buffer
 */
const downloadFromS3 = async (s3Key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: config.aws.bucketName,
      Key: s3Key,
    });
    
    const response = await s3Client.send(command);
    const chunks = [];
    
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  } catch (error) {
    logger.error(`Failed to download file from S3: ${s3Key}`, error);
    throw new Error(`Failed to download file: ${error.message}`);
  }
};

/**
 * Transcribe audio using AssemblyAI
 * @param {string} audioUrl - URL of audio file
 * @param {Object} options - Transcription options
 * @returns {Promise<Object>} Transcription result
 */
const transcribeWithAssemblyAI = async (audioUrl, options = {}) => {
  const { language = 'en', speakerLabels = true } = options;
  
  if (!config.transcription.assemblyaiApiKey) {
    throw new Error('AssemblyAI API key not configured');
  }
  
  try {
    // Submit transcription job
    const submitResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        authorization: config.transcription.assemblyaiApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_code: language,
        speaker_labels: speakerLabels,
        auto_chapters: false,
        sentiment_analysis: false,
        entity_detection: false,
      }),
    });
    
    if (!submitResponse.ok) {
      const errorData = await submitResponse.json();
      throw new Error(`AssemblyAI API error: ${errorData.error || submitResponse.statusText}`);
    }
    
    const { id: jobId } = await submitResponse.json();
    
    // Poll for completion
    let transcriptData = null;
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes max (5 second intervals)
    
    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${jobId}`, {
        headers: {
          authorization: config.transcription.assemblyaiApiKey,
        },
      });
      
      if (!statusResponse.ok) {
        throw new Error(`Failed to check transcription status: ${statusResponse.statusText}`);
      }
      
      transcriptData = await statusResponse.json();
      
      if (transcriptData.status === 'completed') {
        break;
      } else if (transcriptData.status === 'error') {
        throw new Error(`Transcription failed: ${transcriptData.error}`);
      }
      
      attempts++;
    }
    
    if (transcriptData.status !== 'completed') {
      throw new Error('Transcription timed out');
    }
    
    return {
      jobId,
      transcript: transcriptData.text,
      words: transcriptData.words || [],
      utterances: transcriptData.utterances || [],
      speakers: transcriptData.speaker_labels || [],
    };
  } catch (error) {
    logger.error(`AssemblyAI transcription error: ${error.message}`, error);
    throw error;
  }
};

/**
 * Format transcript as conversation between participants
 * @param {Object} transcriptData - Raw transcript data from API
 * @param {Object} participantMapping - Map of speaker labels to participant info
 * @param {Object} meeting - Meeting object
 * @returns {string} Formatted transcript text
 */
const formatTranscript = (transcriptData, participantMapping = {}, meeting = null) => {
  const { utterances = [], words = [] } = transcriptData;
  
  // If we have utterances (with speaker labels), use them
  if (utterances && utterances.length > 0) {
    let formattedText = '';
    
    // Header
    formattedText += '================================================================================\n';
    formattedText += 'MEETING TRANSCRIPT\n';
    formattedText += '================================================================================\n\n';
    
    if (meeting) {
      formattedText += `Meeting ID: ${meeting.meetingId}\n`;
      formattedText += `Title: ${meeting.title}\n`;
      if (meeting.startedAt) {
        formattedText += `Date: ${new Date(meeting.startedAt).toLocaleString()}\n`;
      }
      if (meeting.recording?.duration) {
        const minutes = Math.floor(meeting.recording.duration / 60);
        const seconds = meeting.recording.duration % 60;
        formattedText += `Duration: ${minutes} minutes ${seconds} seconds\n`;
      }
      formattedText += `Participants: ${meeting.participants?.length || 0}\n\n`;
    }
    
    formattedText += '================================================================================\n\n';
    
    // Group utterances by speaker and format
    let currentSpeaker = null;
    let currentText = [];
    
    utterances.forEach((utterance, index) => {
      const speaker = utterance.speaker || `spk_${utterance.speaker_label || 0}`;
      const text = utterance.text || '';
      const startTime = utterance.start || 0;
      const endTime = utterance.end || 0;
      
      // Get participant name or use default
      let participantName = participantMapping[speaker];
      if (!participantName) {
        // Try to map by speaker label number
        const speakerNum = speaker.replace('spk_', '') || '0';
        const participantIndex = parseInt(speakerNum, 10) + 1;
        participantName = `Participant ${participantIndex}`;
      }
      
      // If same speaker, combine text
      if (currentSpeaker === speaker) {
        currentText.push(text);
      } else {
        // Write previous speaker's text
        if (currentSpeaker !== null && currentText.length > 0) {
          formattedText += `${participantName}: ${currentText.join(' ')}\n\n`;
        }
        
        // Start new speaker
        currentSpeaker = speaker;
        currentText = [text];
      }
    });
    
    // Write last speaker's text
    if (currentSpeaker !== null && currentText.length > 0) {
      const speakerNum = currentSpeaker.replace('spk_', '') || '0';
      const participantIndex = parseInt(speakerNum, 10) + 1;
      const participantName = participantMapping[currentSpeaker] || `Participant ${participantIndex}`;
      formattedText += `${participantName}: ${currentText.join(' ')}\n\n`;
    }
    
    formattedText += '================================================================================\n';
    formattedText += 'End of Transcript\n';
    
    return formattedText;
  }
  
  // Fallback: use words if utterances not available
  if (words && words.length > 0) {
    let formattedText = '';
    formattedText += '================================================================================\n';
    formattedText += 'MEETING TRANSCRIPT\n';
    formattedText += '================================================================================\n\n';
    
    if (meeting) {
      formattedText += `Meeting ID: ${meeting.meetingId}\n`;
      formattedText += `Title: ${meeting.title}\n`;
      if (meeting.startedAt) {
        formattedText += `Date: ${new Date(meeting.startedAt).toLocaleString()}\n`;
      }
      formattedText += `Participants: ${meeting.participants?.length || 0}\n\n`;
    }
    
    formattedText += '================================================================================\n\n';
    
    // Simple text output if no speaker diarization
    formattedText += transcriptData.transcript || '';
    
    formattedText += '\n\n================================================================================\n';
    formattedText += 'End of Transcript\n';
    
    return formattedText;
  }
  
  // Last fallback: just the transcript text
  return transcriptData.transcript || 'No transcript available.';
};

/**
 * Start transcription for a meeting recording
 * @param {string} meetingId - Meeting ID
 * @param {string} userId - User ID (for authorization)
 * @param {Object} options - Transcription options
 * @returns {Promise<Object>}
 */
const startTranscription = async (meetingId, userId, options = {}) => {
  const meeting = await Meeting.findOne({ meetingId });
  
  if (!meeting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meeting not found');
  }
  
  // Check if user is the meeting creator
  if (String(meeting.createdBy) !== String(userId)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only meeting creator can start transcription');
  }
  
  // Check if recording exists and is completed
  if (!meeting.recording.fileKey || meeting.recording.status !== 'completed') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Recording must be completed before transcription');
  }
  
  // Check if transcription is already in progress or completed
  if (meeting.transcription.status === 'processing') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Transcription is already in progress');
  }
  
  if (meeting.transcription.status === 'completed') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Transcription already completed');
  }
  
  try {
    // Generate presigned URL for the recording file (valid for 1 hour)
    // AssemblyAI needs a publicly accessible URL, so we use presigned URL
    const audioUrl = await generatePresignedDownloadUrl(meeting.recording.fileKey, 3600);
    
    // Update meeting with transcription status
    meeting.transcription.status = 'processing';
    meeting.transcription.startedAt = new Date();
    meeting.transcription.enabled = true;
    meeting.transcription.language = options.language || config.transcription.language;
    meeting.transcription.error = null;
    
    await meeting.save();
    
    // Start transcription in background (don't await)
    transcribeRecording(meetingId, audioUrl, options).catch((error) => {
      logger.error(`Background transcription failed for meeting ${meetingId}:`, error);
    });
    
    logger.info(`Transcription started for meeting ${meetingId}`);
    
    return {
      meetingId: meeting.meetingId,
      transcription: {
        status: meeting.transcription.status,
        startedAt: meeting.transcription.startedAt,
      },
      message: 'Transcription started. It will be processed in the background.',
    };
  } catch (error) {
    logger.error(`Failed to start transcription for meeting ${meetingId}:`, error);
    meeting.transcription.status = 'idle';
    meeting.transcription.error = error.message;
    await meeting.save();
    
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to start transcription: ${error.message}`
    );
  }
};

/**
 * Process transcription (called in background)
 * @param {string} meetingId - Meeting ID
 * @param {string} audioUrl - URL of audio file
 * @param {Object} options - Transcription options
 */
const transcribeRecording = async (meetingId, audioUrl, options = {}) => {
  const meeting = await Meeting.findOne({ meetingId });
  
  if (!meeting) {
    logger.error(`Meeting not found for transcription: ${meetingId}`);
    return;
  }
  
  try {
    logger.info(`Starting transcription for meeting ${meetingId}`);
    
    // Transcribe using AssemblyAI
    const transcriptData = await transcribeWithAssemblyAI(audioUrl, {
      language: meeting.transcription.language,
      speakerLabels: true,
    });
    
    // Format transcript
    const formattedTranscript = formatTranscript(transcriptData, {}, meeting);
    
    // Extract speaker labels
    const speakers = [...new Set(transcriptData.utterances?.map(u => u.speaker || `spk_${u.speaker_label || 0}`) || [])];
    
    // Map speakers to participants if possible
    const participantMapping = {};
    speakers.forEach((speaker, index) => {
      if (meeting.participants && meeting.participants[index]) {
        participantMapping[speaker] = meeting.participants[index].name || `Participant ${index + 1}`;
      } else {
        participantMapping[speaker] = `Participant ${index + 1}`;
      }
    });
    
    // Re-format with participant mapping
    const finalTranscript = formatTranscript(transcriptData, participantMapping, meeting);
    
    // Upload transcript to S3
    const transcriptBuffer = Buffer.from(finalTranscript, 'utf-8');
    const s3Key = generateTranscriptS3Key(meeting.meetingId, meeting.recording.recordingId, 'txt');
    
    const uploadCommand = new PutObjectCommand({
      Bucket: config.aws.bucketName,
      Key: s3Key,
      Body: transcriptBuffer,
      ContentType: 'text/plain',
      Metadata: {
        meetingId: meeting.meetingId,
        recordingId: meeting.recording.recordingId,
        format: 'txt',
        uploadedAt: new Date().toISOString(),
      },
    });
    
    await s3Client.send(uploadCommand);
    
    const s3Url = `https://${config.aws.bucketName}.s3.${config.aws.region}.amazonaws.com/${s3Key}`;
    
    // Update meeting with transcript data
    meeting.transcription.status = 'completed';
    meeting.transcription.completedAt = new Date();
    meeting.transcription.jobId = transcriptData.jobId;
    meeting.transcription.fileKey = s3Key;
    meeting.transcription.fileUrl = s3Url;
    meeting.transcription.fileSize = transcriptBuffer.length;
    meeting.transcription.rawTranscript = transcriptData;
    meeting.transcription.formattedTranscript = finalTranscript;
    meeting.transcription.speakers = speakers;
    meeting.transcription.participantMapping = participantMapping;
    meeting.transcription.error = null;
    
    await meeting.save();
    
    logger.info(`Transcription completed for meeting ${meetingId}`, {
      jobId: transcriptData.jobId,
      s3Key,
      fileSize: transcriptBuffer.length,
    });
  } catch (error) {
    logger.error(`Transcription failed for meeting ${meetingId}:`, error);
    
    meeting.transcription.status = 'failed';
    meeting.transcription.error = error.message;
    await meeting.save();
  }
};

/**
 * Get transcription status
 * @param {string} meetingId - Meeting ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>}
 */
const getTranscriptionStatus = async (meetingId, userId) => {
  const meeting = await Meeting.findOne({ meetingId });
  
  if (!meeting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meeting not found');
  }
  
  return {
    meetingId: meeting.meetingId,
    transcription: {
      status: meeting.transcription.status,
      startedAt: meeting.transcription.startedAt,
      completedAt: meeting.transcription.completedAt,
      error: meeting.transcription.error,
      speakers: meeting.transcription.speakers?.length || 0,
    },
  };
};

/**
 * Get transcript content
 * @param {string} meetingId - Meeting ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>}
 */
const getTranscript = async (meetingId, userId) => {
  const meeting = await Meeting.findOne({ meetingId });
  
  if (!meeting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meeting not found');
  }
  
  if (meeting.transcription.status !== 'completed') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Transcription not completed yet');
  }
  
  return {
    meetingId: meeting.meetingId,
    transcript: meeting.transcription.formattedTranscript,
    rawTranscript: meeting.transcription.rawTranscript,
    speakers: meeting.transcription.speakers,
    participantMapping: meeting.transcription.participantMapping,
    fileUrl: meeting.transcription.fileUrl,
  };
};

/**
 * Update transcript (for editing)
 * @param {string} meetingId - Meeting ID
 * @param {string} userId - User ID (for authorization)
 * @param {string} transcript - Updated transcript text
 * @returns {Promise<Object>}
 */
const updateTranscript = async (meetingId, userId, transcript) => {
  const meeting = await Meeting.findOne({ meetingId });
  
  if (!meeting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meeting not found');
  }
  
  // Check if user is the meeting creator
  if (String(meeting.createdBy) !== String(userId)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only meeting creator can edit transcript');
  }
  
  if (!transcript || typeof transcript !== 'string') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid transcript text');
  }
  
  try {
    // Update transcript
    meeting.transcription.formattedTranscript = transcript;
    meeting.transcription.lastEditedAt = new Date();
    meeting.transcription.lastEditedBy = userId;
    
    // Upload updated transcript to S3
    const transcriptBuffer = Buffer.from(transcript, 'utf-8');
    const s3Key = meeting.transcription.fileKey || generateTranscriptS3Key(meeting.meetingId, meeting.recording.recordingId, 'txt');
    
    const uploadCommand = new PutObjectCommand({
      Bucket: config.aws.bucketName,
      Key: s3Key,
      Body: transcriptBuffer,
      ContentType: 'text/plain',
      Metadata: {
        meetingId: meeting.meetingId,
        recordingId: meeting.recording.recordingId,
        format: 'txt',
        updatedAt: new Date().toISOString(),
      },
    });
    
    await s3Client.send(uploadCommand);
    
    meeting.transcription.fileKey = s3Key;
    meeting.transcription.fileSize = transcriptBuffer.length;
    
    await meeting.save();
    
    logger.info(`Transcript updated for meeting ${meetingId}`, {
      editedBy: userId,
      fileSize: transcriptBuffer.length,
    });
    
    return {
      meetingId: meeting.meetingId,
      message: 'Transcript updated successfully',
      transcript: meeting.transcription.formattedTranscript,
    };
  } catch (error) {
    logger.error(`Failed to update transcript for meeting ${meetingId}:`, error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to update transcript: ${error.message}`
    );
  }
};

/**
 * Get transcript download URL
 * @param {string} meetingId - Meeting ID
 * @param {string} userId - User ID (for authorization)
 * @param {string} format - Export format (txt, docx, pdf)
 * @returns {Promise<Object>}
 */
const getTranscriptDownloadUrl = async (meetingId, userId, format = 'txt') => {
  const meeting = await Meeting.findOne({ meetingId });
  
  if (!meeting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meeting not found');
  }
  
  if (meeting.transcription.status !== 'completed') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Transcription not completed yet');
  }
  
  // For now, only support TXT format
  // TODO: Add DOCX and PDF export support
  if (format !== 'txt') {
    throw new ApiError(httpStatus.BAD_REQUEST, `Export format ${format} not yet supported. Only 'txt' is available.`);
  }
  
  if (!meeting.transcription.fileKey) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Transcript file not found');
  }
  
  try {
    const presignedUrl = await generatePresignedDownloadUrl(meeting.transcription.fileKey, 3600);
    
    return {
      meetingId: meeting.meetingId,
      downloadUrl: presignedUrl,
      expiresIn: 3600,
      format,
      fileSize: meeting.transcription.fileSize,
    };
  } catch (error) {
    logger.error(`Failed to generate transcript download URL for meeting ${meetingId}:`, error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to generate download URL: ${error.message}`
    );
  }
};

export {
  startTranscription,
  getTranscriptionStatus,
  getTranscript,
  updateTranscript,
  getTranscriptDownloadUrl,
  transcribeRecording,
  formatTranscript,
};

