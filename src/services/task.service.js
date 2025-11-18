import httpStatus from 'http-status';
import Task from '../models/task.model.js';
import Project from '../models/project.model.js';
import User from '../models/user.model.js';
import Candidate from '../models/candidate.model.js';
import ApiError from '../utils/ApiError.js';
import { deleteObject } from '../config/s3.js';

/**
 * Generate unique task ID (e.g., SPK-123)
 * @param {string} taskKey - The task key prefix (e.g., 'SPK')
 * @returns {Promise<string>}
 */
const generateTaskId = async (taskKey = 'SPK') => {
  // Find all tasks with the same taskKey to get the highest number
  const tasks = await Task.find({ taskKey }).select('taskId').lean();

  let maxNumber = 0;

  if (tasks && tasks.length > 0) {
    // Extract numbers from all taskIds and find the maximum
    tasks.forEach((task) => {
      if (task.taskId) {
        const match = task.taskId.match(/-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    });
  }

  const nextNumber = maxNumber + 1;
  const taskId = `${taskKey}-${nextNumber}`;

  // Ensure uniqueness (in case of race condition)
  const exists = await Task.findOne({ taskId });
  if (exists) {
    // If exists, try next number (recursive call)
    return generateTaskId(taskKey);
  }

  return taskId;
};

/**
 * Check if user has access to task
 * @param {Object} user - Current user
 * @param {Object} task - Task object
 * @param {Object} project - Project object (optional, will be fetched if not provided)
 * @returns {Promise<boolean>}
 */
const hasTaskAccess = async (user, task, project = null) => {
  if (user.role === 'admin') return true;

  if (!project && task.project) {
    project = await Project.findById(task.project).lean();
  }

  if (project) {
    // Project creator has access
    if (String(project.createdBy) === String(user.id || user._id)) {
      return true;
    }
    // Project members have access
    if (
      project.assignedTo &&
      project.assignedTo.some((userId) => String(userId) === String(user.id || user._id))
    ) {
      return true;
    }
  }

  // Assigned user has access
  if (
    task.assignedTo &&
    task.assignedTo.some((userId) => String(userId._id || userId) === String(user.id || user._id))
  ) {
    return true;
  }

  // Task creator has access
  if (String(task.createdBy._id || task.createdBy) === String(user.id || user._id)) {
    return true;
  }

  return false;
};

/**
 * Check if user can modify task
 * @param {Object} user - Current user
 * @param {Object} task - Task object
 * @param {Object} project - Project object (optional)
 * @returns {Promise<boolean>}
 */
const canModifyTask = async (user, task, project = null) => {
  if (user.role === 'admin') return true;

  if (!project && task.project) {
    project = await Project.findById(task.project).lean();
  }

  if (project) {
    // Project creator can modify
    if (String(project.createdBy) === String(user.id || user._id)) {
      return true;
    }
  }

  // Assigned user can modify
  if (
    task.assignedTo &&
    task.assignedTo.some((userId) => String(userId._id || userId) === String(user.id || user._id))
  ) {
    return true;
  }

  return false;
};

/**
 * Create a task
 * @param {ObjectId} createdById - User ID who creates the task
 * @param {Object} payload - Task data
 * @returns {Promise<Task>}
 */
const createTask = async (createdById, payload) => {
  // Verify project exists
  const project = await Project.findById(payload.project);
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }

  // Generate task ID
  const taskKey = payload.taskKey || 'SPK';
  const taskId = await generateTaskId(taskKey);

  // Set assignedBy if assignedTo is provided but assignedBy is not
  if (payload.assignedTo && payload.assignedTo.length > 0 && !payload.assignedBy) {
    payload.assignedBy = createdById;
  }

  const task = await Task.create({
    ...payload,
    taskId,
    taskKey,
    createdBy: createdById,
    assignedDate: payload.assignedDate || new Date(),
  });

  // Populate references
  await task.populate([
    { path: 'project', select: 'projectName status priority' },
    { path: 'createdBy', select: 'name email' },
    { path: 'assignedBy', select: 'name email' },
    { path: 'assignedTo', select: 'name email' },
  ]);

  return task;
};

/**
 * Query tasks with filtering, sorting, and pagination
 * @param {Object} filter - Filter object
 * @param {Object} options - Query options
 * @returns {Promise<Object>}
 */
const queryTasks = async (filter, options) => {
  const userRole = filter.userRole;
  const userId = filter.userId;

  // Remove user-specific filter fields
  delete filter.userRole;
  delete filter.userId;

  // If user is not admin, filter by project access
  if (userRole && userRole !== 'admin') {
    // Get projects user has access to
    const userProjects = await Project.find({
      $or: [{ createdBy: userId }, { assignedTo: userId }],
    }).select('_id');

    const projectIds = userProjects.map((p) => p._id);

    // Filter tasks by accessible projects or assigned to user
    filter.$or = [
      { project: { $in: projectIds } },
      { assignedTo: userId },
      { createdBy: userId },
    ];
  }

  const result = await Task.paginate(filter, options);

  // Populate references
  if (result.results && result.results.length > 0) {
    for (const doc of result.results) {
      await doc.populate([
        { path: 'project', select: 'projectName status priority' },
        { path: 'createdBy', select: 'name email' },
        { path: 'assignedBy', select: 'name email' },
        { path: 'assignedTo', select: 'name email' },
      ]);
    }
  }

  return result;
};

/**
 * Get task by ID
 * @param {ObjectId} id - Task ID
 * @returns {Promise<Task>}
 */
const getTaskById = async (id) => {
  const task = await Task.findById(id).exec();
  if (!task) {
    return null;
  }

  // Populate references (except assignedTo and assignedBy - we'll handle them manually)
  await task.populate([
    { path: 'project', select: 'projectName status priority' },
    { path: 'createdBy', select: 'name email' },
    { path: 'subTasks.completedBy', select: 'name email' },
    { path: 'attachments.uploadedBy', select: 'name email' },
  ]);

  // Manually populate assignedBy by checking both User and Candidate collections
  if (task.assignedBy) {
    const assignedById = task.assignedBy.toString();
    
    // First try to find in User collection
    let assignedByUser = await User.findById(assignedById).select('name email').lean();
    
    if (assignedByUser) {
      task._populatedAssignedBy = {
        _id: assignedByUser._id.toString(),
        name: assignedByUser.name || null,
        email: assignedByUser.email || null,
      };
    } else {
      // If not found in User, check Candidate collection
      const assignedByCandidate = await Candidate.findById(assignedById).select('fullName email').lean();
      
      if (assignedByCandidate) {
        task._populatedAssignedBy = {
          _id: assignedByCandidate._id.toString(),
          name: assignedByCandidate.fullName || null,
          email: assignedByCandidate.email || null,
        };
      } else {
        // If neither exists, return just the ID
        task._populatedAssignedBy = {
          _id: assignedById,
          name: null,
          email: null,
        };
      }
    }
    
    // Also set it directly and mark as modified
    task.assignedBy = task._populatedAssignedBy;
    task.markModified('assignedBy');
  }

  // Manually populate assignedTo by checking both User and Candidate collections
  if (task.assignedTo && Array.isArray(task.assignedTo) && task.assignedTo.length > 0) {
    const assignedToIds = task.assignedTo.map((id) => id.toString());
    
    // Fetch users
    const users = await User.find({ _id: { $in: assignedToIds } })
      .select('name email')
      .lean();
    
    const usersMap = new Map();
    const foundUserIds = new Set();
    users.forEach((user) => {
      const userIdStr = user._id.toString();
      usersMap.set(userIdStr, {
        _id: userIdStr,
        name: user.name || null,
        email: user.email || null,
      });
      foundUserIds.add(userIdStr);
    });
    
    // Find IDs that weren't found in users and check candidates
    const candidateIds = assignedToIds.filter((id) => !foundUserIds.has(id));
    
    // Fetch candidates
    const candidatesMap = new Map();
    if (candidateIds.length > 0) {
      const candidates = await Candidate.find({ _id: { $in: candidateIds } })
        .select('fullName email')
        .lean();
      candidates.forEach((candidate) => {
        candidatesMap.set(candidate._id.toString(), {
          _id: candidate._id.toString(),
          name: candidate.fullName || null,
          email: candidate.email || null,
        });
      });
    }
    
    // Manually set assignedTo with populated data
    const populatedAssignedTo = assignedToIds.map((userIdStr) => {
      // First check if it's a user
      const user = usersMap.get(userIdStr);
      if (user) {
        return user;
      }
      
      // Then check if it's a candidate
      const candidate = candidatesMap.get(userIdStr);
      if (candidate) {
        return candidate;
      }
      
      // If neither exists, return just the ID
      return {
        _id: userIdStr,
        name: null,
        email: null,
      };
    });
    
    // Store the populated data in a way that survives toJSON()
    // We'll attach it to the document and handle it in the response
    task._populatedAssignedTo = populatedAssignedTo;
    
    // Also set it directly and mark as modified
    task.assignedTo = populatedAssignedTo;
    task.markModified('assignedTo');
  }

  return task;
};

/**
 * Update task by ID
 * @param {ObjectId} id - Task ID
 * @param {Object} updateBody - Update data
 * @param {Object} currentUser - Current user
 * @returns {Promise<Task>}
 */
const updateTaskById = async (id, updateBody, currentUser) => {
  const task = await getTaskById(id);
  if (!task) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
  }

  // Check access
  const project = await Project.findById(task.project).lean();
  if (!(await canModifyTask(currentUser, task, project))) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  // Verify new project exists if project is being updated
  if (updateBody.project !== undefined) {
    const currentProjectId = task.project.toString();
    const newProjectId = updateBody.project.toString();
    if (currentProjectId !== newProjectId) {
      const newProject = await Project.findById(updateBody.project);
      if (!newProject) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
      }
    }
  }

  // Handle attachment updates and deletions
  if (updateBody.attachments !== undefined) {
    const oldAttachments = task.attachments || [];
    const newAttachments = updateBody.attachments || [];

    // Find attachments that were removed
    const removedAttachments = oldAttachments.filter((oldAttachment) => {
      return !newAttachments.some(
        (newAttachment) => newAttachment.key === oldAttachment.key || newAttachment._id?.toString() === oldAttachment._id?.toString()
      );
    });

    // Delete files from S3 for removed attachments
    if (removedAttachments.length > 0) {
      const deletePromises = removedAttachments
        .filter((attachment) => attachment.key)
        .map((attachment) =>
          deleteObject(attachment.key).catch((error) => {
            console.error(`Failed to delete S3 object ${attachment.key}:`, error);
            return null;
          })
        );

      await Promise.all(deletePromises);
    }
  }

  // Update progress from sub-tasks if sub-tasks are updated
  if (updateBody.subTasks !== undefined) {
    task.subTasks = updateBody.subTasks;
    task.updateProgressFromSubTasks();
  }

  // Set updatedBy
  updateBody.updatedBy = currentUser.id || currentUser._id;

  // Update task
  Object.assign(task, updateBody);
  await task.save();

  // Re-populate after save
  await task.populate([
    { path: 'project', select: 'projectName status priority' },
    { path: 'createdBy', select: 'name email' },
    { path: 'assignedBy', select: 'name email' },
    { path: 'assignedTo', select: 'name email' },
    { path: 'subTasks.completedBy', select: 'name email' },
    { path: 'attachments.uploadedBy', select: 'name email' },
  ]);

  return task;
};

