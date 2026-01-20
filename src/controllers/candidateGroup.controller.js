import httpStatus from 'http-status';
import pick from '../utils/pick.js';
import catchAsync from '../utils/catchAsync.js';
import {
  createCandidateGroup,
  queryCandidateGroups,
  getCandidateGroupById,
  updateCandidateGroupById,
  deleteCandidateGroupById,
  addCandidatesToGroup,
  removeCandidatesFromGroup,
  assignHolidaysToGroup,
  removeHolidaysFromGroup,
} from '../services/candidateGroup.service.js';

/**
 * Create a new candidate group
 */
const create = catchAsync(async (req, res) => {
  const group = await createCandidateGroup(req.body, req.user);
  res.status(httpStatus.CREATED).send({
    success: true,
    message: 'Candidate group created successfully',
    data: group,
  });
});

/**
 * Get all candidate groups
 */
const list = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'isActive', 'createdBy']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await queryCandidateGroups(filter, options);
  res.status(httpStatus.OK).send({
    success: true,
    data: result,
  });
});

/**
 * Get a single candidate group
 */
const get = catchAsync(async (req, res) => {
  const group = await getCandidateGroupById(req.params.groupId);
  res.status(httpStatus.OK).send({
    success: true,
    data: group,
  });
});

/**
 * Update a candidate group
 */
const update = catchAsync(async (req, res) => {
  const group = await updateCandidateGroupById(req.params.groupId, req.body, req.user);
  res.status(httpStatus.OK).send({
    success: true,
    message: 'Candidate group updated successfully',
    data: group,
  });
});

/**
 * Delete a candidate group
 */
const remove = catchAsync(async (req, res) => {
  await deleteCandidateGroupById(req.params.groupId, req.user);
  res.status(httpStatus.OK).send({
    success: true,
    message: 'Candidate group deleted successfully',
  });
});

/**
 * Add candidates to a group
 */
const addCandidates = catchAsync(async (req, res) => {
  const group = await addCandidatesToGroup(req.params.groupId, req.body.candidateIds, req.user);
  res.status(httpStatus.OK).send({
    success: true,
    message: 'Candidates added to group successfully',
    data: group,
  });
});

/**
 * Remove candidates from a group
 */
const removeCandidates = catchAsync(async (req, res) => {
  const group = await removeCandidatesFromGroup(req.params.groupId, req.body.candidateIds, req.user);
  res.status(httpStatus.OK).send({
    success: true,
    message: 'Candidates removed from group successfully',
    data: group,
  });
});

/**
 * Assign holidays to all candidates in a group
 */
const assignHolidays = catchAsync(async (req, res) => {
  const result = await assignHolidaysToGroup(req.params.groupId, req.body.holidayIds, req.user);
  res.status(httpStatus.OK).send(result);
});

/**
 * Remove holidays from all candidates in a group
 */
const removeHolidays = catchAsync(async (req, res) => {
  const result = await removeHolidaysFromGroup(req.params.groupId, req.body.holidayIds, req.user);
  res.status(httpStatus.OK).send(result);
});

export {
  create,
  list,
  get,
  update,
  remove,
  addCandidates,
  removeCandidates,
  assignHolidays,
  removeHolidays,
};
