import Project from '../models/project.model.js';
import Task from '../models/task.model.js';
import User from '../models/user.model.js';
import Candidate from '../models/candidate.model.js';
import Attendance from '../models/attendance.model.js';
import Meeting from '../models/meeting.model.js';

/**
 * Get admin dashboard overview
 * @returns {Promise<Object>}
 */
const getAdminDashboard = async () => {
  // Get all active projects (not cancelled or completed)
  const activeProjects = await Project.find({
    status: { $nin: ['Cancelled', 'Completed'] },
  })
    .populate('createdBy', 'name email')
    .populate('assignedTo', 'name email')
    .lean();

  // Get all tasks for active projects
  const activeProjectIds = activeProjects.map((p) => p._id);
  const allTasks = await Task.find({
    project: { $in: activeProjectIds },
  })
    .populate('project', 'projectName status priority')
    .populate('assignedTo', 'name email')
    .lean();

  // Calculate project statistics
  const projectStats = {
    total: activeProjects.length,
    byStatus: {
      'Not Started': 0,
      Inprogress: 0,
      'On Hold': 0,
    },
    byPriority: {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    },
  };

  activeProjects.forEach((project) => {
    if (projectStats.byStatus[project.status]) {
      projectStats.byStatus[project.status]++;
    }
    if (projectStats.byPriority[project.priority]) {
      projectStats.byPriority[project.priority]++;
    }
  });

  // Calculate task statistics
  const taskStats = {
    total: allTasks.length,
    byStatus: {
      New: 0,
      Todo: 0,
      'On Going': 0,
      'In Review': 0,
      Completed: 0,
    },
    byPriority: {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    },
    overdue: 0,
    dueSoon: 0, // Due within 7 days
    averageProgress: 0,
  };

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  let totalProgress = 0;
  allTasks.forEach((task) => {
    if (taskStats.byStatus[task.status]) {
      taskStats.byStatus[task.status]++;
    }
    if (taskStats.byPriority[task.priority]) {
      taskStats.byPriority[task.priority]++;
    }

    // Check for overdue tasks
    if (task.dueDate && new Date(task.dueDate) < now && task.status !== 'Completed') {
      taskStats.overdue++;
    }

    // Check for tasks due soon
    if (
      task.dueDate &&
      new Date(task.dueDate) >= now &&
      new Date(task.dueDate) <= sevenDaysFromNow &&
      task.status !== 'Completed'
    ) {
      taskStats.dueSoon++;
    }

    totalProgress += task.progress || 0;
  });

  taskStats.averageProgress =
    allTasks.length > 0 ? Math.round(totalProgress / allTasks.length) : 0;

  // Calculate project progress
  const projectsWithProgress = activeProjects.map((project) => {
    const projectTasks = allTasks.filter(
      (task) => task.project && task.project._id.toString() === project._id.toString()
    );

    let projectProgress = 0;
    if (projectTasks.length > 0) {
      const totalTaskProgress = projectTasks.reduce((sum, task) => sum + (task.progress || 0), 0);
      projectProgress = Math.round(totalTaskProgress / projectTasks.length);
    }

    // Count tasks by status for this project
    const taskCounts = {
      total: projectTasks.length,
      completed: projectTasks.filter((t) => t.status === 'Completed').length,
      inProgress: projectTasks.filter((t) => t.status === 'On Going').length,
      overdue: projectTasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Completed'
      ).length,
    };

    // Calculate days remaining
    let daysRemaining = null;
    if (project.endDate) {
      const endDate = new Date(project.endDate);
      const daysDiff = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      daysRemaining = daysDiff;
    }

    return {
      id: project._id.toString(),
      projectName: project.projectName,
      status: project.status,
      priority: project.priority,
      progress: projectProgress,
      taskCounts,
      daysRemaining,
      startDate: project.startDate,
      endDate: project.endDate,
      projectManager: project.projectManager,
      assignedTo: project.assignedTo || [],
      createdBy: project.createdBy,
    };
  });

  // Identify bottlenecks
  const bottlenecks = {
    overdueTasks: allTasks
      .filter(
        (task) => task.dueDate && new Date(task.dueDate) < now && task.status !== 'Completed'
      )
      .slice(0, 10)
      .map((task) => ({
        id: task._id.toString(),
        taskId: task.taskId,
        title: task.title,
        project: task.project?.projectName || 'Unknown',
        dueDate: task.dueDate,
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo || [],
        daysOverdue: Math.ceil((now - new Date(task.dueDate)) / (1000 * 60 * 60 * 24)),
      })),

    projectsAtRisk: projectsWithProgress
      .filter((project) => {
        // Projects with low progress and approaching deadline
        const isLowProgress = project.progress < 50;
        const isApproachingDeadline = project.daysRemaining !== null && project.daysRemaining < 30;
        const hasOverdueTasks = project.taskCounts.overdue > 0;
        return (isLowProgress && isApproachingDeadline) || hasOverdueTasks;
      })
      .slice(0, 10)
      .map((project) => ({
        id: project.id,
        projectName: project.projectName,
        status: project.status,
        priority: project.priority,
        progress: project.progress,
        daysRemaining: project.daysRemaining,
        overdueTasks: project.taskCounts.overdue,
        totalTasks: project.taskCounts.total,
      })),

    blockedTasks: allTasks
      .filter((task) => task.status === 'In Review' && task.priority === 'Critical')
      .slice(0, 10)
      .map((task) => ({
        id: task._id.toString(),
        taskId: task.taskId,
        title: task.title,
        project: task.project?.projectName || 'Unknown',
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo || [],
      })),

    highPriorityIncomplete: allTasks
      .filter(
        (task) =>
          (task.priority === 'High' || task.priority === 'Critical') &&
          task.status !== 'Completed'
      )
      .slice(0, 10)
      .map((task) => ({
        id: task._id.toString(),
        taskId: task.taskId,
        title: task.title,
        project: task.project?.projectName || 'Unknown',
        status: task.status,
        priority: task.priority,
        progress: task.progress,
        dueDate: task.dueDate,
        assignedTo: task.assignedTo || [],
      })),
  };

  // Get team workload (tasks assigned per user)
  const userWorkload = {};
  allTasks.forEach((task) => {
    if (task.assignedTo && Array.isArray(task.assignedTo)) {
      task.assignedTo.forEach((user) => {
        // Handle both populated user objects and ObjectIds
        const userId = user._id?.toString() || (typeof user === 'object' && user.toString ? user.toString() : String(user));
        const userName = user.name || 'Unknown';
        const userEmail = user.email || '';
        
        if (!userWorkload[userId]) {
          userWorkload[userId] = {
            userId,
            userName,
            userEmail,
            totalTasks: 0,
            completedTasks: 0,
            overdueTasks: 0,
            inProgressTasks: 0,
          };
        }
        userWorkload[userId].totalTasks++;
        if (task.status === 'Completed') {
          userWorkload[userId].completedTasks++;
        }
        if (task.status === 'On Going') {
          userWorkload[userId].inProgressTasks++;
        }
        if (task.dueDate && new Date(task.dueDate) < now && task.status !== 'Completed') {
          userWorkload[userId].overdueTasks++;
        }
      });
    }
  });

  const teamWorkload = Object.values(userWorkload)
    .sort((a, b) => b.totalTasks - a.totalTasks)
    .slice(0, 10);

  // Get candidate statistics
  const candidateStats = await Candidate.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: [{ $eq: ['$isCompleted', true] }, 1, 0] },
        },
        incomplete: {
          $sum: { $cond: [{ $eq: ['$isCompleted', false] }, 1, 0] },
        },
        averageProfileCompletion: {
          $avg: '$isProfileCompleted',
        },
      },
    },
  ]);

  const candidateStatistics = candidateStats[0] || {
    total: 0,
    completed: 0,
    incomplete: 0,
    averageProfileCompletion: 0,
  };

  // Get recent candidates (last 10)
  const recentCandidates = await Candidate.find()
    .populate('owner', 'name email')
    .populate('adminId', 'name email')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean()
    .then((candidates) =>
      candidates.map((c) => ({
        id: c._id.toString(),
        fullName: c.fullName,
        email: c.email,
        profileCompletion: c.isProfileCompleted || 0,
        isCompleted: c.isCompleted || false,
        createdAt: c.createdAt,
        owner: c.owner,
        adminId: c.adminId,
      }))
    );

  // Get attendance statistics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Today's attendance
  const todayAttendance = await Attendance.find({
    date: { $gte: today, $lt: tomorrow },
  })
    .populate('candidate', 'fullName email')
    .lean();

  // Active punches (punch in but no punch out)
  const activePunches = await Attendance.find({
    punchOut: null,
    isActive: true,
  })
    .populate('candidate', 'fullName email')
    .sort({ punchIn: -1 })
    .limit(10)
    .lean();

  // Weekly attendance (last 7 days)
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const weeklyAttendance = await Attendance.aggregate([
    {
      $match: {
        date: { $gte: sevenDaysAgo, $lt: tomorrow },
      },
    },
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        totalHours: {
          $sum: {
            $divide: [{ $ifNull: ['$duration', 0] }, 3600000],
          },
        },
        averageHoursPerDay: {
          $avg: {
            $divide: [{ $ifNull: ['$duration', 0] }, 3600000],
          },
        },
        completedRecords: {
          $sum: { $cond: [{ $ne: ['$punchOut', null] }, 1, 0] },
        },
      },
    },
  ]);

  const weeklyStats = weeklyAttendance[0] || {
    totalRecords: 0,
    totalHours: 0,
    averageHoursPerDay: 0,
    completedRecords: 0,
  };

  // Monthly attendance (current month)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

  const monthlyAttendance = await Attendance.aggregate([
    {
      $match: {
        date: { $gte: monthStart, $lte: monthEnd },
      },
    },
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        totalHours: {
          $sum: {
            $divide: [{ $ifNull: ['$duration', 0] }, 3600000],
          },
        },
        averageHoursPerDay: {
          $avg: {
            $divide: [{ $ifNull: ['$duration', 0] }, 3600000],
          },
        },
        uniqueCandidates: { $addToSet: '$candidate' },
      },
    },
  ]);

  const monthlyStats = monthlyAttendance[0] || {
    totalRecords: 0,
    totalHours: 0,
    averageHoursPerDay: 0,
    uniqueCandidates: [],
  };

  // Get upcoming meetings (next 7 days)
  const upcomingMeetings = await Meeting.find({
    status: { $in: ['scheduled', 'active'] },
    scheduledAt: { $gte: now, $lte: sevenDaysFromNow },
  })
    .populate('createdBy', 'name email')
    .sort({ scheduledAt: 1 })
    .limit(10)
    .lean()
    .then((meetings) =>
      meetings.map((m) => ({
        id: m._id.toString(),
        meetingId: m.meetingId,
        title: m.title,
        description: m.description,
        scheduledAt: m.scheduledAt,
        duration: m.duration,
        status: m.status,
        currentParticipants: m.currentParticipants || 0,
        maxParticipants: m.maxParticipants || 50,
        createdBy: m.createdBy,
        meetingUrl: m.meetingUrl,
      }))
    );

  // Get active meetings
  const activeMeetings = await Meeting.find({
    status: 'active',
  })
    .populate('createdBy', 'name email')
    .sort({ startedAt: -1 })
    .limit(10)
    .lean()
    .then((meetings) =>
      meetings.map((m) => ({
        id: m._id.toString(),
        meetingId: m.meetingId,
        title: m.title,
        description: m.description,
        startedAt: m.startedAt,
        duration: m.duration,
        status: m.status,
        currentParticipants: m.currentParticipants || 0,
        maxParticipants: m.maxParticipants || 50,
        createdBy: m.createdBy,
        meetingUrl: m.meetingUrl,
      }))
    );

  // Get meeting statistics
  const meetingStats = await Meeting.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const meetingStatistics = {
    scheduled: 0,
    active: 0,
    ended: 0,
    cancelled: 0,
    total: 0,
  };

  meetingStats.forEach((stat) => {
    if (meetingStatistics.hasOwnProperty(stat._id)) {
      meetingStatistics[stat._id] = stat.count;
    }
    meetingStatistics.total += stat.count;
  });

  // Get user statistics
  const userStats = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
      },
    },
  ]);

  const userStatistics = {
    total: 0,
    admin: 0,
    user: 0,
  };

  userStats.forEach((stat) => {
    if (stat._id === 'admin') {
      userStatistics.admin = stat.count;
    } else if (stat._id === 'user') {
      userStatistics.user = stat.count;
    }
    userStatistics.total += stat.count;
  });

  return {
    summary: {
      activeProjects: projectStats.total,
      totalTasks: taskStats.total,
      completedTasks: taskStats.byStatus.Completed,
      overdueTasks: taskStats.overdue,
      tasksDueSoon: taskStats.dueSoon,
      averageTaskProgress: taskStats.averageProgress,
      totalCandidates: candidateStatistics.total,
      completedProfiles: candidateStatistics.completed,
      activeMeetings: meetingStatistics.active,
      upcomingMeetings: upcomingMeetings.length,
      todayAttendance: todayAttendance.length,
      activePunches: activePunches.length,
    },
    projectStatistics: projectStats,
    taskStatistics: taskStats,
    candidateStatistics: {
      total: candidateStatistics.total,
      completed: candidateStatistics.completed,
      incomplete: candidateStatistics.incomplete,
      averageProfileCompletion: Math.round(candidateStatistics.averageProfileCompletion || 0),
    },
    attendanceStatistics: {
      today: {
        totalRecords: todayAttendance.length,
        activePunches: activePunches.length,
      },
      weekly: {
        totalRecords: weeklyStats.totalRecords,
        totalHours: Math.round(weeklyStats.totalHours * 100) / 100,
        averageHoursPerDay: Math.round(weeklyStats.averageHoursPerDay * 100) / 100,
        completedRecords: weeklyStats.completedRecords,
      },
      monthly: {
        totalRecords: monthlyStats.totalRecords,
        totalHours: Math.round(monthlyStats.totalHours * 100) / 100,
        averageHoursPerDay: Math.round(monthlyStats.averageHoursPerDay * 100) / 100,
        uniqueCandidates: monthlyStats.uniqueCandidates?.length || 0,
      },
    },
    meetingStatistics,
    userStatistics,
    projects: projectsWithProgress.sort((a, b) => {
      // Sort by priority (Critical > High > Medium > Low) then by progress
      const priorityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return b.progress - a.progress;
    }),
    bottlenecks,
    teamWorkload,
    recentCandidates,
    todayAttendance: todayAttendance.map((a) => ({
      id: a._id.toString(),
      candidate: a.candidate,
      date: a.date,
      punchIn: a.punchIn,
      punchOut: a.punchOut,
      duration: a.duration,
      isActive: a.isActive,
    })),
    activePunches: activePunches.map((a) => ({
      id: a._id.toString(),
      candidate: a.candidate,
      date: a.date,
      punchIn: a.punchIn,
      duration: a.duration,
    })),
    upcomingMeetings,
    activeMeetings,
  };
};

export { getAdminDashboard };

