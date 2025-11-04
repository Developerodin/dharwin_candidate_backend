import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as attendanceValidation from '../../validations/attendance.validation.js';
import * as attendanceController from '../../controllers/attendance.controller.js';

const router = express.Router();

// Punch in for a candidate
router
  .route('/punch-in/:candidateId')
  .post(auth(), validate(attendanceValidation.punchIn), attendanceController.createPunchIn);

// Punch out for a candidate
router
  .route('/punch-out/:candidateId')
  .post(auth(), validate(attendanceValidation.punchOut), attendanceController.createPunchOut);

// Get current punch status for a candidate
router
  .route('/status/:candidateId')
  .get(auth(), validate(attendanceValidation.getCurrentStatus), attendanceController.getStatus);

// Get attendance records for a specific candidate
router
  .route('/candidate/:candidateId')
  .get(auth(), validate(attendanceValidation.getAttendance), attendanceController.getCandidateAttendance);

// Get attendance statistics for a candidate
router
  .route('/statistics/:candidateId')
  .get(auth(), validate(attendanceValidation.getStatistics), attendanceController.getStatistics);

// Get all attendance records (admin only)
router
  .route('/')
  .get(auth(), validate(attendanceValidation.getAllAttendance), attendanceController.getAll);

// Get attendance by ID
router
  .route('/:attendanceId')
  .get(auth(), validate(attendanceValidation.getAttendanceById), attendanceController.get);

export default router;

