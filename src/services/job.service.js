import httpStatus from 'http-status';
import XLSX from 'xlsx';
import Job from '../models/job.model.js';
import JobTemplate from '../models/jobTemplate.model.js';
import ApiError from '../utils/ApiError.js';

const isOwnerOrAdmin = (user, resource) => {
  if (!resource) return false;
  return user.role === 'admin' || String(resource.createdBy) === String(user.id || user._id);
};

const createJob = async (createdById, payload) => {
  const job = await Job.create({
    createdBy: createdById,
    ...payload,
  });
  return job;
};

const queryJobs = async (filter, options) => {
  // Handle search query
  if (filter.search) {
    const searchRegex = new RegExp(filter.search, 'i');
    filter.$or = [
      { title: searchRegex },
      { 'organisation.name': searchRegex },
      { jobDescription: searchRegex },
      { location: searchRegex },
      { skillTags: { $in: [searchRegex] } },
    ];
    delete filter.search;
  }

  // If user is not admin, filter by createdBy
  if (filter.userRole && filter.userRole !== 'admin') {
    const userId = filter.userId;
    const userFilter = { createdBy: userId };
    
    // Remove user-specific filter fields
    delete filter.userRole;
    delete filter.userId;
    
    // Merge with existing filter
    const finalFilter = { ...filter, ...userFilter };
    const result = await Job.paginate(finalFilter, options);
    
    // Manually populate with field selection
    if (result.results && result.results.length > 0) {
      for (const doc of result.results) {
        await doc.populate([
          { path: 'createdBy', select: 'name email' },
          { path: 'templateId', select: 'name' },
        ]);
      }
    }
    
    return result;
  }
  
  // Remove user-specific filter fields for admin
  delete filter.userRole;
  delete filter.userId;
  
  const result = await Job.paginate(filter, options);
  
  // Manually populate with field selection
  if (result.results && result.results.length > 0) {
    for (const doc of result.results) {
      await doc.populate([
        { path: 'createdBy', select: 'name email' },
        { path: 'templateId', select: 'name' },
      ]);
    }
  }
  
  return result;
};

const getJobById = async (id) => {
  const job = await Job.findById(id).exec();
  if (!job) {
    return null;
  }
  
  // Manually populate with field selection
  await job.populate([
    { path: 'createdBy', select: 'name email' },
    { path: 'templateId', select: 'name description' },
  ]);
  
  return job;
};

const updateJobById = async (id, updateBody, currentUser) => {
  const job = await getJobById(id);
  if (!job) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');
  }
  if (!isOwnerOrAdmin(currentUser, job)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  
  Object.assign(job, updateBody);
  await job.save();
  
  // Re-populate after save
  await job.populate([
    { path: 'createdBy', select: 'name email' },
    { path: 'templateId', select: 'name' },
  ]);
  
  return job;
};

const deleteJobById = async (id, currentUser) => {
  const job = await getJobById(id);
  if (!job) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Job not found');
  }
  if (!isOwnerOrAdmin(currentUser, job)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  
  await job.deleteOne();
  return job;
};

