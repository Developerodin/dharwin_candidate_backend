import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import {
  getChatHistory,
  getMessageById,
  editMessage,
  deleteMessage,
} from '../services/chat.service.js';

/**
 * Get chat history for a meeting
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getHistory = catchAsync(async (req, res) => {
  const { meetingId } = req.params;
  const { limit, before } = req.query;

  const result = await getChatHistory(meetingId, {
    limit: limit ? parseInt(limit, 10) : undefined,
    before: before ? new Date(before) : undefined,
  });

  res.status(httpStatus.OK).json({
    success: true,
    data: result,
    message: 'Chat history retrieved successfully',
  });
});

/**
 * Get a single message by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMessage = catchAsync(async (req, res) => {
  const { meetingId, messageId } = req.params;

  const message = await getMessageById(messageId, meetingId);

  res.status(httpStatus.OK).json({
    success: true,
    data: message,
    message: 'Message retrieved successfully',
  });
});

/**
 * Edit a message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const edit = catchAsync(async (req, res) => {
  const { meetingId, messageId } = req.params;
  const { message: newMessage } = req.body;
  const { email } = req.body; // Email from request body (for public endpoints)

  // For authenticated users, use req.user.email if available
  const senderEmail = req.user?.email || email;

  if (!senderEmail) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Email is required',
    });
  }

  const updatedMessage = await editMessage(messageId, senderEmail, newMessage, meetingId);

  res.status(httpStatus.OK).json({
    success: true,
    data: updatedMessage,
    message: 'Message edited successfully',
  });
});

/**
 * Delete a message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const remove = catchAsync(async (req, res) => {
  const { meetingId, messageId } = req.params;
  const { email } = req.body; // Email from request body (for public endpoints)

  // For authenticated users, use req.user.email if available
  const senderEmail = req.user?.email || email;

  if (!senderEmail) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Email is required',
    });
  }

  await deleteMessage(messageId, senderEmail, meetingId);

  res.status(httpStatus.NO_CONTENT).send();
});

export {
  getHistory,
  getMessage,
  edit,
  remove,
};

