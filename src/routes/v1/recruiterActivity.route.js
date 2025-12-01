import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as recruiterActivityValidation from '../../validations/recruiterActivity.validation.js';
import * as recruiterActivityController from '../../controllers/recruiterActivity.controller.js';

const router = express.Router();

// Activity logs routes (Admin only)
router
  .route('/logs')
  .get(
    auth('manageRecruiters'),
    validate(recruiterActivityValidation.getActivityLogs),
    recruiterActivityController.getActivityLogsHandler
  );

router
  .route('/logs/summary')
  .get(
    auth('manageRecruiters'),
    validate(recruiterActivityValidation.getActivityLogsSummary),
    recruiterActivityController.getActivityLogsSummaryHandler
  );

router
  .route('/logs/statistics')
  .get(
    auth('manageRecruiters'),
    validate(recruiterActivityValidation.getActivityStatistics),
    recruiterActivityController.getActivityStatisticsHandler
  );

export default router;

