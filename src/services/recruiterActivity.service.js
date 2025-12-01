import httpStatus from 'http-status';
import RecruiterActivityLog from '../models/recruiterActivityLog.model.js';
import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';

/**
 * Log a recruiter activity
 */
const logActivity = async (recruiterId, activityType, data = {}) => {
  const activityLog = await RecruiterActivityLog.create({
    recruiter: recruiterId,
    activityType,
    description: data.description,
    job: data.jobId,
    candidate: data.candidateId,
    meeting: data.meetingId,
    metadata: data.metadata,
  });
  return activityLog;
};

/**
 * Get activity logs with filters (Admin only)
 */
const getActivityLogs = async (filter = {}, options = {}) => {
  const query = {};
  
  // Filter by recruiter
  if (filter.recruiterId) {
    query.recruiter = filter.recruiterId;
  }
  
  // Filter by activity type
  if (filter.activityType) {
    query.activityType = filter.activityType;
  }
  
  // Filter by date range
  if (filter.startDate || filter.endDate) {
    query.createdAt = {};
    if (filter.startDate) {
      query.createdAt.$gte = new Date(filter.startDate);
    }
    if (filter.endDate) {
      query.createdAt.$lte = new Date(filter.endDate);
    }
  }
  
  // Filter by job
  if (filter.jobId) {
    query.job = filter.jobId;
  }
  
  // Filter by candidate
  if (filter.candidateId) {
    query.candidate = filter.candidateId;
  }
  
  const result = await RecruiterActivityLog.paginate(query, {
    ...options,
    sortBy: options.sortBy || 'createdAt:desc',
  });
  
  // Manually populate the results
  if (result.results && result.results.length > 0) {
    for (const doc of result.results) {
      await doc.populate([
        { path: 'recruiter', select: 'name email role' },
        { path: 'job', select: 'title organisation status' },
        { path: 'candidate', select: 'fullName email' },
        { path: 'meeting', select: 'title scheduledAt status' },
      ]);
    }
    
    // Transform results to include explicit candidate and recruiter name/email
    result.results = result.results.map((doc) => {
      const docObj = doc.toObject ? doc.toObject() : doc;
      
      // Add recruiter name and email explicitly
      if (docObj.recruiter) {
        docObj.recruiterName = docObj.recruiter.name || null;
        docObj.recruiterEmail = docObj.recruiter.email || null;
      } else {
        docObj.recruiterName = null;
        docObj.recruiterEmail = null;
      }
      
      // Add candidate name and email explicitly
      if (docObj.candidate) {
        docObj.candidateName = docObj.candidate.fullName || null;
        docObj.candidateEmail = docObj.candidate.email || null;
      } else {
        docObj.candidateName = null;
        docObj.candidateEmail = null;
      }
      
      return docObj;
    });
  }
  
  return result;
};

/**
 * Get activity logs summary by recruiter (Admin only)
 */
const getActivityLogsSummary = async (filter = {}) => {
  const matchQuery = {};
  
  if (filter.recruiterId) {
    matchQuery.recruiter = filter.recruiterId;
  }
  
  if (filter.startDate || filter.endDate) {
    matchQuery.createdAt = {};
    if (filter.startDate) {
      matchQuery.createdAt.$gte = new Date(filter.startDate);
    }
    if (filter.endDate) {
      matchQuery.createdAt.$lte = new Date(filter.endDate);
    }
  }
  
  const summary = await RecruiterActivityLog.aggregate([
    {
      $match: matchQuery,
    },
    {
      $group: {
        _id: {
          recruiter: '$recruiter',
          activityType: '$activityType',
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.recruiter',
        activities: {
          $push: {
            activityType: '$_id.activityType',
            count: '$count',
          },
        },
        totalActivities: { $sum: '$count' },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'recruiter',
      },
    },
    {
      $unwind: {
        path: '$recruiter',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        recruiter: {
          id: '$recruiter._id',
          name: '$recruiter.name',
          email: '$recruiter.email',
          role: '$recruiter.role',
        },
        activities: 1,
        totalActivities: 1,
      },
    },
    {
      $sort: { totalActivities: -1 },
    },
  ]);
  
  return summary;
};

/**
 * Get activity statistics (Admin only)
 */
const getActivityStatistics = async (filter = {}) => {
  const matchQuery = {};
  
  if (filter.recruiterId) {
    matchQuery.recruiter = filter.recruiterId;
  }
  
  if (filter.startDate || filter.endDate) {
    matchQuery.createdAt = {};
    if (filter.startDate) {
      matchQuery.createdAt.$gte = new Date(filter.startDate);
    }
    if (filter.endDate) {
      matchQuery.createdAt.$lte = new Date(filter.endDate);
    }
  }
  
  const stats = await RecruiterActivityLog.aggregate([
    {
      $match: matchQuery,
    },
    {
      $group: {
        _id: '$activityType',
        count: { $sum: 1 },
      },
    },
  ]);
  
  const statistics = {
    jobPostingsCreated: 0,
    candidatesScreened: 0,
    interviewsScheduled: 0,
    notesAdded: 0,
    feedbackAdded: 0,
    total: 0,
  };
  
  stats.forEach((stat) => {
    switch (stat._id) {
      case 'job_posting_created':
        statistics.jobPostingsCreated = stat.count;
        break;
      case 'candidate_screened':
        statistics.candidatesScreened = stat.count;
        break;
      case 'interview_scheduled':
        statistics.interviewsScheduled = stat.count;
        break;
      case 'note_added':
        statistics.notesAdded = stat.count;
        break;
      case 'feedback_added':
        statistics.feedbackAdded = stat.count;
        break;
    }
    statistics.total += stat.count;
  });
  
  return statistics;
};

export {
  logActivity,
  getActivityLogs,
  getActivityLogsSummary,
  getActivityStatistics,
};

