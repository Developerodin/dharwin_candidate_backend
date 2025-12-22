import Joi from 'joi';
import { objectId } from './custom.validation.js';

const punchIn = {
  body: Joi.object().keys({
    punchInTime: Joi.date().optional(),
    notes: Joi.string().optional().trim().allow('', null),
    timezone: Joi.string().optional().trim().description('Timezone (e.g., America/New_York, America/Los_Angeles, Asia/Kolkata, UTC). If not provided, defaults to UTC.'),
  }),
  params: Joi.object().keys({
    candidateId: Joi.string().custom(objectId).required(),
  }),
};

const punchOut = {
  body: Joi.object().keys({
    punchOutTime: Joi.date().optional(),
    notes: Joi.string().optional().trim().allow('', null),
    timezone: Joi.string().optional().trim().description('Timezone (e.g., America/New_York, America/Los_Angeles, Asia/Kolkata, UTC). If not provided, uses the timezone from punch-in record.'),
  }),
  params: Joi.object().keys({
    candidateId: Joi.string().custom(objectId).required(),
  }),
};

const getAttendance = {
  params: Joi.object().keys({
    candidateId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    sortBy: Joi.string().optional(),
    limit: Joi.number().integer().optional(),
    page: Joi.number().integer().optional(),
  }),
};

const getAllAttendance = {
  query: Joi.object().keys({
    candidate: Joi.string().custom(objectId).optional(),
    candidateEmail: Joi.string().email().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    day: Joi.string().valid('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday').optional(),
    sortBy: Joi.string().optional(),
    limit: Joi.number().integer().optional(),
    page: Joi.number().integer().optional(),
  }),
};

const getAttendanceById = {
  params: Joi.object().keys({
    attendanceId: Joi.string().custom(objectId).required(),
  }),
};

const getCurrentStatus = {
  params: Joi.object().keys({
    candidateId: Joi.string().custom(objectId).required(),
  }),
};

const getStatistics = {
  params: Joi.object().keys({
    candidateId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
  }),
};

export {
  punchIn,
  punchOut,
  getAttendance,
  getAllAttendance,
  getAttendanceById,
  getCurrentStatus,
  getStatistics,
};

