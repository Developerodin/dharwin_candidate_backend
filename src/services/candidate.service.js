import httpStatus from 'http-status';
import Candidate from '../models/candidate.model.js';
import User from '../models/user.model.js';
import { createUser, getUserByEmail, updateUserById } from './user.service.js';
import ApiError from '../utils/ApiError.js';

const isOwnerOrAdmin = (user, candidate) => {
  if (!candidate) return false;
  return user.role === 'admin' || String(candidate.owner) === String(user.id || user._id);
};

const calculateProfileCompletion = (candidate) => {
  let completion = 30; // Base 30% when user registers (name, email, phone)
  
  // Additional Personal/Academic Information (10%)
  if (candidate.shortBio || candidate.sevisId || candidate.ead || 
      candidate.degree || candidate.supervisorName || candidate.supervisorContact) {
    completion += 10;
  }
  
  // Dynamic Sections (10% each = 60% total)
  // Qualifications Section (10%)
  if (candidate.qualifications && candidate.qualifications.length > 0) {
    completion += 10;
  }
  
  // Experience Section (10%)
  if (candidate.experiences && candidate.experiences.length > 0) {
    completion += 10;
  }
  
  // Skills Section (10%)
  if (candidate.skills && candidate.skills.length > 0) {
    completion += 10;
  }
  
  // Documents Section (10%)
  if (candidate.documents && candidate.documents.length > 0) {
    completion += 10;
  }
  
  // Social Links Section (10%)
  if (candidate.socialLinks && candidate.socialLinks.length > 0) {
    completion += 10;
  }
  
  // Salary Slips Section (10%)
  if (candidate.salarySlips && candidate.salarySlips.length > 0) {
    completion += 10;
  }
  
  return completion;
};

const hasAllRequiredData = (candidateData) => {
  // Check if at least one qualification is provided
  const hasQualifications = candidateData.qualifications && 
    candidateData.qualifications.length > 0;
  
  // Check if at least one experience is provided
  const hasExperiences = candidateData.experiences && 
    candidateData.experiences.length > 0;
  
  // Auto-verify email if both qualifications and experiences are provided
  return hasQualifications && hasExperiences;
};

const createCandidate = async (ownerId, payload) => {
  // If admin provided password, create or reuse a user for candidate's email
  let resolvedOwnerId = ownerId;
  let shouldAutoVerifyEmail = false;
  
  if (payload.password && payload.email) {
    const existing = await getUserByEmail(payload.email);
    if (existing) {
      resolvedOwnerId = existing.id;
    } else {
      const user = await createUser({
        name: payload.fullName || payload.email,
        email: payload.email,
        password: payload.password,
        role: payload.role || 'user',
        adminId: payload.adminId,
      });
      resolvedOwnerId = user.id;
    }
  }
  
  // Check if all required data is provided for auto email verification
  if (hasAllRequiredData(payload)) {
    shouldAutoVerifyEmail = true;
  }
  
  const { password, ...rest } = payload; // never store password on candidate
  
  // Create candidate with calculated profile completion
  const candidate = await Candidate.create({ 
    owner: resolvedOwnerId, 
    adminId: payload.adminId || resolvedOwnerId, // Use provided adminId or default to owner
    ...rest 
  });
  
  // Calculate and update profile completion percentage and completion status
  candidate.isProfileCompleted = calculateProfileCompletion(candidate);
  candidate.isCompleted = candidate.isProfileCompleted === 100;
  await candidate.save();
  
  // Auto-verify email if all required data is provided
  if (shouldAutoVerifyEmail) {
    await updateUserById(resolvedOwnerId, { isEmailVerified: true });
  }
  
  return candidate;
};

const queryCandidates = async (filter, options) => {
  // reuse paginate plugin interface from existing codebase (limit, page, sortBy)
  return Candidate.paginate(filter, options);
};

const getCandidateById = async (id) => {
  return Candidate.findById(id);
};

const updateCandidateById = async (id, updateBody, currentUser) => {
  const candidate = await getCandidateById(id);
  if (!candidate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Candidate not found');
  }
  if (!isOwnerOrAdmin(currentUser, candidate)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  
  // Update the candidate with new data
  Object.assign(candidate, updateBody);
  
  // Automatically recalculate profile completion percentage and completion status
  candidate.isProfileCompleted = calculateProfileCompletion(candidate);
  candidate.isCompleted = candidate.isProfileCompleted === 100;
  
  await candidate.save();
  return candidate;
};

const deleteCandidateById = async (id) => {
  const candidate = await getCandidateById(id);
  if (!candidate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Candidate not found');
  }
  await candidate.deleteOne();
  return candidate;
};

export {
  createCandidate,
  queryCandidates,
  getCandidateById,
  updateCandidateById,
  deleteCandidateById,
  isOwnerOrAdmin,
  calculateProfileCompletion,
  hasAllRequiredData,
};


