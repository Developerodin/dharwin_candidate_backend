import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import { uploadSingle, uploadMultiple } from '../../middlewares/upload.js';
import * as uploadController from '../../controllers/upload.controller.js';
import * as uploadValidation from '../../validations/upload.validation.js';

const router = express.Router();

// Upload single file directly to S3
router
  .route('/single')
  .post(
    auth(),
    uploadSingle('file'),
    validate(uploadValidation.uploadSingleFile),
    uploadController.uploadSingleFile
  );

// Upload multiple files directly to S3
router
  .route('/multiple')
  .post(
    auth(),
    uploadMultiple('files', 5),
    validate(uploadValidation.uploadMultipleFiles),
    uploadController.uploadMultipleFiles
  );

// Generate presigned URL for direct upload from frontend
router
  .route('/presigned-url')
  .post(
    auth(),
    validate(uploadValidation.getPresignedUploadUrl),
    uploadController.getPresignedUploadUrl
  );

// Confirm file upload and add to candidate profile (for presigned URL uploads)
router
  .route('/confirm')
  .post(
    auth(),
    validate(uploadValidation.confirmUpload),
    uploadController.confirmUpload
  );

export default router;
