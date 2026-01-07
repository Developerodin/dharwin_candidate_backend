import httpStatus from 'http-status';
import ApiError from '../utils/ApiError.js';
import Attendance from '../models/attendance.model.js';
import Candidate from '../models/candidate.model.js';
import Holiday from '../models/holiday.model.js';
import pick from '../utils/pick.js';

/**
 * Punch in for a candidate
 * @param {ObjectId} candidateId
 * @param {Date} [punchInTime] - Optional punch in time (defaults to now)
 * @param {string} [notes] - Optional notes
 * @param {string} [timezone] - Optional timezone (e.g., 'America/New_York', 'Asia/Kolkata'). Defaults to 'UTC'
 * @returns {Promise<Attendance>}
 */
const punchIn = async (candidateId, punchInTime = new Date(), notes, timezone = 'UTC') => {
  // Check if candidate exists
  const candidate = await Candidate.findById(candidateId);
  if (!candidate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Candidate not found');
  }

  // Get today's date (normalized to start of day)
  const today = new Date(punchInTime);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Check if there's already an attendance record for today (prevent multiple punch-in/out cycles)
  const existingAttendance = await Attendance.findOne({
    candidate: candidateId,
    date: {
      $gte: today,
      $lt: tomorrow,
    },
  });

  if (existingAttendance) {
    // If already punched out, cannot punch in again today
    if (existingAttendance.punchOut) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'You have already completed punch-in and punch-out for today. Only one punch-in/punch-out cycle is allowed per day.'
      );
    }
    // If already punched in but not punched out
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'You are already punched in. Please punch out first.'
    );
  }

  // Create new attendance record with timezone and Present status
  const attendance = await Attendance.create({
    candidate: candidateId,
    candidateEmail: candidate.email,
    date: today,
    punchIn: punchInTime,
    notes,
    timezone: timezone || 'UTC',
    status: 'Present',
  });

  return attendance.populate('candidate', 'fullName email');
};

/**
 * Punch out for a candidate
 * @param {ObjectId} candidateId
 * @param {Date} [punchOutTime] - Optional punch out time (defaults to now)
 * @param {string} [notes] - Optional notes
 * @param {string} [timezone] - Optional timezone (e.g., 'America/New_York', 'Asia/Kolkata'). If not provided, uses timezone from punch-in record
 * @returns {Promise<Attendance>}
 */
const punchOut = async (candidateId, punchOutTime = new Date(), notes, timezone) => {
  // Get today's date (normalized to start of day)
  const today = new Date(punchOutTime);
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Find active punch in for today (not yet punched out)
  const attendance = await Attendance.findOne({
    candidate: candidateId,
    date: {
      $gte: today,
      $lt: tomorrow,
    },
    punchOut: null,
    isActive: true,
  });

  if (!attendance) {
    // Check if they already punched out today
    const alreadyPunchedOut = await Attendance.findOne({
      candidate: candidateId,
      date: {
        $gte: today,
        $lt: tomorrow,
      },
      punchOut: { $ne: null },
    });

    if (alreadyPunchedOut) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'You have already punched out for today. Only one punch-in/punch-out cycle is allowed per day.'
      );
    }

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
  // Keep status as Present since they punched in
  attendance.status = 'Present';
  if (notes) {
    attendance.notes = notes;
  }
  // Update timezone if provided, otherwise keep the timezone from punch-in
  if (timezone) {
    attendance.timezone = timezone;
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
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const attendance = await Attendance.findOne({
    candidate: candidateId,
    date: {
      $gte: today,
      $lt: tomorrow,
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

/**
 * Add holidays to candidate calendar attendance
 * Admin can add multiple holidays to multiple candidates at once
 * @param {Array<string>} candidateIds - Array of candidate IDs
 * @param {Array<string>} holidayIds - Array of holiday IDs
 * @param {Object} user - Current user
 * @returns {Promise<Object>}
 */
const addHolidaysToCandidates = async (candidateIds, holidayIds, user) => {
  // Check permissions: only admin can add holidays
  if (user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admin can add holidays to candidate calendar');
  }

  // Validate candidate IDs
  const candidates = await Candidate.find({ _id: { $in: candidateIds } });
  if (candidates.length !== candidateIds.length) {
    const foundIds = candidates.map((c) => String(c._id));
    const missingIds = candidateIds.filter((id) => !foundIds.includes(String(id)));
    throw new ApiError(httpStatus.NOT_FOUND, `Some candidates not found: ${missingIds.join(', ')}`);
  }

  // Validate holiday IDs
  const holidays = await Holiday.find({ _id: { $in: holidayIds }, isActive: true });
  if (holidays.length !== holidayIds.length) {
    const foundIds = holidays.map((h) => String(h._id));
    const missingIds = holidayIds.filter((id) => !foundIds.includes(String(id)));
    throw new ApiError(httpStatus.NOT_FOUND, `Some holidays not found or inactive: ${missingIds.join(', ')}`);
  }

  const createdRecords = [];
  const skipped = [];
  const candidateMap = new Map(candidates.map((c) => [String(c._id), c]));

  // Process each candidate
  for (const candidateId of candidateIds) {
    const candidate = candidateMap.get(String(candidateId));
    if (!candidate) continue;

    // Get current holidays array (convert to string array for comparison)
    const currentHolidayIds = (candidate.holidays || []).map((h) => String(h));
    const newHolidayIds = holidayIds.filter((id) => !currentHolidayIds.includes(String(id)));

    // Add new holidays to candidate's holidays array
    if (newHolidayIds.length > 0) {
      candidate.holidays = [...(candidate.holidays || []), ...newHolidayIds];
      await candidate.save();
    }

    // Create attendance records for each holiday date
    for (const holiday of holidays) {
      const normalizedDate = new Date(holiday.date);
      normalizedDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(normalizedDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Check if attendance already exists for this candidate & date
      const existingAttendance = await Attendance.findOne({
        candidate: candidateId,
        date: {
          $gte: normalizedDate,
          $lt: nextDay,
        },
      });

      if (existingAttendance) {
        skipped.push({
          candidateId,
          candidateName: candidate.fullName,
          holidayId: holiday._id,
          holidayTitle: holiday.title,
          date: normalizedDate.toISOString(),
          reason: 'Attendance already exists for this date',
        });
        continue;
      }

      // Create attendance record for holiday
      const attendance = await Attendance.create({
        candidate: candidateId,
        candidateEmail: candidate.email,
        date: normalizedDate,
        punchIn: normalizedDate,
        punchOut: null,
        duration: 0,
        notes: `Holiday: ${holiday.title}`,
        timezone: 'UTC',
        status: 'Holiday',
      });

      createdRecords.push(await attendance.populate('candidate', 'fullName email'));
    }
  }

  return {
    success: true,
    message: `Holidays added to ${candidates.length} candidate(s). Created ${createdRecords.length} attendance record(s).`,
    data: {
      candidatesUpdated: candidates.length,
      holidaysAdded: holidayIds.length,
      attendanceRecordsCreated: createdRecords.length,
      createdRecords,
      skipped: skipped.length > 0 ? skipped : undefined,
    },
  };
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
  addHolidaysToCandidates,
};

