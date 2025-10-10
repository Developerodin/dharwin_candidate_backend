import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import { uploadFileToS3, uploadMultipleFilesToS3, generatePresignedUploadUrl } from '../services/upload.service.js';
import { updateCandidateById } from '../services/candidate.service.js';
import ApiError from '../utils/ApiError.js';

// Upload single file directly to S3
const uploadSingleFile = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No file provided');
  }

  const userId = req.user.id;
  const { label, candidateId } = req.body;

  if (!label) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Document label is required');
  }

  // Upload file to S3
  const uploadResult = await uploadFileToS3(req.file, userId);

  // If candidateId is provided, add document to candidate profile
  if (candidateId) {
    const candidate = await updateCandidateById(candidateId, {
      $push: {
        documents: {
          label,
          url: uploadResult.url,
          key: uploadResult.key,
          originalName: uploadResult.originalName,
          size: uploadResult.size,
          mimeType: uploadResult.mimeType,
        },
      },
    }, req.user);

    return res.status(httpStatus.CREATED).json({
      success: true,
      message: 'File uploaded and added to candidate profile successfully',
      data: {
        file: uploadResult,
        candidate: candidate,
      },
    });
  }

  // Return upload result without adding to candidate
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'File uploaded successfully',
    data: uploadResult,
  });
});

// Upload multiple files directly to S3
const uploadMultipleFiles = catchAsync(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No files provided');
  }

  const userId = req.user.id;
  const { candidateId } = req.body;
  const labels = req.body.labels ? JSON.parse(req.body.labels) : [];

  // Upload files to S3
  const uploadResults = await uploadMultipleFilesToS3(req.files, userId);

  // If candidateId is provided, add documents to candidate profile
  if (candidateId) {
    const documents = uploadResults.map((result, index) => ({
      label: labels[index] || `Document ${index + 1}`,
      url: result.url,
      key: result.key,
      originalName: result.originalName,
      size: result.size,
      mimeType: result.mimeType,
    }));

    const candidate = await updateCandidateById(candidateId, {
      $push: {
        documents: { $each: documents },
      },
    }, req.user);

    return res.status(httpStatus.CREATED).json({
      success: true,
      message: 'Files uploaded and added to candidate profile successfully',
      data: {
        files: uploadResults,
        candidate: candidate,
      },
    });
  }

  // Return upload results without adding to candidate
  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'Files uploaded successfully',
    data: uploadResults,
  });
});

// Generate presigned URL for direct upload from frontend
const getPresignedUploadUrl = catchAsync(async (req, res) => {
  const { fileName, contentType, candidateId } = req.body;
  const userId = req.user.id;

  if (!fileName || !contentType) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'fileName and contentType are required');
  }

  const presignedData = await generatePresignedUploadUrl(fileName, contentType, userId);

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Presigned URL generated successfully',
    data: {
      presignedUrl: presignedData.presignedUrl,
      fileKey: presignedData.fileKey,
      expiresIn: presignedData.expiresIn,
      candidateId, // Return candidateId for frontend to use when confirming upload
    },
  });
});

// Confirm file upload and add to candidate profile (for presigned URL uploads)
const confirmUpload = catchAsync(async (req, res) => {
  const { fileKey, label, candidateId } = req.body;
  const userId = req.user.id;

  if (!fileKey || !label || !candidateId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'fileKey, label, and candidateId are required');
  }

  // Generate download URL for the uploaded file
  const { generatePresignedDownloadUrl } = await import('../config/s3.js');
  const fileUrl = await generatePresignedDownloadUrl(fileKey, 7 * 24 * 3600); // 7 days expiry

  // Add document to candidate profile
  const candidate = await updateCandidateById(candidateId, {
    $push: {
      documents: {
        label,
        url: fileUrl,
        key: fileKey,
        originalName: req.body.originalFileName || fileKey.split('/').pop(),
        // Note: size and mimeType not available in presigned URL flow
      },
    },
  }, req.user);

  res.status(httpStatus.CREATED).json({
    success: true,
    message: 'File upload confirmed and added to candidate profile',
    data: {
      document: {
        label,
        url: fileUrl,
        fileKey,
      },
      candidate: candidate,
    },
  });
});

export {
  uploadSingleFile,
  uploadMultipleFiles,
  getPresignedUploadUrl,
  confirmUpload,
};
