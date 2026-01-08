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

/**
 * Assign leaves to candidate calendar attendance
 * Admin can assign leaves (casual or sick) to multiple candidates for specific dates
 * @param {Array<string>} candidateIds - Array of candidate IDs
 * @param {Array<Date>} dates - Array of dates for leave
 * @param {string} leaveType - Type of leave ('casual' or 'sick')
 * @param {string} [notes] - Optional notes
 * @param {Object} user - Current user
 * @returns {Promise<Object>}
 */
const assignLeavesToCandidates = async (candidateIds, dates, leaveType, notes, user) => {
  // Check permissions: only admin can assign leaves
  if (user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admin can assign leaves to candidates');
  }

  // Validate candidate IDs
  const candidates = await Candidate.find({ _id: { $in: candidateIds } });
  if (candidates.length !== candidateIds.length) {
    const foundIds = candidates.map((c) => String(c._id));
    const missingIds = candidateIds.filter((id) => !foundIds.includes(String(id)));
    throw new ApiError(httpStatus.NOT_FOUND, `Some candidates not found: ${missingIds.join(', ')}`);
  }

  // Validate dates array
  if (!Array.isArray(dates) || dates.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'At least one date is required');
  }

  // Validate leave type
  if (!['casual', 'sick'].includes(leaveType)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Leave type must be either "casual" or "sick"');
  }

  // Normalize dates (remove duplicates and sort, validate dates)
  // Use UTC methods to avoid timezone issues - normalize to UTC midnight
  const normalizedDates = dates
    .map((d) => {
      const date = new Date(d);
      if (isNaN(date.getTime())) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Invalid date: ${d}`);
      }
      // Normalize to UTC midnight to avoid timezone shifts
      // Extract UTC year, month, day and create new UTC date at midnight
      const utcYear = date.getUTCFullYear();
      const utcMonth = date.getUTCMonth();
      const utcDay = date.getUTCDate();
      const utcDate = new Date(Date.UTC(utcYear, utcMonth, utcDay, 0, 0, 0, 0));
      return utcDate;
    })
    .filter((date, index, self) => {
      // Remove duplicates by comparing timestamps
      return index === self.findIndex((d) => d.getTime() === date.getTime());
    })
    .sort((a, b) => a - b);

  const createdRecords = [];
  const skipped = [];
  const candidateMap = new Map(candidates.map((c) => [String(c._id), c]));

  // Process each candidate
  for (const candidateId of candidateIds) {
    const candidate = candidateMap.get(String(candidateId));
    if (!candidate) continue;

    // Initialize leaves array if it doesn't exist
    if (!candidate.leaves) {
      candidate.leaves = [];
    }
    
    // Track if we added any leaves for this candidate
    let leavesAdded = false;

    // Create attendance records and add leave info for each date
    for (const date of normalizedDates) {
      // Date is already normalized to UTC midnight from the array
      const normalizedDate = new Date(date);
      
      // Validate the date is valid
      if (isNaN(normalizedDate.getTime())) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Invalid date: ${date}`);
      }
      
      // Calculate next day in UTC
      const nextDay = new Date(normalizedDate);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);

      // Check if attendance already exists for this candidate & date
      const existingAttendance = await Attendance.findOne({
        candidate: candidateId,
        date: {
          $gte: normalizedDate,
          $lt: nextDay,
        },
      });

      // Check if leave already exists in candidate's leaves array for this date
      const normalizedDateTimestamp = normalizedDate.getTime();
      const existingLeave = candidate.leaves.find((leave) => {
        const leaveDate = new Date(leave.date);
        return leaveDate.getTime() === normalizedDateTimestamp;
      });

      // Create attendance record for leave (only if it doesn't exist)
      let attendance = null;
      if (!existingAttendance) {
        const leaveNotes = notes || `${leaveType.charAt(0).toUpperCase() + leaveType.slice(1)} Leave`;
        attendance = await Attendance.create({
          candidate: candidateId,
          candidateEmail: candidate.email,
          date: normalizedDate,
          punchIn: normalizedDate,
          punchOut: null,
          duration: 0,
          notes: leaveNotes,
          timezone: 'UTC',
          status: 'Leave',
          leaveType: leaveType,
        });
        createdRecords.push(await attendance.populate('candidate', 'fullName email'));
      } else {
        skipped.push({
          candidateId,
          candidateName: candidate.fullName,
          date: normalizedDate.toISOString(),
          reason: 'Attendance already exists for this date',
        });
      }

      // Add leave information to candidate's leaves array (one entry per date)
      // Only add if it doesn't already exist
      if (!existingLeave) {
        const leaveInfo = {
          date: new Date(normalizedDate.getTime()), // Use getTime() to create fresh instance
          leaveType: leaveType,
          notes: notes || null,
          assignedAt: new Date(),
        };
        
        // Validate the date
        if (isNaN(leaveInfo.date.getTime())) {
          throw new ApiError(httpStatus.BAD_REQUEST, `Invalid date for leave: ${normalizedDate}`);
        }
        
        // Push to leaves array - Mongoose will validate on save
        candidate.leaves.push(leaveInfo);
        leavesAdded = true;
        
        // Mark the leaves array as modified to ensure Mongoose saves it
        candidate.markModified('leaves');
      }
    }

    // Save candidate after processing all dates
    // Only save if we added any leaves
    if (leavesAdded) {
      await candidate.save();
    }
  }

  return {
    success: true,
    message: `Leaves assigned to ${candidates.length} candidate(s). Created ${createdRecords.length} attendance record(s).`,
    data: {
      candidatesUpdated: candidates.length,
      leaveType: leaveType,
      dates: normalizedDates.map((d) => d.toISOString()),
      totalDays: normalizedDates.length,
      attendanceRecordsCreated: createdRecords.length,
      createdRecords,
      skipped: skipped.length > 0 ? skipped : undefined,
    },
  };
};

