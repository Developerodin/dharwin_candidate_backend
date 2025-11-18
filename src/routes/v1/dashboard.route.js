import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as dashboardValidation from '../../validations/dashboard.validation.js';
import * as dashboardController from '../../controllers/dashboard.controller.js';

const router = express.Router();

router
  .route('/')
  .get(auth(), validate(dashboardValidation.getDashboard), dashboardController.getDashboard);

export default router;

