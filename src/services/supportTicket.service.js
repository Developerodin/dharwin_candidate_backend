import httpStatus from 'http-status';
import SupportTicket from '../models/supportTicket.model.js';
import Candidate from '../models/candidate.model.js';
import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import { uploadMultipleFilesToS3 } from './upload.service.js';

/**
 * Create a support ticket
 * @param {Object} ticketData - Ticket data
 * @param {string} userId - User ID who created the ticket
 * @param {Array} files - Array of uploaded files (optional)
 * @param {Object} user - Current user object (to check role)
 * @returns {Promise<SupportTicket>}
 */
const createSupportTicket = async (ticketData, userId, files = [], user = null) => {
  let candidate = null;
  let candidateId = null;

  // Check if admin is creating ticket on behalf of a candidate
  if (user && user.role === 'admin' && ticketData.candidateId) {
    // Admin creating ticket for a specific candidate
    candidate = await Candidate.findById(ticketData.candidateId);
    if (!candidate) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Candidate not found');
    }
    candidateId = candidate._id;
  } else {
    // Regular user creating ticket - find their candidate profile
    candidate = await Candidate.findOne({ owner: userId });
    candidateId = candidate?._id || null;
  }
  
  // Handle file uploads if any
  let attachments = [];
  if (files && files.length > 0) {
    try {
      // Upload files to S3 in the support-tickets folder
      const uploadResults = await uploadMultipleFilesToS3(files, userId, 'support-tickets');
      attachments = uploadResults.map((result) => ({
        key: result.key,
        url: result.url,
        originalName: result.originalName,
        size: result.size,
        mimeType: result.mimeType,
        uploadedAt: new Date(),
      }));
    } catch (error) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to upload attachments: ${error.message}`);
    }
  }
  
  // Remove candidateId from ticketData before creating (it's not a field in the model)
  const { candidateId: _, ...ticketFields } = ticketData;
  
  const ticket = await SupportTicket.create({
    ...ticketFields,
    createdBy: userId,
    candidate: candidateId,
    attachments,
  });

  // Populate createdBy and candidate
  await ticket.populate([
    { path: 'createdBy', select: 'name email role' },
    { path: 'candidate', select: 'fullName email' },
  ]);

  // Ensure timestamps are included (toJSON plugin removes them)
  const ticketObj = ticket.toObject ? ticket.toObject() : ticket;
  ticketObj.createdAt = ticket.createdAt;
  ticketObj.updatedAt = ticket.updatedAt;
  return ticketObj;
};

/**
 * Query support tickets with filters
 * @param {Object} filter - Filter object
 * @param {Object} options - Query options
 * @param {Object} user - Current user
 * @returns {Promise<Object>}
 */
const querySupportTickets = async (filter, options, user) => {
  // If user is not admin, show tickets they created OR tickets created for their candidate profile
  if (user.role !== 'admin') {
    // Find candidate associated with the user
    const candidate = await Candidate.findOne({ owner: user.id });
    
    if (candidate) {
      // Show tickets created by user OR tickets created for their candidate profile
      filter.$or = [
        { createdBy: user.id },
        { candidate: candidate._id }
      ];
    } else {
      // No candidate profile, only show tickets created by user
      filter.createdBy = user.id;
    }
  } else if (user.role === 'admin' && user.subRole && user.subRole !== 'Admin') {
    // Admin with subRole (except "Admin") can only see tickets assigned to them
    filter.assignedTo = user.id;
  }
  // Admin without subRole or with subRole="Admin" can see all tickets (no filter applied)

  const result = await SupportTicket.paginate(filter, options);

  // Populate fields
  if (result.results && result.results.length > 0) {
    await SupportTicket.populate(result.results, [
      { path: 'createdBy', select: 'name email role subRole' },
      { path: 'candidate', select: 'fullName email' },
      { path: 'assignedTo', select: 'name email role subRole' },
      { path: 'resolvedBy', select: 'name email' },
      { path: 'closedBy', select: 'name email' },
      { path: 'comments.commentedBy', select: 'name email role subRole' },
    ]);
    
    // Ensure timestamps are included in the response (toJSON plugin removes them)
    // Process tickets and populate comments
    const processedTickets = await Promise.all(result.results.map(async (ticket) => {
      const ticketObj = ticket.toObject ? ticket.toObject() : ticket;
      // Add createdAt and updatedAt from the original document
      ticketObj.createdAt = ticket.createdAt || ticketObj.createdAt;
      ticketObj.updatedAt = ticket.updatedAt || ticketObj.updatedAt;
      
      // Manually populate comments if they weren't populated (do this after toObject to preserve changes)
      if (ticketObj.comments && Array.isArray(ticketObj.comments)) {
        for (const comment of ticketObj.comments) {
          if (comment.commentedBy) {
            // Check if it needs to be populated (no name property means it's not populated)
            const needsPopulation = typeof comment.commentedBy === 'string' || 
                                    (typeof comment.commentedBy === 'object' && !comment.commentedBy.name);
            
            if (needsPopulation) {
              // Not populated, fetch the user
              const userId = typeof comment.commentedBy === 'string' 
                ? comment.commentedBy 
                : (comment.commentedBy._id ? comment.commentedBy._id.toString() : comment.commentedBy.toString());
              const user = await User.findById(userId).select('name email role subRole').lean();
              if (user) {
                comment.commentedBy = {
                  id: user._id.toString(),
                  name: user.name,
                  email: user.email,
                  role: user.role,
                  subRole: user.subRole || null,
                };
              }
            } else if (comment.commentedBy && typeof comment.commentedBy === 'object' && comment.commentedBy._id) {
              // Already populated, ensure it has id field
              comment.commentedBy.id = comment.commentedBy._id.toString();
              delete comment.commentedBy._id;
            }
          }
        }
      }
      
      return ticketObj;
    }));
    
    result.results = processedTickets;
  }

  return result;
};

/**
 * Get support ticket by ID
 * @param {string} ticketId - Ticket ID
 * @param {Object} user - Current user
 * @returns {Promise<SupportTicket>}
 */
const getSupportTicketById = async (ticketId, user) => {
  const ticket = await SupportTicket.findById(ticketId);

  if (!ticket) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Support ticket not found');
  }

  // Check permissions
  if (user.role !== 'admin') {
    // Non-admin users can see tickets they created OR tickets created for their candidate profile
    const candidate = await Candidate.findOne({ owner: user.id });
    const canView = 
      String(ticket.createdBy) === String(user.id) || 
      (candidate && String(ticket.candidate) === String(candidate._id));
    
    if (!canView) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You can only view your own tickets');
    }
  } else if (user.role === 'admin' && user.subRole && user.subRole !== 'Admin') {
    // Admin with subRole (except "Admin") can only see tickets assigned to them
    if (!ticket.assignedTo || String(ticket.assignedTo) !== String(user.id)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You can only view tickets assigned to you');
    }
  }
  // Admin without subRole or with subRole="Admin" can see all tickets (no check needed)

  // Populate fields
  await ticket.populate([
    { path: 'createdBy', select: 'name email role subRole' },
    { path: 'candidate', select: 'fullName email' },
    { path: 'assignedTo', select: 'name email role subRole' },
    { path: 'resolvedBy', select: 'name email' },
    { path: 'closedBy', select: 'name email' },
    { path: 'comments.commentedBy', select: 'name email role subRole' },
  ]);

  // Ensure timestamps are included (toJSON plugin removes them)
  const ticketObj = ticket.toObject ? ticket.toObject() : ticket;
  ticketObj.createdAt = ticket.createdAt;
  ticketObj.updatedAt = ticket.updatedAt;

  // Manually populate comments if they weren't populated (do this after toObject to preserve changes)
  if (ticketObj.comments && Array.isArray(ticketObj.comments)) {
    for (const comment of ticketObj.comments) {
      if (comment.commentedBy) {
        // Check if it's an ObjectId (string or object) that needs to be populated
        const isObjectId = typeof comment.commentedBy === 'string' || 
                          (typeof comment.commentedBy === 'object' && 
                           (comment.commentedBy._id || (comment.commentedBy.toString && !comment.commentedBy.name)));
        
        if (isObjectId) {
          // Not populated, fetch the user
          const userId = typeof comment.commentedBy === 'string' 
            ? comment.commentedBy 
            : (comment.commentedBy._id ? comment.commentedBy._id.toString() : comment.commentedBy.toString());
          const user = await User.findById(userId).select('name email role').lean();
          if (user) {
            comment.commentedBy = {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }
        } else if (comment.commentedBy && typeof comment.commentedBy === 'object' && comment.commentedBy._id) {
          // Already populated, ensure it has id field
          comment.commentedBy.id = comment.commentedBy._id.toString();
          delete comment.commentedBy._id;
        }
      }
    }
  }

  return ticketObj;
};

/**
 * Update support ticket
 * @param {string} ticketId - Ticket ID
 * @param {Object} updateData - Update data
 * @param {Object} user - Current user
 * @returns {Promise<SupportTicket>}
 */
const updateSupportTicketById = async (ticketId, updateData, user) => {
  // Fetch ticket as Mongoose document (not plain object) to use methods
  const ticket = await SupportTicket.findById(ticketId);

  if (!ticket) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Support ticket not found');
  }

  // Check permissions
  if (user.role !== 'admin') {
    // Non-admin users can update tickets they created OR tickets created for their candidate profile
    const candidate = await Candidate.findOne({ owner: user.id });
    const canUpdate = 
      String(ticket.createdBy) === String(user.id) || 
      (candidate && String(ticket.candidate) === String(candidate._id));
    
    if (!canUpdate) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You can only update your own tickets');
    }
  } else if (user.role === 'admin' && user.subRole && user.subRole !== 'Admin') {
    // Admin with subRole (except "Admin") can only update tickets assigned to them
    if (!ticket.assignedTo || String(ticket.assignedTo) !== String(user.id)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You can only update tickets assigned to you');
    }
  }
  // Admin without subRole or with subRole="Admin" can update all tickets (no check needed)

  // Only admin can update tickets (except status updates by ticket creator)
  if (user.role !== 'admin') {
    // Non-admins can only update their own ticket status to 'Closed'
    if (updateData.status && updateData.status !== 'Closed') {
      throw new ApiError(httpStatus.FORBIDDEN, 'You can only close your own tickets');
    }
    // Remove fields that non-admins cannot update
    delete updateData.assignedTo;
    delete updateData.priority;
    delete updateData.category;
  }

  // Validate subRole-based assignment: subRole admins can only assign to users with subRoles
  if (updateData.assignedTo && user.role === 'admin') {
    // Fetch the user being assigned to
    const assignedUser = await User.findById(updateData.assignedTo).select('role subRole');
    
    if (!assignedUser) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User to assign ticket to not found');
    }

    // If the assigning user has a subRole, ensure the assigned user also has a subRole
    if (user.subRole) {
      if (!assignedUser.subRole) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Cannot assign ticket to a user without a subRole. Only users with subRoles can be assigned tickets by subRole admins.'
        );
      }
      // Ensure assigned user is an admin
      if (assignedUser.role !== 'admin') {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          'Cannot assign ticket to a non-admin user. Tickets can only be assigned to admin users with subRoles.'
        );
      }
    }
  }

  // If status is being updated, use the method to handle it properly
  if (updateData.status) {
    await ticket.updateStatus(updateData.status, user.id);
    delete updateData.status;
  }

  // Update other fields
  Object.assign(ticket, updateData);
  await ticket.save();

  // Populate fields
  await ticket.populate([
    { path: 'createdBy', select: 'name email role subRole' },
    { path: 'candidate', select: 'fullName email' },
    { path: 'assignedTo', select: 'name email role subRole' },
    { path: 'resolvedBy', select: 'name email' },
    { path: 'closedBy', select: 'name email' },
    { path: 'comments.commentedBy', select: 'name email role subRole' },
  ]);

  // Ensure timestamps are included (toJSON plugin removes them)
  const ticketObj = ticket.toObject ? ticket.toObject() : ticket;
  ticketObj.createdAt = ticket.createdAt;
  ticketObj.updatedAt = ticket.updatedAt;

  // Manually populate comments if they weren't populated (do this after toObject to preserve changes)
  if (ticketObj.comments && Array.isArray(ticketObj.comments)) {
    for (const comment of ticketObj.comments) {
      if (comment.commentedBy) {
        // Check if it's an ObjectId (string or object) that needs to be populated
        const isObjectId = typeof comment.commentedBy === 'string' || 
                          (typeof comment.commentedBy === 'object' && 
                           (comment.commentedBy._id || (comment.commentedBy.toString && !comment.commentedBy.name)));
        
        if (isObjectId) {
          // Not populated, fetch the user
          const userId = typeof comment.commentedBy === 'string' 
            ? comment.commentedBy 
            : (comment.commentedBy._id ? comment.commentedBy._id.toString() : comment.commentedBy.toString());
          const user = await User.findById(userId).select('name email role').lean();
          if (user) {
            comment.commentedBy = {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }
        } else if (comment.commentedBy && typeof comment.commentedBy === 'object' && comment.commentedBy._id) {
          // Already populated, ensure it has id field
          comment.commentedBy.id = comment.commentedBy._id.toString();
          delete comment.commentedBy._id;
        }
      }
    }
  }

  return ticketObj;
};

/**
 * Add comment to support ticket
 * @param {string} ticketId - Ticket ID
 * @param {string} content - Comment content
 * @param {Object} user - Current user
 * @param {Array} files - Array of uploaded files (optional)
 * @returns {Promise<SupportTicket>}
 */
const addCommentToTicket = async (ticketId, content, user, files = []) => {
  // Fetch ticket as Mongoose document (not plain object) to use methods
  const ticket = await SupportTicket.findById(ticketId);

  if (!ticket) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Support ticket not found');
  }

  // Check permissions
  if (user.role !== 'admin') {
    // Non-admin users can comment on tickets they created OR tickets created for their candidate profile
    const candidate = await Candidate.findOne({ owner: user.id });
    const canComment = 
      String(ticket.createdBy) === String(user.id) || 
      (candidate && String(ticket.candidate) === String(candidate._id));
    
    if (!canComment) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You can only comment on your own tickets');
    }
  } else if (user.role === 'admin' && user.subRole && user.subRole !== 'Admin') {
    // Admin with subRole (except "Admin") can only comment on tickets assigned to them
    if (!ticket.assignedTo || String(ticket.assignedTo) !== String(user.id)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You can only comment on tickets assigned to you');
    }
  }
  // Admin without subRole or with subRole="Admin" can comment on all tickets (no check needed)

  // Check if ticket is closed
  if (ticket.status === 'Closed') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot add comment to closed ticket');
  }

  // Handle file uploads if any
  let attachments = [];
  if (files && files.length > 0) {
    try {
      // Upload files to S3 in the support-tickets/comments folder
      const uploadResults = await uploadMultipleFilesToS3(files, user.id, 'support-tickets/comments');
      attachments = uploadResults.map((result) => ({
        key: result.key,
        url: result.url,
        originalName: result.originalName,
        size: result.size,
        mimeType: result.mimeType,
        uploadedAt: new Date(),
      }));
    } catch (error) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to upload attachments: ${error.message}`);
    }
  }

  // Determine if this is an admin comment
  const isAdminComment = user.role === 'admin';

  // Add comment using the document method
  await ticket.addComment(content, user.id, isAdminComment, attachments);

  // Populate fields
  await ticket.populate([
    { path: 'createdBy', select: 'name email role subRole' },
    { path: 'candidate', select: 'fullName email' },
    { path: 'assignedTo', select: 'name email role subRole' },
    { path: 'resolvedBy', select: 'name email' },
    { path: 'closedBy', select: 'name email' },
    { path: 'comments.commentedBy', select: 'name email role subRole' },
  ]);

  // Ensure timestamps are included (toJSON plugin removes them)
  const ticketObj = ticket.toObject ? ticket.toObject() : ticket;
  ticketObj.createdAt = ticket.createdAt;
  ticketObj.updatedAt = ticket.updatedAt;

  // Manually populate comments if they weren't populated (do this after toObject to preserve changes)
  if (ticketObj.comments && Array.isArray(ticketObj.comments)) {
    for (const comment of ticketObj.comments) {
      if (comment.commentedBy) {
        // Check if it's an ObjectId (string or object) that needs to be populated
        const isObjectId = typeof comment.commentedBy === 'string' || 
                          (typeof comment.commentedBy === 'object' && 
                           (comment.commentedBy._id || (comment.commentedBy.toString && !comment.commentedBy.name)));
        
        if (isObjectId) {
          // Not populated, fetch the user
          const userId = typeof comment.commentedBy === 'string' 
            ? comment.commentedBy 
            : (comment.commentedBy._id ? comment.commentedBy._id.toString() : comment.commentedBy.toString());
          const user = await User.findById(userId).select('name email role').lean();
          if (user) {
            comment.commentedBy = {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }
        } else if (comment.commentedBy && typeof comment.commentedBy === 'object' && comment.commentedBy._id) {
          // Already populated, ensure it has id field
          comment.commentedBy.id = comment.commentedBy._id.toString();
          delete comment.commentedBy._id;
        }
      }
    }
  }

  return ticketObj;
};

/**
 * Delete support ticket
 * @param {string} ticketId - Ticket ID
 * @param {Object} user - Current user
 * @returns {Promise<void>}
 */
const deleteSupportTicketById = async (ticketId, user) => {
  // Fetch ticket as Mongoose document (not plain object) to use methods
  const ticket = await SupportTicket.findById(ticketId);

  if (!ticket) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Support ticket not found');
  }

  // Only admin can delete tickets
  if (user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admin can delete tickets');
  }

  await ticket.deleteOne();
};

export {
  createSupportTicket,
  querySupportTickets,
  getSupportTicketById,
  updateSupportTicketById,
  addCommentToTicket,
  deleteSupportTicketById,
};

