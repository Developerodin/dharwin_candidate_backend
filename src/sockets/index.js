import { Server } from 'socket.io';
import logger from '../config/logger.js';
import config from '../config/config.js';
import initializeChatSocket from './chat.socket.js';

/**
 * Initialize Socket.io server
 * @param {http.Server} httpServer - HTTP server instance
 * @returns {Server} Socket.io server instance
 */
const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.env === 'production'
        ? ['https://main.d17v4yz0vw03r0.amplifyapp.com']
        : true, // Allow all origins in development
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Initialize chat socket handlers
  initializeChatSocket(io);

  logger.info('Socket.io server initialized');

  return io;
};

export default initializeSocket;

