import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as holidayValidation from '../../validations/holiday.validation.js';
import * as holidayController from '../../controllers/holiday.controller.js';

const router = express.Router();

// Create a new holiday (admin only)
router
  .route('/')
  .post(auth('manageCandidates'), validate(holidayValidation.createHoliday), holidayController.create)
  .get(auth(), validate(holidayValidation.getHolidays), holidayController.list);

// Get, update, delete a specific holiday
router
  .route('/:holidayId')
  .get(auth(), validate(holidayValidation.getHoliday), holidayController.get)
  .patch(auth('manageCandidates'), validate(holidayValidation.updateHoliday), holidayController.update)
  .delete(auth('manageCandidates'), validate(holidayValidation.deleteHoliday), holidayController.remove);

export default router;

