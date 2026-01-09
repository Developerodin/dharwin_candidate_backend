import httpStatus from 'http-status';
import ApiError from '../utils/ApiError.js';
import LeaveRequest from '../models/leaveRequest.model.js';
import Candidate from '../models/candidate.model.js';
import { assignLeavesToCandidates } from './attendance.service.js';
import pick from '../utils/pick.js';

/**
 * Create a leave request
 * @param {ObjectId} candidateId
 * @param {Array<Date>} dates - Array of dates for leave
 * @param {string} leaveType - Type of leave ('casual', 'sick', or 'unpaid')
 * @param {string} [notes] - Optional notes
 * @param {Object} user - Current user (must be candidate owner or admin)
 * @returns {Promise<LeaveRequest>}
 */
const createLeaveRequest = async (candidateId, dates, leaveType, notes, user) => {
  // Validate candidate
  const candidate = await Candidate.findById(candidateId);
  if (!candidate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Candidate not found');
  }

  // Check permissions: candidate owner or admin can create leave requests
  if (user.role !== 'admin' && String(candidate.owner) !== String(user.id)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only create leave requests for yourself');
  }

  // Validate dates array
  if (!Array.isArray(dates) || dates.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'At least one date is required');
  }

  // Validate leave type
  if (!['casual', 'sick', 'unpaid'].includes(leaveType)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Leave type must be either "casual", "sick", or "unpaid"');
  }

  // Normalize dates (remove duplicates and sort, validate dates)
  const normalizedDates = dates
    .map((d) => {
      const date = new Date(d);
      if (isNaN(date.getTime())) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Invalid date: ${d}`);
      }
      // Normalize to UTC midnight to avoid timezone shifts
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

  // Check for existing pending requests for the same dates
  const existingRequests = await LeaveRequest.find({
    candidate: candidateId,
    status: 'pending',
    dates: { $in: normalizedDates },
  });

  if (existingRequests.length > 0) {
    const conflictingDates = existingRequests.flatMap((req) => req.dates);
    const duplicateDates = normalizedDates.filter((date) =>
      conflictingDates.some((existingDate) => existingDate.getTime() === date.getTime())
    );

    if (duplicateDates.length > 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `You already have pending leave requests for: ${duplicateDates.map((d) => d.toISOString().split('T')[0]).join(', ')}`
      );
    }
  }

  // Create leave request
  const leaveRequest = await LeaveRequest.create({
    candidate: candidateId,
    candidateEmail: candidate.email,
    dates: normalizedDates,
    leaveType,
    notes: notes || null,
    status: 'pending',
    requestedBy: user.id,
  });

  return leaveRequest.populate('candidate', 'fullName email').populate('requestedBy', 'name email');
};

/**
 * Query leave requests
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @param {Object} user - Current user (for permission checking)
 * @returns {Promise<QueryResult>}
 */
const queryLeaveRequests = async (filter, options, user) => {
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

  const leaveRequests = await LeaveRequest.paginate(filter, {
    ...options,
    sortBy: options.sortBy || 'createdAt:desc',
  });

  // Manually populate with field selection
  if (leaveRequests.results && leaveRequests.results.length > 0) {
    await LeaveRequest.populate(leaveRequests.results, [
      { path: 'candidate', select: 'fullName email' },
      { path: 'requestedBy', select: 'name email' },
      { path: 'reviewedBy', select: 'name email' },
    ]);
  }

  return leaveRequests;
};

/**
 * Get leave request by ID
 * @param {ObjectId} id
 * @param {Object} user - Current user (for permission checking)
 * @returns {Promise<LeaveRequest>}
 */
const getLeaveRequestById = async (id, user) => {
  const leaveRequest = await LeaveRequest.findById(id)
    .populate('candidate', 'fullName email owner')
    .populate('requestedBy', 'name email')
    .populate('reviewedBy', 'name email');

  if (!leaveRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Leave request not found');
  }

  // Check permissions: admin or candidate owner can view
  const candidateOwnerId = leaveRequest.candidate.owner?._id || leaveRequest.candidate.owner;
  if (user.role !== 'admin' && String(candidateOwnerId) !== String(user.id)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  return leaveRequest;
};

/**
 * Approve a leave request
 * Admin approves the request and automatically assigns the leave
 * @param {ObjectId} requestId
 * @param {string} [adminComment] - Optional admin comment
 * @param {Object} user - Current user (must be admin)
 * @returns {Promise<Object>}
 */
const approveLeaveRequest = async (requestId, adminComment, user) => {
  // Check permissions: only admin can approve
  if (user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admin can approve leave requests');
  }

  const leaveRequest = await LeaveRequest.findById(requestId)
    .populate('candidate', 'fullName email');

  if (!leaveRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Leave request not found');
  }

  if (leaveRequest.status !== 'pending') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot approve leave request. Current status is: ${leaveRequest.status}`
    );
  }

  // Approve the request
  leaveRequest.status = 'approved';
  leaveRequest.adminComment = adminComment || null;
  leaveRequest.reviewedBy = user.id;
  leaveRequest.reviewedAt = new Date();
  await leaveRequest.save();

  // Automatically assign the leave using existing attendance service
  try {
    const assignResult = await assignLeavesToCandidates(
      [leaveRequest.candidate._id],
      leaveRequest.dates,
      leaveRequest.leaveType,
      leaveRequest.notes || `Approved leave request`,
      user
    );

    return {
      success: true,
      message: 'Leave request approved and leave assigned successfully',
      data: {
        leaveRequest: await leaveRequest.populate('requestedBy', 'name email').populate('reviewedBy', 'name email'),
        leaveAssignment: assignResult,
      },
    };
  } catch (error) {
    // If leave assignment fails, revert the approval status
    leaveRequest.status = 'pending';
    leaveRequest.adminComment = null;
    leaveRequest.reviewedBy = null;
    leaveRequest.reviewedAt = null;
    await leaveRequest.save();

    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to assign leave: ${error.message}`
    );
  }
};

/**
 * Reject a leave request
 * Admin rejects the request with optional comment
 * @param {ObjectId} requestId
 * @param {string} [adminComment] - Optional admin comment explaining rejection
 * @param {Object} user - Current user (must be admin)
 * @returns {Promise<LeaveRequest>}
 */
const rejectLeaveRequest = async (requestId, adminComment, user) => {
  // Check permissions: only admin can reject
  if (user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admin can reject leave requests');
  }

  const leaveRequest = await LeaveRequest.findById(requestId);

  if (!leaveRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Leave request not found');
  }

  if (leaveRequest.status !== 'pending') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot reject leave request. Current status is: ${leaveRequest.status}`
    );
  }

  // Reject the request
  leaveRequest.status = 'rejected';
  leaveRequest.adminComment = adminComment || null;
  leaveRequest.reviewedBy = user.id;
  leaveRequest.reviewedAt = new Date();
  await leaveRequest.save();

  return leaveRequest.populate('candidate', 'fullName email')
    .populate('requestedBy', 'name email')
    .populate('reviewedBy', 'name email');
};

