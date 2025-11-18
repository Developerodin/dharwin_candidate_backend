import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';
import { getAdminDashboard } from '../services/dashboard.service.js';

/**
 * Get admin dashboard overview
 * Only accessible by admin users
 */
const getDashboard = catchAsync(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden: Admin access required');
  }

  const dashboard = await getAdminDashboard();
  res.send(dashboard);
});

export { getDashboard };

