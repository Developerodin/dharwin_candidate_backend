import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as candidateValidation from '../../validations/candidate.validation.js';
import * as candidateController from '../../controllers/candidate.controller.js';

const router = express.Router();

router
  .route('/')
  .post(auth(), validate(candidateValidation.createCandidate), candidateController.create)
  .get(auth(), validate(candidateValidation.getCandidates), candidateController.list);

// Export all candidates route - MUST come before /:candidateId route
router
  .route('/export')
  .post(auth('manageCandidates'), validate(candidateValidation.exportAllCandidates), candidateController.exportAll);

// Salary slip management routes - MUST come before /:candidateId route to avoid conflicts
router
  .route('/salary-slips/:candidateId')
  .post(auth(), validate(candidateValidation.addSalarySlip), candidateController.addSalarySlip);

router
  .route('/salary-slips/:candidateId/:salarySlipIndex')
  .patch(auth(), validate(candidateValidation.updateSalarySlip), candidateController.updateSalarySlip)
  .delete(auth(), validate(candidateValidation.deleteSalarySlip), candidateController.deleteSalarySlip);

// Resend email verification route - MUST come before /:candidateId route
router
  .route('/:candidateId/resend-verification-email')
  .post(auth('manageCandidates'), validate(candidateValidation.resendVerificationEmail), candidateController.resendVerificationEmail);

router
  .route('/:candidateId/export')
  .post(auth(), validate(candidateValidation.exportCandidate), candidateController.exportProfile);

// Recruiter notes and feedback routes - MUST come before /:candidateId route
router
  .route('/:candidateId/notes')
  .post(auth(), validate(candidateValidation.addRecruiterNote), candidateController.addNote);

router
  .route('/:candidateId/feedback')
  .post(auth(), validate(candidateValidation.addRecruiterFeedback), candidateController.addFeedback);

router
  .route('/:candidateId/assign-recruiter')
  .post(auth('manageCandidates'), validate(candidateValidation.assignRecruiter), candidateController.assignRecruiter);

// Week-off calendar routes - MUST come before /:candidateId route
router
  .route('/week-off')
  .post(auth('manageCandidates'), validate(candidateValidation.updateWeekOff), candidateController.updateWeekOff);

router
  .route('/:candidateId/week-off')
  .get(auth(), validate(candidateValidation.getWeekOff), candidateController.getWeekOff);

// Joining date and resign date routes - MUST come before /:candidateId route
router
  .route('/:candidateId/joining-date')
  .patch(auth('manageCandidates'), validate(candidateValidation.updateJoiningDate), candidateController.updateJoining);

router
  .route('/:candidateId/resign-date')
  .patch(auth('manageCandidates'), validate(candidateValidation.updateResignDate), candidateController.updateResign);

router
  .route('/:candidateId')
  .get(auth(), validate(candidateValidation.getCandidate), candidateController.get)
  .patch(auth(), validate(candidateValidation.updateCandidate), candidateController.update)
  .delete(auth('manageCandidates'), validate(candidateValidation.deleteCandidate), candidateController.remove);

// Document verification routes
router
  .route('/documents/:candidateId')
  .get(auth(), validate(candidateValidation.getDocuments), candidateController.getCandidateDocuments);

router
  .route('/documents/verify/:candidateId/:documentIndex')
  .patch(auth('manageCandidates'), validate(candidateValidation.verifyDocument), candidateController.verifyDocumentStatus);

router
  .route('/documents/status/:candidateId')
  .get(auth(), validate(candidateValidation.getDocumentStatus), candidateController.getCandidateDocumentStatus);

// Share candidate profile route
router
  .route('/share/:candidateId')
  .post(auth(), validate(candidateValidation.shareCandidateProfile), candidateController.shareProfile);

// Public candidate profile route (no authentication required)
router
  .route('/public/candidate/:candidateId')
  .get(candidateController.getPublicProfile);

export default router;