/**
 * Cancel a leave request
 * Candidate can cancel their own pending requests
 * @param {ObjectId} requestId
 * @param {Object} user - Current user
 * @returns {Promise<LeaveRequest>}
 */
const cancelLeaveRequest = async (requestId, user) => {
  const leaveRequest = await LeaveRequest.findById(requestId)
    .populate('candidate', 'fullName email owner');

  if (!leaveRequest) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Leave request not found');
  }

  // Check permissions: candidate owner or admin can cancel
  const candidateOwnerId = leaveRequest.candidate.owner?._id || leaveRequest.candidate.owner;
  if (user.role !== 'admin' && String(candidateOwnerId) !== String(user.id)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only cancel your own leave requests');
  }

  if (leaveRequest.status !== 'pending') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot cancel leave request. Current status is: ${leaveRequest.status}`
    );
  }

  // Cancel the request
  leaveRequest.status = 'cancelled';
  await leaveRequest.save();

  return leaveRequest.populate('requestedBy', 'name email');
};

/**
 * Get leave requests by candidate ID
 * @param {ObjectId} candidateId
 * @param {Object} options - Query options
 * @param {Object} user - Current user (for permission checking)
 * @returns {Promise<QueryResult>}
 */
const getLeaveRequestsByCandidateId = async (candidateId, options = {}, user) => {
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

  return queryLeaveRequests(filter, queryOptions, user);
};

export {
  createLeaveRequest,
  queryLeaveRequests,
  getLeaveRequestById,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
  getLeaveRequestsByCandidateId,
};
