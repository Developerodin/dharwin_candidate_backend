import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as shiftValidation from '../../validations/shift.validation.js';
import * as shiftController from '../../controllers/shift.controller.js';

const router = express.Router();

// Create a new shift (admin only)
router
  .route('/')
  .post(auth('manageCandidates'), validate(shiftValidation.createShift), shiftController.create)
  .get(auth(), validate(shiftValidation.getShifts), shiftController.list);

// Get, update, delete a specific shift
router
  .route('/:shiftId')
  .get(auth(), validate(shiftValidation.getShift), shiftController.get)
  .patch(auth('manageCandidates'), validate(shiftValidation.updateShift), shiftController.update)
  .delete(auth('manageCandidates'), validate(shiftValidation.deleteShift), shiftController.remove);

export default router;

