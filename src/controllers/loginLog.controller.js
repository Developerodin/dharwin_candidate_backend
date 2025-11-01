import httpStatus from 'http-status';
import pick from '../utils/pick.js';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';
import * as loginLogService from '../services/loginLog.service.js';

const getLoginLogs = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['email', 'role', 'isActive']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  
  // Handle userId filter
  if (req.query.userId) {
    filter.user = req.query.userId;
  }
  
  // Convert string dates to Date objects if provided
  if (req.query.startDate || req.query.endDate) {
    filter.loginTime = {};
    if (req.query.startDate) {
      filter.loginTime.$gte = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      filter.loginTime.$lte = new Date(req.query.endDate);
    }
  }
  
  const result = await loginLogService.queryLoginLogs(filter, options);
  res.send(result);
});

const getLoginLog = catchAsync(async (req, res) => {
  const loginLog = await loginLogService.getLoginLogById(req.params.loginLogId);
  if (!loginLog) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Login log not found');
  }
  res.send(loginLog);
});

const getLoginLogsByUser = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await loginLogService.getLoginLogsByUserId(req.params.userId, options);
  res.send(result);
});

const getActiveSessions = catchAsync(async (req, res) => {
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await loginLogService.getActiveSessions(options);
  res.send(result);
});

const getLoginStatistics = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['startDate', 'endDate', 'role']);
  const stats = await loginLogService.getLoginStatistics(filter);
  res.send(stats);
});

export {
  getLoginLogs,
  getLoginLog,
  getLoginLogsByUser,
  getActiveSessions,
  getLoginStatistics,
};

