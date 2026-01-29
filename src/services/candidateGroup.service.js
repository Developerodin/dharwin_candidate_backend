import httpStatus from 'http-status';
import CandidateGroup from '../models/candidateGroup.model.js';
import Candidate from '../models/candidate.model.js';
import Holiday from '../models/holiday.model.js';
import Attendance from '../models/attendance.model.js';
import ApiError from '../utils/ApiError.js';
import pick from '../utils/pick.js';
import { addHolidaysToCandidates, removeHolidaysFromCandidates } from './attendance.service.js';
import config from '../config/config.js';

/**
 * Create a new candidate group
 * @param {Object} groupBody
 * @param {Object} user - Current user
 * @returns {Promise<CandidateGroup>}
 */
const createCandidateGroup = async (groupBody, user) => {
  // Check permissions: only admin can create groups
  if (user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admin can create candidate groups');
  }

  const { name, description, candidateIds } = groupBody;

  // Validate candidate IDs if provided
  if (candidateIds && candidateIds.length > 0) {
    const candidates = await Candidate.find({ _id: { $in: candidateIds } });
    if (candidates.length !== candidateIds.length) {
      const foundIds = candidates.map((c) => String(c._id));
      const missingIds = candidateIds.filter((id) => !foundIds.includes(String(id)));
      throw new ApiError(httpStatus.NOT_FOUND, `Some candidates not found: ${missingIds.join(', ')}`);
    }
  }

  // Create new group
  const group = await CandidateGroup.create({
    name,
    description,
    candidates: candidateIds || [],
    createdBy: user._id,
    isActive: true,
  });

  return await group.populate('candidates', 'fullName email employeeId');
};

/**
 * Query candidate groups
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryCandidateGroups = async (filter, options) => {
  const result = await CandidateGroup.paginate(filter, options);
  
  // Manually populate with field selection
  if (result.results && result.results.length > 0) {
    for (const doc of result.results) {
      await doc.populate([
        { path: 'candidates', select: 'fullName email employeeId' },
        { path: 'createdBy', select: 'name email' },
      ]);
    }
  }
  
  return result;
};

/**
 * Get candidate group by id
 * @param {ObjectId} id
 * @returns {Promise<CandidateGroup>}
 */
const getCandidateGroupById = async (id) => {
  const group = await CandidateGroup.findById(id)
    .populate('candidates', 'fullName email employeeId')
    .populate('createdBy', 'name email');
  if (!group) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Candidate group not found');
  }
  return group;
};

/**
 * Update candidate group by id
 * @param {ObjectId} groupId
 * @param {Object} updateBody
 * @param {Object} user - Current user
 * @returns {Promise<CandidateGroup>}
 */
const updateCandidateGroupById = async (groupId, updateBody, user) => {
  // Check permissions: only admin can update groups
  if (user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admin can update candidate groups');
  }

  const group = await getCandidateGroupById(groupId);
  const previousCandidateIds = (group.candidates || []).map((c) => String(c._id || c));

  // If updating candidates, validate them
  if (updateBody.candidateIds) {
    const candidates = await Candidate.find({ _id: { $in: updateBody.candidateIds } });
    if (candidates.length !== updateBody.candidateIds.length) {
      const foundIds = candidates.map((c) => String(c._id));
      const missingIds = updateBody.candidateIds.filter((id) => !foundIds.includes(String(id)));
      throw new ApiError(httpStatus.NOT_FOUND, `Some candidates not found: ${missingIds.join(', ')}`);
    }
    updateBody.candidates = updateBody.candidateIds;
    delete updateBody.candidateIds;
  }

  Object.assign(group, updateBody);
  await group.save();

  if (group.holidays && group.holidays.length > 0) {
    const holidayIds = group.holidays.map((h) => String(h._id || h));
    const currentCandidateIds = (group.candidates || []).map((c) => String(c._id || c));

    // Auto-assign group default holidays to newly added candidates
    const newCandidateIds = currentCandidateIds.filter((id) => !previousCandidateIds.includes(id));
    if (newCandidateIds.length > 0) {
      await addHolidaysToCandidates(newCandidateIds, holidayIds, user);
    }

    // Remove group default holidays from candidates that were removed from the group
    const removedCandidateIds = previousCandidateIds.filter((id) => !currentCandidateIds.includes(id));
    if (removedCandidateIds.length > 0) {
      await removeHolidaysFromCandidates(removedCandidateIds, holidayIds, user);
    }
  }

  return await group.populate('candidates', 'fullName email employeeId');
};

