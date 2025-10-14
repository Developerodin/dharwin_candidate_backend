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
  deleteSalarySlipFromCandidate,
  verifyDocument,
  getDocumentStatus,
  getDocuments,
  shareCandidateProfile,
  getPublicCandidateProfile
} from '../services/candidate.service.js';
import { sendEmail, sendCandidateProfileShareEmail } from '../services/email.service.js';

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

// Document verification controllers
const verifyDocumentStatus = catchAsync(async (req, res) => {
  const candidate = await verifyDocument(
    req.params.candidateId,
    req.params.documentIndex,
    req.body,
    req.user
  );
  res.status(httpStatus.OK).send({
    success: true,
    message: 'Document status updated successfully',
    data: candidate
  });
});

const getCandidateDocumentStatus = catchAsync(async (req, res) => {
  const candidate = await getDocumentStatus(req.params.candidateId, req.user);
  res.status(httpStatus.OK).send({
    success: true,
    data: candidate
  });
});

const getCandidateDocuments = catchAsync(async (req, res) => {
  const documents = await getDocuments(req.params.candidateId, req.user);
  res.status(httpStatus.OK).send({
    success: true,
    data: documents
  });
});

export { verifyDocumentStatus, getCandidateDocumentStatus, getCandidateDocuments };

// Share candidate profile controller
const shareProfile = catchAsync(async (req, res) => {
  const { candidateId } = req.params;
  const { email, withDoc } = req.body;
  
  // Get candidate data and generate public URL
  const shareResult = await shareCandidateProfile(candidateId, { email, withDoc }, req.user);
  
  // Get the candidate data for email
  const candidate = await getCandidateById(candidateId);
  if (!candidate) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Candidate not found');
  }
  
  // Prepare candidate data for email
  const candidateData = {
    candidateName: candidate.fullName,
    candidateEmail: candidate.email
  };
  
  // Prepare share data for email
  const emailShareData = {
    publicUrl: shareResult.publicUrl,
    withDoc,
    sharedBy: req.user.name
  };
  
  // Send the email
  await sendCandidateProfileShareEmail(email, candidateData, emailShareData);
  
  res.status(httpStatus.OK).send({
    success: true,
    message: 'Candidate profile shared successfully',
    data: shareResult
  });
});

// Public candidate profile controller
const getPublicProfile = catchAsync(async (req, res) => {
  const { candidateId } = req.params;
  const { token, data } = req.query;
  
  if (!token || !data) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required parameters');
  }
  
  // Get the public candidate profile data
  const candidateData = await getPublicCandidateProfile(candidateId, token, data);
  
  // Generate HTML page
  const html = generatePublicProfileHTML(candidateData);
  
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});


// Helper function to get preview button
const getPreviewButton = (document) => {
  const mimeType = document.mimeType || '';
  const fileName = document.originalName || document.label || '';
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  // Check if document can be previewed in browser
  const canPreview = 
    mimeType.startsWith('image/') ||
    mimeType === 'application/pdf' ||
    mimeType.startsWith('text/') ||
    ['txt', 'rtf', 'html', 'htm', 'xml', 'json', 'csv'].includes(extension) ||
    mimeType === 'application/json' ||
    mimeType === 'text/csv' ||
    mimeType === 'text/xml';
  
  if (canPreview) {
    return `<a href="${document.url}" class="document-preview" target="_blank" rel="noopener noreferrer">Preview</a>`;
  }
  
  // For non-previewable files, show a "View" button instead
  return `<a href="${document.url}" class="document-preview" target="_blank" rel="noopener noreferrer">Preview</a>`;
};

