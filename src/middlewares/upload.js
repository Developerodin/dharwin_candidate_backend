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

// File filter for video and audio files
const videoFileFilter = (req, file, cb) => {
  const allowedVideoTypes = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
  ];
  
  const allowedAudioTypes = [
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'audio/x-m4a',
  ];
  
  const allowedTypes = [...allowedVideoTypes, ...allowedAudioTypes];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(
      httpStatus.BAD_REQUEST, 
      `File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    ), false);
  }
};

// Configure multer for video files (larger file size limit)
const videoUpload = multer({
  storage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for video files
    files: 1, // Only 1 file per request
  },
});

// Middleware for single video file upload
const uploadVideo = (fieldName = 'file') => {
  return (req, res, next) => {
    videoUpload.single(fieldName)(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new ApiError(httpStatus.BAD_REQUEST, 'File size too large. Maximum size is 500MB.'));
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return next(new ApiError(httpStatus.BAD_REQUEST, 'Only one file allowed per request.'));
          }
        }
        return next(err);
      }
      next();
    });
  };
};

// File filter for images and videos
const imageVideoFileFilter = (req, file, cb) => {
  const allowedImageTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/svg+xml',
  ];
  
  const allowedVideoTypes = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/avi',
    'video/mov',
  ];
  
  const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(
      httpStatus.BAD_REQUEST, 
      `File type ${file.mimetype} is not allowed. Allowed types: Images (JPEG, PNG, GIF, WEBP, BMP, SVG) and Videos (MP4, WEBM, MOV, AVI, MKV)`
    ), false);
  }
};

// Configure multer for images and videos (support tickets)
const imageVideoUpload = multer({
  storage,
  fileFilter: imageVideoFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for images and videos
    files: 10, // Maximum 10 files per request
  },
});

// Middleware for multiple image/video file uploads (for support tickets)
const uploadImagesVideos = (fieldName = 'attachments', maxCount = 10) => {
  return (req, res, next) => {
    imageVideoUpload.array(fieldName, maxCount)(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new ApiError(httpStatus.BAD_REQUEST, 'File size too large. Maximum size is 100MB per file.'));
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

export { uploadSingle, uploadMultiple, uploadVideo, uploadImagesVideos };