/**
 * Delete candidate group by id
 * @param {ObjectId} groupId
 * @param {Object} user - Current user
 * @returns {Promise<CandidateGroup>}
 */
const deleteCandidateGroupById = async (groupId, user) => {
  // Check permissions: only admin can delete groups
  if (user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admin can delete candidate groups');
  }

  const group = await getCandidateGroupById(groupId);
  await CandidateGroup.findByIdAndDelete(groupId);
  return group;
};

/**
 * Add candidates to a group
 * @param {ObjectId} groupId
 * @param {Array<string>} candidateIds - Array of candidate IDs to add
 * @param {Object} user - Current user
 * @returns {Promise<CandidateGroup>}
 */
const addCandidatesToGroup = async (groupId, candidateIds, user) => {
  // Check permissions: only admin can modify groups
  if (user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admin can modify candidate groups');
  }

  // Validate candidate IDs
  const candidates = await Candidate.find({ _id: { $in: candidateIds } });
  if (candidates.length !== candidateIds.length) {
    const foundIds = candidates.map((c) => String(c._id));
    const missingIds = candidateIds.filter((id) => !foundIds.includes(String(id)));
    throw new ApiError(httpStatus.NOT_FOUND, `Some candidates not found: ${missingIds.join(', ')}`);
  }

  const group = await getCandidateGroupById(groupId);

  // Get current candidate IDs (convert to string array for comparison)
  const currentCandidateIds = (group.candidates || []).map((c) => String(c._id || c));
  
  // Filter out candidates that are already in the group
  const newCandidateIds = candidateIds.filter((id) => !currentCandidateIds.includes(String(id)));

  if (newCandidateIds.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'All candidates are already in the group');
  }

  // Add new candidates to the group
  group.candidates = [...(group.candidates || []), ...newCandidateIds];
  await group.save();

  // Auto-assign group default holidays to newly added candidates
  if (group.holidays && group.holidays.length > 0) {
    const holidayIds = group.holidays.map((h) => String(h._id || h));
    await addHolidaysToCandidates(newCandidateIds, holidayIds, user);
  }

  return await group.populate('candidates', 'fullName email employeeId');
};

/**
 * Remove candidates from a group
 * @param {ObjectId} groupId
 * @param {Array<string>} candidateIds - Array of candidate IDs to remove
 * @param {Object} user - Current user
 * @returns {Promise<CandidateGroup>}
 */
const removeCandidatesFromGroup = async (groupId, candidateIds, user) => {
  // Check permissions: only admin can modify groups
  if (user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admin can modify candidate groups');
  }

  const group = await getCandidateGroupById(groupId);

  // Convert candidate IDs to strings for comparison
  const candidateIdsStr = candidateIds.map((id) => String(id));
  
  // Filter out candidates to remove
  const originalCount = group.candidates.length;
  group.candidates = (group.candidates || []).filter(
    (c) => !candidateIdsStr.includes(String(c._id || c))
  );

  if (group.candidates.length === originalCount) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'None of the specified candidates are in the group');
  }

  await group.save();

  // Remove this group's default holidays from the removed candidates (symmetric with add)
  let holidayIdsToRemove = (group.holidays || []).map((h) => String(h._id || h));

  // If group has no stored default holidays (e.g. assigned before we added group.holidays),
  // infer: from remaining candidates' intersection, or from removed candidates' holidays if none remain
  if (holidayIdsToRemove.length === 0) {
    if (group.candidates.length > 0) {
      const remaining = await Candidate.find({ _id: { $in: group.candidates } }).select('holidays').lean();
      if (remaining.length > 0) {
        const first = (remaining[0].holidays || []).map((h) => String(h));
        holidayIdsToRemove = first.filter((id) =>
          remaining.every((c) => (c.holidays || []).map((h) => String(h)).includes(id))
        );
      }
    } else {
      // No one left in group: remove all holidays from the removed candidate(s) (they got them from this group)
      const removedCandidates = await Candidate.find({ _id: { $in: candidateIdsStr } }).select('holidays').lean();
      const allIds = new Set();
      removedCandidates.forEach((c) => (c.holidays || []).forEach((h) => allIds.add(String(h))));
      holidayIdsToRemove = [...allIds];
    }
  }

  if (holidayIdsToRemove.length > 0) {
    await removeHolidaysFromCandidates(candidateIdsStr, holidayIdsToRemove, user);
  }

  return await group.populate('candidates', 'fullName email employeeId');
};

