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
 * Create a new shift or multiple shifts
 */
const create = catchAsync(async (req, res) => {
  const result = await createShift(req.body, req.user);
  
  // Check if it's a bulk creation with partial success
  if (result && typeof result === 'object' && result.shifts && Array.isArray(result.shifts)) {
    const { shifts, errors, partialSuccess } = result;
    
    if (partialSuccess) {
      res.status(httpStatus.CREATED).send({
        success: true,
        message: `Created ${shifts.length} shift(s) successfully, ${errors.length} failed`,
        data: shifts,
        errors: errors,
        partialSuccess: true,
      });
    } else {
      res.status(httpStatus.CREATED).send({
        success: true,
        message: `${shifts.length} shift(s) created successfully`,
        data: shifts,
      });
    }
  } else if (Array.isArray(result)) {
    // Bulk creation - all succeeded
    res.status(httpStatus.CREATED).send({
      success: true,
      message: `${result.length} shift(s) created successfully`,
      data: result,
    });
  } else {
    // Single shift creation (backward compatible)
    res.status(httpStatus.CREATED).send({
      success: true,
      message: 'Shift created successfully',
      data: result,
    });
  }
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

