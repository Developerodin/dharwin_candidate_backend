import httpStatus from 'http-status';
import ApiError from '../utils/ApiError.js';
import BackdatedAttendanceRequest from '../models/backdatedAttendanceRequest.model.js';
import Candidate from '../models/candidate.model.js';
import Attendance from '../models/attendance.model.js';
import pick from '../utils/pick.js';

/**
 * Create a backdated attendance request with multiple dates
 * @param {ObjectId} candidateId
 * @param {Array} attendanceEntries - Array of attendance entries, each with {date, punchIn, punchOut?, timezone?}
 * @param {string} [notes] - Optional notes
 * @param {Object} user - Current user (must be candidate owner or admin)
 * @returns {Promise<BackdatedAttendanceRequest>}
 */
const createBackdatedAttendanceRequest = async (candidateId, attendanceEntries, notes, user) => {
  // Validate candidate
  const candidate = await Candidate.findById(candidateId);
  if (!candidate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Candidate not found');
  }

  // Check permissions: candidate owner or admin can create requests
  if (user.role !== 'admin' && String(candidate.owner) !== String(user.id)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only create backdated attendance requests for yourself');
  }

  // Validate attendance entries array
  if (!Array.isArray(attendanceEntries) || attendanceEntries.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'At least one attendance entry is required');
  }

  // Get today's UTC date for validation
  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0));

  // Normalize and validate each attendance entry
  const normalizedEntries = [];
  const normalizedDates = new Set();

  for (let i = 0; i < attendanceEntries.length; i++) {
    const entry = attendanceEntries[i];
    
    if (!entry.date || !entry.punchIn) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Attendance entry ${i + 1}: date and punchIn are required`);
    }

    // Parse and normalize date to UTC midnight (preserve the date, don't shift timezone)
    const dateObj = new Date(entry.date);
    if (isNaN(dateObj.getTime())) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Attendance entry ${i + 1}: Invalid date: ${entry.date}`);
    }
    
    // Extract UTC year, month, day to preserve the date regardless of timezone
    const utcYear = dateObj.getUTCFullYear();
    const utcMonth = dateObj.getUTCMonth();
    const utcDay = dateObj.getUTCDate();
    const normalizedDate = new Date(Date.UTC(utcYear, utcMonth, utcDay, 0, 0, 0, 0));

    // Validate date is in the past
    if (normalizedDate >= todayUTC) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Attendance entry ${i + 1}: Backdated attendance requests can only be made for past dates`
      );
    }

    // Check for duplicate dates in the same request
    const dateKey = normalizedDate.getTime();
    if (normalizedDates.has(dateKey)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Attendance entry ${i + 1}: Duplicate date ${normalizedDate.toISOString().split('T')[0]} in the same request`
      );
    }
    normalizedDates.add(dateKey);

    // Validate punch in
    const punchIn = new Date(entry.punchIn);
    if (isNaN(punchIn.getTime())) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Attendance entry ${i + 1}: Invalid punchIn time: ${entry.punchIn}`);
    }

    // Validate punch out if provided
    let punchOut = null;
    if (entry.punchOut) {
      punchOut = new Date(entry.punchOut);
      if (isNaN(punchOut.getTime())) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Attendance entry ${i + 1}: Invalid punchOut time: ${entry.punchOut}`);
      }
      if (punchOut <= punchIn) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Attendance entry ${i + 1}: Punch out time must be after punch in time`
        );
      }
    }

    normalizedEntries.push({
      date: normalizedDate,
      punchIn,
      punchOut: punchOut || null,
      timezone: entry.timezone || 'UTC',
    });
  }

  // Check for existing pending requests for any of the dates
  const dateArray = Array.from(normalizedDates);
  const existingRequests = await BackdatedAttendanceRequest.find({
    candidate: candidateId,
    status: 'pending',
    'attendanceEntries.date': {
      $in: dateArray,
    },
  });

  if (existingRequests.length > 0) {
    // Find conflicting dates
    const conflictingDates = [];
    for (const existingRequest of existingRequests) {
      for (const existingEntry of existingRequest.attendanceEntries) {
        const existingDateKey = existingEntry.date.getTime();
        if (normalizedDates.has(existingDateKey)) {
          conflictingDates.push(existingEntry.date.toISOString().split('T')[0]);
        }
      }
    }

    if (conflictingDates.length > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `You already have pending backdated attendance requests for: ${conflictingDates.join(', ')}`
      );
    }
  }

  // Create backdated attendance request
  const request = await BackdatedAttendanceRequest.create({
    candidate: candidateId,
    candidateEmail: candidate.email,
    attendanceEntries: normalizedEntries,
    notes: notes || null,
    status: 'pending',
    requestedBy: user.id,
  });

  return request.populate('candidate', 'fullName email').populate('requestedBy', 'name email');
};

/**
 * Query backdated attendance requests
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @param {Object} user - Current user (for permission checking)
 * @returns {Promise<QueryResult>}
 */
const queryBackdatedAttendanceRequests = async (filter, options, user) => {
  // If not admin, only show requests for candidates owned by the user
  if (user.role !== 'admin') {
    // Get all candidates owned by this user
    const candidates = await Candidate.find({ owner: user.id }).select('_id');
    const candidateIds = candidates.map((c) => c._id);
    
    if (candidateIds.length === 0) {
      // No candidates owned, return empty result
      return {
        results: [],
        page: options.page || 1,
        limit: options.limit || 10,
        totalPages: 0,
        totalResults: 0,
      };
    }
    
    filter.candidate = { $in: candidateIds };
  }

  const requests = await BackdatedAttendanceRequest.paginate(filter, {
    ...options,
    sortBy: options.sortBy || 'createdAt:desc',
  });

  // Manually populate with field selection
  if (requests.results && requests.results.length > 0) {
    await BackdatedAttendanceRequest.populate(requests.results, [
      { path: 'candidate', select: 'fullName email' },
      { path: 'requestedBy', select: 'name email' },
      { path: 'reviewedBy', select: 'name email' },
    ]);
  }

  return requests;
};

/**
 * Get backdated attendance request by ID
 * @param {ObjectId} id
 * @param {Object} user - Current user (for permission checking)
 * @returns {Promise<BackdatedAttendanceRequest>}
 */
const getBackdatedAttendanceRequestById = async (id, user) => {
  const request = await BackdatedAttendanceRequest.findById(id)
    .populate('candidate', 'fullName email owner')
    .populate('requestedBy', 'name email')
    .populate('reviewedBy', 'name email');

  if (!request) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Backdated attendance request not found');
  }

  // Check permissions: admin or candidate owner can view
  const candidateOwnerId = request.candidate.owner?._id || request.candidate.owner;
  if (user.role !== 'admin' && String(candidateOwnerId) !== String(user.id)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  return request;
};

/**
 * Approve a backdated attendance request
 * Admin approves the request and creates/updates the attendance record
 * @param {ObjectId} requestId
 * @param {string} [adminComment] - Optional admin comment
 * @param {Object} user - Current user (must be admin)
 * @returns {Promise<Object>}
 */
const approveBackdatedAttendanceRequest = async (requestId, adminComment, user) => {
  // Check permissions: only admin can approve
  if (user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admin can approve backdated attendance requests');
  }

  const request = await BackdatedAttendanceRequest.findById(requestId)
    .populate('candidate', 'fullName email');

  if (!request) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Backdated attendance request not found');
  }

  if (request.status !== 'pending') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot approve backdated attendance request. Current status is: ${request.status}`
    );
  }

  // Approve the request
  request.status = 'approved';
  request.adminComment = adminComment || null;
  request.reviewedBy = user.id;
  request.reviewedAt = new Date();
  await request.save();

  // IMPORTANT: Create or update attendance records in the attendance system
  // This ensures the backdated attendance is reflected in the candidate's attendance calendar
  try {
    const createdOrUpdatedAttendances = [];
    const errors = [];

    // Process each attendance entry
    for (let i = 0; i < request.attendanceEntries.length; i++) {
      const entry = request.attendanceEntries[i];
      
      try {
        // Normalize date to UTC midnight for consistent querying
        const normalizedDate = new Date(entry.date);
        normalizedDate.setUTCHours(0, 0, 0, 0);
        const nextDay = new Date(normalizedDate);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);

        // Check if attendance already exists for this date
        let attendance = await Attendance.findOne({
          candidate: request.candidate._id,
          date: {
            $gte: normalizedDate,
            $lt: nextDay,
          },
        });

        if (attendance) {
          // Update existing attendance record
          attendance.punchIn = entry.punchIn;
          attendance.punchOut = entry.punchOut || null;
          attendance.timezone = entry.timezone;
          
          // Update notes (merge with existing or replace)
          if (request.notes) {
            attendance.notes = request.notes;
          }
          
          // Calculate duration
          if (entry.punchOut) {
            attendance.duration = entry.punchOut.getTime() - entry.punchIn.getTime();
          } else {
            attendance.duration = 0;
          }
          
          // Set status to Present (backdated attendance request means they were present)
          attendance.status = 'Present';
          
          // Clear leaveType if it was set (since this is attendance, not leave)
          attendance.leaveType = undefined;
          
          // Ensure isActive is true
          attendance.isActive = true;
          
          await attendance.save();
          createdOrUpdatedAttendances.push(await attendance.populate('candidate', 'fullName email'));
        } else {
          // Create new attendance record
          attendance = await Attendance.create({
            candidate: request.candidate._id,
            candidateEmail: request.candidateEmail,
            date: normalizedDate,
            punchIn: entry.punchIn,
            punchOut: entry.punchOut || null,
            timezone: entry.timezone,
            notes: request.notes || null,
            duration: entry.punchOut ? entry.punchOut.getTime() - entry.punchIn.getTime() : 0,
            status: 'Present',
            isActive: true,
          });
          createdOrUpdatedAttendances.push(await attendance.populate('candidate', 'fullName email'));
        }
      } catch (error) {
        errors.push({
          entryIndex: i,
          date: entry.date.toISOString().split('T')[0],
          error: error.message,
        });
      }
    }

    // If all entries failed, revert the approval
    if (createdOrUpdatedAttendances.length === 0 && errors.length > 0) {
      request.status = 'pending';
      request.adminComment = null;
      request.reviewedBy = null;
      request.reviewedAt = null;
      await request.save();

      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Failed to create/update attendance for all dates: ${errors.map(e => `${e.date}: ${e.error}`).join('; ')}`
      );
    }

    return {
      success: true,
      message: `Backdated attendance request approved. ${createdOrUpdatedAttendances.length} attendance record(s) created/updated successfully${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
      data: {
        request: await request.populate('requestedBy', 'name email').populate('reviewedBy', 'name email'),
        attendances: createdOrUpdatedAttendances,
        errors: errors.length > 0 ? errors : undefined,
      },
    };
  } catch (error) {
    // If attendance creation/update fails, revert the approval status
    request.status = 'pending';
    request.adminComment = null;
    request.reviewedBy = null;
    request.reviewedAt = null;
    await request.save();

    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to create/update attendance: ${error.message}`
    );
  }
};

/**
 * Reject a backdated attendance request
 * Admin rejects the request with optional comment
 * @param {ObjectId} requestId
 * @param {string} [adminComment] - Optional admin comment explaining rejection
 * @param {Object} user - Current user (must be admin)
 * @returns {Promise<BackdatedAttendanceRequest>}
 */
const rejectBackdatedAttendanceRequest = async (requestId, adminComment, user) => {
  // Check permissions: only admin can reject
  if (user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admin can reject backdated attendance requests');
  }

  const request = await BackdatedAttendanceRequest.findById(requestId);

  if (!request) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Backdated attendance request not found');
  }

  if (request.status !== 'pending') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot reject backdated attendance request. Current status is: ${request.status}`
    );
  }

  // Reject the request
  request.status = 'rejected';
  request.adminComment = adminComment || null;
  request.reviewedBy = user.id;
  request.reviewedAt = new Date();
  await request.save();

  return request.populate('candidate', 'fullName email')
    .populate('requestedBy', 'name email')
    .populate('reviewedBy', 'name email');
};

