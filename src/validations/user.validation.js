import Joi from 'joi';
import { password, objectId } from './custom.validation.js';


const createUser = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    role: Joi.string().required().valid('user', 'admin', 'supervisor', 'recruiter'),
    phoneNumber: Joi.string().optional().pattern(/^[\+]?[1-9][\d]{0,15}$/).messages({
      'string.pattern.base': 'Phone number must be a valid mobile phone number'
    }),
    adminId: Joi.when('role', {
      is: 'user',
      then: Joi.string().required().custom(objectId).messages({
        'any.required': 'Admin ID is required when role is user'
      }),
      otherwise: Joi.forbidden()
    }),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    name: Joi.string(),
    role: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email(),
      password: Joi.string().custom(password),
      name: Joi.string(),
      phoneNumber: Joi.string().optional().pattern(/^[\+]?[1-9][\d]{0,15}$/).messages({
        'string.pattern.base': 'Phone number must be a valid mobile phone number'
      }),
      adminId: Joi.string().optional().custom(objectId),
    })
    .min(1),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId),
  }),
};

export { createUser, getUsers, getUser, updateUser, deleteUser };

