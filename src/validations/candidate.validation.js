import Joi from 'joi';
import { objectId, password as passwordValidator } from './custom.validation.js';

const document = Joi.object({
  label: Joi.string().required(),
  url: Joi.string().uri().required(),
  key: Joi.string().optional().trim(),
  originalName: Joi.string().optional().trim(),
  size: Joi.number().optional().integer().min(0),
  mimeType: Joi.string().optional().trim(),
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
  month: Joi.string().required().trim().messages({
    'string.empty': 'Month is required',
    'any.required': 'Month is required'
  }),
  year: Joi.number().integer().min(1900).max(2100).required().messages({
    'number.base': 'Year must be a number',
    'number.integer': 'Year must be an integer',
    'number.min': 'Year must be at least 1900',
    'number.max': 'Year must be at most 2100',
    'any.required': 'Year is required'
  }),
  documentUrl: Joi.string().uri().required().messages({
    'string.uri': 'Document URL must be a valid URL',
    'any.required': 'Document URL is required'
  }),
  key: Joi.string().optional().trim(),
  originalName: Joi.string().optional().trim(),
  size: Joi.number().optional().integer().min(0),
  mimeType: Joi.string().optional().trim(),
});

const createCandidate = {
  body: Joi.object()
    .keys({
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
    })
    .required(),
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

export { exportCandidate };


