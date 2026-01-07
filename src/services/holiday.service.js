import httpStatus from 'http-status';
import Holiday from '../models/holiday.model.js';
import ApiError from '../utils/ApiError.js';
import pick from '../utils/pick.js';

/**
 * Create a new holiday
 * @param {Object} holidayBody
 * @param {Object} user - Current user
 * @returns {Promise<Holiday>}
 */
const createHoliday = async (holidayBody, user) => {
  // Check permissions: only admin can create holidays
  if (user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admin can create holidays');
  }

  const { title, date, isActive } = holidayBody;

  // Normalize date to start of day
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  // Create new holiday
  const holiday = await Holiday.create({
    title,
    date: normalizedDate,
    isActive: isActive !== undefined ? isActive : true,
  });

  return holiday;
};

/**
 * Query holidays
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryHolidays = async (filter, options) => {
  // Build date range filter if startDate or endDate provided
  if (filter.startDate || filter.endDate) {
    filter.date = {};
    if (filter.startDate) {
      const startDate = new Date(filter.startDate);
      startDate.setHours(0, 0, 0, 0);
      filter.date.$gte = startDate;
      delete filter.startDate;
    }
    if (filter.endDate) {
      const endDate = new Date(filter.endDate);
      endDate.setHours(23, 59, 59, 999);
      filter.date.$lte = endDate;
      delete filter.endDate;
    }
  }

  // Normalize date filter if provided
  if (filter.date && !filter.startDate && !filter.endDate) {
    const dateFilter = new Date(filter.date);
    dateFilter.setHours(0, 0, 0, 0);
    const nextDay = new Date(dateFilter);
    nextDay.setDate(nextDay.getDate() + 1);
    filter.date = {
      $gte: dateFilter,
      $lt: nextDay,
    };
  }

  const holidays = await Holiday.paginate(filter, options);
  return holidays;
};

/**
 * Get holiday by id
 * @param {ObjectId} id
 * @returns {Promise<Holiday>}
 */
const getHolidayById = async (id) => {
  const holiday = await Holiday.findById(id);
  if (!holiday) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Holiday not found');
  }
  return holiday;
};

/**
 * Update holiday by id
 * @param {ObjectId} holidayId
 * @param {Object} updateBody
 * @param {Object} user - Current user
 * @returns {Promise<Holiday>}
 */
const updateHolidayById = async (holidayId, updateBody, user) => {
  // Check permissions: only admin can update holidays
  if (user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admin can update holidays');
  }

  const holiday = await getHolidayById(holidayId);

  // Normalize date if provided
  if (updateBody.date) {
    const normalizedDate = new Date(updateBody.date);
    normalizedDate.setHours(0, 0, 0, 0);
    updateBody.date = normalizedDate;
  }

  Object.assign(holiday, updateBody);
  await holiday.save();
  return holiday;
};

/**
 * Delete holiday by id
 * @param {ObjectId} holidayId
 * @param {Object} user - Current user
 * @returns {Promise<Holiday>}
 */
const deleteHolidayById = async (holidayId, user) => {
  // Check permissions: only admin can delete holidays
  if (user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admin can delete holidays');
  }

  const holiday = await getHolidayById(holidayId);
  await Holiday.findByIdAndDelete(holidayId);
  return holiday;
};

export {
  createHoliday,
  queryHolidays,
  getHolidayById,
  updateHolidayById,
  deleteHolidayById,
};

