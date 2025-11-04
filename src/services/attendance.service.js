import httpStatus from 'http-status';
import ApiError from '../utils/ApiError.js';
import Attendance from '../models/attendance.model.js';
import Candidate from '../models/candidate.model.js';
import pick from '../utils/pick.js';

/**
 * Punch in for a candidate
 * @param {ObjectId} candidateId
 * @param {Date} [punchInTime] - Optional punch in time (defaults to now)
 * @param {string} [notes] - Optional notes
 * @returns {Promise<Attendance>}
 */
const punchIn = async (candidateId, punchInTime = new Date(), notes) => {
  // Check if candidate exists
  const candidate = await Candidate.findById(candidateId);
  if (!candidate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Candidate not found');
  }

  // Get today's date (normalized to start of day)
  const today = new Date(punchInTime);
  today.setHours(0, 0, 0, 0);

  // Check if there's already an active punch in for today (no punch out)
  const existingAttendance = await Attendance.findOne({
    candidate: candidateId,
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
    punchOut: null,
    isActive: true,
  });

  if (existingAttendance) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'You are already punched in. Please punch out first.'
    );
  }

  // Create new attendance record
  const attendance = await Attendance.create({
    candidate: candidateId,
    candidateEmail: candidate.email,
    date: today,
    punchIn: punchInTime,
    notes,
  });

  return attendance.populate('candidate', 'fullName email');
};

/**
 * Punch out for a candidate
 * @param {ObjectId} candidateId
 * @param {Date} [punchOutTime] - Optional punch out time (defaults to now)
 * @param {string} [notes] - Optional notes
 * @returns {Promise<Attendance>}
 */
const punchOut = async (candidateId, punchOutTime = new Date(), notes) => {
  // Get today's date (normalized to start of day)
  const today = new Date(punchOutTime);
  today.setHours(0, 0, 0, 0);

  // Find active punch in for today
  const attendance = await Attendance.findOne({
    candidate: candidateId,
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
    punchOut: null,
    isActive: true,
  });

  if (!attendance) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'No active punch in found. Please punch in first.'
    );
  }

  // Validate punch out time is after punch in time
  if (punchOutTime < attendance.punchIn) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Punch out time cannot be before punch in time.'
    );
  }

  // Update attendance with punch out
  attendance.punchOut = punchOutTime;
  attendance.duration = punchOutTime.getTime() - attendance.punchIn.getTime();
  if (notes) {
    attendance.notes = notes;
  }
  await attendance.save();

  return attendance.populate('candidate', 'fullName email');
};

/**
 * Get attendance by ID
 * @param {ObjectId} id
 * @returns {Promise<Attendance>}
 */
const getAttendanceById = async (id) => {
  return Attendance.findById(id)
    .populate('candidate', 'fullName email owner')
    .populate('candidate.owner', 'name email');
};

/**
 * Query for attendance records
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryAttendance = async (filter, options) => {
  const attendance = await Attendance.paginate(filter, {
    ...options,
    populate: 'candidate',
    select: 'fullName email',
    sortBy: options.sortBy || 'date:desc',
  });
  return attendance;
};

/**
 * Get attendance records by candidate ID
 * @param {ObjectId} candidateId
 * @param {Object} options - Query options
 * @param {Date} [options.startDate] - Start date filter
 * @param {Date} [options.endDate] - End date filter
 * @returns {Promise<QueryResult>}
 */
const getAttendanceByCandidateId = async (candidateId, options = {}) => {
  const filter = { candidate: candidateId };
  
  // Add date range filter if provided
  if (options.startDate || options.endDate) {
    filter.date = {};
    if (options.startDate) {
      const startDate = new Date(options.startDate);
      startDate.setHours(0, 0, 0, 0);
      filter.date.$gte = startDate;
    }
    if (options.endDate) {
      const endDate = new Date(options.endDate);
      endDate.setHours(23, 59, 59, 999);
      filter.date.$lte = endDate;
    }
  }

  const queryOptions = pick(options, ['sortBy', 'limit', 'page']);
  return queryAttendance(filter, queryOptions);
};

/**
 * Get current punch status for a candidate
 * @param {ObjectId} candidateId
 * @returns {Promise<Attendance|null>}
 */
const getCurrentPunchStatus = async (candidateId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await Attendance.findOne({
    candidate: candidateId,
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
    },
    punchOut: null,
    isActive: true,
  }).populate('candidate', 'fullName email');

  return attendance;
};

/**
 * Get attendance statistics for a candidate
 * @param {ObjectId} candidateId
 * @param {Object} filter - Filter options (e.g., date range)
 * @returns {Promise<Object>}
 */
const getAttendanceStatistics = async (candidateId, filter = {}) => {
  const matchFilter = { candidate: candidateId };
  
  if (filter.startDate || filter.endDate) {
    matchFilter.date = {};
    if (filter.startDate) {
      const startDate = new Date(filter.startDate);
      startDate.setHours(0, 0, 0, 0);
      matchFilter.date.$gte = startDate;
    }
    if (filter.endDate) {
      const endDate = new Date(filter.endDate);
      endDate.setHours(23, 59, 59, 999);
      matchFilter.date.$lte = endDate;
    }
  }

  const stats = await Attendance.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        totalDays: { $sum: 1 },
        totalHours: {
          $sum: {
            $divide: [
              { $ifNull: ['$duration', 0] },
              3600000, // Convert milliseconds to hours
            ],
          },
        },
        totalMinutes: {
          $sum: {
            $divide: [
              { $ifNull: ['$duration', 0] },
              60000, // Convert milliseconds to minutes
            ],
          },
        },
        averageHoursPerDay: {
          $avg: {
            $divide: [
              { $ifNull: ['$duration', 0] },
              3600000,
            ],
          },
        },
        daysWithPunchOut: {
          $sum: {
            $cond: [{ $ne: ['$punchOut', null] }, 1, 0],
          },
        },
      },
    },
  ]);

  return stats[0] || {
    totalDays: 0,
    totalHours: 0,
    totalMinutes: 0,
    averageHoursPerDay: 0,
    daysWithPunchOut: 0,
  };
};

/**
 * Get all attendance records (admin only)
 * @param {Object} filter - Filter options
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getAllAttendance = async (filter = {}, options = {}) => {
  // Add date range filter if provided
  if (options.startDate || options.endDate) {
    filter.date = filter.date || {};
    if (options.startDate) {
      const startDate = new Date(options.startDate);
      startDate.setHours(0, 0, 0, 0);
      filter.date.$gte = startDate;
    }
    if (options.endDate) {
      const endDate = new Date(options.endDate);
      endDate.setHours(23, 59, 59, 999);
      filter.date.$lte = endDate;
    }
  }

  const queryOptions = pick(options, ['sortBy', 'limit', 'page']);
  return queryAttendance(filter, queryOptions);
};

export {
  punchIn,
  punchOut,
  getAttendanceById,
  queryAttendance,
  getAttendanceByCandidateId,
  getCurrentPunchStatus,
  getAttendanceStatistics,
  getAllAttendance,
};

