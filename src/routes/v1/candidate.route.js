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

router
  .route('/:candidateId')
  .get(auth(), validate(candidateValidation.getCandidate), candidateController.get)
  .patch(auth(), validate(candidateValidation.updateCandidate), candidateController.update)
  .delete(auth('manageCandidates'), validate(candidateValidation.deleteCandidate), candidateController.remove);

router
  .route('/:candidateId/export')
  .post(auth(), validate(candidateValidation.exportCandidate), candidateController.exportProfile);

export default router;