/**
 * Assign holidays to all candidates in a group
 * @param {ObjectId} groupId
 * @param {Array<string>} holidayIds - Array of holiday IDs
 * @param {Object} user - Current user
 * @returns {Promise<Object>}
 */
const assignHolidaysToGroup = async (groupId, holidayIds, user) => {
  // Check permissions: only admin can assign holidays
  if (user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admin can assign holidays to groups');
  }

  // Get the group with candidates
  const group = await getCandidateGroupById(groupId);

  if (!group.candidates || group.candidates.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Group has no candidates');
  }

  // Validate holiday IDs
  const holidays = await Holiday.find({ _id: { $in: holidayIds }, isActive: true });
  if (holidays.length !== holidayIds.length) {
    const foundIds = holidays.map((h) => String(h._id));
    const missingIds = holidayIds.filter((id) => !foundIds.includes(String(id)));
    throw new ApiError(httpStatus.NOT_FOUND, `Some holidays not found or inactive: ${missingIds.join(', ')}`);
  }

  const createdRecords = [];
  const skipped = [];
  const candidateIds = group.candidates.map((c) => c._id || c);

  // Process each candidate in the group
  for (const candidateId of candidateIds) {
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) continue;

    // Get current holidays array (convert to string array for comparison)
    const currentHolidayIds = (candidate.holidays || []).map((h) => String(h));
    const newHolidayIds = holidayIds.filter((id) => !currentHolidayIds.includes(String(id)));

    // Add new holidays to candidate's holidays array
    if (newHolidayIds.length > 0) {
      candidate.holidays = [...(candidate.holidays || []), ...newHolidayIds];
      await candidate.save();
    }

    // Create attendance records for each holiday date (UTC midnight + app default timezone)
    for (const holiday of holidays) {
      const normalizedDate = new Date(holiday.date);
      normalizedDate.setUTCHours(0, 0, 0, 0);
      const nextDay = new Date(normalizedDate);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);

      // Check if attendance already exists for this candidate & date
      const existingAttendance = await Attendance.findOne({
        candidate: candidateId,
        date: {
          $gte: normalizedDate,
          $lt: nextDay,
        },
      });

      if (existingAttendance) {
        skipped.push({
          candidateId,
          candidateName: candidate.fullName,
          holidayId: holiday._id,
          holidayTitle: holiday.title,
          date: normalizedDate.toISOString(),
          reason: 'Attendance already exists for this date',
        });
        continue;
      }

      // Create attendance record for holiday
      const attendance = await Attendance.create({
        candidate: candidateId,
        candidateEmail: candidate.email,
        date: normalizedDate,
        punchIn: normalizedDate,
        punchOut: null,
        duration: 0,
        notes: `Holiday: ${holiday.title}`,
        timezone: config.attendance?.defaultTimezone || 'UTC',
        status: 'Holiday',
      });

      createdRecords.push(await attendance.populate('candidate', 'fullName email'));
    }
  }

  // Save these holidays as the group default (auto-assigned when new candidates are added)
  group.holidays = holidayIds;
  await group.save();

  return {
    success: true,
    message: `Holidays assigned to group "${group.name}". Added to ${candidateIds.length} candidate(s). Created ${createdRecords.length} attendance record(s).`,
    data: {
      groupId: group._id,
      groupName: group.name,
      candidatesUpdated: candidateIds.length,
      holidaysAdded: holidayIds.length,
      attendanceRecordsCreated: createdRecords.length,
      createdRecords,
      skipped: skipped.length > 0 ? skipped : undefined,
    },
  };
};

