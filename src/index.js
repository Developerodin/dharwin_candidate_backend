import http from 'http';
import mongoose from 'mongoose';
import app from './app.js';
import config from './config/config.js';
import logger from './config/logger.js';
import { startMeetingScheduler, stopMeetingScheduler } from './services/meeting.scheduler.js';
import { startAttendanceScheduler, stopAttendanceScheduler } from './services/attendance.scheduler.js';
import initializeSocket from './sockets/index.js';

let server;
let io;
let meetingSchedulerInterval;
let attendanceSchedulerInterval;
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB');
  
  // Create HTTP server from Express app
  server = http.createServer(app);
  
  // Initialize Socket.io
  io = initializeSocket(server);
  
  // Make io accessible to app if needed
  app.set('io', io);
  
  server.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });
  
  // Start auto-end scheduler (run every 1 minute)
  meetingSchedulerInterval = startMeetingScheduler(1);
  
  // Start attendance scheduler (run every 15 minutes by default)
  attendanceSchedulerInterval = startAttendanceScheduler(config.attendance?.schedulerIntervalMinutes || 15);
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      if (meetingSchedulerInterval) {
        stopMeetingScheduler(meetingSchedulerInterval);
      }
      if (attendanceSchedulerInterval) {
        stopAttendanceScheduler(attendanceSchedulerInterval);
      }
      process.exit(1);
    });
  } else {
    if (meetingSchedulerInterval) {
      stopMeetingScheduler(meetingSchedulerInterval);
    }
    if (attendanceSchedulerInterval) {
      stopAttendanceScheduler(attendanceSchedulerInterval);
    }
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
  if (meetingSchedulerInterval) {
    stopMeetingScheduler(meetingSchedulerInterval);
  }
  if (attendanceSchedulerInterval) {
    stopAttendanceScheduler(attendanceSchedulerInterval);
  }
});
