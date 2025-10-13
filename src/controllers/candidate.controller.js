import httpStatus from 'http-status';
import pick from '../utils/pick.js';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';
import { 
  createCandidate, 
  queryCandidates, 
  getCandidateById, 
  updateCandidateById, 
  deleteCandidateById, 
  exportAllCandidates,
  addSalarySlipToCandidate,
  updateSalarySlipInCandidate,
  deleteSalarySlipFromCandidate
} from '../services/candidate.service.js';
import { sendEmail } from '../services/email.service.js';

const create = catchAsync(async (req, res) => {
  const ownerId = req.user.role === 'admin' && req.body.owner ? req.body.owner : req.user.id;
  const isMultiple = Array.isArray(req.body);
  
  // For multiple candidates, only admins can create them
  if (isMultiple && req.user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admin can create multiple candidates');
  }
  
  const result = await createCandidate(ownerId, req.body);
  
  if (isMultiple) {
    // Handle multiple candidates response
    if (result.summary.failed === 0) {
      // All candidates created successfully
      res.status(httpStatus.CREATED).send({
        message: 'All candidates created successfully',
        ...result
      });
    } else if (result.summary.successful === 0) {
      // All candidates failed
      res.status(httpStatus.BAD_REQUEST).send({
        message: 'Failed to create any candidates',
        ...result
      });
    } else {
      // Partial success
      res.status(httpStatus.MULTI_STATUS).send({
        message: 'Some candidates created successfully, some failed',
        ...result
      });
    }
  } else {
    // Handle single candidate response (existing behavior)
    res.status(httpStatus.CREATED).send(result);
  }
});

const list = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['owner', 'fullName', 'email']);
  // Non-admins can see only their own
  if (req.user.role !== 'admin') {
    filter.owner = req.user.id;
  }
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await queryCandidates(filter, options);
  res.send(result);
});

