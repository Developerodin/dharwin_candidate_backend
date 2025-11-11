import fs from 'fs/promises';
import path from 'path';
import { s3Client, generatePresignedDownloadUrl } from '../config/s3.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import config from '../config/config.js';
import logger from '../config/logger.js';

/**
 * Generate S3 key for recording file
 * @param {string} meetingId - Meeting ID
 * @param {string} recordingId - Recording ID
 * @param {string} format - File format (mp4, webm, etc.)
 * @returns {string} S3 key
 */
const generateRecordingS3Key = (meetingId, recordingId, format) => {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `recordings/${timestamp}/${meetingId}/${recordingId}.${format}`;
};

/**
 * Upload recording file to S3
 * @param {Buffer|string} fileData - File buffer (from multer) or local file path
 * @param {string} meetingId - Meeting ID
 * @param {string} recordingId - Recording ID
 * @param {string} format - File format
 * @returns {Promise<Object>} Upload result with S3 key and URL
 */
const uploadRecordingToS3 = async (fileData, meetingId, recordingId, format) => {
  try {
    let fileBuffer;
    let fileSize;
    
    // Handle both Buffer (from multer) and file path
    if (Buffer.isBuffer(fileData)) {
      // File data is already a buffer (from multer memory storage)
      fileBuffer = fileData;
      fileSize = fileBuffer.length;
    } else {
      // File data is a file path (legacy support)
      try {
        await fs.access(fileData);
      } catch (error) {
        throw new Error(`Recording file not found: ${fileData}`);
      }
      
      logger.info(`Reading recording file: ${fileData}`);
      fileBuffer = await fs.readFile(fileData);
      fileSize = fileBuffer.length;
    }

    // Generate S3 key
    const s3Key = generateRecordingS3Key(meetingId, recordingId, format);

    // Determine content type based on format
    const contentTypeMap = {
      // Video formats
      mp4: 'video/mp4',
      webm: 'video/webm',
      m3u8: 'application/vnd.apple.mpegurl',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      mkv: 'video/x-matroska',
      // Audio formats
      mp3: 'audio/mpeg',
      m4a: 'audio/mp4',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
    };
    const contentType = contentTypeMap[format] || 'video/mp4';

    logger.info(`Uploading recording to S3: ${s3Key} (${fileSize} bytes, ${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: config.aws.bucketName,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: contentType,
      Metadata: {
        meetingId,
        recordingId,
        format,
        uploadedAt: new Date().toISOString(),
      },
    });

    await s3Client.send(uploadCommand);

    logger.info(`Recording uploaded to S3 successfully: ${s3Key}`);

    // Generate S3 URL (public URL if bucket is public, otherwise use presigned URL)
    const s3Url = `https://${config.aws.bucketName}.s3.${config.aws.region}.amazonaws.com/${s3Key}`;

    return {
      s3Key,
      s3Url,
      fileSize,
      contentType,
    };
  } catch (error) {
    logger.error(`Failed to upload recording to S3: ${error.message}`, error);
    throw error;
  }
};

/**
 * Delete local recording file
 * @param {string} localFilePath - Local file path
 * @returns {Promise<void>}
 */
const deleteLocalRecording = async (localFilePath) => {
  try {
    await fs.unlink(localFilePath);
    logger.info(`Deleted local recording file: ${localFilePath}`);
  } catch (error) {
    logger.error(`Failed to delete local recording file: ${localFilePath}`, error);
    // Don't throw error - file cleanup failure shouldn't break the flow
  }
};

/**
 * Upload recording to S3 and cleanup local file
 * @param {string} localFilePath - Local file path
 * @param {string} meetingId - Meeting ID
 * @param {string} recordingId - Recording ID
 * @param {string} format - File format
 * @param {boolean} deleteLocal - Whether to delete local file after upload (default: true)
 * @returns {Promise<Object>} Upload result
 */
const uploadAndCleanup = async (localFilePath, meetingId, recordingId, format, deleteLocal = true) => {
  try {
    // Upload to S3
    const uploadResult = await uploadRecordingToS3(localFilePath, meetingId, recordingId, format);

    // Delete local file if requested
    if (deleteLocal) {
      await deleteLocalRecording(localFilePath);
    }

    return uploadResult;
  } catch (error) {
    logger.error(`Failed to upload and cleanup recording: ${error.message}`, error);
    throw error;
  }
};

/**
 * Get presigned download URL for recording
 * @param {string} s3Key - S3 key
 * @param {number} expiresIn - Expiration time in seconds (default: 3600)
 * @returns {Promise<string>} Presigned URL
 */
const getPresignedDownloadUrl = async (s3Key, expiresIn = 3600) => {
  try {
    const url = await generatePresignedDownloadUrl(s3Key, expiresIn);
    return url;
  } catch (error) {
    logger.error(`Failed to generate presigned URL for ${s3Key}: ${error.message}`, error);
    throw error;
  }
};

export {
  uploadRecordingToS3,
  uploadAndCleanup,
  deleteLocalRecording,
  getPresignedDownloadUrl,
  generateRecordingS3Key,
};