// Excel Export
const exportJobsToExcel = async (filters = {}) => {
  // Remove user-specific filter fields
  delete filters.userRole;
  delete filters.userId;

  // Get all jobs with optional filters
  const jobs = await Job.find(filters)
    .populate('createdBy', 'name email')
    .populate('templateId', 'name')
    .sort({ createdAt: -1 });

  // Format jobs data for export
  const exportData = jobs.map((job) => ({
    'Job Title': job.title,
    'Organisation Name': job.organisation?.name || '',
    'Organisation Website': job.organisation?.website || '',
    'Organisation Email': job.organisation?.email || '',
    'Organisation Phone': job.organisation?.phone || '',
    'Organisation Address': job.organisation?.address || '',
    'Job Type': job.jobType,
    'Location': job.location,
    'Skill Tags': job.skillTags?.join('; ') || '',
    'Job Description': job.jobDescription || '',
    'Salary Min': job.salaryRange?.min || '',
    'Salary Max': job.salaryRange?.max || '',
    'Salary Currency': job.salaryRange?.currency || '',
    'Experience Level': job.experienceLevel || '',
    'Status': job.status,
    'Template Used': job.templateId?.name || '',
    'Created By': job.createdBy?.name || '',
    'Created At': job.createdAt ? new Date(job.createdAt).toISOString() : '',
    'Updated At': job.updatedAt ? new Date(job.updatedAt).toISOString() : '',
  }));

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths
  const columnWidths = [
    { wch: 20 }, // Job Title
    { wch: 25 }, // Organisation Name
    { wch: 30 }, // Organisation Website
    { wch: 25 }, // Organisation Email
    { wch: 20 }, // Organisation Phone
    { wch: 30 }, // Organisation Address
    { wch: 15 }, // Job Type
    { wch: 20 }, // Location
    { wch: 30 }, // Skill Tags
    { wch: 50 }, // Job Description
    { wch: 12 }, // Salary Min
    { wch: 12 }, // Salary Max
    { wch: 15 }, // Salary Currency
    { wch: 18 }, // Experience Level
    { wch: 12 }, // Status
    { wch: 20 }, // Template Used
    { wch: 20 }, // Created By
    { wch: 25 }, // Created At
    { wch: 25 }, // Updated At
  ];
  worksheet['!cols'] = columnWidths;

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Jobs');

  // Generate Excel buffer
  const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return excelBuffer;
};