/**
 * Delete task by ID
 * @param {ObjectId} id - Task ID
 * @param {Object} currentUser - Current user
 * @returns {Promise<Task>}
 */
const deleteTaskById = async (id, currentUser) => {
  const task = await getTaskById(id);
  if (!task) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
  }

  // Check access - only admin or project creator can delete
  const project = await Project.findById(task.project).lean();
  if (!project) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Project not found');
  }

  const isAdmin = currentUser.role === 'admin';
  const isProjectCreator = String(project.createdBy) === String(currentUser.id || currentUser._id);

  if (!isAdmin && !isProjectCreator) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  // Delete all attachments from S3
  if (task.attachments && task.attachments.length > 0) {
    const deletePromises = task.attachments
      .filter((attachment) => attachment.key)
      .map((attachment) =>
        deleteObject(attachment.key).catch((error) => {
          console.error(`Failed to delete S3 object ${attachment.key}:`, error);
          return null;
        })
      );

    await Promise.all(deletePromises);
  }

  await task.deleteOne();
  return task;
};

/**
 * Get tasks organized by status for Kanban board
 * @param {Object} filter - Filter object
 * @param {Object} currentUser - Current user
 * @returns {Promise<Object>}
 */
const getKanbanBoardTasks = async (filter, currentUser) => {
  const userRole = currentUser.role;
  const userId = currentUser.id || currentUser._id;

  // Build base filter
  const baseFilter = { ...filter };
  delete baseFilter.userRole;
  delete baseFilter.userId;

  // If user is not admin, filter by project access
  if (userRole !== 'admin') {
    const userProjects = await Project.find({
      $or: [{ createdBy: userId }, { assignedTo: userId }],
    }).select('_id');

    const projectIds = userProjects.map((p) => p._id);

    baseFilter.$or = [
      { project: { $in: projectIds } },
      { assignedTo: userId },
      { createdBy: userId },
    ];
  }

  // Get all tasks matching filter - don't populate assignedTo yet to preserve raw ObjectIds
  const tasks = await Task.find(baseFilter)
    .populate([
      { path: 'project', select: 'projectName status priority' },
      { path: 'createdBy', select: 'name email' },
      { path: 'assignedBy', select: 'name email' },
    ])
    .sort({ createdAt: -1 })
    .lean();

  // Collect all unique user IDs to populate in batch
  const allUserIds = new Set();
  tasks.forEach((task) => {
    if (task.assignedTo && Array.isArray(task.assignedTo)) {
      task.assignedTo.forEach((userId) => {
        if (userId) {
          allUserIds.add(userId.toString());
        }
      });
    }
  });

  // Batch fetch all users
  const usersMap = new Map();
  const foundUserIds = new Set();
  if (allUserIds.size > 0) {
    const users = await User.find({ _id: { $in: Array.from(allUserIds) } })
      .select('name email')
      .lean();
    users.forEach((user) => {
      const userIdStr = user._id.toString();
      usersMap.set(userIdStr, {
        _id: userIdStr,
        name: user.name || null,
        email: user.email || null,
      });
      foundUserIds.add(userIdStr);
    });
  }

  // Find IDs that weren't found in users and check candidates
  const candidateIds = Array.from(allUserIds).filter((id) => !foundUserIds.has(id.toString()));

  // Batch fetch candidates for IDs not found in users
  const candidatesMap = new Map();
  if (candidateIds.length > 0) {
    const candidates = await Candidate.find({ _id: { $in: candidateIds } })
      .select('fullName email')
      .lean();
    candidates.forEach((candidate) => {
      candidatesMap.set(candidate._id.toString(), {
        _id: candidate._id.toString(),
        name: candidate.fullName || null,
        email: candidate.email || null,
      });
    });
  }

  // Manually populate assignedTo for each task
  const tasksPlain = tasks.map((task) => {
    // Get the raw assignedTo ObjectIds from the task
    const assignedToIds = task.assignedTo || [];
    
    // Populate each user/candidate from the maps
    if (assignedToIds && Array.isArray(assignedToIds) && assignedToIds.length > 0) {
      task.assignedTo = assignedToIds.map((userId) => {
        const userIdStr = userId?.toString ? userId.toString() : String(userId);
        
        // First check if it's a user
        const user = usersMap.get(userIdStr);
        if (user) {
          return user;
        }
        
        // Then check if it's a candidate
        const candidate = candidatesMap.get(userIdStr);
        if (candidate) {
          return candidate;
        }
        
        // If neither exists, still return the ID
        return {
          _id: userIdStr,
          name: null,
          email: null,
        };
      });
    } else {
      task.assignedTo = [];
    }
    
    // Convert _id to id for consistency with toJSON plugin
    if (task._id) {
      task.id = task._id.toString();
      delete task._id;
    }
    
    return task;
  });

  // Group by status
  const statuses = ['New', 'Todo', 'On Going', 'In Review', 'Completed'];
  const grouped = {};

  statuses.forEach((status) => {
    grouped[status] = tasksPlain.filter((task) => task.status === status);
  });

  return grouped;
};