/**
 * Update a backdated attendance request
 * Admin can update pending requests before approval
 * @param {ObjectId} requestId
 * @param {Object} updateData - Data to update (attendanceEntries array or notes)
 * @param {Object} user - Current user (must be admin)
 * @returns {Promise<BackdatedAttendanceRequest>}
 */
const updateBackdatedAttendanceRequest = async (requestId, updateData, user) => {
  // Check permissions: only admin can update
  if (user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admin can update backdated attendance requests');
  }

  const request = await BackdatedAttendanceRequest.findById(requestId);

  if (!request) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Backdated attendance request not found');
  }

  if (request.status !== 'pending') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot update backdated attendance request. Current status is: ${request.status}`
    );
  }

  // Update attendance entries if provided
  if (updateData.attendanceEntries !== undefined) {
    if (!Array.isArray(updateData.attendanceEntries) || updateData.attendanceEntries.length === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'At least one attendance entry is required');
    }

    // Get today's UTC date for validation
    const today = new Date();
    const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0));

    // Normalize and validate each attendance entry
    const normalizedEntries = [];
    const normalizedDates = new Set();

    for (let i = 0; i < updateData.attendanceEntries.length; i++) {
      const entry = updateData.attendanceEntries[i];
      
      if (!entry.date || !entry.punchIn) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Attendance entry ${i + 1}: date and punchIn are required`);
      }

      // Parse and normalize date to UTC midnight
      const dateObj = new Date(entry.date);
      if (isNaN(dateObj.getTime())) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Attendance entry ${i + 1}: Invalid date: ${entry.date}`);
      }
      
      const utcYear = dateObj.getUTCFullYear();
      const utcMonth = dateObj.getUTCMonth();
      const utcDay = dateObj.getUTCDate();
      const normalizedDate = new Date(Date.UTC(utcYear, utcMonth, utcDay, 0, 0, 0, 0));

      // Validate date is in the past
      if (normalizedDate >= todayUTC) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Attendance entry ${i + 1}: Backdated attendance requests can only be made for past dates`
        );
      }

      // Check for duplicate dates
      const dateKey = normalizedDate.getTime();
      if (normalizedDates.has(dateKey)) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Attendance entry ${i + 1}: Duplicate date ${normalizedDate.toISOString().split('T')[0]} in the same request`
        );
      }
      normalizedDates.add(dateKey);

      // Validate punch in
      const punchIn = new Date(entry.punchIn);
      if (isNaN(punchIn.getTime())) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Attendance entry ${i + 1}: Invalid punchIn time: ${entry.punchIn}`);
      }

      // Validate punch out if provided
      let punchOut = null;
      if (entry.punchOut) {
        punchOut = new Date(entry.punchOut);
        if (isNaN(punchOut.getTime())) {
          throw new ApiError(httpStatus.BAD_REQUEST, `Attendance entry ${i + 1}: Invalid punchOut time: ${entry.punchOut}`);
        }
        if (punchOut <= punchIn) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Attendance entry ${i + 1}: Punch out time must be after punch in time`
          );
        }
      }

      normalizedEntries.push({
        date: normalizedDate,
        punchIn,
        punchOut: punchOut || null,
        timezone: entry.timezone || 'UTC',
      });
    }

    request.attendanceEntries = normalizedEntries;
  }

  // Update notes if provided
  if (updateData.notes !== undefined) {
    request.notes = updateData.notes || null;
  }

  await request.save();

  return request.populate('candidate', 'fullName email')
    .populate('requestedBy', 'name email');
};

/**
 * Cancel a backdated attendance request
 * Candidate can cancel their own pending requests
 * @param {ObjectId} requestId
 * @param {Object} user - Current user
 * @returns {Promise<BackdatedAttendanceRequest>}
 */
const cancelBackdatedAttendanceRequest = async (requestId, user) => {
  const request = await BackdatedAttendanceRequest.findById(requestId)
    .populate('candidate', 'fullName email owner');

  if (!request) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Backdated attendance request not found');
  }

  // Check permissions: candidate owner or admin can cancel
  const candidateOwnerId = request.candidate.owner?._id || request.candidate.owner;
  if (user.role !== 'admin' && String(candidateOwnerId) !== String(user.id)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only cancel your own backdated attendance requests');
  }

  if (request.status !== 'pending') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot cancel backdated attendance request. Current status is: ${request.status}`
    );
  }

  // Cancel the request
  request.status = 'cancelled';
  await request.save();

  return request.populate('requestedBy', 'name email');
};

/**
 * Get backdated attendance requests by candidate ID
 * @param {ObjectId} candidateId
 * @param {Object} options - Query options
 * @param {Object} user - Current user (for permission checking)
 * @returns {Promise<QueryResult>}
 */
const getBackdatedAttendanceRequestsByCandidateId = async (candidateId, options = {}, user) => {
  // Validate candidate
  const candidate = await Candidate.findById(candidateId);
  if (!candidate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Candidate not found');
  }

  // Check permissions: admin or candidate owner can view
  if (user.role !== 'admin' && String(candidate.owner) !== String(user.id)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  const filter = { candidate: candidateId };
  const queryOptions = pick(options, ['sortBy', 'limit', 'page', 'status']);

  if (options.status) {
    filter.status = options.status;
  }

  return queryBackdatedAttendanceRequests(filter, queryOptions, user);
};

export {
  createBackdatedAttendanceRequest,
  queryBackdatedAttendanceRequests,
  getBackdatedAttendanceRequestById,
  approveBackdatedAttendanceRequest,
  rejectBackdatedAttendanceRequest,
  updateBackdatedAttendanceRequest,
  cancelBackdatedAttendanceRequest,
  getBackdatedAttendanceRequestsByCandidateId,
};
