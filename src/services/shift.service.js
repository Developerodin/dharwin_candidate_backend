import httpStatus from 'http-status';
import Shift from '../models/shift.model.js';
import ApiError from '../utils/ApiError.js';
import pick from '../utils/pick.js';

/**
 * Create a single shift
 * @param {Object} shiftBody
 * @param {Object} user - Current user
 * @returns {Promise<Shift>}
 */
const createSingleShift = async (shiftBody, user) => {
  const { name, description, timezone, startTime, endTime, isActive } = shiftBody;

  // Validate time range
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;
  
  if (endTotalMinutes === startTotalMinutes) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'End time cannot be the same as start time');
  }

  // Create new shift
  const shift = await Shift.create({
    name,
    description,
    timezone,
    startTime,
    endTime,
    isActive: isActive !== undefined ? isActive : true,
  });

  return shift;
};

/**
 * Create a new shift or multiple shifts
 * @param {Object|Array} shiftBody - Single shift object or array of shift objects
 * @param {Object} user - Current user
 * @returns {Promise<Shift|Array<Shift>>}
 */
const createShift = async (shiftBody, user) => {
  // Check permissions: only admin can create shifts
  if (user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admin can create shifts');
  }

  // Handle array of shifts (bulk creation)
  if (Array.isArray(shiftBody)) {
    if (shiftBody.length === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'At least one shift is required');
    }
    if (shiftBody.length > 100) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot create more than 100 shifts at once');
    }

    // Validate and create all shifts
    const shifts = [];
    const errors = [];

    for (let i = 0; i < shiftBody.length; i++) {
      try {
        const shift = await createSingleShift(shiftBody[i], user);
        shifts.push(shift);
      } catch (error) {
        errors.push({
          index: i,
          shift: shiftBody[i],
          error: error.message,
        });
      }
    }

    // If all shifts failed, throw error
    if (shifts.length === 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Failed to create shifts: ${errors.map(e => `Shift ${e.index + 1}: ${e.error}`).join('; ')}`
      );
    }

    // If some shifts failed, return partial success with errors
    if (errors.length > 0) {
      return {
        shifts,
        errors,
        partialSuccess: true,
      };
    }

    return shifts;
  }

  // Handle single shift (backward compatible)
  return await createSingleShift(shiftBody, user);
};

/**
 * Query shifts
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryShifts = async (filter, options) => {
  const shifts = await Shift.paginate(filter, options);
  return shifts;
};

/**
 * Get shift by id
 * @param {ObjectId} id
 * @returns {Promise<Shift>}
 */
const getShiftById = async (id) => {
  const shift = await Shift.findById(id);
  if (!shift) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Shift not found');
  }
  return shift;
};

/**
 * Update shift by id
 * @param {ObjectId} shiftId
 * @param {Object} updateBody
 * @param {Object} user - Current user
 * @returns {Promise<Shift>}
 */
const updateShiftById = async (shiftId, updateBody, user) => {
  // Check permissions: only admin can update shifts
  if (user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admin can update shifts');
  }

  const shift = await getShiftById(shiftId);

  // Validate time range if both times are being updated
  if (updateBody.startTime && updateBody.endTime) {
    const [startHours, startMinutes] = updateBody.startTime.split(':').map(Number);
    const [endHours, endMinutes] = updateBody.endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    if (endTotalMinutes === startTotalMinutes) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'End time cannot be the same as start time');
    }
  } else if (updateBody.startTime) {
    // Only startTime is being updated, validate against existing endTime
    const [startHours, startMinutes] = updateBody.startTime.split(':').map(Number);
    const endTime = shift.endTime;
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    if (endTotalMinutes === startTotalMinutes) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'End time cannot be the same as start time');
    }
  } else if (updateBody.endTime) {
    // Only endTime is being updated, validate against existing startTime
    const startTime = shift.startTime;
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = updateBody.endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    if (endTotalMinutes === startTotalMinutes) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'End time cannot be the same as start time');
    }
  }

  Object.assign(shift, updateBody);
  await shift.save();
  return shift;
};

/**
 * Delete shift by id
 * @param {ObjectId} shiftId
 * @param {Object} user - Current user
 * @returns {Promise<Shift>}
 */
const deleteShiftById = async (shiftId, user) => {
  // Check permissions: only admin can delete shifts
  if (user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admin can delete shifts');
  }

  const shift = await getShiftById(shiftId);
  await Shift.findByIdAndDelete(shiftId);
  return shift;
};

export {
  createShift,
  queryShifts,
  getShiftById,
  updateShiftById,
  deleteShiftById,
};