// Excel Import
const importJobsFromExcel = async (fileBuffer, createdById) => {
  try {
    // Read Excel file
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const results = {
      successful: [],
      failed: [],
      summary: {
        total: data.length,
        successful: 0,
        failed: 0,
      },
    };

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Map Excel columns to job fields
        const jobData = {
          title: row['Job Title'] || row['Title'] || '',
          organisation: {
            name: row['Organisation Name'] || row['Organization Name'] || row['Company Name'] || '',
            website: row['Organisation Website'] || row['Website'] || '',
            email: row['Organisation Email'] || row['Email'] || '',
            phone: row['Organisation Phone'] || row['Phone'] || '',
            address: row['Organisation Address'] || row['Address'] || '',
            description: row['Organisation Description'] || row['Company Description'] || '',
          },
          jobType: row['Job Type'] || row['Type'] || 'Full-time',
          location: row['Location'] || '',
          jobDescription: row['Job Description'] || row['Description'] || '',
          skillTags: (row['Skill Tags'] || row['Skills'] || '')
            ? String(row['Skill Tags'] || row['Skills'] || '').split(';').map((tag) => tag.trim()).filter((tag) => tag)
            : [],
          salaryRange: {
            min: row['Salary Min'] || row['Min Salary'] || null,
            max: row['Salary Max'] || row['Max Salary'] || null,
            currency: row['Salary Currency'] || row['Currency'] || 'USD',
          },
          experienceLevel: row['Experience Level'] || row['Experience'] || null,
          status: row['Status'] || 'Active',
        };

        // Validate required fields
        if (!jobData.title || !jobData.organisation.name || !jobData.location) {
          throw new Error('Missing required fields: Title, Organisation Name, and Location are required');
        }

        // Validate job type
        const validJobTypes = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Freelance'];
        if (!validJobTypes.includes(jobData.jobType)) {
          throw new Error(`Invalid job type: ${jobData.jobType}`);
        }

        // Validate status
        const validStatuses = ['Draft', 'Active', 'Closed', 'Archived'];
        if (!validStatuses.includes(jobData.status)) {
          throw new Error(`Invalid status: ${jobData.status}`);
        }

        // Create job
        const job = await createJob(createdById, jobData);
        results.successful.push({
          row: i + 2, // +2 because Excel rows start at 1 and we have header
          jobId: job.id,
          title: job.title,
        });
        results.summary.successful += 1;
      } catch (error) {
        results.failed.push({
          row: i + 2,
          error: error.message || 'Unknown error',
          data: row,
        });
        results.summary.failed += 1;
      }
    }

    return results;
  } catch (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Failed to import jobs: ${error.message}`);
  }
};

// Job Template CRUD
const createJobTemplate = async (createdById, payload) => {
  const template = await JobTemplate.create({
    createdBy: createdById,
    ...payload,
  });
  return template;
};

const queryJobTemplates = async (filter, options) => {
  // If user is not admin, filter by createdBy
  if (filter.userRole && filter.userRole !== 'admin') {
    const userId = filter.userId;
    const userFilter = { createdBy: userId };
    
    delete filter.userRole;
    delete filter.userId;
    
    const finalFilter = { ...filter, ...userFilter };
    const result = await JobTemplate.paginate(finalFilter, options);
    
    if (result.results && result.results.length > 0) {
      for (const doc of result.results) {
        await doc.populate([{ path: 'createdBy', select: 'name email' }]);
      }
    }
    
    return result;
  }
  
  delete filter.userRole;
  delete filter.userId;
  
  const result = await JobTemplate.paginate(filter, options);
  
  if (result.results && result.results.length > 0) {
    for (const doc of result.results) {
      await doc.populate([{ path: 'createdBy', select: 'name email' }]);
    }
  }
  
  return result;
};

const getJobTemplateById = async (id) => {
  const template = await JobTemplate.findById(id).exec();
  if (!template) {
    return null;
  }
  
  await template.populate([{ path: 'createdBy', select: 'name email' }]);
  
  return template;
};

const updateJobTemplateById = async (id, updateBody, currentUser) => {
  const template = await getJobTemplateById(id);
  if (!template) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Job template not found');
  }
  if (!isOwnerOrAdmin(currentUser, template)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  
  Object.assign(template, updateBody);
  await template.save();
  
  await template.populate([{ path: 'createdBy', select: 'name email' }]);
  
  return template;
};

const deleteJobTemplateById = async (id, currentUser) => {
  const template = await getJobTemplateById(id);
  if (!template) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Job template not found');
  }
  if (!isOwnerOrAdmin(currentUser, template)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  
  await template.deleteOne();
  return template;
};

// Create job from template
const createJobFromTemplate = async (templateId, createdById, jobData) => {
  const template = await getJobTemplateById(templateId);
  if (!template) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Job template not found');
  }

  // Replace template variables with actual values
  let jobDescription = template.templateContent;
  
  // Replace common variables
  if (jobData.organisation?.name) {
    jobDescription = jobDescription.replace(/\{\{organisationName\}\}/g, jobData.organisation.name);
  }
  if (jobData.title) {
    jobDescription = jobDescription.replace(/\{\{jobTitle\}\}/g, jobData.title);
  }
  if (jobData.location) {
    jobDescription = jobDescription.replace(/\{\{location\}\}/g, jobData.location);
  }
  
  // Replace custom variables if provided
  if (jobData.templateVariables) {
    Object.keys(jobData.templateVariables).forEach((key) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      jobDescription = jobDescription.replace(regex, jobData.templateVariables[key]);
    });
  }

  // Use template defaults if not provided
  const finalJobData = {
    ...jobData,
    jobDescription: jobDescription || jobData.jobDescription,
    jobType: jobData.jobType || template.defaultJobType,
    location: jobData.location || template.defaultLocation,
    skillTags: jobData.skillTags || template.defaultSkillTags || [],
    templateId: templateId,
  };

  const job = await createJob(createdById, finalJobData);

  // Update template usage
  template.usageCount += 1;
  template.lastUsedAt = new Date();
  await template.save();

  return job;
};

export {
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
  isOwnerOrAdmin,
};

