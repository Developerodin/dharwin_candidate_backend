# Admin Dashboard API Documentation

## Base URL
```
/v1/dashboard
```

All endpoints require authentication and admin role. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Get Admin Dashboard Overview

**Endpoint:** `GET /v1/dashboard`

**Description:** Get comprehensive overview of all active projects, progress tracking, and bottleneck identification. This endpoint is only accessible to admin users.

**Authentication:** Required (Admin only)

**Response (200 OK):**
```json
{
  "summary": {
    "activeProjects": 15,
    "totalTasks": 142,
    "completedTasks": 45,
    "overdueTasks": 8,
    "tasksDueSoon": 12,
    "averageTaskProgress": 65,
    "totalCandidates": 25,
    "completedProfiles": 18,
    "activeMeetings": 2,
    "upcomingMeetings": 5,
    "todayAttendance": 12,
    "activePunches": 3
  },
  "projectStatistics": {
    "total": 15,
    "byStatus": {
      "Not Started": 2,
      "Inprogress": 11,
      "On Hold": 2
    },
    "byPriority": {
      "Low": 3,
      "Medium": 5,
      "High": 6,
      "Critical": 1
    }
  },
  "taskStatistics": {
    "total": 142,
    "byStatus": {
      "New": 25,
      "Todo": 30,
      "On Going": 35,
      "In Review": 7,
      "Completed": 45
    },
    "byPriority": {
      "Low": 20,
      "Medium": 50,
      "High": 60,
      "Critical": 12
    },
    "overdue": 8,
    "dueSoon": 12,
    "averageProgress": 65
  },
  "projects": [
    {
      "id": "507f1f77bcf86cd799439014",
      "projectName": "Website Redesign Project",
      "status": "Inprogress",
      "priority": "High",
      "progress": 72,
      "taskCounts": {
        "total": 25,
        "completed": 18,
        "inProgress": 5,
        "overdue": 2
      },
      "daysRemaining": 15,
      "startDate": "2025-11-05T00:00:00.000Z",
      "endDate": "2025-11-20T00:00:00.000Z",
      "projectManager": "John Doe",
      "assignedTo": [
        {
          "id": "507f1f77bcf86cd799439011",
          "name": "Angelina May",
          "email": "angelina@example.com"
        }
      ],
      "createdBy": {
        "id": "507f1f77bcf86cd799439010",
        "name": "Admin Administrator",
        "email": "admin@example.com"
      }
    }
  ],
  "bottlenecks": {
    "overdueTasks": [
      {
        "id": "507f1f77bcf86cd799439020",
        "taskId": "SPK-123",
        "title": "Update ynex new project design",
        "project": "Website Redesign Project",
        "dueDate": "2025-11-10T00:00:00.000Z",
        "status": "On Going",
        "priority": "High",
        "assignedTo": [
          {
            "id": "507f1f77bcf86cd799439011",
            "name": "Angelina May",
            "email": "angelina@example.com"
          }
        ],
        "daysOverdue": 5
      }
    ],
    "projectsAtRisk": [
      {
        "id": "507f1f77bcf86cd799439014",
        "projectName": "Website Redesign Project",
        "status": "Inprogress",
        "priority": "High",
        "progress": 45,
        "daysRemaining": 10,
        "overdueTasks": 3,
        "totalTasks": 25
      }
    ],
    "blockedTasks": [
      {
        "id": "507f1f77bcf86cd799439025",
        "taskId": "SPK-128",
        "title": "Critical security review",
        "project": "Website Redesign Project",
        "status": "In Review",
        "priority": "Critical",
        "assignedTo": [
          {
            "id": "507f1f77bcf86cd799439012",
            "name": "Alex Carey",
            "email": "alex@example.com"
          }
        ]
      }
    ],
    "highPriorityIncomplete": [
      {
        "id": "507f1f77bcf86cd799439020",
        "taskId": "SPK-123",
        "title": "Update ynex new project design",
        "project": "Website Redesign Project",
        "status": "On Going",
        "priority": "High",
        "progress": 70,
        "dueDate": "2025-11-15T00:00:00.000Z",
        "assignedTo": [
          {
            "id": "507f1f77bcf86cd799439011",
            "name": "Angelina May",
            "email": "angelina@example.com"
          }
        ]
      }
    ]
  },
  "teamWorkload": [
    {
      "userId": "507f1f77bcf86cd799439011",
      "userName": "Angelina May",
      "userEmail": "angelina@example.com",
      "totalTasks": 15,
      "completedTasks": 8,
      "overdueTasks": 2,
      "inProgressTasks": 5
    },
    {
      "userId": "507f1f77bcf86cd799439012",
      "userName": "Alex Carey",
      "userEmail": "alex@example.com",
      "totalTasks": 12,
      "completedTasks": 6,
      "overdueTasks": 1,
      "inProgressTasks": 4
    }
  ]
}
```

