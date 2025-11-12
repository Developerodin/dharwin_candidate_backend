import httpStatus from 'http-status';
import ChatMessage from '../models/chatMessage.model.js';
import ApiError from '../utils/ApiError.js';
import Meeting from '../models/meeting.model.js';

/**
 * Validate message content
 * @param {string} message - Message text
 * @returns {boolean}
 */
const validateMessage = (message) => {
  if (!message || typeof message !== 'string') {
    return false;
  }
  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return false;
  }
  if (trimmed.length > 1000) {
    return false;
  }
  return true;
};

/**
 * Save a chat message
 * @param {string} meetingId - Meeting ID
 * @param {string} senderEmail - Sender email
 * @param {string} senderName - Sender name
 * @param {string} message - Message content
 * @param {string} messageType - Message type (text, system, file)
 * @returns {Promise<ChatMessage>}
 */
const saveMessage = async (meetingId, senderEmail, senderName, message, messageType = 'text') => {
  if (!validateMessage(message)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid message content');
  }

  // Verify meeting exists
  const meeting = await Meeting.findOne({ meetingId });
  if (!meeting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meeting not found');
  }

  const chatMessage = await ChatMessage.create({
    meetingId,
    senderEmail: senderEmail.toLowerCase(),
    senderName,
    message: message.trim(),
    messageType,
    timestamp: new Date(),
  });

  return chatMessage;
};

/**
 * Get chat history for a meeting
 * @param {string} meetingId - Meeting ID
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of messages to return (default: 50, max: 100)
 * @param {Date} options.before - Get messages before this timestamp (for pagination)
 * @returns {Promise<Object>}
 */
const getChatHistory = async (meetingId, options = {}) => {
  const { limit = 50, before } = options;
  const actualLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);

  // Verify meeting exists
  const meeting = await Meeting.findOne({ meetingId });
  if (!meeting) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Meeting not found');
  }

  const filter = {
    meetingId,
    isDeleted: false,
  };

  if (before) {
    filter.timestamp = { $lt: new Date(before) };
  }

  const messages = await ChatMessage.find(filter)
    .sort({ timestamp: -1 })
    .limit(actualLimit)
    .exec();

  // Reverse to get chronological order (oldest first)
  messages.reverse();

  const total = await ChatMessage.countDocuments({
    meetingId,
    isDeleted: false,
  });

  const hasMore = before
    ? messages.length === actualLimit
    : total > actualLimit;

  return {
    messages,
    hasMore,
    total,
  };
};

/**
 * Get a single message by ID
 * @param {string} messageId - Message ID
 * @param {string} meetingId - Meeting ID (for validation)
 * @returns {Promise<ChatMessage>}
 */
const getMessageById = async (messageId, meetingId) => {
  const message = await ChatMessage.findById(messageId);

  if (!message) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Message not found');
  }

  if (message.meetingId !== meetingId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Message does not belong to this meeting');
  }

  if (message.isDeleted) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Message has been deleted');
  }

  return message;
};

/**
 * Edit a message
 * @param {string} messageId - Message ID
 * @param {string} senderEmail - Sender email (for authorization)
 * @param {string} newMessage - New message content
 * @param {string} meetingId - Meeting ID (for validation)
 * @returns {Promise<ChatMessage>}
 */
const editMessage = async (messageId, senderEmail, newMessage, meetingId) => {
  if (!validateMessage(newMessage)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid message content');
  }

  const message = await getMessageById(messageId, meetingId);

  // Verify sender owns the message
  if (message.senderEmail.toLowerCase() !== senderEmail.toLowerCase()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only edit your own messages');
  }

  // Update message
  message.message = newMessage.trim();
  await message.markAsEdited();

  return message;
};

/**
 * Delete a message
 * @param {string} messageId - Message ID
 * @param {string} senderEmail - Sender email (for authorization)
 * @param {string} meetingId - Meeting ID (for validation)
 * @returns {Promise<ChatMessage>}
 */
const deleteMessage = async (messageId, senderEmail, meetingId) => {
  const message = await getMessageById(messageId, meetingId);

  // Verify sender owns the message
  if (message.senderEmail.toLowerCase() !== senderEmail.toLowerCase()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only delete your own messages');
  }

  // Soft delete
  await message.softDelete();

  return message;
};

/**
 * Create a system message
 * @param {string} meetingId - Meeting ID
 * @param {string} systemMessage - System message text
 * @returns {Promise<ChatMessage>}
 */
const createSystemMessage = async (meetingId, systemMessage) => {
  return saveMessage(
    meetingId,
    'system@meeting.app',
    'System',
    systemMessage,
    'system'
  );
};

export {
  validateMessage,
  saveMessage,
  getChatHistory,
  getMessageById,
  editMessage,
  deleteMessage,
  createSystemMessage,
};