const get = catchAsync(async (req, res) => {
  const candidate = await getCandidateById(req.params.candidateId);
  if (!candidate) throw new ApiError(httpStatus.NOT_FOUND, 'Candidate not found');
  if (req.user.role !== 'admin' && String(candidate.owner) !== String(req.user.id)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  res.send(candidate);
});

const update = catchAsync(async (req, res) => {
  const candidate = await updateCandidateById(req.params.candidateId, req.body, req.user);
  res.send(candidate);
});

const remove = catchAsync(async (req, res) => {
  // Only admins can delete any candidate; users cannot delete
  if (req.user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admin can delete candidate');
  }
  await deleteCandidateById(req.params.candidateId);
  res.status(httpStatus.NO_CONTENT).send();
});

export { create, list, get, update, remove };

const exportProfile = catchAsync(async (req, res) => {
  const candidate = await getCandidateById(req.params.candidateId);
  if (!candidate) throw new ApiError(httpStatus.NOT_FOUND, 'Candidate not found');
  if (req.user.role !== 'admin' && String(candidate.owner) !== String(req.user.id)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  const { email } = req.body;
  const subject = `Candidate Profile: ${candidate.fullName}`;
  const lines = [
    `Name: ${candidate.fullName}`,
    `Email: ${candidate.email}`,
    `Phone: ${candidate.phoneNumber}`,
    candidate.shortBio ? `Bio: ${candidate.shortBio}` : null,
    candidate.sevisId ? `SEVIS ID: ${candidate.sevisId}` : null,
    candidate.ead ? `EAD: ${candidate.ead}` : null,
    candidate.degree ? `Degree: ${candidate.degree}` : null,
    candidate.supervisorName ? `Supervisor: ${candidate.supervisorName}` : null,
    candidate.supervisorContact ? `Supervisor Contact: ${candidate.supervisorContact}` : null,
    '',
    'Qualifications:',
    ...candidate.qualifications.map((q, i) => `  ${i + 1}. ${q.degree} - ${q.institute} (${q.startYear || ''}-${q.endYear || ''})`),
    '',
    'Experiences:',
    ...candidate.experiences.map((e, i) => `  ${i + 1}. ${e.role} @ ${e.company} (${e.startDate ? new Date(e.startDate).getFullYear() : ''}-${e.endDate ? new Date(e.endDate).getFullYear() : ''})`),
    '',
    'Social Links:',
    ...candidate.socialLinks.map((s, i) => `  ${i + 1}. ${s.platform}: ${s.url}`),
  ].filter(Boolean);
  await sendEmail(email, subject, lines.join('\n'));
  res.status(httpStatus.NO_CONTENT).send();
});

const exportAll = catchAsync(async (req, res) => {
  // Only admins can export all candidates
  if (req.user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admin can export all candidates');
  }

  const { email } = req.body;
  
  // Get filters from query parameters
  const filters = pick(req.query, ['owner', 'fullName', 'email']);
  
  // Export all candidates
  const exportData = await exportAllCandidates(filters);
  
  if (email) {
    // Send via email
    const subject = `All Candidates Export - ${exportData.totalCandidates} candidates`;
    const csvContent = generateCSVFormat(exportData);
    
    await sendEmail(email, subject, csvContent);
    
    res.status(httpStatus.OK).send({
      message: `CSV export sent successfully to ${email}`,
      totalCandidates: exportData.totalCandidates,
      exportedAt: exportData.exportedAt
    });
  } else {
    // Return CSV data directly
    const csvContent = generateCSVFormat(exportData);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="candidates-export-${new Date().toISOString().split('T')[0]}.csv"`);
    res.status(httpStatus.OK).send(csvContent);
  }
});


// Helper function to generate CSV format
const generateCSVFormat = (exportData) => {
  const headers = [
    'ID',
    'Full Name',
    'Email',
    'Phone Number',
    'Short Bio',
    'SEVIS ID',
    'EAD',
    'Degree',
    'Supervisor Name',
    'Supervisor Contact',
    'Owner',
    'Owner Email',
    'Admin',
    'Admin Email',
    'Profile Completion %',
    'Status',
    'Created At',
    'Updated At',
    'Qualifications',
    'Experiences',
    'Skills',
    'Social Links',
    'Documents',
    'Salary Slips'
  ];

  const rows = exportData.data.map(candidate => [
    candidate.id,
    `"${candidate.fullName || ''}"`,
    candidate.email || '',
    candidate.phoneNumber || '',
    `"${(candidate.shortBio || '').replace(/"/g, '""')}"`,
    candidate.sevisId || '',
    candidate.ead || '',
    `"${candidate.degree || ''}"`,
    `"${candidate.supervisorName || ''}"`,
    candidate.supervisorContact || '',
    `"${candidate.owner || ''}"`,
    candidate.ownerEmail || '',
    `"${candidate.adminId || ''}"`,
    candidate.adminEmail || '',
    candidate.isProfileCompleted || 0,
    candidate.isCompleted ? 'Completed' : 'Incomplete',
    new Date(candidate.createdAt).toLocaleDateString(),
    new Date(candidate.updatedAt).toLocaleDateString(),
    `"${candidate.qualifications.map(q => `${q.degree} - ${q.institute}`).join('; ')}"`,
    `"${candidate.experiences.map(e => `${e.role} @ ${e.company}`).join('; ')}"`,
    `"${candidate.skills.map(s => `${s.name} (${s.level})`).join('; ')}"`,
    `"${candidate.socialLinks.map(sl => `${sl.platform}: ${sl.url}`).join('; ')}"`,
    `"${candidate.documents.map(d => d.label || d.originalName).join('; ')}"`,
    `"${candidate.salarySlips.map(ss => `${ss.month} ${ss.year}`).join('; ')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  return csvContent;
};

export { exportProfile, exportAll };

// Salary slip management controllers
const addSalarySlip = catchAsync(async (req, res) => {
  const candidate = await addSalarySlipToCandidate(req.params.candidateId, req.body, req.user);
  res.status(httpStatus.OK).send(candidate);
});

const updateSalarySlip = catchAsync(async (req, res) => {
  const candidate = await updateSalarySlipInCandidate(
    req.params.candidateId, 
    req.params.salarySlipIndex, 
    req.body, 
    req.user
  );
  res.status(httpStatus.OK).send(candidate);
});

const deleteSalarySlip = catchAsync(async (req, res) => {
  const candidate = await deleteSalarySlipFromCandidate(
    req.params.candidateId, 
    req.params.salarySlipIndex, 
    req.user
  );
  res.status(httpStatus.OK).send(candidate);
});

export { addSalarySlip, updateSalarySlip, deleteSalarySlip };


