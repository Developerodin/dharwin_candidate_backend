import Joi from 'joi';
import { objectId } from './custom.validation.js';

const uploadSingleFile = {
  body: Joi.object().keys({
    label: Joi.string().required().trim().messages({
      'string.empty': 'Document label is required',
      'any.required': 'Document label is required',
    }),
    candidateId: Joi.string().custom(objectId).optional().messages({
      'string.pattern.name': 'Invalid candidate ID format',
    }),
  }),
};

const uploadMultipleFiles = {
  body: Joi.object().keys({
    labels: Joi.string().optional().messages({
      'string.base': 'Labels must be a JSON string array',
    }),
    candidateId: Joi.string().custom(objectId).optional().messages({
      'string.pattern.name': 'Invalid candidate ID format',
    }),
  }),
};

const getPresignedUploadUrl = {
  body: Joi.object().keys({
    fileName: Joi.string().required().trim().messages({
      'string.empty': 'File name is required',
      'any.required': 'File name is required',
    }),
    contentType: Joi.string().required().messages({
      'string.empty': 'Content type is required',
      'any.required': 'Content type is required',
    }),
    candidateId: Joi.string().custom(objectId).optional().messages({
      'string.pattern.name': 'Invalid candidate ID format',
    }),
  }),
};

const confirmUpload = {
  body: Joi.object().keys({
    fileKey: Joi.string().required().trim().messages({
      'string.empty': 'File key is required',
      'any.required': 'File key is required',
    }),
    label: Joi.string().required().trim().messages({
      'string.empty': 'Document label is required',
      'any.required': 'Document label is required',
    }),
    candidateId: Joi.string().custom(objectId).required().messages({
      'string.empty': 'Candidate ID is required',
      'any.required': 'Candidate ID is required',
      'string.pattern.name': 'Invalid candidate ID format',
    }),
  }),
};

export {
  uploadSingleFile,
  uploadMultipleFiles,
  getPresignedUploadUrl,
  confirmUpload,
};
