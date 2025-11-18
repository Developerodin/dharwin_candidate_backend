import express from 'express';
import authRoute from './auth.route.js';
import userRoute from './user.route.js';
import candidateRoute from './candidate.route.js';
import uploadRoute from './upload.route.js';
import meetingRoute from './meeting.route.js';
import loginLogRoute from './loginLog.route.js';
import attendanceRoute from './attendance.route.js';
import projectRoute from './project.route.js';
import taskRoute from './task.route.js';
import dashboardRoute from './dashboard.route.js';
import docsRoute from './docs.route.js';
import config from '../../config/config.js';

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/candidates',
    route: candidateRoute,
  },
  {
    path: '/upload',
    route: uploadRoute,
  },
  {
    path: '/meetings',
    route: meetingRoute,
  },
  {
    path: '/login-logs',
    route: loginLogRoute,
  },
  {
    path: '/attendance',
    route: attendanceRoute,
  },
  {
    path: '/projects',
    route: projectRoute,
  },
  {
    path: '/tasks',
    route: taskRoute,
  },
  {
    path: '/dashboard',
    route: dashboardRoute,
  },
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

export default router;
