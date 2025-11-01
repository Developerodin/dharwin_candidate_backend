import httpStatus from 'http-status';
import ApiError from '../utils/ApiError.js';
import LoginLog from '../models/loginLog.model.js';
import pick from '../utils/pick.js';

/**
 * Create a login log entry
 * @param {Object} loginLogBody
 * @param {ObjectId} loginLogBody.user - User ID
 * @param {string} loginLogBody.email - User email
 * @param {string} loginLogBody.role - User role
 * @param {string} [loginLogBody.ipAddress] - IP address
 * @param {string} [loginLogBody.userAgent] - User agent
 * @returns {Promise<LoginLog>}
 */
const createLoginLog = async (loginLogBody) => {
  const loginLog = await LoginLog.create(loginLogBody);
  return loginLog;
};

/**
 * Update logout time for a login log entry
 * @param {ObjectId} loginLogId
 * @param {Date} logoutTime
 * @returns {Promise<LoginLog>}
 */
const updateLogoutTime = async (loginLogId, logoutTime = new Date()) => {
  const loginLog = await LoginLog.findById(loginLogId);
  if (!loginLog) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Login log not found');
  }
  
  loginLog.logoutTime = logoutTime;
  loginLog.isActive = false;
  await loginLog.save();
  
  return loginLog;
};

/**
 * Get login log by ID
 * @param {ObjectId} id
 * @returns {Promise<LoginLog>}
 */
const getLoginLogById = async (id) => {
  return LoginLog.findById(id).populate('user', 'name email role');
};

/**
 * Query for login logs
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryLoginLogs = async (filter, options) => {
  const loginLogs = await LoginLog.paginate(filter, {
    ...options,
    populate: 'user',
    select: 'name email role',
  });
  return loginLogs;
};

/**
 * Get login logs by user ID
 * @param {ObjectId} userId
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getLoginLogsByUserId = async (userId, options) => {
  const filter = { user: userId };
  return queryLoginLogs(filter, options);
};

/**
 * Get active login sessions
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const getActiveSessions = async (options) => {
  const filter = { isActive: true };
  return queryLoginLogs(filter, options);
};

/**
 * Get login statistics
 * @param {Object} filter - Filter options (e.g., date range, role)
 * @returns {Promise<Object>}
 */
const getLoginStatistics = async (filter = {}) => {
  const matchFilter = {};
  
  if (filter.startDate || filter.endDate) {
    matchFilter.loginTime = {};
    if (filter.startDate) {
      matchFilter.loginTime.$gte = new Date(filter.startDate);
    }
    if (filter.endDate) {
      matchFilter.loginTime.$lte = new Date(filter.endDate);
    }
  }
  
  if (filter.role) {
    matchFilter.role = filter.role;
  }
  
  const stats = await LoginLog.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        totalLogins: { $sum: 1 },
        activeSessions: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        totalAdmins: {
          $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
        },
        totalUsers: {
          $sum: { $cond: [{ $eq: ['$role', 'user'] }, 1, 0] }
        },
      },
    },
  ]);
  
  return stats[0] || {
    totalLogins: 0,
    activeSessions: 0,
    totalAdmins: 0,
    totalUsers: 0,
  };
};

export {
  createLoginLog,
  updateLogoutTime,
  getLoginLogById,
  queryLoginLogs,
  getLoginLogsByUserId,
  getActiveSessions,
  getLoginStatistics,
};

