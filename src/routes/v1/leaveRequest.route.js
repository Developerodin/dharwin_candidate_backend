import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as leaveRequestValidation from '../../validations/leaveRequest.validation.js';
import * as leaveRequestController from '../../controllers/leaveRequest.controller.js';

const router = express.Router();

// Create a leave request (candidate or admin)
router
  .route('/candidate/:candidateId')
  .post(auth(), validate(leaveRequestValidation.createLeaveRequest), leaveRequestController.create)
  .get(auth(), validate(leaveRequestValidation.getLeaveRequestsByCandidate), leaveRequestController.getByCandidate);

// Get all leave requests (with filters)
router
  .route('/')
  .get(auth(), validate(leaveRequestValidation.getLeaveRequests), leaveRequestController.list);

// Get a specific leave request
router
  .route('/:requestId')
  .get(auth(), validate(leaveRequestValidation.getLeaveRequest), leaveRequestController.get);

// Approve a leave request (admin only)
router
  .route('/:requestId/approve')
  .patch(auth('manageCandidates'), validate(leaveRequestValidation.approveLeaveRequest), leaveRequestController.approve);

// Reject a leave request (admin only)
router
  .route('/:requestId/reject')
  .patch(auth('manageCandidates'), validate(leaveRequestValidation.rejectLeaveRequest), leaveRequestController.reject);

// Cancel a leave request (candidate can cancel their own)
router
  .route('/:requestId/cancel')
  .post(auth(), validate(leaveRequestValidation.cancelLeaveRequest), leaveRequestController.cancel);

export default router;
