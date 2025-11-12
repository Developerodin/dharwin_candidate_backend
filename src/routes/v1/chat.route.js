import express from 'express';
import validate from '../../middlewares/validate.js';
import optionalAuth from '../../middlewares/optionalAuth.js';
import * as chatValidation from '../../validations/chat.validation.js';
import * as chatController from '../../controllers/chat.controller.js';

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * /meetings/{meetingId}/chat/history:
 *   get:
 *     summary: Get chat history for a meeting
 *     description: Retrieve chat message history for a meeting with pagination support
 *     tags: [Meetings, Chat]
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Number of messages to return
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Get messages before this timestamp (ISO format) for pagination
 *     responses:
 *       200:
 *         description: Chat history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           meetingId:
 *                             type: string
 *                           senderEmail:
 *                             type: string
 *                           senderName:
 *                             type: string
 *                           message:
 *                             type: string
 *                           messageType:
 *                             type: string
 *                             enum: [text, system, file]
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           editedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           isDeleted:
 *                             type: boolean
 *                     hasMore:
 *                       type: boolean
 *                     total:
 *                       type: integer
 *                 message:
 *                   type: string
 *                   example: "Chat history retrieved successfully"
 *       404:
 *         description: Meeting not found
 */
router.get('/history', validate(chatValidation.getChatHistory), chatController.getHistory);

/**
 * @swagger
 * /meetings/{meetingId}/chat/messages/{messageId}:
 *   get:
 *     summary: Get a single chat message
 *     description: Retrieve a specific chat message by ID
 *     tags: [Meetings, Chat]
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting ID
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message retrieved successfully
 *       404:
 *         description: Message not found
 */
router.get('/messages/:messageId', validate(chatValidation.getMessage), chatController.getMessage);

/**
 * @swagger
 * /meetings/{meetingId}/chat/messages/{messageId}:
 *   patch:
 *     summary: Edit a chat message
 *     description: Edit a message (only by the sender)
 *     tags: [Meetings, Chat]
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting ID
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 description: Updated message text
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Sender email (required for public endpoints)
 *     responses:
 *       200:
 *         description: Message edited successfully
 *       403:
 *         description: Forbidden - You can only edit your own messages
 *       404:
 *         description: Message not found
 */
router.patch('/messages/:messageId', optionalAuth, validate(chatValidation.editMessage), chatController.edit);

/**
 * @swagger
 * /meetings/{meetingId}/chat/messages/{messageId}:
 *   delete:
 *     summary: Delete a chat message
 *     description: Delete a message (only by the sender)
 *     tags: [Meetings, Chat]
 *     parameters:
 *       - in: path
 *         name: meetingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Meeting ID
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Sender email (required for public endpoints)
 *     responses:
 *       204:
 *         description: Message deleted successfully
 *       403:
 *         description: Forbidden - You can only delete your own messages
 *       404:
 *         description: Message not found
 */
router.delete('/messages/:messageId', optionalAuth, validate(chatValidation.deleteMessage), chatController.remove);

export default router;