/**
 * Get task statistics
 * @param {Object} filter - Filter object
 * @param {Object} currentUser - Current user
 * @returns {Promise<Object>}
 */
const getTaskStatistics = async (filter, currentUser) => {
  const userRole = currentUser.role;
  const userId = currentUser.id || currentUser._id;

  // Build base filter
  const baseFilter = { ...filter };
  delete baseFilter.userRole;
  delete baseFilter.userId;

  // If user is not admin, filter by project access
  if (userRole !== 'admin') {
    const userProjects = await Project.find({
      $or: [{ createdBy: userId }, { assignedTo: userId }],
    }).select('_id');

    const projectIds = userProjects.map((p) => p._id);

    baseFilter.$or = [
      { project: { $in: projectIds } },
      { assignedTo: userId },
      { createdBy: userId },
    ];
  }

  // Get counts by status
  const statusCounts = await Task.aggregate([
    { $match: baseFilter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const stats = {
    New: 0,
    Todo: 0,
    'On Going': 0,
    'In Review': 0,
    Completed: 0,
  };

  statusCounts.forEach((item) => {
    if (stats.hasOwnProperty(item._id)) {
      stats[item._id] = item.count;
    }
  });

  // Calculate totals
  const total = Object.values(stats).reduce((sum, count) => sum + count, 0);

  return {
    ...stats,
    total,
  };
};

export {
  createTask,
  queryTasks,
  getTaskById,
  updateTaskById,
  deleteTaskById,
  getKanbanBoardTasks,
  getTaskStatistics,
  hasTaskAccess,
  canModifyTask,
};