// Helper function to generate public profile HTML
const generatePublicProfileHTML = (candidateData) => {
  const { withDoc } = candidateData;
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${candidateData.fullName} - Candidate Profile</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                line-height: 1.6;
                color: #1a202c;
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                min-height: 100vh;
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }
            
            .header {
                background: linear-gradient(135deg, #093464 0%, #0d4a7a 100%);
                color: white;
                padding: 40px;
                border-radius: 12px;
                margin-bottom: 30px;
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
                opacity: 0.3;
            }
            
            .logo {
                position: relative;
                z-index: 1;
                margin-bottom: 20px;
            }
            
            .logo img {
                max-height: 60px;
                max-width: 200px;
                width: auto;
                height: auto;
            }
            
            .profile-title {
                position: relative;
                z-index: 1;
                font-size: 32px;
                font-weight: 700;
                margin-bottom: 10px;
            }
            
            .profile-subtitle {
                position: relative;
                z-index: 1;
                font-size: 18px;
                opacity: 0.9;
            }
            
            .main-content {
                display: grid;
                grid-template-columns: 1fr 2fr;
                gap: 30px;
                margin-bottom: 30px;
            }
            
            .sidebar {
                background: white;
                border-radius: 12px;
                padding: 30px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                height: fit-content;
            }
            
            .content {
                background: white;
                border-radius: 12px;
                padding: 30px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            
            .section {
                margin-bottom: 30px;
            }
            
            .section-title {
                color: #093464;
                font-size: 20px;
                font-weight: 600;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 2px solid #e2e8f0;
            }
            
            .info-item {
                margin-bottom: 20px;
                padding: 15px;
                background: #f8fafc;
                border-radius: 8px;
                border-left: 4px solid #36af4c;
            }
            
            .info-label {
                font-weight: 600;
                color: #093464;
                margin-bottom: 5px;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .info-value {
                color: #1a202c;
                font-size: 16px;
            }
            
            .list-item {
                background: #f8fafc;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 15px;
                border-left: 4px solid #36af4c;
            }
            
            .list-item-title {
                font-weight: 600;
                color: #1a202c;
                margin-bottom: 8px;
                font-size: 18px;
            }
            
            .list-item-subtitle {
                color: #4a5568;
                margin-bottom: 8px;
                font-size: 16px;
            }
            
            .list-item-description {
                color: #64748b;
                font-size: 14px;
                font-style: italic;
            }
            
            .skill-tag {
                display: inline-block;
                background: #e2e8f0;
                color: #4a5568;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 500;
                margin: 4px;
            }
            
            .document-item {
                background: #f8fafc;
                border-radius: 8px;
                padding: 16px 20px;
                margin-bottom: 12px;
                border-left: 4px solid #36af4c;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
            }
            
            
            
            .document-name {
                font-weight: 600;
                color: #1a202c;
                word-break: break-word;
                flex: 1;
                min-width: 0;
            }
            
            .document-size {
                color: #64748b;
                font-size: 14px;
                margin-bottom: 8px;
            }
            
            .document-actions {
                display: flex;
                gap: 8px;
                flex-shrink: 0;
            }
            
            .document-preview {
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                color: white;
                padding: 6px 12px;
                border-radius: 6px;
                text-decoration: none;
                font-weight: 500;
                font-size: 12px;
                transition: all 0.3s ease;
                border: none;
                cursor: pointer;
            }
            
            .document-preview:hover {
                background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                transform: translateY(-1px);
            }
            
            
            
            .shared-info {
                background: #f0f9ff;
                border: 1px solid #bae6fd;
                border-radius: 8px;
                padding: 20px;
                margin-top: 30px;
                text-align: center;
            }
            
            .shared-info-title {
                color: #0369a1;
                font-weight: 600;
                margin-bottom: 8px;
            }
            
            .shared-info-text {
                color: #0369a1;
                font-size: 14px;
            }
            
            .footer {
                background: #093464;
                color: white;
                padding: 30px;
                border-radius: 12px;
                text-align: center;
            }
            
            .footer p {
                margin-bottom: 8px;
                opacity: 0.9;
            }
            
            .footer a {
                color: #36af4c;
                text-decoration: none;
                font-weight: 500;
            }
            
            .footer a:hover {
                text-decoration: underline;
            }
            
            @media (max-width: 768px) {
                .main-content {
                    grid-template-columns: 1fr;
                }
                
                .container {
                    padding: 10px;
                }
                
                .header {
                    padding: 30px 20px;
                }
                
                .profile-title {
                    font-size: 24px;
                }
                
                .sidebar, .content {
                    padding: 20px;
                }
                
                .document-item {
                    flex-direction: row;
                    align-items: center;
                    padding: 12px 16px;
                }
                
                
                .document-actions {
                    flex-direction: row;
                    gap: 8px;
                }
                
                .document-preview, .document-download {
                    width: 100%;
                    text-align: center;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">
                    <img src="https://main.d17v4yz0vw03r0.amplifyapp.com/assets/images/company-logos/logo.jpeg" alt="Dharwin" />
                </div>
                <h1 class="profile-title">${candidateData.fullName}</h1>
                <p class="profile-subtitle">Candidate Profile</p>
            </div>
            
            <div class="main-content">
                <div class="sidebar">
                    <div class="section">
                        <h2 class="section-title">Contact Information</h2>
                        
                        <div class="info-item">
                            <div class="info-label">Email</div>
                            <div class="info-value">${candidateData.email}</div>
                        </div>
                        
                        <div class="info-item">
                            <div class="info-label">Phone</div>
                            <div class="info-value">${candidateData.phoneNumber}</div>
                        </div>
                        
                        ${candidateData.shortBio ? `
                        <div class="info-item">
                            <div class="info-label">Bio</div>
                            <div class="info-value">${candidateData.shortBio}</div>
                        </div>
                        ` : ''}
                        
                        ${candidateData.sevisId ? `
                        <div class="info-item">
                            <div class="info-label">SEVIS ID</div>
                            <div class="info-value">${candidateData.sevisId}</div>
                        </div>
                        ` : ''}
                        
                        ${candidateData.ead ? `
                        <div class="info-item">
                            <div class="info-label">EAD</div>
                            <div class="info-value">${candidateData.ead}</div>
                        </div>
                        ` : ''}
                        
                        ${candidateData.degree ? `
                        <div class="info-item">
                            <div class="info-label">Degree</div>
                            <div class="info-value">${candidateData.degree}</div>
                        </div>
                        ` : ''}
                        
                        ${candidateData.supervisorName ? `
                        <div class="info-item">
                            <div class="info-label">Supervisor</div>
                            <div class="info-value">${candidateData.supervisorName}</div>
                        </div>
                        ` : ''}
                        
                        ${candidateData.supervisorContact ? `
                        <div class="info-item">
                            <div class="info-label">Supervisor Contact</div>
                            <div class="info-value">${candidateData.supervisorContact}</div>
                        </div>
                        ` : ''}
                    </div>
                    
                    ${candidateData.socialLinks && candidateData.socialLinks.length > 0 ? `
                    <div class="section">
                        <h2 class="section-title">Social Links</h2>
                        ${candidateData.socialLinks.map(sl => `
                        <div class="info-item">
                            <div class="info-label">${sl.platform}</div>
                            <div class="info-value"><a href="${sl.url}" target="_blank" style="color: #36af4c; text-decoration: none;">${sl.url}</a></div>
                        </div>
                        `).join('')}
                    </div>
                    ` : ''}
                </div>
                
                <div class="content">
                    ${candidateData.qualifications && candidateData.qualifications.length > 0 ? `
                    <div class="section">
                        <h2 class="section-title">🎓 Qualifications</h2>
                        ${candidateData.qualifications.map(q => `
                        <div class="list-item">
                            <div class="list-item-title">${q.degree}</div>
                            <div class="list-item-subtitle">${q.institute}${q.location ? ` - ${q.location}` : ''}</div>
                            ${q.startYear || q.endYear ? `<div class="list-item-subtitle">${q.startYear || ''} - ${q.endYear || ''}</div>` : ''}
                            ${q.description ? `<div class="list-item-description">${q.description}</div>` : ''}
                        </div>
                        `).join('')}
                    </div>
                    ` : ''}
                    
                    ${candidateData.experiences && candidateData.experiences.length > 0 ? `
                    <div class="section">
                        <h2 class="section-title">💼 Work Experience</h2>
                        ${candidateData.experiences.map(e => `
                        <div class="list-item">
                            <div class="list-item-title">${e.role}</div>
                            <div class="list-item-subtitle">${e.company}</div>
                            ${e.startDate || e.endDate ? `<div class="list-item-subtitle">${e.startDate ? new Date(e.startDate).toLocaleDateString() : ''} - ${e.endDate ? new Date(e.endDate).toLocaleDateString() : 'Present'}</div>` : ''}
                            ${e.description ? `<div class="list-item-description">${e.description}</div>` : ''}
                        </div>
                        `).join('')}
                    </div>
                    ` : ''}
                    
                    ${candidateData.skills && candidateData.skills.length > 0 ? `
                    <div class="section">
                        <h2 class="section-title">🛠️ Skills</h2>
                        <div>
                            ${candidateData.skills.map(s => `
                            <span class="skill-tag">${s.name} (${s.level})</span>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}
                    
                    ${withDoc ? `
                    <div class="section">
                        <h2 class="section-title">📄 Documents</h2>
                        ${candidateData.documents && candidateData.documents.length > 0 ? `
                        ${candidateData.documents.map(d => `
                        <div class="document-item">
                            <div class="document-name">${d.label || d.originalName}</div>
                            <div class="document-actions">
                                ${getPreviewButton(d)}
                            </div>
                        </div>
                        `).join('')}
                        ` : `
                        <div class="list-item">
                            <div class="list-item-title">No documents available</div>
                            <div class="list-item-description">This candidate has not uploaded any documents yet.</div>
                        </div>
                        `}
                    </div>
                    ` : ''}
                    
                    ${withDoc ? `
                    <div class="section">
                        <h2 class="section-title">💰 Salary Slips</h2>
                        ${candidateData.salarySlips && candidateData.salarySlips.length > 0 ? `
                        ${candidateData.salarySlips.map(ss => `
                        <div class="document-item">
                            <div class="document-name">${ss.month} ${ss.year}</div>
                            <div class="document-actions">
                                ${ss.documentUrl ? `<a href="${ss.documentUrl}" class="document-preview" target="_blank" rel="noopener noreferrer">Preview</a>` : ''}
                            </div>
                        </div>
                        `).join('')}
                        ` : `
                        <div class="list-item">
                            <div class="list-item-title">No salary slips available</div>
                            <div class="list-item-description">This candidate has not uploaded any salary slips yet.</div>
                        </div>
                        `}
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="shared-info">
                <div class="shared-info-title">Profile Shared</div>
                <div class="shared-info-text">This profile was shared by ${candidateData.sharedBy} on ${new Date(candidateData.sharedAt).toLocaleDateString()}</div>
            </div>
            
            <div class="footer">
                <p>This candidate profile was shared through Dharwin Business Solutions</p>
                <p>© 2024 Dharwin. All rights reserved.</p>
                <!-- <p><a href="#">Visit our website</a></p> -->
            </div>
        </div>
        
    </body>
    </html>
  `;
};

export { shareProfile, getPublicProfile };


