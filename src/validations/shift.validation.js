import Joi from 'joi';
import { objectId } from './custom.validation.js';

// Custom validation for time format (HH:mm in 24-hour format)
const timeFormat = (value, helpers) => {
  if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
    return helpers.message('Time must be in HH:mm format (24-hour, e.g., "10:00", "18:00")');
  }
  return value;
};

// Custom validation to ensure endTime is after startTime
const validateTimeRange = (value, helpers) => {
  const { startTime, endTime } = helpers.state.ancestors[0];
  if (startTime && endTime) {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    // Allow overnight shifts (endTime < startTime means next day)
    // But if they're equal, that's invalid
    if (endTotalMinutes === startTotalMinutes) {
      return helpers.message('End time cannot be the same as start time');
    }
  }
  return value;
};

// Single shift schema for reuse
const shiftSchema = Joi.object()
  .keys({
    name: Joi.string().required().trim().min(1).max(200).messages({
      'any.required': 'Shift name is required',
      'string.empty': 'Shift name cannot be empty',
      'string.max': 'Shift name must not exceed 200 characters',
    }),
    description: Joi.string().optional().trim().max(1000).messages({
      'string.max': 'Description must not exceed 1000 characters',
    }),
    timezone: Joi.string().required().trim().messages({
      'any.required': 'Timezone is required',
      'string.empty': 'Timezone cannot be empty',
    }),
    startTime: Joi.string()
      .required()
      .custom(timeFormat)
      .messages({
        'any.required': 'Start time is required',
        'string.empty': 'Start time cannot be empty',
      }),
    endTime: Joi.string()
      .required()
      .custom(timeFormat)
      .custom(validateTimeRange)
      .messages({
        'any.required': 'End time is required',
        'string.empty': 'End time cannot be empty',
      }),
    isActive: Joi.boolean().optional().default(true),
  })
  .custom((value, helpers) => {
    // Additional validation to ensure endTime is after startTime
    const { startTime, endTime } = value;
    if (startTime && endTime) {
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      
      const startTotalMinutes = startHours * 60 + startMinutes;
      const endTotalMinutes = endHours * 60 + endMinutes;
      
      // Allow overnight shifts, but if equal, it's invalid
      if (endTotalMinutes === startTotalMinutes) {
        return helpers.error('any.custom', {
          message: 'End time cannot be the same as start time',
        });
      }
    }
    return value;
  });

const createShift = {
  body: Joi.alternatives()
    .try(
      // Single shift object
      shiftSchema,
      // Array of shifts
      Joi.array().items(shiftSchema).min(1).max(100).messages({
        'array.min': 'At least one shift is required',
        'array.max': 'Cannot create more than 100 shifts at once',
      })
    )
    .messages({
      'alternatives.match': 'Request body must be either a single shift object or an array of shifts',
    }),
};

const updateShift = {
  params: Joi.object().keys({
    shiftId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().optional().trim().min(1).max(200),
      description: Joi.string().optional().trim().max(1000).allow(null, ''),
      timezone: Joi.string().optional().trim(),
      startTime: Joi.string().optional().custom(timeFormat),
      endTime: Joi.string().optional().custom(timeFormat),
      isActive: Joi.boolean().optional(),
    })
    .custom((value, helpers) => {
      // Validate time range if both times are provided
      const { startTime, endTime } = value;
      if (startTime && endTime) {
        const [startHours, startMinutes] = startTime.split(':').map(Number);
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        
        const startTotalMinutes = startHours * 60 + startMinutes;
        const endTotalMinutes = endHours * 60 + endMinutes;
        
        if (endTotalMinutes === startTotalMinutes) {
          return helpers.error('any.custom', {
            message: 'End time cannot be the same as start time',
          });
        }
      }
      return value;
    }),
};

const getShift = {
  params: Joi.object().keys({
    shiftId: Joi.string().custom(objectId).required(),
  }),
};

const getShifts = {
  query: Joi.object().keys({
    name: Joi.string().optional().trim(),
    timezone: Joi.string().optional().trim(),
    isActive: Joi.boolean().optional(),
    sortBy: Joi.string().optional(),
    limit: Joi.number().integer().optional(),
    page: Joi.number().integer().optional(),
  }),
};

const deleteShift = {
  params: Joi.object().keys({
    shiftId: Joi.string().custom(objectId).required(),
  }),
};

export {
  createShift,
  updateShift,
  getShift,
  getShifts,
  deleteShift,
};