/**
 * Update a leave for a candidate
 * Admin can update leave details (date, leaveType, notes)
 * @param {string} candidateId - Candidate ID
 * @param {string} leaveId - Leave ID (from leaves array)
 * @param {Object} updateData - Data to update (date, leaveType, notes)
 * @param {Object} user - Current user
 * @returns {Promise<Object>}
 */
const updateLeaveForCandidate = async (candidateId, leaveId, updateData, user) => {
  // Check permissions: only admin can update leaves
  if (user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admin can update leaves');
  }

  // Validate candidate
  const candidate = await Candidate.findById(candidateId);
  if (!candidate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Candidate not found');
  }

  // Find the leave in the candidate's leaves array
  const leave = candidate.leaves.id(leaveId);
  if (!leave) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Leave not found');
  }

  // Store old date for attendance record update
  const oldDate = new Date(leave.date);
  oldDate.setHours(0, 0, 0, 0);

  // Update leave fields
  if (updateData.date !== undefined) {
    leave.date = new Date(updateData.date);
  }
  if (updateData.leaveType !== undefined) {
    if (!['casual', 'sick'].includes(updateData.leaveType)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Leave type must be either "casual" or "sick"');
    }
    leave.leaveType = updateData.leaveType;
  }
  if (updateData.notes !== undefined) {
    leave.notes = updateData.notes || null;
  }

  await candidate.save();

  // Update corresponding attendance record
  const newDate = new Date(leave.date);
  newDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(newDate);
  nextDay.setDate(nextDay.getDate() + 1);

  // Find attendance record for the old date
  const attendance = await Attendance.findOne({
    candidate: candidateId,
    date: {
      $gte: oldDate,
      $lt: new Date(oldDate.getTime() + 24 * 60 * 60 * 1000),
    },
    status: 'Leave',
  });

  if (attendance) {
    // If date changed, check if attendance already exists for new date
    if (newDate.getTime() !== oldDate.getTime()) {
      const existingAttendance = await Attendance.findOne({
        candidate: candidateId,
        date: {
          $gte: newDate,
          $lt: nextDay,
        },
      });

      if (existingAttendance) {
        // Delete old attendance and keep existing one
        await Attendance.findByIdAndDelete(attendance._id);
      } else {
        // Update attendance date
        attendance.date = newDate;
        attendance.punchIn = newDate;
        attendance.leaveType = leave.leaveType;
        attendance.notes = leave.notes || `${leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)} Leave`;
        await attendance.save();
      }
    } else {
      // Date didn't change, just update leave type and notes
      attendance.leaveType = leave.leaveType;
      attendance.notes = leave.notes || `${leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)} Leave`;
      await attendance.save();
    }
  }

  return {
    success: true,
    message: 'Leave updated successfully',
    data: {
      candidate: await candidate.populate('leaves'),
      leave: leave,
    },
  };
};

/**
 * Delete a leave for a candidate
 * Admin can delete a leave and its corresponding attendance record
 * @param {string} candidateId - Candidate ID
 * @param {string} leaveId - Leave ID (from leaves array)
 * @param {Object} user - Current user
 * @returns {Promise<Object>}
 */
const deleteLeaveForCandidate = async (candidateId, leaveId, user) => {
  // Check permissions: only admin can delete leaves
  if (user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admin can delete leaves');
  }

  // Validate candidate
  const candidate = await Candidate.findById(candidateId);
  if (!candidate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Candidate not found');
  }

  // Find the leave in the candidate's leaves array
  const leave = candidate.leaves.id(leaveId);
  if (!leave) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Leave not found');
  }

  // Store date for attendance record deletion
  const leaveDate = new Date(leave.date);
  leaveDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(leaveDate);
  nextDay.setDate(nextDay.getDate() + 1);

  // Remove leave from candidate's leaves array
  candidate.leaves.pull(leaveId);
  await candidate.save();

  // Delete corresponding attendance record
  await Attendance.deleteOne({
    candidate: candidateId,
    date: {
      $gte: leaveDate,
      $lt: nextDay,
    },
    status: 'Leave',
    leaveType: leave.leaveType,
  });

  return {
    success: true,
    message: 'Leave deleted successfully',
    data: {
      candidateId: candidateId,
      leaveId: leaveId,
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
  assignLeavesToCandidates,
  updateLeaveForCandidate,
  deleteLeaveForCandidate,
};

