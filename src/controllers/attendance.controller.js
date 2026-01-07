import httpStatus from 'http-status';
import pick from '../utils/pick.js';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';
import {
  punchIn,
  punchOut,
  getAttendanceById,
  queryAttendance,
  getAttendanceByCandidateId,
  getCurrentPunchStatus,
  getAttendanceStatistics,
  getAllAttendance,
  addHolidaysToCandidates,
} from '../services/attendance.service.js';
import { getCandidateById } from '../services/candidate.service.js';

/**
 * Punch in for a candidate
 */
const createPunchIn = catchAsync(async (req, res) => {
  const { candidateId } = req.params;
  const { punchInTime, notes, timezone } = req.body;

  // Check if user has permission to punch in for this candidate
  const candidate = await getCandidateById(candidateId);
  if (!candidate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Candidate not found');
  }

  // Only candidate owner or admin can punch in
  if (req.user.role !== 'admin' && String(candidate.owner) !== String(req.user.id)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  const attendance = await punchIn(
    candidateId,
    punchInTime ? new Date(punchInTime) : undefined,
    notes,
    timezone || 'UTC'
  );

  res.status(httpStatus.CREATED).send({
    success: true,
    message: 'Punched in successfully',
    data: attendance,
  });
});

/**
 * Punch out for a candidate
 */
const createPunchOut = catchAsync(async (req, res) => {
  const { candidateId } = req.params;
  const { punchOutTime, notes, timezone } = req.body;

  // Check if user has permission to punch out for this candidate
  const candidate = await getCandidateById(candidateId);
  if (!candidate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Candidate not found');
  }

  // Only candidate owner or admin can punch out
  if (req.user.role !== 'admin' && String(candidate.owner) !== String(req.user.id)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  const attendance = await punchOut(
    candidateId,
    punchOutTime ? new Date(punchOutTime) : undefined,
    notes,
    timezone
  );

  res.status(httpStatus.OK).send({
    success: true,
    message: 'Punched out successfully',
    data: attendance,
  });
});

/**
 * Get current punch status for a candidate
 */
const getStatus = catchAsync(async (req, res) => {
  const { candidateId } = req.params;

  // Check if user has permission to view this candidate's status
  const candidate = await getCandidateById(candidateId);
  if (!candidate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Candidate not found');
  }

  // Only candidate owner or admin can view status
  if (req.user.role !== 'admin' && String(candidate.owner) !== String(req.user.id)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  const attendance = await getCurrentPunchStatus(candidateId);

  res.status(httpStatus.OK).send({
    success: true,
    data: attendance || null,
    isPunchedIn: attendance !== null,
  });
});

/**
 * Get attendance records for a candidate
 */
const getCandidateAttendance = catchAsync(async (req, res) => {
  const { candidateId } = req.params;
  const filter = pick(req.query, ['startDate', 'endDate']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'startDate', 'endDate']);

  // Check if user has permission to view this candidate's attendance
  const candidate = await getCandidateById(candidateId);
  if (!candidate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Candidate not found');
  }

  // Only candidate owner or admin can view attendance
  if (req.user.role !== 'admin' && String(candidate.owner) !== String(req.user.id)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  const result = await getAttendanceByCandidateId(candidateId, options);

  res.status(httpStatus.OK).send({
    success: true,
    data: result,
  });
});

/**
 * Get all attendance records (admin only)
 */
const getAll = catchAsync(async (req, res) => {
  // Only admin can view all attendance records
  if (req.user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admin can view all attendance records');
  }

  const filter = pick(req.query, ['candidate', 'candidateEmail', 'day']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'startDate', 'endDate']);

  const result = await getAllAttendance(filter, options);

  res.status(httpStatus.OK).send({
    success: true,
    data: result,
  });
});

/**
 * Get attendance by ID
 */
const get = catchAsync(async (req, res) => {
  const { attendanceId } = req.params;

  const attendance = await getAttendanceById(attendanceId);
  if (!attendance) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Attendance record not found');
  }

  // Only candidate owner or admin can view attendance
  // Check if candidate owner matches (owner can be ObjectId or populated object)
  const candidateOwnerId = attendance.candidate.owner?._id || attendance.candidate.owner;
  if (req.user.role !== 'admin' && String(candidateOwnerId) !== String(req.user.id)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  res.status(httpStatus.OK).send({
    success: true,
    data: attendance,
  });
});

/**
 * Get attendance statistics for a candidate
 */
const getStatistics = catchAsync(async (req, res) => {
  const { candidateId } = req.params;
  const filter = pick(req.query, ['startDate', 'endDate']);

  // Check if user has permission to view this candidate's statistics
  const candidate = await getCandidateById(candidateId);
  if (!candidate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Candidate not found');
  }

  // Only candidate owner or admin can view statistics
  if (req.user.role !== 'admin' && String(candidate.owner) !== String(req.user.id)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  const statistics = await getAttendanceStatistics(candidateId, filter);

  res.status(httpStatus.OK).send({
    success: true,
    data: statistics,
  });
});

/**
 * Add holidays to candidate calendar attendance
 */
const addHolidays = catchAsync(async (req, res) => {
  const { candidateIds, holidayIds } = req.body;

  const result = await addHolidaysToCandidates(candidateIds, holidayIds, req.user);

  res.status(httpStatus.OK).send(result);
});

export {
  createPunchIn,
  createPunchOut,
  getStatus,
  getCandidateAttendance,
  getAll,
  get,
  getStatistics,
  addHolidays,
};

