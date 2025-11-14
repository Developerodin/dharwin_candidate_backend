import Joi from 'joi';
import { objectId } from './custom.validation.js';

const attachment = Joi.object({
  label: Joi.string().optional().trim(),
  url: Joi.string().uri().optional(),
  key: Joi.string().optional().trim(),
  originalName: Joi.string().optional().trim(),
  size: Joi.number().optional().integer().min(0),
  mimeType: Joi.string().optional().trim(),
  uploadedBy: Joi.string().custom(objectId).optional(),
  uploadedAt: Joi.date().optional(),
  _id: Joi.string().custom(objectId).optional(),
});

const subTask = Joi.object({
  title: Joi.string().required().trim().min(1).max(200).messages({
    'any.required': 'Sub-task title is required',
    'string.empty': 'Sub-task title cannot be empty',
  }),
  description: Joi.string().optional().trim().allow('', null).max(1000),
  isCompleted: Joi.boolean().optional().default(false),
  completedAt: Joi.date().optional().allow(null),
  completedBy: Joi.string().custom(objectId).optional(),
  order: Joi.number().optional().default(0),
  _id: Joi.string().custom(objectId).optional(),
});

const createTask = {
  body: Joi.object()
    .keys({
      title: Joi.string().required().trim().min(3).max(200).messages({
        'any.required': 'Task title is required',
        'string.empty': 'Task title cannot be empty',
        'string.min': 'Task title must be at least 3 characters',
        'string.max': 'Task title must not exceed 200 characters',
      }),
      description: Joi.string().optional().trim().allow('', null).max(5000),
      project: Joi.string().custom(objectId).required().messages({
        'any.required': 'Project is required',
      }),
      status: Joi.string()
        .valid('New', 'Todo', 'On Going', 'In Review', 'Completed')
        .optional()
        .default('New'),
      priority: Joi.string()
        .valid('Low', 'Medium', 'High', 'Critical')
        .optional()
        .default('Medium'),
      assignedDate: Joi.date().optional().allow(null),
      dueDate: Joi.date().optional().allow(null),
      assignedBy: Joi.string().custom(objectId).optional(),
      assignedTo: Joi.array().items(Joi.string().custom(objectId)).optional(),
      progress: Joi.number().integer().min(0).max(100).optional().default(0),
      efforts: Joi.object({
        hours: Joi.number().min(0).optional().default(0),
        minutes: Joi.number().min(0).max(59).optional().default(0),
        seconds: Joi.number().min(0).max(59).optional().default(0),
      }).optional(),
      tags: Joi.array().items(Joi.string().trim()).max(10).optional(),
      taskKey: Joi.string().optional().trim().default('SPK'),
      subTasks: Joi.array().items(subTask).optional(),
      attachments: Joi.array().items(attachment).optional(),
    })
    .required(),
};

const getTasks = {
  query: Joi.object().keys({
    title: Joi.string().optional(),
    project: Joi.string().custom(objectId).optional(),
    status: Joi.string()
      .valid('New', 'Todo', 'On Going', 'In Review', 'Completed')
      .optional(),
    priority: Joi.string().valid('Low', 'Medium', 'High', 'Critical').optional(),
    assignedTo: Joi.string().custom(objectId).optional(),
    createdBy: Joi.string().custom(objectId).optional(),
    tags: Joi.string().optional(), // Comma-separated tags
    sortBy: Joi.string().optional(),
    limit: Joi.number().integer().optional(),
    page: Joi.number().integer().optional(),
  }),
};

const getTask = {
  params: Joi.object().keys({
    taskId: Joi.string().custom(objectId).required(),
  }),
};

const updateTask = {
  params: Joi.object().keys({
    taskId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string().optional().trim().min(3).max(200),
      description: Joi.string().optional().trim().allow('', null).max(5000),
      status: Joi.string()
        .valid('New', 'Todo', 'On Going', 'In Review', 'Completed')
        .optional(),
      priority: Joi.string().valid('Low', 'Medium', 'High', 'Critical').optional(),
      assignedDate: Joi.date().optional().allow(null),
      dueDate: Joi.date()
        .optional()
        .allow(null)
        .custom((value, helpers) => {
          const { assignedDate } = helpers.state.ancestors[0];
          if (assignedDate && value && new Date(value) < new Date(assignedDate)) {
            return helpers.error('date.min');
          }
          return value;
        })
        .messages({
          'date.min': 'Due date must be after assigned date',
        }),
      assignedBy: Joi.string().custom(objectId).optional(),
      assignedTo: Joi.array().items(Joi.string().custom(objectId)).optional(),
      progress: Joi.number().integer().min(0).max(100).optional(),
      efforts: Joi.object({
        hours: Joi.number().min(0).optional(),
        minutes: Joi.number().min(0).max(59).optional(),
        seconds: Joi.number().min(0).max(59).optional(),
      }).optional(),
      tags: Joi.array().items(Joi.string().trim()).max(10).optional(),
      subTasks: Joi.array().items(subTask).optional(),
      attachments: Joi.array().items(attachment).optional(),
    })
    .min(1),
};

const deleteTask = {
  params: Joi.object().keys({
    taskId: Joi.string().custom(objectId).required(),
  }),
};

const getKanbanBoard = {
  query: Joi.object().keys({
    project: Joi.string().custom(objectId).optional(),
    priority: Joi.string().valid('Low', 'Medium', 'High', 'Critical').optional(),
    assignedTo: Joi.string().custom(objectId).optional(),
    tags: Joi.string().optional(),
  }),
};

const getStatistics = {
  query: Joi.object().keys({
    project: Joi.string().custom(objectId).optional(),
    priority: Joi.string().valid('Low', 'Medium', 'High', 'Critical').optional(),
    assignedTo: Joi.string().custom(objectId).optional(),
    tags: Joi.string().optional(),
  }),
};

const updateStatus = {
  params: Joi.object().keys({
    taskId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      status: Joi.string()
        .valid('New', 'Todo', 'On Going', 'In Review', 'Completed')
        .required()
        .messages({
          'any.required': 'Status is required',
        }),
    })
    .required(),
};

export {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  getKanbanBoard,
  getStatistics,
  updateStatus,
};

