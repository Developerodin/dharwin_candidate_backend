import httpStatus from 'http-status';
import pick from '../utils/pick.js';
import catchAsync from '../utils/catchAsync.js';
import {
  createLeaveRequest,
  queryLeaveRequests,
  getLeaveRequestById,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest,
  getLeaveRequestsByCandidateId,
} from '../services/leaveRequest.service.js';

/**
 * Create a leave request
 */
const create = catchAsync(async (req, res) => {
  const { candidateId } = req.params;
  const { dates, leaveType, notes } = req.body;

  const leaveRequest = await createLeaveRequest(
    candidateId,
    dates,
    leaveType,
    notes,
    req.user
  );

  res.status(httpStatus.CREATED).send({
    success: true,
    message: 'Leave request created successfully',
    data: leaveRequest,
  });
});

/**
 * Get all leave requests
 */
const list = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['candidate', 'status', 'leaveType']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  const result = await queryLeaveRequests(filter, options, req.user);

  res.status(httpStatus.OK).send({
    success: true,
    data: result,
  });
});

/**
 * Get leave request by ID
 */
const get = catchAsync(async (req, res) => {
  const { requestId } = req.params;

  const leaveRequest = await getLeaveRequestById(requestId, req.user);

  res.status(httpStatus.OK).send({
    success: true,
    data: leaveRequest,
  });
});

/**
 * Approve a leave request
 */
const approve = catchAsync(async (req, res) => {
  const { requestId } = req.params;
  const { adminComment } = req.body;

  const result = await approveLeaveRequest(requestId, adminComment, req.user);

  res.status(httpStatus.OK).send({
    success: true,
    message: result.message,
    data: result.data,
  });
});

/**
 * Reject a leave request
 */
const reject = catchAsync(async (req, res) => {
  const { requestId } = req.params;
  const { adminComment } = req.body;

  const leaveRequest = await rejectLeaveRequest(requestId, adminComment, req.user);

  res.status(httpStatus.OK).send({
    success: true,
    message: 'Leave request rejected successfully',
    data: leaveRequest,
  });
});

/**
 * Cancel a leave request
 */
const cancel = catchAsync(async (req, res) => {
  const { requestId } = req.params;

  const leaveRequest = await cancelLeaveRequest(requestId, req.user);

  res.status(httpStatus.OK).send({
    success: true,
    message: 'Leave request cancelled successfully',
    data: leaveRequest,
  });
});

/**
 * Get leave requests by candidate ID
 */
const getByCandidate = catchAsync(async (req, res) => {
  const { candidateId } = req.params;
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'status']);

  const result = await getLeaveRequestsByCandidateId(candidateId, options, req.user);

  res.status(httpStatus.OK).send({
    success: true,
    data: result,
  });
});

export {
  create,
  list,
  get,
  approve,
  reject,
  cancel,
  getByCandidate,
};
