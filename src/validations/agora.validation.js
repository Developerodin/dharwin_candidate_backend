import Joi from 'joi';

const generateToken = {
  body: Joi.object().keys({
    channelName: Joi.string().required().min(1).max(64).description('Channel name'),
    uid: Joi.number().integer().min(0).max(4294967295).optional().description('User ID (0 for auto-generated)'),
    account: Joi.string().min(1).max(255).optional().description('User account (alternative to uid)'),
    role: Joi.number().integer().valid(1, 2).default(1).description('User role (1 for publisher, 2 for subscriber)'),
    expirationTimeInSeconds: Joi.number().integer().min(1).max(86400).default(3600).description('Token expiration time in seconds'),
  }).xor('uid', 'account').messages({
    'object.xor': 'Either uid or account must be provided, but not both',
  }),
};

const generateMultipleTokens = {
  body: Joi.object().keys({
    users: Joi.array().items(
      Joi.object().keys({
        channelName: Joi.string().required().min(1).max(64).description('Channel name'),
        uid: Joi.number().integer().min(0).max(4294967295).optional().description('User ID (0 for auto-generated)'),
        account: Joi.string().min(1).max(255).optional().description('User account (alternative to uid)'),
        role: Joi.number().integer().valid(1, 2).default(1).description('User role (1 for publisher, 2 for subscriber)'),
      }).xor('uid', 'account').messages({
        'object.xor': 'Either uid or account must be provided, but not both',
      })
    ).min(1).max(50).required().description('Array of users'),
    expirationTimeInSeconds: Joi.number().integer().min(1).max(86400).default(3600).description('Token expiration time in seconds'),
  }),
};

export {
  generateToken,
  generateMultipleTokens,
};
