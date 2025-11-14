import httpStatus from 'http-status';
import Project from '../models/project.model.js';
import ApiError from '../utils/ApiError.js';
import { deleteObject } from '../config/s3.js';

const isOwnerOrAdmin = (user, project) => {
  if (!project) return false;
  return user.role === 'admin' || String(project.createdBy) === String(user.id || user._id);
};

const createProject = async (createdById, payload) => {
  const project = await Project.create({
    createdBy: createdById,
    ...payload,
  });
  return project;
};

const queryProjects = async (filter, options) => {
  // If user is not admin, filter by createdBy or assignedTo
  if (filter.userRole && filter.userRole !== 'admin') {
    const userId = filter.userId;
    const userFilter = {
      $or: [
        { createdBy: userId },
        { assignedTo: userId }
      ]
    };
    
    // Remove user-specific filter fields
    delete filter.userRole;
    delete filter.userId;
    
    // Merge with existing filter
    const finalFilter = { ...filter, ...userFilter };
    const result = await Project.paginate(finalFilter, options);
    
    // Manually populate with field selection
    if (result.results && result.results.length > 0) {
      for (const doc of result.results) {
        await doc.populate([
          { path: 'createdBy', select: 'name email' },
          { path: 'assignedTo', select: 'name email' }
        ]);
      }
    }
    
    return result;
  }
  
  // Remove user-specific filter fields for admin
  delete filter.userRole;
  delete filter.userId;
  
  const result = await Project.paginate(filter, options);
  
  // Manually populate with field selection
  if (result.results && result.results.length > 0) {
    for (const doc of result.results) {
      await doc.populate([
        { path: 'createdBy', select: 'name email' },
        { path: 'assignedTo', select: 'name email' }
      ]);
    }
  }
  
  return result;
};

const getProjectById = async (id) => {
  const project = await Project.findById(id).exec();
  if (!project) {
    return null;
  }
  
  // Manually populate with field selection
  await project.populate([
    { path: 'createdBy', select: 'name email' },
    { path: 'assignedTo', select: 'name email' }
  ]);
  
  return project;
};

const updateProjectById = async (id, updateBody, currentUser) => {
  const project = await getProjectById(id);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }
  if (!isOwnerOrAdmin(currentUser, project)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  
  // Handle attachment updates and deletions
  if (updateBody.attachments !== undefined) {
    const oldAttachments = project.attachments || [];
    const newAttachments = updateBody.attachments || [];
    
    // Find attachments that were removed (exist in old but not in new)
    const removedAttachments = oldAttachments.filter(oldAttachment => {
      // Check if this attachment still exists in new attachments by comparing key
      return !newAttachments.some(newAttachment => 
        newAttachment.key === oldAttachment.key
      );
    });
    
    // Delete files from S3 for removed attachments
    if (removedAttachments.length > 0) {
      const deletePromises = removedAttachments
        .filter(attachment => attachment.key) // Only delete if key exists
        .map(attachment => 
          deleteObject(attachment.key).catch(error => {
            // Log error but don't fail the update if S3 deletion fails
            console.error(`Failed to delete S3 object ${attachment.key}:`, error);
            return null;
          })
        );
      
      await Promise.all(deletePromises);
    }
  }
  
  // Update project with new data
  Object.assign(project, updateBody);
  await project.save();
  
  // Re-populate after save
  await project.populate([
    { path: 'createdBy', select: 'name email' },
    { path: 'assignedTo', select: 'name email' }
  ]);
  
  return project;
};

const deleteProjectById = async (id, currentUser) => {
  const project = await getProjectById(id);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }
  if (!isOwnerOrAdmin(currentUser, project)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }
  
  // Delete all attachments from S3 before deleting the project
  if (project.attachments && project.attachments.length > 0) {
    const deletePromises = project.attachments
      .filter(attachment => attachment.key) // Only delete if key exists
      .map(attachment => 
        deleteObject(attachment.key).catch(error => {
          // Log error but don't fail the deletion if S3 deletion fails
          console.error(`Failed to delete S3 object ${attachment.key}:`, error);
          return null;
        })
      );
    
    await Promise.all(deletePromises);
  }
  
  await project.deleteOne();
  return project;
};

export {
  createProject,
  queryProjects,
  getProjectById,
  updateProjectById,
  deleteProjectById,
  isOwnerOrAdmin,
};

