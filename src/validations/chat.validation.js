import Joi from 'joi';

const getChatHistory = {
  params: Joi.object().keys({
    meetingId: Joi.string().required().description('Meeting ID'),
  }),
  query: Joi.object().keys({
    limit: Joi.number().integer().min(1).max(100).default(50).description('Number of messages to return'),
    before: Joi.date().iso().optional().description('Get messages before this timestamp (ISO format)'),
  }),
};

const getMessage = {
  params: Joi.object().keys({
    meetingId: Joi.string().required().description('Meeting ID'),
    messageId: Joi.string().required().description('Message ID'),
  }),
};

const editMessage = {
  params: Joi.object().keys({
    meetingId: Joi.string().required().description('Meeting ID'),
    messageId: Joi.string().required().description('Message ID'),
  }),
  body: Joi.object().keys({
    message: Joi.string().required().min(1).max(1000).description('Updated message text'),
    email: Joi.string().email().optional().description('Sender email (required for public endpoints)'),
  }),
};

const deleteMessage = {
  params: Joi.object().keys({
    meetingId: Joi.string().required().description('Meeting ID'),
    messageId: Joi.string().required().description('Message ID'),
  }),
  body: Joi.object().keys({
    email: Joi.string().email().optional().description('Sender email (required for public endpoints)'),
  }),
};

export {
  getChatHistory,
  getMessage,
  editMessage,
  deleteMessage,
};

