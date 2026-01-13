import httpStatus from 'http-status';
import ApiError from '../utils/ApiError.js';
import SubRole from '../models/subRole.model.js';
import User from '../models/user.model.js';

/**
 * Create a subRole
 * @param {Object} subRoleBody
 * @param {ObjectId} createdById
 * @returns {Promise<SubRole>}
 */
const createSubRole = async (subRoleBody, createdById) => {
  if (await SubRole.isNameTaken(subRoleBody.name)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'SubRole name already taken');
  }
  return SubRole.create({
    ...subRoleBody,
    createdBy: createdById,
  });
};

/**
 * Query for subRoles
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const querySubRoles = async (filter, options) => {
  const subRoles = await SubRole.paginate(filter, options);
  
  // Populate createdBy field
  if (subRoles.results && subRoles.results.length > 0) {
    for (const doc of subRoles.results) {
      await doc.populate({ path: 'createdBy', select: 'name email' });
    }
  }
  
  return subRoles;
};

/**
 * Get subRole by id
 * @param {ObjectId} id
 * @returns {Promise<SubRole>}
 */
const getSubRoleById = async (id) => {
  const subRole = await SubRole.findById(id);
  if (subRole) {
    await subRole.populate({ path: 'createdBy', select: 'name email' });
  }
  return subRole;
};

/**
 * Get subRole by name
 * @param {string} name
 * @returns {Promise<SubRole>}
 */
const getSubRoleByName = async (name) => {
  const subRole = await SubRole.findOne({ name });
  if (subRole) {
    await subRole.populate({ path: 'createdBy', select: 'name email' });
  }
  return subRole;
};

/**
 * Update subRole by id
 * @param {ObjectId} subRoleId
 * @param {Object} updateBody
 * @returns {Promise<SubRole>}
 */
const updateSubRoleById = async (subRoleId, updateBody) => {
  const subRole = await getSubRoleById(subRoleId);
  if (!subRole) {
    throw new ApiError(httpStatus.NOT_FOUND, 'SubRole not found');
  }
  if (updateBody.name && (await SubRole.isNameTaken(updateBody.name, subRoleId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'SubRole name already taken');
  }
  
  // Store old name before update
  const oldName = subRole.name;
  
  // Update the subRole
  Object.assign(subRole, updateBody);
  await subRole.save();
  
  // Prepare fields to update in user table
  const updateFields = {};
  
  // If navigation is provided in update, always update all users' navigation
  if (updateBody.navigation !== undefined) {
    updateFields.navigation = subRole.navigation;
  }
  
  // If name changed, update all users' subRole string field
  if (updateBody.name !== undefined && updateBody.name !== oldName) {
    updateFields.subRole = subRole.name;
  }
  
  // Bulk update all users with this subRoleId directly in the user table
  if (Object.keys(updateFields).length > 0) {
    const updateResult = await User.updateMany(
      { subRoleId: subRoleId },
      { $set: updateFields }
    );
    
    // Log the update for debugging (optional)
    if (updateResult.modifiedCount > 0) {
      console.log(`Updated ${updateResult.modifiedCount} user(s) with subRoleId ${subRoleId}`);
    }
  }
  
  await subRole.populate({ path: 'createdBy', select: 'name email' });
  return subRole;
};

/**
 * Delete subRole by id
 * @param {ObjectId} subRoleId
 * @returns {Promise<SubRole>}
 */
const deleteSubRoleById = async (subRoleId) => {
  const subRole = await getSubRoleById(subRoleId);
  if (!subRole) {
    throw new ApiError(httpStatus.NOT_FOUND, 'SubRole not found');
  }
  await subRole.deleteOne();
  return subRole;
};

export {
  createSubRole,
  querySubRoles,
  getSubRoleById,
  getSubRoleByName,
  updateSubRoleById,
  deleteSubRoleById,
};
