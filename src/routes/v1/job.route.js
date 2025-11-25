import express from 'express';
import auth from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import { uploadSingle } from '../../middlewares/upload.js';
import * as jobValidation from '../../validations/job.validation.js';
import * as jobController from '../../controllers/job.controller.js';

const router = express.Router();

// Job CRUD routes
router
  .route('/')
  .post(auth(), validate(jobValidation.createJob), jobController.create)
  .get(auth(), validate(jobValidation.getJobs), jobController.list);

// Excel import/export routes (must be before /:jobId to avoid route conflicts)
router
  .route('/export/excel')
  .get(auth(), validate(jobValidation.exportJobs), jobController.exportExcel);

router
  .route('/import/excel')
  .post(
    auth(),
    uploadSingle('file'),
    validate(jobValidation.importJobs),
    jobController.importExcel
  );

// Job Template routes (must be before /:jobId to avoid route conflicts)
router
  .route('/templates')
  .post(auth(), validate(jobValidation.createJobTemplate), jobController.createTemplate)
  .get(auth(), validate(jobValidation.getJobTemplates), jobController.listTemplates);

router
  .route('/templates/:templateId')
  .get(auth(), validate(jobValidation.getJobTemplate), jobController.getTemplate)
  .patch(auth(), validate(jobValidation.updateJobTemplate), jobController.updateTemplate)
  .delete(auth(), validate(jobValidation.deleteJobTemplate), jobController.removeTemplate);

// Create job from template
router
  .route('/templates/:templateId/create-job')
  .post(
    auth(),
    validate(jobValidation.createJobFromTemplate),
    jobController.createFromTemplate
  );

// Dynamic job routes (must be last to avoid matching specific routes)
router
  .route('/:jobId')
  .get(auth(), validate(jobValidation.getJob), jobController.get)
  .patch(auth(), validate(jobValidation.updateJob), jobController.update)
  .delete(auth(), validate(jobValidation.deleteJob), jobController.remove);

export default router;

