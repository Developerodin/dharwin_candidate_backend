import mongoose from 'mongoose';
import app from './app.js';
import config from './config/config.js';
import logger from './config/logger.js';
import { startMeetingScheduler, stopMeetingScheduler } from './services/meeting.scheduler.js';

let server;
let meetingSchedulerInterval;
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB');
  server = app.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });
  // Start auto-end scheduler (run every 1 minute)
  meetingSchedulerInterval = startMeetingScheduler(1);
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      if (meetingSchedulerInterval) {
        stopMeetingScheduler(meetingSchedulerInterval);
      }
      process.exit(1);
    });
  } else {
    if (meetingSchedulerInterval) {
      stopMeetingScheduler(meetingSchedulerInterval);
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
});
