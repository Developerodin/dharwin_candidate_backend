import Joi from 'joi';
import { objectId } from './custom.validation.js';

const getLoginLogs = {
  query: Joi.object().keys({
    email: Joi.string().email(),
    role: Joi.string().valid('user', 'admin'),
    userId: Joi.string().custom(objectId),
    isActive: Joi.boolean(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1),
    page: Joi.number().integer().min(1),
  }),
};

const getLoginLog = {
  params: Joi.object().keys({
    loginLogId: Joi.string().required().custom(objectId),
  }),
};

const getLoginLogsByUser = {
  params: Joi.object().keys({
    userId: Joi.string().required().custom(objectId),
  }),
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1),
    page: Joi.number().integer().min(1),
  }),
};

const getActiveSessions = {
  query: Joi.object().keys({
    sortBy: Joi.string(),
    limit: Joi.number().integer().min(1),
    page: Joi.number().integer().min(1),
  }),
};

const getLoginStatistics = {
  query: Joi.object().keys({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
    role: Joi.string().valid('user', 'admin'),
  }),
};

export {
  getLoginLogs,
  getLoginLog,
  getLoginLogsByUser,
  getActiveSessions,
  getLoginStatistics,
};

