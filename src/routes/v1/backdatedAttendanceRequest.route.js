import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as backdatedAttendanceRequestValidation from '../../validations/backdatedAttendanceRequest.validation.js';
import * as backdatedAttendanceRequestController from '../../controllers/backdatedAttendanceRequest.controller.js';

const router = express.Router();

// Create a backdated attendance request (candidate or admin)
router
  .route('/candidate/:candidateId')
  .post(auth(), validate(backdatedAttendanceRequestValidation.createBackdatedAttendanceRequest), backdatedAttendanceRequestController.create)
  .get(auth(), validate(backdatedAttendanceRequestValidation.getBackdatedAttendanceRequestsByCandidate), backdatedAttendanceRequestController.getByCandidate);

// Get all backdated attendance requests (with filters)
router
  .route('/')
  .get(auth(), validate(backdatedAttendanceRequestValidation.getBackdatedAttendanceRequests), backdatedAttendanceRequestController.list);

// Get a specific backdated attendance request
router
  .route('/:requestId')
  .get(auth(), validate(backdatedAttendanceRequestValidation.getBackdatedAttendanceRequest), backdatedAttendanceRequestController.get);

// Update a backdated attendance request (admin only)
router
  .route('/:requestId')
  .patch(auth('manageCandidates'), validate(backdatedAttendanceRequestValidation.updateBackdatedAttendanceRequest), backdatedAttendanceRequestController.update);

// Approve a backdated attendance request (admin only)
router
  .route('/:requestId/approve')
  .patch(auth('manageCandidates'), validate(backdatedAttendanceRequestValidation.approveBackdatedAttendanceRequest), backdatedAttendanceRequestController.approve);

// Reject a backdated attendance request (admin only)
router
  .route('/:requestId/reject')
  .patch(auth('manageCandidates'), validate(backdatedAttendanceRequestValidation.rejectBackdatedAttendanceRequest), backdatedAttendanceRequestController.reject);

// Cancel a backdated attendance request (candidate can cancel their own)
router
  .route('/:requestId/cancel')
  .post(auth(), validate(backdatedAttendanceRequestValidation.cancelBackdatedAttendanceRequest), backdatedAttendanceRequestController.cancel);

export default router;
