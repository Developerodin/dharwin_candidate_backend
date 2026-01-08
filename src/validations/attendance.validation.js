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

const addHolidaysToCandidates = {
  body: Joi.object().keys({
    candidateIds: Joi.array()
      .items(Joi.string().custom(objectId))
      .min(1)
      .required()
      .messages({
        'array.min': 'At least one candidate ID is required',
        'any.required': 'Candidate IDs are required',
      }),
    holidayIds: Joi.array()
      .items(Joi.string().custom(objectId))
      .min(1)
      .required()
      .messages({
        'array.min': 'At least one holiday ID is required',
        'any.required': 'Holiday IDs are required',
      }),
  }),
};

const assignLeavesToCandidates = {
  body: Joi.object().keys({
    candidateIds: Joi.array()
      .items(Joi.string().custom(objectId))
      .min(1)
      .required()
      .messages({
        'array.min': 'At least one candidate ID is required',
        'any.required': 'Candidate IDs are required',
      }),
    dates: Joi.array()
      .items(Joi.date())
      .min(1)
      .required()
      .messages({
        'array.min': 'At least one date is required',
        'any.required': 'Dates are required',
        'array.base': 'Dates must be an array',
      }),
    leaveType: Joi.string()
      .valid('casual', 'sick')
      .required()
      .messages({
        'any.required': 'Leave type is required',
        'any.only': 'Leave type must be either "casual" or "sick"',
      }),
    notes: Joi.string().optional().trim().allow('', null),
  }),
};

const updateLeave = {
  params: Joi.object().keys({
    candidateId: Joi.string().custom(objectId).required(),
    leaveId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      date: Joi.date().optional().messages({
        'date.base': 'Date must be a valid date',
      }),
      leaveType: Joi.string()
        .valid('casual', 'sick')
        .optional()
        .messages({
          'any.only': 'Leave type must be either "casual" or "sick"',
        }),
      notes: Joi.string().optional().trim().allow('', null),
    })
    .min(1)
    .messages({
      'object.min': 'At least one field must be provided for update',
    }),
};

const deleteLeave = {
  params: Joi.object().keys({
    candidateId: Joi.string().custom(objectId).required(),
    leaveId: Joi.string().custom(objectId).required(),
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
  addHolidaysToCandidates,
  assignLeavesToCandidates,
  updateLeave,
  deleteLeave,
};

