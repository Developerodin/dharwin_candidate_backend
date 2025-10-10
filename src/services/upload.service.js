import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, generateFileKey, generatePresignedDownloadUrl } from '../config/s3.js';
import config from '../config/config.js';
import ApiError from '../utils/ApiError.js';
import httpStatus from 'http-status';

// Upload file directly to S3
const uploadFileToS3 = async (file, userId, folder = 'documents') => {
  try {
    const fileKey = generateFileKey(file.originalname, userId, folder);
    
    const uploadParams = {
      Bucket: config.aws.bucketName,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        originalName: file.originalname,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
      },
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Generate presigned URL for accessing the file
    const fileUrl = await generatePresignedDownloadUrl(fileKey, 7 * 24 * 3600); // 7 days expiry

    return {
      key: fileKey,
      url: fileUrl,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to upload file: ${error.message}`);
  }
};

// Upload multiple files to S3
const uploadMultipleFilesToS3 = async (files, userId, folder = 'documents') => {
  try {
    const uploadPromises = files.map(file => uploadFileToS3(file, userId, folder));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to upload files: ${error.message}`);
  }
};

// Generate presigned URL for direct upload from frontend
const generatePresignedUploadUrl = async (fileName, contentType, userId, folder = 'documents') => {
  try {
    const fileKey = generateFileKey(fileName, userId, folder);
    const { generatePresignedUploadUrl: generateUrl } = await import('../config/s3.js');
    
    const presignedUrl = await generateUrl(fileKey, contentType, 3600); // 1 hour expiry
    
    return {
      presignedUrl,
      fileKey,
      expiresIn: 3600,
    };
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to generate presigned URL: ${error.message}`);
  }
};

export {
  uploadFileToS3,
  uploadMultipleFilesToS3,
  generatePresignedUploadUrl,
};
