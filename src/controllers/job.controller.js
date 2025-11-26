import httpStatus from 'http-status';
import pick from '../utils/pick.js';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';
import {
  createJob,
  queryJobs,
  getJobById,
  updateJobById,
  deleteJobById,
  exportJobsToExcel,
  importJobsFromExcel,
  createJobTemplate,
  queryJobTemplates,
  getJobTemplateById,
  updateJobTemplateById,
  deleteJobTemplateById,
  createJobFromTemplate,
} from '../services/job.service.js';

// Job CRUD
const create = catchAsync(async (req, res) => {
  const createdById = req.user.id;
  const job = await createJob(createdById, req.body);
  res.status(httpStatus.CREATED).send(job);
});

const list = catchAsync(async (req, res) => {
  const filter = pick(req.query, [
    'title',
    'jobType',
    'location',
    'status',
    'experienceLevel',
    'createdBy',
    'search',
  ]);
  
  // Add user info for filtering
  filter.userRole = req.user.role;
  filter.userId = req.user.id;
  
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await queryJobs(filter, options);
  res.send(result);
});

const get = catchAsync(async (req, res) => {
  const job = await getJobById(req.params.jobId);
  if (!job) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');
  }
  
  // Check if user has access (admin or creator)
  const hasAccess =
    req.user.role === 'admin' ||
    String(job.createdBy._id || job.createdBy) === String(req.user.id);
  
  if (!hasAccess) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  
  res.send(job);
});

const update = catchAsync(async (req, res) => {
  const job = await updateJobById(req.params.jobId, req.body, req.user);
  res.send(job);
});

const remove = catchAsync(async (req, res) => {
  await deleteJobById(req.params.jobId, req.user);
  res.status(httpStatus.NO_CONTENT).send();
});

// Excel Export
const exportExcel = catchAsync(async (req, res) => {
  const filter = pick(req.query, [
    'title',
    'jobType',
    'location',
    'status',
    'experienceLevel',
    'createdBy',
  ]);
  
  // Add user info for filtering
  filter.userRole = req.user.role;
  filter.userId = req.user.id;
  
  const excelBuffer = await exportJobsToExcel(filter);
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=jobs_export_${Date.now()}.xlsx`);
  res.send(excelBuffer);
});

// Excel Import
const importExcel = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Excel file is required');
  }
  
  const createdById = req.user.id;
  const result = await importJobsFromExcel(req.file.buffer, createdById);
  
  if (result.summary.failed === 0) {
    res.status(httpStatus.CREATED).send({
      message: 'All jobs imported successfully',
      ...result,
    });
  } else if (result.summary.successful === 0) {
    res.status(httpStatus.BAD_REQUEST).send({
      message: 'Failed to import any jobs',
      ...result,
    });
  } else {
    res.status(httpStatus.MULTI_STATUS).send({
      message: 'Some jobs imported successfully, some failed',
      ...result,
    });
  }
});

// Job Template CRUD
const createTemplate = catchAsync(async (req, res) => {
  const createdById = req.user.id;
  const template = await createJobTemplate(createdById, req.body);
  res.status(httpStatus.CREATED).send(template);
});

const listTemplates = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['title', 'createdBy']);
  
  // Add user info for filtering
  filter.userRole = req.user.role;
  filter.userId = req.user.id;
  
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await queryJobTemplates(filter, options);
  res.send(result);
});

const getTemplate = catchAsync(async (req, res) => {
  const template = await getJobTemplateById(req.params.templateId);
  if (!template) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Job template not found');
  }
  
  // Check if user has access (admin or creator)
  const hasAccess =
    req.user.role === 'admin' ||
    String(template.createdBy._id || template.createdBy) === String(req.user.id);
  
  if (!hasAccess) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  
  res.send(template);
});

const updateTemplate = catchAsync(async (req, res) => {
  const template = await updateJobTemplateById(req.params.templateId, req.body, req.user);
  res.send(template);
});

const removeTemplate = catchAsync(async (req, res) => {
  await deleteJobTemplateById(req.params.templateId, req.user);
  res.status(httpStatus.NO_CONTENT).send();
});

// Create job from template
const createFromTemplate = catchAsync(async (req, res) => {
  const createdById = req.user.id;
  const { templateId } = req.params;
  const job = await createJobFromTemplate(templateId, createdById, req.body);
  res.status(httpStatus.CREATED).send(job);
});

export {
  create,
  list,
  get,
  update,
  remove,
  exportExcel,
  importExcel,
  createTemplate,
  listTemplates,
  getTemplate,
  updateTemplate,
  removeTemplate,
  createFromTemplate,
};

