import logger from '../config/logger.js';
import Meeting from '../models/meeting.model.js';
import {
  saveMessage,
  editMessage,
  deleteMessage,
  createSystemMessage,
} from '../services/chat.service.js';

// Store typing users per meeting
const typingUsers = new Map(); // meetingId -> Map of email -> {email, name}

/**
 * Initialize chat socket handlers
 * @param {Socket} io - Socket.io server instance
 */
const initializeChatSocket = (io) => {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Join meeting chat room
    socket.on('join-meeting', async (data) => {
      try {
        const { meetingId, email, name } = data;

        if (!meetingId || !email || !name) {
          socket.emit('error', { message: 'Missing required fields', code: 'INVALID_DATA' });
          return;
        }

        // Verify meeting exists and user can join
        const meeting = await Meeting.findOne({ meetingId });
        if (!meeting) {
          socket.emit('error', { message: 'Meeting not found', code: 'MEETING_NOT_FOUND' });
          return;
        }

        // Check if meeting is active or scheduled
        if (!meeting.canJoin()) {
          socket.emit('error', { message: 'Meeting is not available', code: 'MEETING_UNAVAILABLE' });
          return;
        }

        // Join the room
        const roomName = `meeting:${meetingId}`;
        socket.join(roomName);
        socket.data.meetingId = meetingId;
        socket.data.email = email.toLowerCase();
        socket.data.name = name;

        logger.info(`User ${email} joined meeting chat: ${meetingId}`);

        // Broadcast user joined to others in the room
        socket.to(roomName).emit('user-joined', {
          email,
          name,
          meetingId,
          timestamp: new Date(),
        });

        // Send system message
        await createSystemMessage(meetingId, `${name} joined the chat`);

        // Confirm join
        socket.emit('joined-meeting', {
          meetingId,
          message: 'Successfully joined meeting chat',
        });
      } catch (error) {
        logger.error(`Error joining meeting chat: ${error.message}`);
        socket.emit('error', { message: error.message, code: 'JOIN_ERROR' });
      }
    });

    // Leave meeting chat room
    socket.on('leave-meeting', async (data) => {
      try {
        const { meetingId } = data || socket.data;
        const { email, name } = socket.data;

        if (!meetingId || !email) {
          return;
        }

        const roomName = `meeting:${meetingId}`;
        socket.leave(roomName);

        // Remove from typing users
        if (typingUsers.has(meetingId)) {
          typingUsers.get(meetingId).delete(email);
        }

        // Broadcast user left to others in the room
        socket.to(roomName).emit('user-left', {
          email,
          name,
          meetingId,
          timestamp: new Date(),
        });

        // Send system message
        if (meetingId && email && name) {
          await createSystemMessage(meetingId, `${name} left the chat`);
        }

        logger.info(`User ${email} left meeting chat: ${meetingId}`);
      } catch (error) {
        logger.error(`Error leaving meeting chat: ${error.message}`);
      }
    });

    // Send message
    socket.on('send-message', async (data) => {
      try {
        const { meetingId, message, email, name } = data;

        if (!meetingId || !message || !email || !name) {
          socket.emit('error', { message: 'Missing required fields', code: 'INVALID_DATA' });
          return;
        }

        // Verify meeting exists
        const meeting = await Meeting.findOne({ meetingId });
        if (!meeting) {
          socket.emit('error', { message: 'Meeting not found', code: 'MEETING_NOT_FOUND' });
          return;
        }

        // Save message to database
        const chatMessage = await saveMessage(meetingId, email, name, message, 'text');

        // Broadcast message to all participants in the room
        const roomName = `meeting:${meetingId}`;
        const messageData = {
          id: chatMessage.id,
          meetingId,
          senderEmail: chatMessage.senderEmail,
          senderName: chatMessage.senderName,
          message: chatMessage.message,
          messageType: chatMessage.messageType,
          timestamp: chatMessage.timestamp,
          editedAt: chatMessage.editedAt,
          isDeleted: chatMessage.isDeleted,
        };

        io.to(roomName).emit('message-received', messageData);

        logger.info(`Message sent in meeting ${meetingId} by ${email}`);
      } catch (error) {
        logger.error(`Error sending message: ${error.message}`);
        socket.emit('error', { message: error.message, code: 'SEND_MESSAGE_ERROR' });
      }
    });

    // Edit message
    socket.on('edit-message', async (data) => {
      try {
        const { messageId, meetingId, newMessage, email } = data;

        if (!messageId || !meetingId || !newMessage || !email) {
          socket.emit('error', { message: 'Missing required fields', code: 'INVALID_DATA' });
          return;
        }

        // Edit message
        const updatedMessage = await editMessage(messageId, email, newMessage, meetingId);

        // Broadcast edited message to all participants in the room
        const roomName = `meeting:${meetingId}`;
        io.to(roomName).emit('message-edited', {
          messageId: updatedMessage.id,
          newMessage: updatedMessage.message,
          editedAt: updatedMessage.editedAt,
        });

        logger.info(`Message ${messageId} edited by ${email}`);
      } catch (error) {
        logger.error(`Error editing message: ${error.message}`);
        socket.emit('error', { message: error.message, code: 'EDIT_MESSAGE_ERROR' });
      }
    });

    // Delete message
    socket.on('delete-message', async (data) => {
      try {
        const { messageId, meetingId, email } = data;

        if (!messageId || !meetingId || !email) {
          socket.emit('error', { message: 'Missing required fields', code: 'INVALID_DATA' });
          return;
        }

        // Delete message
        await deleteMessage(messageId, email, meetingId);

        // Broadcast deleted message to all participants in the room
        const roomName = `meeting:${meetingId}`;
        io.to(roomName).emit('message-deleted', {
          messageId,
        });

        logger.info(`Message ${messageId} deleted by ${email}`);
      } catch (error) {
        logger.error(`Error deleting message: ${error.message}`);
        socket.emit('error', { message: error.message, code: 'DELETE_MESSAGE_ERROR' });
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      try {
        const { meetingId, email, name } = data;

        if (!meetingId || !email || !name) {
          return;
        }

        const roomName = `meeting:${meetingId}`;

        // Add to typing users
        if (!typingUsers.has(meetingId)) {
          typingUsers.set(meetingId, new Map());
        }
        typingUsers.get(meetingId).set(email, { email, name });

        // Broadcast typing indicator to others in the room
        socket.to(roomName).emit('user-typing', {
          email,
          name,
          meetingId,
        });
      } catch (error) {
        logger.error(`Error handling typing indicator: ${error.message}`);
      }
    });

    // Stop typing indicator
    socket.on('stop-typing', (data) => {
      try {
        const { meetingId, email } = data;

        if (!meetingId || !email) {
          return;
        }

        const roomName = `meeting:${meetingId}`;

        // Remove from typing users
        if (typingUsers.has(meetingId)) {
          typingUsers.get(meetingId).delete(email);
        }

        // Broadcast stop typing to others in the room
        socket.to(roomName).emit('user-stopped-typing', {
          email,
          meetingId,
        });
      } catch (error) {
        logger.error(`Error handling stop typing: ${error.message}`);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        const { meetingId, email, name } = socket.data;

        if (meetingId && email) {
          const roomName = `meeting:${meetingId}`;

          // Remove from typing users
          if (typingUsers.has(meetingId)) {
            typingUsers.get(meetingId).delete(email);
          }

          // Broadcast user left to others in the room
          socket.to(roomName).emit('user-left', {
            email,
            name,
            meetingId,
            timestamp: new Date(),
          });

          // Send system message
          if (name) {
            await createSystemMessage(meetingId, `${name} left the chat`);
          }

          logger.info(`User ${email} disconnected from meeting chat: ${meetingId}`);
        }

        logger.info(`Socket disconnected: ${socket.id}`);
      } catch (error) {
        logger.error(`Error handling disconnect: ${error.message}`);
      }
    });
  });
};

export default initializeChatSocket;

