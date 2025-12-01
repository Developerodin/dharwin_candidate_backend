import httpStatus from 'http-status';
import pick from '../utils/pick.js';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';
import {
  getActivityLogs,
  getActivityLogsSummary,
  getActivityStatistics,
} from '../services/recruiterActivity.service.js';

/**
 * Get recruiter activity logs (Admin only)
 */
const getActivityLogsHandler = catchAsync(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden: Admin access required');
  }
  
  const filter = pick(req.query, [
    'recruiterId',
    'activityType',
    'startDate',
    'endDate',
    'jobId',
    'candidateId',
  ]);
  
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  
  const result = await getActivityLogs(filter, options);
  res.send(result);
});

/**
 * Get activity logs summary by recruiter (Admin only)
 */
const getActivityLogsSummaryHandler = catchAsync(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden: Admin access required');
  }
  
  const filter = pick(req.query, ['recruiterId', 'startDate', 'endDate']);
  
  const summary = await getActivityLogsSummary(filter);
  res.send(summary);
});

/**
 * Get activity statistics (Admin only)
 */
const getActivityStatisticsHandler = catchAsync(async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden: Admin access required');
  }
  
  const filter = pick(req.query, ['recruiterId', 'startDate', 'endDate']);
  
  const statistics = await getActivityStatistics(filter);
  res.send(statistics);
});

export {
  getActivityLogsHandler,
  getActivityLogsSummaryHandler,
  getActivityStatisticsHandler,
};

