import Joi from 'joi';
import { objectId, password as passwordValidator } from './custom.validation.js';

const document = Joi.object({
  label: Joi.string().optional().trim(),
  url: Joi.string().uri().optional(),
  key: Joi.string().optional().trim(),
  originalName: Joi.string().optional().trim(),
  size: Joi.number().optional().integer().min(0),
  mimeType: Joi.string().optional().trim(),
  status: Joi.number().optional().integer().default(0),
});

const qualification = Joi.object({
  degree: Joi.string().required(),
  institute: Joi.string().required(),
  location: Joi.string().allow('', null),
  startYear: Joi.number().integer().min(1900).max(3000).allow(null),
  endYear: Joi.number().integer().min(1900).max(3000).allow(null),
  description: Joi.string().allow('', null),
});

const experience = Joi.object({
  company: Joi.string().required(),
  role: Joi.string().required(),
  startDate: Joi.date().allow(null),
  endDate: Joi.date().allow(null),
  description: Joi.string().allow('', null),
});

const skill = Joi.object({
  name: Joi.string().required(),
  level: Joi.string().valid('Beginner', 'Intermediate', 'Advanced', 'Expert').default('Beginner'),
  category: Joi.string().allow('', null),
});

const socialLink = Joi.object({
  platform: Joi.string().required(),
  url: Joi.string().uri().required(),
});

const salarySlip = Joi.object({
  month: Joi.string().optional().trim(),
  year: Joi.number().integer().min(1900).max(2100).optional(),
  documentUrl: Joi.string().uri().optional(),
  key: Joi.string().optional().trim(),
  originalName: Joi.string().optional().trim(),
  size: Joi.number().optional().integer().min(0),
  mimeType: Joi.string().optional().trim(),
});

const singleCandidateSchema = Joi.object().keys({
  owner: Joi.string().custom(objectId), // admin can set
  role: Joi.string().valid('user').optional(), // role for candidate
  adminId: Joi.when('role', {
    is: 'user',
    then: Joi.string().required().custom(objectId).messages({
      'any.required': 'Admin ID is required when role is user'
    }),
    otherwise: Joi.forbidden()
  }),
  fullName: Joi.string().required(),
  email: Joi.string().email().required(),
  phoneNumber: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be a valid 10-digit Indian mobile number (without +91 prefix)',
      'any.required': 'Phone number is required'
    }),
  password: Joi.string().custom(passwordValidator), // only admin will use
  shortBio: Joi.string().allow('', null),
  sevisId: Joi.string().allow('', null),
  ead: Joi.string().allow('', null),
  degree: Joi.string().allow('', null),
  supervisorName: Joi.string().allow('', null),
  supervisorContact: Joi.string().allow('', null),
  qualifications: Joi.array().items(qualification),
  experiences: Joi.array().items(experience),
  documents: Joi.array().items(document),
  skills: Joi.array().items(skill),
  socialLinks: Joi.array().items(socialLink),
  salarySlips: Joi.array().items(salarySlip),
});

const createCandidate = {
  body: Joi.alternatives().try(
    // Single candidate object
    singleCandidateSchema,
    // Array of candidates (for bulk creation)
    Joi.array()
      .items(singleCandidateSchema)
      .min(1)
      .max(50) // Limit to 50 candidates at once
      .messages({
        'array.min': 'At least one candidate is required',
        'array.max': 'Cannot create more than 50 candidates at once'
      })
  ).required(),
};

