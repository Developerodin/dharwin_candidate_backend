import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as candidateGroupValidation from '../../validations/candidateGroup.validation.js';
import * as candidateGroupController from '../../controllers/candidateGroup.controller.js';

const router = express.Router();

// Create a new candidate group (admin only)
router
  .route('/')
  .post(auth('manageCandidates'), validate(candidateGroupValidation.createCandidateGroup), candidateGroupController.create)
  .get(auth(), validate(candidateGroupValidation.getCandidateGroups), candidateGroupController.list);

// Add candidates to a group (admin only) - must come before /:groupId
router
  .route('/:groupId/candidates')
  .post(auth('manageCandidates'), validate(candidateGroupValidation.addCandidatesToGroup), candidateGroupController.addCandidates);

// Remove candidates from a group (admin only) - must come before /:groupId
router
  .route('/:groupId/candidates/remove')
  .post(auth('manageCandidates'), validate(candidateGroupValidation.removeCandidatesFromGroup), candidateGroupController.removeCandidates);

// Assign holidays to all candidates in a group (admin only) - must come before /:groupId
router
  .route('/:groupId/holidays')
  .post(auth('manageCandidates'), validate(candidateGroupValidation.assignHolidaysToGroup), candidateGroupController.assignHolidays)
  .delete(auth('manageCandidates'), validate(candidateGroupValidation.removeHolidaysFromGroup), candidateGroupController.removeHolidays);

// Get, update, delete a specific candidate group - must come after specific routes
router
  .route('/:groupId')
  .get(auth(), validate(candidateGroupValidation.getCandidateGroup), candidateGroupController.get)
  .patch(auth('manageCandidates'), validate(candidateGroupValidation.updateCandidateGroup), candidateGroupController.update)
  .delete(auth('manageCandidates'), validate(candidateGroupValidation.deleteCandidateGroup), candidateGroupController.remove);

export default router;
