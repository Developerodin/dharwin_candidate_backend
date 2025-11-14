import Joi from 'joi';
import { objectId } from './custom.validation.js';

const attachment = Joi.object({
  label: Joi.string().optional().trim(),
  url: Joi.string().uri().optional(),
  key: Joi.string().optional().trim(),
  originalName: Joi.string().optional().trim(),
  size: Joi.number().optional().integer().min(0),
  mimeType: Joi.string().optional().trim(),
});

const goal = Joi.alternatives().try(
  Joi.string().trim(),
  Joi.object({
    title: Joi.string().optional().trim(),
    description: Joi.string().optional().trim(),
  })
);

const objective = Joi.alternatives().try(
  Joi.string().trim(),
  Joi.object({
    title: Joi.string().optional().trim(),
    description: Joi.string().optional().trim(),
  })
);

const deliverable = Joi.object({
  title: Joi.string().required().trim(),
  description: Joi.string().optional().trim().allow('', null),
  dueDate: Joi.date().optional().allow(null),
  status: Joi.string().valid('Pending', 'In Progress', 'Completed', 'Delayed').optional().default('Pending'),
});

const resource = Joi.object({
  type: Joi.string().valid('Budget', 'Equipment', 'Tool', 'Software', 'Service', 'Other').required(),
  name: Joi.string().required().trim(),
  description: Joi.string().optional().trim().allow('', null),
  quantity: Joi.number().optional().allow(null),
  cost: Joi.number().optional().allow(null),
  unit: Joi.string().optional().trim().allow('', null),
});

const stakeholder = Joi.object({
  name: Joi.string().required().trim(),
  role: Joi.string().optional().trim().allow('', null),
  email: Joi.string().email().optional().trim().allow('', null),
  phone: Joi.string().optional().trim().allow('', null),
  organization: Joi.string().optional().trim().allow('', null),
  notes: Joi.string().optional().trim().allow('', null),
});

const createProject = {
  body: Joi.object().keys({
    projectName: Joi.string().required().trim().messages({
      'any.required': 'Project name is required',
      'string.empty': 'Project name cannot be empty'
    }),
    projectManager: Joi.string().optional().trim().allow('', null),
    clientStakeholder: Joi.string().optional().trim().allow('', null),
    projectDescription: Joi.string().optional().trim().allow('', null),
    startDate: Joi.date().optional().allow(null),
    endDate: Joi.date().optional().allow(null).custom((value, helpers) => {
      const { startDate } = helpers.state.ancestors[0];
      if (startDate && value && new Date(value) < new Date(startDate)) {
        return helpers.error('date.min');
      }
      return value;
    }).messages({
      'date.min': 'End date must be after start date'
    }),
    status: Joi.string().valid('Not Started', 'Inprogress', 'On Hold', 'Completed', 'Cancelled').optional().default('Inprogress'),
    priority: Joi.string().valid('Low', 'Medium', 'High', 'Critical').optional().default('High'),
    assignedTo: Joi.array().items(Joi.string().custom(objectId)).optional(),
    tags: Joi.array().items(Joi.string().trim()).optional(),
    attachments: Joi.array().items(attachment).optional(),
    // Project Briefs
    goals: Joi.array().items(goal).optional(),
    objectives: Joi.array().items(objective).optional(),
    deliverables: Joi.array().items(deliverable).optional(),
    // Project Scope
    techStack: Joi.array().items(Joi.string().trim()).optional(),
    resources: Joi.array().items(resource).optional(),
    stakeholders: Joi.array().items(stakeholder).optional(),
  }).required(),
};

const getProjects = {
  query: Joi.object().keys({
    projectName: Joi.string().optional(),
    projectManager: Joi.string().optional(),
    status: Joi.string().valid('Not Started', 'Inprogress', 'On Hold', 'Completed', 'Cancelled').optional(),
    priority: Joi.string().valid('Low', 'Medium', 'High', 'Critical').optional(),
    createdBy: Joi.string().custom(objectId).optional(),
    assignedTo: Joi.string().custom(objectId).optional(),
    sortBy: Joi.string().optional(),
    limit: Joi.number().integer().optional(),
    page: Joi.number().integer().optional(),
  }),
};

const getProject = {
  params: Joi.object().keys({
    projectId: Joi.string().custom(objectId).required(),
  }),
};

const updateProject = {
  params: Joi.object().keys({
    projectId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      projectName: Joi.string().optional().trim(),
      projectManager: Joi.string().optional().trim().allow('', null),
      clientStakeholder: Joi.string().optional().trim().allow('', null),
      projectDescription: Joi.string().optional().trim().allow('', null),
      startDate: Joi.date().optional().allow(null),
      endDate: Joi.date().optional().allow(null).custom((value, helpers) => {
        const { startDate } = helpers.state.ancestors[0];
        if (startDate && value && new Date(value) < new Date(startDate)) {
          return helpers.error('date.min');
        }
        return value;
      }).messages({
        'date.min': 'End date must be after start date'
      }),
      status: Joi.string().valid('Not Started', 'Inprogress', 'On Hold', 'Completed', 'Cancelled').optional(),
      priority: Joi.string().valid('Low', 'Medium', 'High', 'Critical').optional(),
      assignedTo: Joi.array().items(Joi.string().custom(objectId)).optional(),
      tags: Joi.array().items(Joi.string().trim()).optional(),
      attachments: Joi.array().items(attachment).optional(),
      // Project Briefs
      goals: Joi.array().items(goal).optional(),
      objectives: Joi.array().items(objective).optional(),
      deliverables: Joi.array().items(deliverable).optional(),
      // Project Scope
      techStack: Joi.array().items(Joi.string().trim()).optional(),
      resources: Joi.array().items(resource).optional(),
      stakeholders: Joi.array().items(stakeholder).optional(),
    })
    .min(1),
};

const deleteProject = {
  params: Joi.object().keys({
    projectId: Joi.string().custom(objectId).required(),
  }),
};

export { createProject, getProjects, getProject, updateProject, deleteProject };

