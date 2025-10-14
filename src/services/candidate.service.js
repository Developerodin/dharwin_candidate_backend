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
  // Check if payload is an array (multiple candidates) or single object
  const isMultiple = Array.isArray(payload);
  const candidatesData = isMultiple ? payload : [payload];
  
  const results = {
    successful: [],
    failed: [],
    summary: {
      total: candidatesData.length,
      successful: 0,
      failed: 0
    }
  };

  // Process each candidate
  for (let i = 0; i < candidatesData.length; i++) {
    const candidateData = candidatesData[i];
    
    try {
      // If admin provided password, create or reuse a user for candidate's email
      let resolvedOwnerId = ownerId;
      let shouldAutoVerifyEmail = false;
      
      if (candidateData.password && candidateData.email) {
        const existing = await getUserByEmail(candidateData.email);
        if (existing) {
          resolvedOwnerId = existing.id;
        } else {
          const user = await createUser({
            name: candidateData.fullName || candidateData.email,
            email: candidateData.email,
            password: candidateData.password,
            role: candidateData.role || 'user',
            adminId: candidateData.adminId,
          });
          resolvedOwnerId = user.id;
        }
      }
      
      // Check if all required data is provided for auto email verification
      if (hasAllRequiredData(candidateData)) {
        shouldAutoVerifyEmail = true;
      }
      
      const { password, ...rest } = candidateData; // never store password on candidate
      
      // Create candidate with calculated profile completion
      const candidate = await Candidate.create({ 
        owner: resolvedOwnerId, 
        adminId: candidateData.adminId || resolvedOwnerId, // Use provided adminId or default to owner
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
      
      results.successful.push({
        index: i,
        candidate: candidate,
        message: 'Candidate created successfully'
      });
      results.summary.successful++;
      
    } catch (error) {
      results.failed.push({
        index: i,
        candidateData: {
          fullName: candidateData.fullName,
          email: candidateData.email
        },
        error: error.message,
        message: `Failed to create candidate: ${error.message}`
      });
      results.summary.failed++;
    }
  }

  // Return format based on input type
  if (isMultiple) {
    return results;
  } else {
    // For single candidate, return the candidate directly if successful, or throw error if failed
    if (results.summary.successful === 1) {
      return results.successful[0].candidate;
    } else {
      throw new ApiError(httpStatus.BAD_REQUEST, results.failed[0].message);
    }
  }
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

const exportAllCandidates = async (filters = {}) => {
  // Get all candidates with optional filters
  const candidates = await Candidate.find(filters)
    .populate('owner', 'name email')
    .populate('adminId', 'name email')
    .sort({ createdAt: -1 });

  // Format candidates data for export
  const exportData = candidates.map(candidate => ({
    id: candidate.id,
    fullName: candidate.fullName,
    email: candidate.email,
    phoneNumber: candidate.phoneNumber,
    shortBio: candidate.shortBio || '',
    sevisId: candidate.sevisId || '',
    ead: candidate.ead || '',
    degree: candidate.degree || '',
    supervisorName: candidate.supervisorName || '',
    supervisorContact: candidate.supervisorContact || '',
    owner: candidate.owner ? candidate.owner.name : '',
    ownerEmail: candidate.owner ? candidate.owner.email : '',
    adminId: candidate.adminId ? candidate.adminId.name : '',
    adminEmail: candidate.adminId ? candidate.adminId.email : '',
    isProfileCompleted: candidate.isProfileCompleted,
    isCompleted: candidate.isCompleted,
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
    qualifications: candidate.qualifications.map(q => ({
      degree: q.degree,
      institute: q.institute,
      location: q.location || '',
      startYear: q.startYear || '',
      endYear: q.endYear || '',
      description: q.description || ''
    })),
    experiences: candidate.experiences.map(e => ({
      company: e.company,
      role: e.role,
      startDate: e.startDate ? new Date(e.startDate).toISOString().split('T')[0] : '',
      endDate: e.endDate ? new Date(e.endDate).toISOString().split('T')[0] : '',
      description: e.description || ''
    })),
    skills: candidate.skills.map(s => ({
      name: s.name,
      level: s.level,
      category: s.category || ''
    })),
    socialLinks: candidate.socialLinks.map(sl => ({
      platform: sl.platform,
      url: sl.url
    })),
    documents: candidate.documents.map(d => ({
      label: d.label || '',
      url: d.url || '',
      originalName: d.originalName || '',
      size: d.size || '',
      mimeType: d.mimeType || ''
    })),
    salarySlips: candidate.salarySlips.map(ss => ({
      month: ss.month || '',
      year: ss.year || '',
      documentUrl: ss.documentUrl || '',
      originalName: ss.originalName || '',
      size: ss.size || '',
      mimeType: ss.mimeType || ''
    }))
  }));

  return {
    totalCandidates: exportData.length,
    exportedAt: new Date().toISOString(),
    data: exportData
  };
};

// Salary slip management methods
const addSalarySlipToCandidate = async (candidateId, salarySlipData, currentUser) => {
  const candidate = await getCandidateById(candidateId);
  if (!candidate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Candidate not found');
  }
  if (!isOwnerOrAdmin(currentUser, candidate)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  candidate.salarySlips.push(salarySlipData);
  
  // Recalculate profile completion
  candidate.isProfileCompleted = calculateProfileCompletion(candidate);
  candidate.isCompleted = candidate.isProfileCompleted === 100;
  
  await candidate.save();
  return candidate;
};

const updateSalarySlipInCandidate = async (candidateId, salarySlipIndex, updateData, currentUser) => {
  const candidate = await getCandidateById(candidateId);
  if (!candidate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Candidate not found');
  }
  if (!isOwnerOrAdmin(currentUser, candidate)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  if (salarySlipIndex < 0 || salarySlipIndex >= candidate.salarySlips.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid salary slip index');
  }

  // Update the salary slip
  Object.assign(candidate.salarySlips[salarySlipIndex], updateData);
  
  // Recalculate profile completion
  candidate.isProfileCompleted = calculateProfileCompletion(candidate);
  candidate.isCompleted = candidate.isProfileCompleted === 100;
  
  await candidate.save();
  return candidate;
};

const deleteSalarySlipFromCandidate = async (candidateId, salarySlipIndex, currentUser) => {
  const candidate = await getCandidateById(candidateId);
  if (!candidate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Candidate not found');
  }
  if (!isOwnerOrAdmin(currentUser, candidate)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  if (salarySlipIndex < 0 || salarySlipIndex >= candidate.salarySlips.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid salary slip index');
  }

  // Remove the salary slip
  candidate.salarySlips.splice(salarySlipIndex, 1);
  
  // Recalculate profile completion
  candidate.isProfileCompleted = calculateProfileCompletion(candidate);
  candidate.isCompleted = candidate.isProfileCompleted === 100;
  
  await candidate.save();
  return candidate;
};

// Document verification services
const verifyDocument = async (candidateId, documentIndex, verificationData, user) => {
  // Check if user has permission to verify documents (admin only)
  if (user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admins can verify documents');
  }

  const candidate = await Candidate.findById(candidateId);
  if (!candidate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Candidate not found');
  }

  // Check if document index is valid
  if (documentIndex >= candidate.documents.length || documentIndex < 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid document index');
  }

  // Update the document status
  candidate.documents[documentIndex].status = verificationData.status;
  if (verificationData.adminNotes) {
    candidate.documents[documentIndex].adminNotes = verificationData.adminNotes;
  }
  candidate.documents[documentIndex].verifiedAt = new Date();
  candidate.documents[documentIndex].verifiedBy = user.id;

  await candidate.save();
  return candidate;
};

const getDocumentStatus = async (candidateId, user) => {
  // Check if user has permission to view document status
  if (user.role !== 'admin' && user.id !== candidateId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
  }

  const candidate = await Candidate.findById(candidateId);
  if (!candidate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Candidate not found');
  }

  // Return only document information with status
  const documentsWithStatus = candidate.documents.map((doc, index) => ({
    index,
    label: doc.label,
    originalName: doc.originalName,
    status: doc.status,
    adminNotes: doc.adminNotes,
    verifiedAt: doc.verifiedAt,
    verifiedBy: doc.verifiedBy,
    url: doc.url,
    size: doc.size,
    mimeType: doc.mimeType
  }));

  return {
    candidateId: candidate._id,
    fullName: candidate.fullName,
    email: candidate.email,
    documents: documentsWithStatus
  };
};

const getDocuments = async (candidateId, user) => {
  // Check if user has permission to view documents
  if (user.role !== 'admin' && user.id !== candidateId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
  }

  const candidate = await Candidate.findById(candidateId);
  if (!candidate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Candidate not found');
  }

  // Return all document information
  const documents = candidate.documents.map((doc, index) => ({
    index,
    label: doc.label,
    originalName: doc.originalName,
    url: doc.url,
    key: doc.key,
    size: doc.size,
    mimeType: doc.mimeType,
    status: doc.status,
    adminNotes: doc.adminNotes,
    verifiedAt: doc.verifiedAt,
    verifiedBy: doc.verifiedBy
  }));

  return {
    candidateId: candidate._id,
    fullName: candidate.fullName,
    email: candidate.email,
    documents: documents
  };
};

export {
  createCandidate,
  queryCandidates,
  getCandidateById,
  updateCandidateById,
  deleteCandidateById,
  exportAllCandidates,
  isOwnerOrAdmin,
  calculateProfileCompletion,
  hasAllRequiredData,
  // Salary slip management
  addSalarySlipToCandidate,
  updateSalarySlipInCandidate,
  deleteSalarySlipFromCandidate,
  // Document verification
  verifyDocument,
  getDocumentStatus,
  getDocuments,
};


