import httpStatus from 'http-status';
import pick from '../utils/pick.js';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';
import { createCandidate, createCandidateByAdmin, queryCandidates, getCandidateById, updateCandidateById, deleteCandidateById } from '../services/candidate.service.js';
import { sendEmail } from '../services/email.service.js';

const create = catchAsync(async (req, res) => {
  const ownerId = req.user.role === 'admin' && req.body.owner ? req.body.owner : req.user.id;
  const candidate = await createCandidate(ownerId, req.body);
  res.status(httpStatus.CREATED).send(candidate);
});

const createByAdmin = catchAsync(async (req, res) => {
  // Only admins can use this endpoint
  if (req.user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admin can create candidates with auto user registration');
  }
  
  const candidate = await createCandidateByAdmin(req.user.id, req.body);
  res.status(httpStatus.CREATED).send(candidate);
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

export { create, createByAdmin, list, get, update, remove };

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

export { exportProfile };


