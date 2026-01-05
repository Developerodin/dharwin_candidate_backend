import httpStatus from 'http-status';
import SupportTicket from '../models/supportTicket.model.js';
import Candidate from '../models/candidate.model.js';
import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';

/**
 * Create a support ticket
 * @param {Object} ticketData - Ticket data
 * @param {string} userId - User ID who created the ticket
 * @returns {Promise<SupportTicket>}
 */
const createSupportTicket = async (ticketData, userId) => {
  // Find candidate associated with the user
  const candidate = await Candidate.findOne({ owner: userId });
  
  const ticket = await SupportTicket.create({
    ...ticketData,
    createdBy: userId,
    candidate: candidate?._id || null,
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
  // If user is not admin, only show their own tickets
  if (user.role !== 'admin') {
    filter.createdBy = user.id;
  }

  const result = await SupportTicket.paginate(filter, options);

  // Populate fields
  if (result.results && result.results.length > 0) {
    await SupportTicket.populate(result.results, [
      { path: 'createdBy', select: 'name email role' },
      { path: 'candidate', select: 'fullName email' },
      { path: 'assignedTo', select: 'name email role' },
      { path: 'resolvedBy', select: 'name email' },
      { path: 'closedBy', select: 'name email' },
      { path: 'comments.commentedBy', select: 'name email role' },
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

  // Check permissions: admin can see all, users can only see their own
  if (user.role !== 'admin' && String(ticket.createdBy) !== String(user.id)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only view your own tickets');
  }

  // Populate fields
  await ticket.populate([
    { path: 'createdBy', select: 'name email role' },
    { path: 'candidate', select: 'fullName email' },
    { path: 'assignedTo', select: 'name email role' },
    { path: 'resolvedBy', select: 'name email' },
    { path: 'closedBy', select: 'name email' },
    { path: 'comments.commentedBy', select: 'name email role' },
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

  // Check permissions: admin can see all, users can only see their own
  if (user.role !== 'admin' && String(ticket.createdBy) !== String(user.id)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only update your own tickets');
  }

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
    { path: 'createdBy', select: 'name email role' },
    { path: 'candidate', select: 'fullName email' },
    { path: 'assignedTo', select: 'name email role' },
    { path: 'resolvedBy', select: 'name email' },
    { path: 'closedBy', select: 'name email' },
    { path: 'comments.commentedBy', select: 'name email role' },
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
 * @returns {Promise<SupportTicket>}
 */
const addCommentToTicket = async (ticketId, content, user) => {
  // Fetch ticket as Mongoose document (not plain object) to use methods
  const ticket = await SupportTicket.findById(ticketId);

  if (!ticket) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Support ticket not found');
  }

  // Check permissions: admin can see all, users can only see their own
  if (user.role !== 'admin' && String(ticket.createdBy) !== String(user.id)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only comment on your own tickets');
  }

  // Check if ticket is closed
  if (ticket.status === 'Closed') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot add comment to closed ticket');
  }

  // Determine if this is an admin comment
  const isAdminComment = user.role === 'admin';

  // Add comment using the document method
  await ticket.addComment(content, user.id, isAdminComment);

  // Populate fields
  await ticket.populate([
    { path: 'createdBy', select: 'name email role' },
    { path: 'candidate', select: 'fullName email' },
    { path: 'assignedTo', select: 'name email role' },
    { path: 'resolvedBy', select: 'name email' },
    { path: 'closedBy', select: 'name email' },
    { path: 'comments.commentedBy', select: 'name email role' },
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

