import Meeting from '../models/meeting.model.js';
import logger from '../config/logger.js';

const endExpiredMeetings = async () => {
  try {
    const now = new Date();
    const expiredMeetings = await Meeting.find({ status: 'active', expiresAt: { $lte: now } });

    if (!expiredMeetings.length) return 0;

    let ended = 0;
    for (const m of expiredMeetings) {
      try {
        if (m.autoEndIfExpired()) {
          await m.save();
          ended++;
          logger.info(`Auto-ended meeting ${m.meetingId}`);
        }
      } catch (e) {
        logger.error(`Error auto-ending meeting ${m.meetingId}: ${e.message}`);
      }
    }
    return ended;
  } catch (e) {
    logger.error(`endExpiredMeetings failed: ${e.message}`);
    return 0;
  }
};

const startMeetingScheduler = (intervalMinutes = 1) => {
  const intervalMs = intervalMinutes * 60 * 1000;
  const run = async () => {
    await endExpiredMeetings();
  };
  run();
  const id = setInterval(run, intervalMs);
  logger.info(`Meeting scheduler started (every ${intervalMinutes} min)`);
  return id;
};

const stopMeetingScheduler = (id) => {
  if (id) {
    clearInterval(id);
    logger.info('Meeting scheduler stopped');
    return true;
  }
  return false;
};

export { endExpiredMeetings, startMeetingScheduler, stopMeetingScheduler };


