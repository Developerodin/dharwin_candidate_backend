import Joi from 'joi';
import { password, objectId } from './custom.validation.js';


const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    role: Joi.string().required().valid('user', 'admin'),
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

const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

const logout = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
  }),
};

const resetPassword = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
  }),
};

const verifyEmail = {
  body: Joi.object().keys({
    token: Joi.string().required(),
  }),
};

const sendCandidateInvitation = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    onboardUrl: Joi.string().uri().required(),
  }),
};

export { register, login, logout, refreshTokens, forgotPassword, resetPassword, verifyEmail, sendCandidateInvitation };

