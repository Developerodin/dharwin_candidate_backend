import httpStatus from 'http-status';
import pick from '../utils/pick.js';
import catchAsync from '../utils/catchAsync.js';
import {
  createShift,
  queryShifts,
  getShiftById,
  updateShiftById,
  deleteShiftById,
} from '../services/shift.service.js';

/**
 * Create a new shift
 */
const create = catchAsync(async (req, res) => {
  const shift = await createShift(req.body, req.user);
  res.status(httpStatus.CREATED).send({
    success: true,
    message: 'Shift created successfully',
    data: shift,
  });
});

/**
 * Get all shifts
 */
const list = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'timezone', 'isActive']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await queryShifts(filter, options);
  res.status(httpStatus.OK).send({
    success: true,
    data: result,
  });
});

/**
 * Get a single shift
 */
const get = catchAsync(async (req, res) => {
  const shift = await getShiftById(req.params.shiftId);
  res.status(httpStatus.OK).send({
    success: true,
    data: shift,
  });
});

/**
 * Update a shift
 */
const update = catchAsync(async (req, res) => {
  const shift = await updateShiftById(req.params.shiftId, req.body, req.user);
  res.status(httpStatus.OK).send({
    success: true,
    message: 'Shift updated successfully',
    data: shift,
  });
});

/**
 * Delete a shift
 */
const remove = catchAsync(async (req, res) => {
  await deleteShiftById(req.params.shiftId, req.user);
  res.status(httpStatus.OK).send({
    success: true,
    message: 'Shift deleted successfully',
  });
});

export { create, list, get, update, remove };

