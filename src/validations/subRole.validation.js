import Joi from 'joi';
import { objectId } from './custom.validation.js';

const createSubRole = {
  body: Joi.object().keys({
    name: Joi.string().required().trim().messages({
      'any.required': 'SubRole name is required',
      'string.empty': 'SubRole name cannot be empty'
    }),
    description: Joi.string().optional().trim().allow('', null),
    navigation: Joi.object().unknown(true).required().messages({
      'any.required': 'Navigation structure is required',
      'object.base': 'Navigation must be an object'
    }),
    isActive: Joi.boolean().optional().default(true),
  }),
};

const getSubRoles = {
  query: Joi.object().keys({
    name: Joi.string().optional(),
    isActive: Joi.boolean().optional(),
    sortBy: Joi.string().optional(),
    limit: Joi.number().integer().optional(),
    page: Joi.number().integer().optional(),
  }),
};

const getSubRole = {
  params: Joi.object().keys({
    subRoleId: Joi.string().custom(objectId).required(),
  }),
};

const updateSubRole = {
  params: Joi.object().keys({
    subRoleId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().optional().trim(),
      description: Joi.string().optional().trim().allow('', null),
      navigation: Joi.object().unknown(true).optional(),
      isActive: Joi.boolean().optional(),
    })
    .min(1)
    .messages({
      'object.min': 'At least one field must be provided for update'
    }),
};

const deleteSubRole = {
  params: Joi.object().keys({
    subRoleId: Joi.string().custom(objectId).required(),
  }),
};

export { createSubRole, getSubRoles, getSubRole, updateSubRole, deleteSubRole };
