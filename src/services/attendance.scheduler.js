import Attendance from '../models/attendance.model.js';
import logger from '../config/logger.js';
import config from '../config/config.js';
import { hasExceededDurationInTimezone } from '../utils/timezone.js';

/**
 * Auto punch out candidates who have been punched in for more than the configured duration
 * Uses timezone-aware calculation: if candidate punched in at 9 AM EST, they'll be auto-punched out at 6 PM EST
 * @returns {Promise<number>} Number of candidates auto-punched out
 */
const autoPunchOutExpired = async () => {
  try {
    const now = new Date();
    const autoPunchOutDurationHours = config.attendance?.autoPunchOutDurationHours || 9;

    // Find all active punch-ins (no punch out)
    const activePunchIns = await Attendance.find({
      punchOut: null,
      isActive: true,
    }).populate('candidate', 'fullName email');

    if (!activePunchIns.length) return 0;

    let punchedOut = 0;
    for (const attendance of activePunchIns) {
      try {
        // Get the timezone from attendance record (defaults to UTC if not set)
        const timezone = attendance.timezone || 'UTC';
        
        // Check if duration has been exceeded in the candidate's timezone
        const hasExceeded = hasExceededDurationInTimezone(
          attendance.punchIn,
          timezone,
          autoPunchOutDurationHours
        );
        
        if (hasExceeded) {
          // Auto punch out with current time
          attendance.punchOut = now;
          attendance.duration = now.getTime() - attendance.punchIn.getTime();
          // Add note indicating it was auto-punched out
          attendance.notes = attendance.notes
            ? `${attendance.notes}\n[Auto-punched out after ${autoPunchOutDurationHours} hours in ${timezone} timezone]`
            : `[Auto-punched out after ${autoPunchOutDurationHours} hours in ${timezone} timezone]`;
          
          await attendance.save();
          punchedOut++;
          
          logger.info(
            `Auto-punched out candidate ${attendance.candidate?.fullName || attendance.candidateEmail} ` +
            `(ID: ${attendance.candidate?._id || attendance.candidate}) after ${autoPunchOutDurationHours} hours ` +
            `in ${timezone} timezone. Punch in: ${attendance.punchIn.toISOString()}, Punch out: ${now.toISOString()}`
          );
        }
      } catch (e) {
        logger.error(
          `Error auto-punching out attendance ${attendance._id} for candidate ${attendance.candidateEmail}: ${e.message}`
        );
      }
    }
    
    if (punchedOut > 0) {
      logger.info(`Auto-punched out ${punchedOut} candidate(s) after ${autoPunchOutDurationHours} hours (timezone-aware)`);
    }
    
    return punchedOut;
  } catch (e) {
    logger.error(`autoPunchOutExpired failed: ${e.message}`);
    return 0;
  }
};

/**
 * Start attendance scheduler
 * @param {number} intervalMinutes - Interval in minutes to run the scheduler (default: 15)
 * @returns {NodeJS.Timeout} Interval ID
 */
const startAttendanceScheduler = (intervalMinutes = 15) => {
  const intervalMs = intervalMinutes * 60 * 1000;
  const run = async () => {
    await autoPunchOutExpired();
  };
  
  // Run immediately on start
  run();
  
  // Then run at specified intervals
  const id = setInterval(run, intervalMs);
  logger.info(
    `Attendance scheduler started (every ${intervalMinutes} min, auto punch-out after ${config.attendance?.autoPunchOutDurationHours || 9} hours)`
  );
  return id;
};

/**
 * Stop attendance scheduler
 * @param {NodeJS.Timeout} id - Interval ID
 * @returns {boolean} Success status
 */
const stopAttendanceScheduler = (id) => {
  if (id) {
    clearInterval(id);
    logger.info('Attendance scheduler stopped');
    return true;
  }
  return false;
};

export { autoPunchOutExpired, startAttendanceScheduler, stopAttendanceScheduler };