**Error Response (403 Forbidden - Non-admin user):**
```json
{
  "code": 403,
  "message": "Forbidden: Admin access required"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "code": 401,
  "message": "Please authenticate"
}
```

---

## Response Fields Description

### Summary
- `activeProjects` (number) - Total number of active projects (excluding Cancelled and Completed)
- `totalTasks` (number) - Total number of tasks across all active projects
- `completedTasks` (number) - Number of completed tasks
- `overdueTasks` (number) - Number of tasks past their due date
- `tasksDueSoon` (number) - Number of tasks due within 7 days
- `averageTaskProgress` (number) - Average progress percentage across all tasks (0-100)
- `totalCandidates` (number) - Total number of candidates
- `completedProfiles` (number) - Number of candidates with completed profiles
- `activeMeetings` (number) - Number of currently active meetings
- `upcomingMeetings` (number) - Number of meetings scheduled in the next 7 days
- `todayAttendance` (number) - Number of attendance records for today
- `activePunches` (number) - Number of active punch-ins (not yet punched out)

### Project Statistics
- `total` (number) - Total active projects
- `byStatus` (object) - Count of projects by status (Not Started, Inprogress, On Hold)
- `byPriority` (object) - Count of projects by priority (Low, Medium, High, Critical)

### Task Statistics
- `total` (number) - Total tasks
- `byStatus` (object) - Count of tasks by status (New, Todo, On Going, In Review, Completed)
- `byPriority` (object) - Count of tasks by priority (Low, Medium, High, Critical)
- `overdue` (number) - Number of overdue tasks
- `dueSoon` (number) - Number of tasks due within 7 days
- `averageProgress` (number) - Average progress percentage

### Projects Array
Each project object contains:
- `id` (string) - Project ID
- `projectName` (string) - Project name
- `status` (string) - Project status
- `priority` (string) - Project priority
- `progress` (number) - Average progress of all tasks in the project (0-100)
- `taskCounts` (object) - Task statistics for the project:
  - `total` (number) - Total tasks
  - `completed` (number) - Completed tasks
  - `inProgress` (number) - Tasks in progress
  - `overdue` (number) - Overdue tasks
- `daysRemaining` (number|null) - Days until project end date (null if no end date)
- `startDate` (Date|null) - Project start date
- `endDate` (Date|null) - Project end date
- `projectManager` (string|null) - Project manager name
- `assignedTo` (array) - Array of assigned users
- `createdBy` (object) - Project creator information

### Bottlenecks
Identifies potential issues and areas needing attention:

#### Overdue Tasks
Tasks that are past their due date and not completed. Limited to top 10.

#### Projects at Risk
Projects that meet any of these criteria:
- Low progress (< 50%) and approaching deadline (< 30 days remaining)
- Has overdue tasks
Limited to top 10.

#### Blocked Tasks
Critical priority tasks stuck in "In Review" status. Limited to top 10.

#### High Priority Incomplete
High or Critical priority tasks that are not completed. Limited to top 10.

### Team Workload
Shows task distribution across team members:
- `userId` (string) - User ID
- `userName` (string) - User name
- `userEmail` (string) - User email
- `totalTasks` (number) - Total tasks assigned
- `completedTasks` (number) - Completed tasks
- `overdueTasks` (number) - Overdue tasks
- `inProgressTasks` (number) - Tasks in progress

Sorted by total tasks (descending), limited to top 10.

### Candidate Statistics
- `total` (number) - Total number of candidates
- `completed` (number) - Number of candidates with completed profiles
- `incomplete` (number) - Number of candidates with incomplete profiles
- `averageProfileCompletion` (number) - Average profile completion percentage (0-100)

