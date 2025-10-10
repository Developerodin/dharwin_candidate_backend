import multer from 'multer';
import ApiError from '../utils/ApiError.js';
import httpStatus from 'http-status';

// Configure multer for memory storage (we'll upload directly to S3)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(
      httpStatus.BAD_REQUEST, 
      `File type ${file.mimetype} is not allowed. Allowed types: PDF, Images (JPEG, PNG, GIF), Word docs, Excel files, Text files`
    ), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5, // Maximum 5 files per request
  },
});

// Middleware for single file upload
const uploadSingle = (fieldName = 'file') => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new ApiError(httpStatus.BAD_REQUEST, 'File size too large. Maximum size is 10MB.'));
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return next(new ApiError(httpStatus.BAD_REQUEST, 'Too many files. Maximum 5 files allowed.'));
          }
        }
        return next(err);
      }
      next();
    });
  };
};

// Middleware for multiple files upload
const uploadMultiple = (fieldName = 'files', maxCount = 5) => {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new ApiError(httpStatus.BAD_REQUEST, 'File size too large. Maximum size is 10MB.'));
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return next(new ApiError(httpStatus.BAD_REQUEST, `Too many files. Maximum ${maxCount} files allowed.`));
          }
        }
        return next(err);
      }
      next();
    });
  };
};

export { uploadSingle, uploadMultiple };
