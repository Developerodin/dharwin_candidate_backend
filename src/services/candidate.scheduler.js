import Candidate from '../models/candidate.model.js';
import logger from '../config/logger.js';

/**
 * Auto deactivate candidates whose resign date has arrived
 * Checks for candidates with resignDate that is today or in the past and isActive = true
 * @returns {Promise<number>} Number of candidates deactivated
 */
const autoDeactivateResignedCandidates = async () => {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalize to start of day for comparison

    // Find all candidates with resign date that is today or in the past but still active
    const candidatesToDeactivate = await Candidate.find({
      resignDate: { $lte: now }, // Resign date is today or in the past
      isActive: true, // Still active
    }).select('_id fullName email resignDate');

    if (!candidatesToDeactivate.length) return 0;

    let deactivated = 0;
    for (const candidate of candidatesToDeactivate) {
      try {
        candidate.isActive = false;
        await candidate.save();
        deactivated++;

        logger.info(
          `Auto-deactivated candidate ${candidate.fullName} (ID: ${candidate._id}, Email: ${candidate.email}) ` +
          `on resign date: ${candidate.resignDate.toISOString()}`
        );
      } catch (e) {
        logger.error(
          `Error auto-deactivating candidate ${candidate._id} (${candidate.email}): ${e.message}`
        );
      }
    }

    if (deactivated > 0) {
      logger.info(`Auto-deactivated ${deactivated} candidate(s) whose resign date has arrived`);
    }

    return deactivated;
  } catch (e) {
    logger.error(`autoDeactivateResignedCandidates failed: ${e.message}`);
    return 0;
  }
};

/**
 * Start candidate scheduler
 * @param {number} intervalMinutes - Interval in minutes to run the scheduler (default: 60 for hourly, or 1440 for daily)
 * @returns {NodeJS.Timeout} Interval ID
 */
const startCandidateScheduler = (intervalMinutes = 60) => {
  const intervalMs = intervalMinutes * 60 * 1000;
  const run = async () => {
    await autoDeactivateResignedCandidates();
  };

  // Run immediately on start
  run();

  // Then run at specified intervals
  const id = setInterval(run, intervalMs);
  logger.info(
    `Candidate scheduler started (every ${intervalMinutes} min, auto-deactivate candidates on resign date)`
  );
  return id;
};

/**
 * Stop candidate scheduler
 * @param {NodeJS.Timeout} id - Interval ID
 * @returns {boolean} Success status
 */
const stopCandidateScheduler = (id) => {
  if (id) {
    clearInterval(id);
    logger.info('Candidate scheduler stopped');
    return true;
  }
  return false;
};

export { autoDeactivateResignedCandidates, startCandidateScheduler, stopCandidateScheduler };