const getCandidates = {
  query: Joi.object().keys({
    owner: Joi.string().custom(objectId),
    fullName: Joi.string(),
    email: Joi.string().email(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getCandidate = {
  params: Joi.object().keys({
    candidateId: Joi.string().custom(objectId),
  }),
};

const updateCandidate = {
  params: Joi.object().keys({
    candidateId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      fullName: Joi.string(),
      email: Joi.string().email(),
      phoneNumber: Joi.string()
        .pattern(/^[6-9]\d{9}$/)
        .messages({
          'string.pattern.base': 'Phone number must be a valid 10-digit Indian mobile number (without +91 prefix)'
        }),
      shortBio: Joi.string().allow('', null),
      sevisId: Joi.string().allow('', null),
      ead: Joi.string().allow('', null),
      degree: Joi.string().allow('', null),
      supervisorName: Joi.string().allow('', null),
      supervisorContact: Joi.string().allow('', null),
      qualifications: Joi.array().items(qualification),
      experiences: Joi.array().items(experience),
      documents: Joi.array().items(document),
      skills: Joi.array().items(skill),
      socialLinks: Joi.array().items(socialLink),
      salarySlips: Joi.array().items(salarySlip),
    })
    .min(1),
};

const deleteCandidate = {
  params: Joi.object().keys({
    candidateId: Joi.string().custom(objectId),
  }),
};

const createCandidateByAdmin = {
  body: Joi.object()
    .keys({
      fullName: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string().custom(passwordValidator).required(), // Required for admin-created candidates
      phoneNumber: Joi.string()
        .pattern(/^[6-9]\d{9}$/)
        .required()
        .messages({
          'string.pattern.base': 'Phone number must be a valid 10-digit Indian mobile number (without +91 prefix)',
          'any.required': 'Phone number is required'
        }),
      shortBio: Joi.string().allow('', null),
      sevisId: Joi.string().allow('', null),
      ead: Joi.string().allow('', null),
      degree: Joi.string().allow('', null),
      supervisorName: Joi.string().allow('', null),
      supervisorContact: Joi.string().allow('', null),
      qualifications: Joi.array().items(qualification),
      experiences: Joi.array().items(experience),
      documents: Joi.array().items(document),
      skills: Joi.array().items(skill),
      socialLinks: Joi.array().items(socialLink),
      salarySlips: Joi.array().items(salarySlip),
    })
    .required(),
};

export { createCandidate, createCandidateByAdmin, getCandidates, getCandidate, updateCandidate, deleteCandidate };

const exportCandidate = {
  params: Joi.object().keys({
    candidateId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const exportAllCandidates = {
  query: Joi.object().keys({
    owner: Joi.string().custom(objectId),
    fullName: Joi.string(),
    email: Joi.string().email(),
  }),
  body: Joi.object().keys({
    email: Joi.string().email().optional(),
  }),
};

export { exportCandidate, exportAllCandidates };

// Salary slip management validations
const addSalarySlip = {
  params: Joi.object().keys({
    candidateId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    month: Joi.string().required().trim(),
    year: Joi.number().required().integer().min(1900).max(2100),
    documentUrl: Joi.string().uri().required(),
    key: Joi.string().required().trim(),
    originalName: Joi.string().required().trim(),
    size: Joi.number().required().integer().min(0),
    mimeType: Joi.string().required().trim(),
  }).required(),
};

const updateSalarySlip = {
  params: Joi.object().keys({
    candidateId: Joi.string().custom(objectId).required(),
    salarySlipIndex: Joi.number().integer().min(0).required(),
  }),
  body: Joi.object().keys({
    month: Joi.string().optional().trim(),
    year: Joi.number().optional().integer().min(1900).max(2100),
    documentUrl: Joi.string().uri().optional(),
    key: Joi.string().optional().trim(),
    originalName: Joi.string().optional().trim(),
    size: Joi.number().optional().integer().min(0),
    mimeType: Joi.string().optional().trim(),
  }).min(1).required(),
};

const deleteSalarySlip = {
  params: Joi.object().keys({
    candidateId: Joi.string().custom(objectId).required(),
    salarySlipIndex: Joi.number().integer().min(0).required(),
  }),
};

export { addSalarySlip, updateSalarySlip, deleteSalarySlip };

// Document verification validations
const verifyDocument = {
  params: Joi.object().keys({
    candidateId: Joi.string().custom(objectId).required(),
    documentIndex: Joi.number().integer().min(0).required(),
  }),
  body: Joi.object().keys({
    status: Joi.number().integer().valid(0, 1, 2).required().messages({
      'any.only': 'Status must be 0 (pending), 1 (approved), or 2 (rejected)',
      'any.required': 'Status is required'
    }),
    adminNotes: Joi.string().optional().trim().max(500).messages({
      'string.max': 'Admin notes cannot exceed 500 characters'
    }),
  }).required(),
};

const getDocumentStatus = {
  params: Joi.object().keys({
    candidateId: Joi.string().custom(objectId).required(),
  }),
};

const getDocuments = {
  params: Joi.object().keys({
    candidateId: Joi.string().custom(objectId).required(),
  }),
};

export { verifyDocument, getDocumentStatus, getDocuments };

// Share candidate profile validation
const shareCandidateProfile = {
  params: Joi.object().keys({
    candidateId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Recipient email is required'
    }),
    withDoc: Joi.boolean().default(false).messages({
      'boolean.base': 'withDoc must be a boolean value'
    }),
  }).required(),
};

export { shareCandidateProfile };


