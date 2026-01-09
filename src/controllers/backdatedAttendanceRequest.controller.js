import httpStatus from 'http-status';
import pick from '../utils/pick.js';
import catchAsync from '../utils/catchAsync.js';
import {
  createBackdatedAttendanceRequest,
  queryBackdatedAttendanceRequests,
  getBackdatedAttendanceRequestById,
  approveBackdatedAttendanceRequest,
  rejectBackdatedAttendanceRequest,
  updateBackdatedAttendanceRequest,
  cancelBackdatedAttendanceRequest,
  getBackdatedAttendanceRequestsByCandidateId,
} from '../services/backdatedAttendanceRequest.service.js';

/**
 * Create a backdated attendance request
 */
const create = catchAsync(async (req, res) => {
  const { candidateId } = req.params;
  const { attendanceEntries, notes } = req.body;

  const request = await createBackdatedAttendanceRequest(
    candidateId,
    attendanceEntries,
    notes,
    req.user
  );

  res.status(httpStatus.CREATED).send({
    success: true,
    message: 'Backdated attendance request created successfully',
    data: request,
  });
});

/**
 * Get all backdated attendance requests
 */
const list = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['candidate', 'status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  const result = await queryBackdatedAttendanceRequests(filter, options, req.user);

  res.status(httpStatus.OK).send({
    success: true,
    data: result,
  });
});

/**
 * Get backdated attendance request by ID
 */
const get = catchAsync(async (req, res) => {
  const { requestId } = req.params;

  const request = await getBackdatedAttendanceRequestById(requestId, req.user);

  res.status(httpStatus.OK).send({
    success: true,
    data: request,
  });
});

/**
 * Approve a backdated attendance request
 */
const approve = catchAsync(async (req, res) => {
  const { requestId } = req.params;
  const { adminComment } = req.body;

  const result = await approveBackdatedAttendanceRequest(requestId, adminComment, req.user);

  res.status(httpStatus.OK).send({
    success: true,
    message: result.message,
    data: result.data,
  });
});

/**
 * Reject a backdated attendance request
 */
const reject = catchAsync(async (req, res) => {
  const { requestId } = req.params;
  const { adminComment } = req.body;

  const request = await rejectBackdatedAttendanceRequest(requestId, adminComment, req.user);

  res.status(httpStatus.OK).send({
    success: true,
    message: 'Backdated attendance request rejected successfully',
    data: request,
  });
});

/**
 * Update a backdated attendance request
 */
const update = catchAsync(async (req, res) => {
  const { requestId } = req.params;
  const { attendanceEntries, notes } = req.body;

  const request = await updateBackdatedAttendanceRequest(
    requestId,
    { attendanceEntries, notes },
    req.user
  );

  res.status(httpStatus.OK).send({
    success: true,
    message: 'Backdated attendance request updated successfully',
    data: request,
  });
});

/**
 * Cancel a backdated attendance request
 */
const cancel = catchAsync(async (req, res) => {
  const { requestId } = req.params;

  const request = await cancelBackdatedAttendanceRequest(requestId, req.user);

  res.status(httpStatus.OK).send({
    success: true,
    message: 'Backdated attendance request cancelled successfully',
    data: request,
  });
});

/**
 * Get backdated attendance requests by candidate ID
 */
const getByCandidate = catchAsync(async (req, res) => {
  const { candidateId } = req.params;
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'status']);

  const result = await getBackdatedAttendanceRequestsByCandidateId(candidateId, options, req.user);

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
  update,
  cancel,
  getByCandidate,
};