### Recent Candidates
Array of the 10 most recently created candidates, each containing:
- `id` (string) - Candidate ID
- `fullName` (string) - Candidate full name
- `email` (string) - Candidate email
- `profileCompletion` (number) - Profile completion percentage (0-100)
- `isCompleted` (boolean) - Whether profile is marked as completed
- `createdAt` (Date) - Creation timestamp
- `owner` (object) - Owner user information
- `adminId` (object) - Admin user information

### Attendance Statistics

#### Today
- `totalRecords` (number) - Total attendance records for today
- `activePunches` (number) - Number of active punch-ins (not yet punched out)

#### Weekly (Last 7 Days)
- `totalRecords` (number) - Total attendance records
- `totalHours` (number) - Total hours worked (rounded to 2 decimals)
- `averageHoursPerDay` (number) - Average hours per day (rounded to 2 decimals)
- `completedRecords` (number) - Records with both punch-in and punch-out

#### Monthly (Current Month)
- `totalRecords` (number) - Total attendance records for the month
- `totalHours` (number) - Total hours worked (rounded to 2 decimals)
- `averageHoursPerDay` (number) - Average hours per day (rounded to 2 decimals)
- `uniqueCandidates` (number) - Number of unique candidates with attendance records

### Today's Attendance
Array of all attendance records for today, each containing:
- `id` (string) - Attendance record ID
- `candidate` (object) - Candidate information (fullName, email)
- `date` (Date) - Attendance date
- `punchIn` (Date) - Punch-in timestamp
- `punchOut` (Date|null) - Punch-out timestamp (null if still active)
- `duration` (number) - Duration in milliseconds
- `isActive` (boolean) - Whether the punch is still active

### Active Punches
Array of active punch-ins (top 10), each containing:
- `id` (string) - Attendance record ID
- `candidate` (object) - Candidate information (fullName, email)
- `date` (Date) - Attendance date
- `punchIn` (Date) - Punch-in timestamp
- `duration` (number) - Current duration in milliseconds

### Meeting Statistics
- `scheduled` (number) - Number of scheduled meetings
- `active` (number) - Number of currently active meetings
- `ended` (number) - Number of ended meetings
- `cancelled` (number) - Number of cancelled meetings
- `total` (number) - Total number of meetings

### Upcoming Meetings
Array of meetings scheduled in the next 7 days (up to 10), each containing:
- `id` (string) - Meeting ID
- `meetingId` (string) - Unique meeting identifier
- `title` (string) - Meeting title
- `description` (string) - Meeting description
- `scheduledAt` (Date) - Scheduled start time
- `duration` (number) - Meeting duration in minutes
- `status` (string) - Meeting status (scheduled or active)
- `currentParticipants` (number) - Current number of participants
- `maxParticipants` (number) - Maximum allowed participants
- `createdBy` (object) - Meeting creator information
- `meetingUrl` (string) - Meeting URL for joining

### Active Meetings
Array of currently active meetings (up to 10), each containing:
- `id` (string) - Meeting ID
- `meetingId` (string) - Unique meeting identifier
- `title` (string) - Meeting title
- `description` (string) - Meeting description
- `startedAt` (Date) - Meeting start time
- `duration` (number) - Meeting duration in minutes
- `status` (string) - Meeting status (active)
- `currentParticipants` (number) - Current number of participants
- `maxParticipants` (number) - Maximum allowed participants
- `createdBy` (object) - Meeting creator information
- `meetingUrl` (string) - Meeting URL for joining

### User Statistics
- `total` (number) - Total number of users
- `admin` (number) - Number of admin users
- `user` (number) - Number of regular users

---

## Example cURL Command

```bash
curl -X GET http://localhost:3000/v1/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Notes

- Only admin users can access this endpoint
- The dashboard only includes active projects (status not "Cancelled" or "Completed")
- Project progress is calculated as the average of all task progress percentages within that project
- Tasks due within 7 days are considered "due soon"
- Bottlenecks are limited to top 10 items each for performance
- Team workload is limited to top 10 users by total task count
- Projects are sorted by priority (Critical > High > Medium > Low) then by progress (descending)
- Recent candidates are limited to the 10 most recently created
- Today's attendance includes all records for the current day
- Active punches show candidates who have punched in but not yet punched out
- Weekly attendance statistics cover the last 7 days
- Monthly attendance statistics cover the current calendar month
- Upcoming meetings are scheduled within the next 7 days and limited to 10
- Active meetings are currently in progress and limited to 10
- Attendance hours are calculated from duration in milliseconds and rounded to 2 decimal places