/**
 * Remove holidays from all candidates in a group
 * @param {ObjectId} groupId
 * @param {Array<string>} holidayIds - Array of holiday IDs
 * @param {Object} user - Current user
 * @returns {Promise<Object>}
 */
const removeHolidaysFromGroup = async (groupId, holidayIds, user) => {
  // Check permissions: only admin can remove holidays
  if (user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admin can remove holidays from groups');
  }

  // Get the group with candidates
  const group = await getCandidateGroupById(groupId);

  if (!group.candidates || group.candidates.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Group has no candidates');
  }

  // Validate holiday IDs
  const holidays = await Holiday.find({ _id: { $in: holidayIds } });
  if (holidays.length !== holidayIds.length) {
    const foundIds = holidays.map((h) => String(h._id));
    const missingIds = holidayIds.filter((id) => !foundIds.includes(String(id)));
    throw new ApiError(httpStatus.NOT_FOUND, `Some holidays not found: ${missingIds.join(', ')}`);
  }

  const deletedRecords = [];
  const skipped = [];
  const candidateIds = group.candidates.map((c) => c._id || c);

  // Process each candidate in the group
  for (const candidateId of candidateIds) {
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) continue;

    // Get current holidays array (convert to string array for comparison)
    const currentHolidayIds = (candidate.holidays || []).map((h) => String(h));
    const holidaysToRemove = holidayIds.filter((id) => currentHolidayIds.includes(String(id)));

    // Remove holidays from candidate's holidays array
    if (holidaysToRemove.length > 0) {
      candidate.holidays = (candidate.holidays || []).filter(
        (h) => !holidaysToRemove.includes(String(h))
      );
      await candidate.save();
    }

    // Delete attendance records for each holiday date (UTC to match create)
    for (const holiday of holidays) {
      const normalizedDate = new Date(holiday.date);
      normalizedDate.setUTCHours(0, 0, 0, 0);
      const nextDay = new Date(normalizedDate);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);

      // Find and delete attendance records with status 'Holiday' for this date
      const attendance = await Attendance.findOneAndDelete({
        candidate: candidateId,
        date: {
          $gte: normalizedDate,
          $lt: nextDay,
        },
        status: 'Holiday',
        notes: { $regex: new RegExp(`Holiday: ${holiday.title}`, 'i') },
      });

      if (attendance) {
        deletedRecords.push({
          candidateId,
          candidateName: candidate.fullName,
          holidayId: holiday._id,
          holidayTitle: holiday.title,
          date: normalizedDate.toISOString(),
          attendanceId: attendance._id,
        });
      } else {
        skipped.push({
          candidateId,
          candidateName: candidate.fullName,
          holidayId: holiday._id,
          holidayTitle: holiday.title,
          date: normalizedDate.toISOString(),
          reason: 'No holiday attendance record found for this date',
        });
      }
    }
  }

  // Update group default holidays so new candidates won't get these
  const holidayIdsStr = holidayIds.map((id) => String(id));
  group.holidays = (group.holidays || []).filter((h) => !holidayIdsStr.includes(String(h._id || h)));
  await group.save();

  return {
    success: true,
    message: `Holidays removed from group "${group.name}". Removed from ${candidateIds.length} candidate(s). Deleted ${deletedRecords.length} attendance record(s).`,
    data: {
      groupId: group._id,
      groupName: group.name,
      candidatesUpdated: candidateIds.length,
      holidaysRemoved: holidayIds.length,
      attendanceRecordsDeleted: deletedRecords.length,
      deletedRecords,
      skipped: skipped.length > 0 ? skipped : undefined,
    },
  };
};

export {
  createCandidateGroup,
  queryCandidateGroups,
  getCandidateGroupById,
  updateCandidateGroupById,
  deleteCandidateGroupById,
  addCandidatesToGroup,
  removeCandidatesFromGroup,
  assignHolidaysToGroup,
  removeHolidaysFromGroup,
};
