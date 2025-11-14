import httpStatus from 'http-status';
import pick from '../utils/pick.js';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';
import {
  createTask,
  queryTasks,
  getTaskById,
  updateTaskById,
  deleteTaskById,
  getKanbanBoardTasks,
  getTaskStatistics,
  hasTaskAccess,
} from '../services/task.service.js';

const create = catchAsync(async (req, res) => {
  const createdById = req.user.id;
  const task = await createTask(createdById, req.body);
  res.status(httpStatus.CREATED).send(task);
});

const list = catchAsync(async (req, res) => {
  const filter = pick(req.query, [
    'title',
    'project',
    'status',
    'priority',
    'assignedTo',
    'createdBy',
    'tags',
  ]);
  // Add user info for filtering
  filter.userRole = req.user.role;
  filter.userId = req.user.id;

  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await queryTasks(filter, options);
  res.send(result);
});

const get = catchAsync(async (req, res) => {
  const task = await getTaskById(req.params.taskId);
  if (!task) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Task not found');
  }

  // Check if user has access
  const hasAccess = await hasTaskAccess(req.user, task);
  if (!hasAccess) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
  }

  // Convert to JSON and restore populated assignedTo and assignedBy if they were manually populated
  const taskJson = task.toJSON();
  if (task._populatedAssignedTo) {
    taskJson.assignedTo = task._populatedAssignedTo;
  }
  if (task._populatedAssignedBy) {
    taskJson.assignedBy = task._populatedAssignedBy;
  }

  res.send(taskJson);
});

const update = catchAsync(async (req, res) => {
  const task = await updateTaskById(req.params.taskId, req.body, req.user);
  res.send(task);
});

const remove = catchAsync(async (req, res) => {
  await deleteTaskById(req.params.taskId, req.user);
  res.status(httpStatus.NO_CONTENT).send();
});

const getKanbanBoard = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['project', 'priority', 'assignedTo', 'tags']);
  filter.userRole = req.user.role;
  filter.userId = req.user.id;

  const result = await getKanbanBoardTasks(filter, req.user);
  res.send(result);
});

const getStatistics = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['project', 'priority', 'assignedTo', 'tags']);
  filter.userRole = req.user.role;
  filter.userId = req.user.id;

  const result = await getTaskStatistics(filter, req.user);
  res.send(result);
});

const updateStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  if (!status) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Status is required');
  }

  const task = await updateTaskById(req.params.taskId, { status }, req.user);
  res.send(task);
});

export { create, list, get, update, remove, getKanbanBoard, getStatistics, updateStatus };

