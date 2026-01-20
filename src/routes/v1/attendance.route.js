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

// Add holidays to candidate calendar attendance (admin only)
router
  .route('/holidays')
  .post(auth('manageCandidates'), validate(attendanceValidation.addHolidaysToCandidates), attendanceController.addHolidays)
  .delete(auth('manageCandidates'), validate(attendanceValidation.removeHolidaysFromCandidates), attendanceController.removeHolidays);

// Assign leaves to candidate calendar attendance (admin only)
router
  .route('/leaves')
  .post(auth('manageCandidates'), validate(attendanceValidation.assignLeavesToCandidates), attendanceController.assignLeaves);

// Update a leave for a candidate (admin only)
router
  .route('/leaves/:candidateId/:leaveId')
  .patch(auth('manageCandidates'), validate(attendanceValidation.updateLeave), attendanceController.updateLeave);

// Delete a leave for a candidate (admin only)
router
  .route('/leaves/:candidateId/:leaveId')
  .delete(auth('manageCandidates'), validate(attendanceValidation.deleteLeave), attendanceController.deleteLeave);

// Cancel a leave for a candidate (admin only)
router
  .route('/leaves/:candidateId/:leaveId/cancel')
  .post(auth('manageCandidates'), validate(attendanceValidation.cancelLeave), attendanceController.cancelLeave);

// Get attendance by ID
router
  .route('/:attendanceId')
  .get(auth(), validate(attendanceValidation.getAttendanceById), attendanceController.get);

export default router;

