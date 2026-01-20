import Joi from 'joi';
import { objectId } from './custom.validation.js';

const createCandidateGroup = {
  body: Joi.object().keys({
    name: Joi.string().required().trim().min(1).max(200).messages({
      'any.required': 'Group name is required',
      'string.empty': 'Group name cannot be empty',
      'string.max': 'Group name must not exceed 200 characters',
    }),
    description: Joi.string().optional().trim().max(1000).allow('', null),
    candidateIds: Joi.array()
      .items(Joi.string().custom(objectId))
      .optional()
      .messages({
        'array.base': 'Candidate IDs must be an array',
      }),
  }),
};

const updateCandidateGroup = {
  params: Joi.object().keys({
    groupId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().optional().trim().min(1).max(200),
      description: Joi.string().optional().trim().max(1000).allow('', null),
      candidateIds: Joi.array()
        .items(Joi.string().custom(objectId))
        .optional()
        .messages({
          'array.base': 'Candidate IDs must be an array',
        }),
      isActive: Joi.boolean().optional(),
    })
    .min(1)
    .messages({
      'object.min': 'At least one field must be provided for update',
    }),
};

const getCandidateGroup = {
  params: Joi.object().keys({
    groupId: Joi.string().custom(objectId).required(),
  }),
};

const getCandidateGroups = {
  query: Joi.object().keys({
    name: Joi.string().optional().trim(),
    isActive: Joi.boolean().optional(),
    createdBy: Joi.string().custom(objectId).optional(),
    sortBy: Joi.string().optional(),
    limit: Joi.number().integer().optional(),
    page: Joi.number().integer().optional(),
  }),
};

const deleteCandidateGroup = {
  params: Joi.object().keys({
    groupId: Joi.string().custom(objectId).required(),
  }),
};

const addCandidatesToGroup = {
  params: Joi.object().keys({
    groupId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    candidateIds: Joi.array()
      .items(Joi.string().custom(objectId))
      .min(1)
      .required()
      .messages({
        'array.min': 'At least one candidate ID is required',
        'any.required': 'Candidate IDs are required',
        'array.base': 'Candidate IDs must be an array',
      }),
  }),
};

const removeCandidatesFromGroup = {
  params: Joi.object().keys({
    groupId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    candidateIds: Joi.array()
      .items(Joi.string().custom(objectId))
      .min(1)
      .required()
      .messages({
        'array.min': 'At least one candidate ID is required',
        'any.required': 'Candidate IDs are required',
        'array.base': 'Candidate IDs must be an array',
      }),
  }),
};

const assignHolidaysToGroup = {
  params: Joi.object().keys({
    groupId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    holidayIds: Joi.array()
      .items(Joi.string().custom(objectId))
      .min(1)
      .required()
      .messages({
        'array.min': 'At least one holiday ID is required',
        'any.required': 'Holiday IDs are required',
        'array.base': 'Holiday IDs must be an array',
      }),
  }),
};

const removeHolidaysFromGroup = {
  params: Joi.object().keys({
    groupId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    holidayIds: Joi.array()
      .items(Joi.string().custom(objectId))
      .min(1)
      .required()
      .messages({
        'array.min': 'At least one holiday ID is required',
        'any.required': 'Holiday IDs are required',
        'array.base': 'Holiday IDs must be an array',
      }),
  }),
};

export {
  createCandidateGroup,
  updateCandidateGroup,
  getCandidateGroup,
  getCandidateGroups,
  deleteCandidateGroup,
  addCandidatesToGroup,
  removeCandidatesFromGroup,
  assignHolidaysToGroup,
  removeHolidaysFromGroup,
};
