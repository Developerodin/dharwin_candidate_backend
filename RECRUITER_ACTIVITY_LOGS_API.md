# Recruiter Activity Logs API Documentation (Admin)

## Overview
This API allows admins to view and analyze recruiter activity logs. Activities are automatically logged when recruiters perform actions such as creating job postings, screening candidates, scheduling interviews, adding notes, and adding feedback.

## Base URL
```
/v1/recruiter-activities
```

## Authentication
All endpoints require authentication and admin role. Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

**Note:** All endpoints are **Admin only** - recruiters cannot access these endpoints.

---

## Get Activity Logs

**GET** `/v1/recruiter-activities/logs`

Get detailed activity logs with filtering and pagination options.

**Authorization:** Admin only

**Query Parameters:**
- `recruiterId` (string, optional) - Filter by specific recruiter ID
- `activityType` (string, optional) - Filter by activity type:
  - `job_posting_created`
  - `candidate_screened`
  - `interview_scheduled`
  - `note_added`
  - `feedback_added`
- `startDate` (date, optional) - Filter logs from this date (ISO format: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss.sssZ`)
- `endDate` (date, optional) - Filter logs until this date (ISO format)
- `jobId` (string, optional) - Filter by specific job ID
- `candidateId` (string, optional) - Filter by specific candidate ID
- `sortBy` (string, optional) - Sort field and order (default: `createdAt:desc`)
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Results per page (default: 10)

**Example Request:**
```
GET /v1/recruiter-activities/logs?recruiterId=69281cc833d819cb5bdb2758&activityType=interview_scheduled&startDate=2024-01-01&page=1&limit=20
```

**Response:** `200 OK`
```json
{
  "results": [
    {
      "id": "activity_log_id",
      "recruiter": {
        "id": "recruiter_id",
        "name": "John Recruiter",
        "email": "john@example.com",
        "role": "recruiter"
      },
      "recruiterName": "John Recruiter",
      "recruiterEmail": "john@example.com",
      "activityType": "interview_scheduled",
      "description": "Scheduled interview: Technical Interview",
      "job": {
        "id": "job_id",
        "title": "Senior Software Engineer",
        "organisation": {
          "name": "Tech Corp"
        },
        "status": "Active"
      },
      "candidate": {
        "id": "candidate_id",
        "fullName": "Jane Smith",
        "email": "jane@example.com"
      },
      "candidateName": "Jane Smith",
      "candidateEmail": "jane@example.com",
      "meeting": {
        "id": "meeting_id",
        "title": "Technical Interview",
        "scheduledAt": "2024-01-20T10:00:00.000Z",
        "status": "scheduled"
      },
      "metadata": {
        "title": "Technical Interview",
        "scheduledAt": "2024-01-20T10:00:00.000Z",
        "duration": 60
      },
      "createdAt": "2024-01-15T09:30:00.000Z",
      "updatedAt": "2024-01-15T09:30:00.000Z"
    },
    {
      "id": "activity_log_id_2",
      "recruiter": {
        "id": "recruiter_id",
        "name": "John Recruiter",
        "email": "john@example.com",
        "role": "recruiter"
      },
      "recruiterName": "John Recruiter",
      "recruiterEmail": "john@example.com",
      "activityType": "job_posting_created",
      "description": "Created job posting: Senior Software Engineer",
      "job": {
        "id": "job_id",
        "title": "Senior Software Engineer",
        "organisation": {
          "name": "Tech Corp"
        },
        "status": "Active"
      },
      "candidate": null,
      "candidateName": null,
      "candidateEmail": null,
      "meeting": null,
      "metadata": {
        "jobTitle": "Senior Software Engineer",
        "organisation": "Tech Corp",
        "status": "Active"
      },
      "createdAt": "2024-01-14T10:00:00.000Z",
      "updatedAt": "2024-01-14T10:00:00.000Z"
    },
    {
      "id": "activity_log_id_3",
      "recruiter": {
        "id": "recruiter_id",
        "name": "John Recruiter",
        "email": "john@example.com",
        "role": "recruiter"
      },
      "recruiterName": "John Recruiter",
      "recruiterEmail": "john@example.com",
      "activityType": "candidate_screened",
      "description": "Screened candidate: Jane Smith",
      "job": null,
      "candidate": {
        "id": "candidate_id",
        "fullName": "Jane Smith",
        "email": "jane@example.com"
      },
      "candidateName": "Jane Smith",
      "candidateEmail": "jane@example.com",
      "meeting": null,
      "metadata": {
        "candidateName": "Jane Smith"
      },
      "createdAt": "2024-01-13T14:00:00.000Z",
      "updatedAt": "2024-01-13T14:00:00.000Z"
    },
    {
      "id": "activity_log_id_4",
      "recruiter": {
        "id": "recruiter_id",
        "name": "John Recruiter",
        "email": "john@example.com",
        "role": "recruiter"
      },
      "recruiterName": "John Recruiter",
      "recruiterEmail": "john@example.com",
      "activityType": "note_added",
      "description": "Added note to candidate: Jane Smith",
      "job": null,
      "candidate": {
        "id": "candidate_id",
        "fullName": "Jane Smith",
        "email": "jane@example.com"
      },
      "candidateName": "Jane Smith",
      "candidateEmail": "jane@example.com",
      "meeting": null,
      "metadata": {
        "candidateName": "Jane Smith",
        "noteLength": 45
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "activity_log_id_5",
      "recruiter": {
        "id": "recruiter_id",
        "name": "John Recruiter",
        "email": "john@example.com",
        "role": "recruiter"
      },
      "recruiterName": "John Recruiter",
      "recruiterEmail": "john@example.com",
      "activityType": "feedback_added",
      "description": "Added feedback to candidate: Jane Smith",
      "job": null,
      "candidate": {
        "id": "candidate_id",
        "fullName": "Jane Smith",
        "email": "jane@example.com"
      },
      "candidateName": "Jane Smith",
      "candidateEmail": "jane@example.com",
      "meeting": null,
      "metadata": {
        "candidateName": "Jane Smith",
        "rating": 5
      },
      "createdAt": "2024-01-16T15:00:00.000Z",
      "updatedAt": "2024-01-16T15:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "totalPages": 5,
  "totalResults": 95
}
```

---

## Get Activity Logs Summary

**GET** `/v1/recruiter-activities/logs/summary`

Get a summary of activities grouped by recruiter. This provides an overview of each recruiter's activity counts.

**Authorization:** Admin only

**Query Parameters:**
- `recruiterId` (string, optional) - Filter by specific recruiter ID
- `startDate` (date, optional) - Filter from this date (ISO format)
- `endDate` (date, optional) - Filter until this date (ISO format)

**Example Request:**
```
GET /v1/recruiter-activities/logs/summary?startDate=2024-01-01&endDate=2024-01-31
```

**Response:** `200 OK`
```json
[
  {
    "_id": "recruiter_id_1",
    "recruiter": {
      "id": "recruiter_id_1",
      "name": "John Recruiter",
      "email": "john@example.com",
      "role": "recruiter"
    },
    "activities": [
      {
        "activityType": "job_posting_created",
        "count": 15
      },
      {
        "activityType": "candidate_screened",
        "count": 42
      },
      {
        "activityType": "interview_scheduled",
        "count": 28
      },
      {
        "activityType": "note_added",
        "count": 35
      },
      {
        "activityType": "feedback_added",
        "count": 12
      }
    ],
    "totalActivities": 132
  },
  {
    "_id": "recruiter_id_2",
    "recruiter": {
      "id": "recruiter_id_2",
      "name": "Jane Recruiter",
      "email": "jane@example.com",
      "role": "recruiter"
    },
    "activities": [
      {
        "activityType": "job_posting_created",
        "count": 8
      },
      {
        "activityType": "candidate_screened",
        "count": 25
      },
      {
        "activityType": "interview_scheduled",
        "count": 18
      },
      {
        "activityType": "note_added",
        "count": 22
      },
      {
        "activityType": "feedback_added",
        "count": 8
      }
    ],
    "totalActivities": 81
  }
]
```

---

## Get Activity Statistics

**GET** `/v1/recruiter-activities/logs/statistics`

Get overall activity statistics across all recruiters or for a specific recruiter.

**Authorization:** Admin only

**Query Parameters:**
- `recruiterId` (string, optional) - Filter by specific recruiter ID
- `startDate` (date, optional) - Filter from this date (ISO format)
- `endDate` (date, optional) - Filter until this date (ISO format)

**Example Request:**
```
GET /v1/recruiter-activities/logs/statistics?startDate=2024-01-01&endDate=2024-01-31
```

**Response:** `200 OK`
```json
{
  "jobPostingsCreated": 45,
  "candidatesScreened": 120,
  "interviewsScheduled": 85,
  "notesAdded": 150,
  "feedbackAdded": 35,
  "total": 435
}
```

**Example Request (Specific Recruiter):**
```
GET /v1/recruiter-activities/logs/statistics?recruiterId=69281cc833d819cb5bdb2758&startDate=2024-01-01&endDate=2024-01-31
```

**Response:** `200 OK`
```json
{
  "jobPostingsCreated": 15,
  "candidatesScreened": 42,
  "interviewsScheduled": 28,
  "notesAdded": 35,
  "feedbackAdded": 12,
  "total": 132
}
```

---

## Activity Types

### 1. Job Posting Created
**Triggered when:** A recruiter creates a job posting

**Activity Type:** `job_posting_created`

**Metadata includes:**
- `jobTitle` - The job title
- `organisation` - Organisation name
- `status` - Job status

**Example:**
```json
{
  "activityType": "job_posting_created",
  "description": "Created job posting: Senior Software Engineer",
  "job": {
    "id": "job_id",
    "title": "Senior Software Engineer",
    "organisation": {
      "name": "Tech Corp"
    }
  },
  "metadata": {
    "jobTitle": "Senior Software Engineer",
    "organisation": "Tech Corp",
    "status": "Active"
  }
}
```

### 2. Candidate Screened
**Triggered when:** A recruiter adds their first note to a candidate (indicating initial screening)

**Activity Type:** `candidate_screened`

**Metadata includes:**
- `candidateName` - The candidate's full name

**Example:**
```json
{
  "activityType": "candidate_screened",
  "description": "Screened candidate: Jane Smith",
  "recruiter": {
    "id": "recruiter_id",
    "name": "John Recruiter",
    "email": "john@example.com",
    "role": "recruiter"
  },
  "recruiterName": "John Recruiter",
  "recruiterEmail": "john@example.com",
  "candidate": {
    "id": "candidate_id",
    "fullName": "Jane Smith",
    "email": "jane@example.com"
  },
  "candidateName": "Jane Smith",
  "candidateEmail": "jane@example.com",
  "metadata": {
    "candidateName": "Jane Smith"
  }
}
```

### 3. Interview Scheduled
**Triggered when:** A recruiter creates a meeting with a scheduled date

**Activity Type:** `interview_scheduled`

**Metadata includes:**
- `title` - Meeting title
- `scheduledAt` - Scheduled date/time
- `duration` - Meeting duration in minutes

**Example:**
```json
{
  "activityType": "interview_scheduled",
  "description": "Scheduled interview: Technical Interview",
  "recruiter": {
    "id": "recruiter_id",
    "name": "John Recruiter",
    "email": "john@example.com",
    "role": "recruiter"
  },
  "recruiterName": "John Recruiter",
  "recruiterEmail": "john@example.com",
  "meeting": {
    "id": "meeting_id",
    "title": "Technical Interview",
    "scheduledAt": "2024-01-20T10:00:00.000Z",
    "status": "scheduled"
  },
  "candidate": {
    "id": "candidate_id",
    "fullName": "Jane Smith",
    "email": "jane@example.com"
  },
  "candidateName": "Jane Smith",
  "candidateEmail": "jane@example.com",
  "metadata": {
    "title": "Technical Interview",
    "scheduledAt": "2024-01-20T10:00:00.000Z",
    "duration": 60
  }
}
```

### 4. Note Added
**Triggered when:** A recruiter adds a note to a candidate

**Activity Type:** `note_added`

**Metadata includes:**
- `candidateName` - The candidate's full name
- `noteLength` - Length of the note in characters

**Example:**
```json
{
  "activityType": "note_added",
  "description": "Added note to candidate: Jane Smith",
  "recruiter": {
    "id": "recruiter_id",
    "name": "John Recruiter",
    "email": "john@example.com",
    "role": "recruiter"
  },
  "recruiterName": "John Recruiter",
  "recruiterEmail": "john@example.com",
  "candidate": {
    "id": "candidate_id",
    "fullName": "Jane Smith",
    "email": "jane@example.com"
  },
  "candidateName": "Jane Smith",
  "candidateEmail": "jane@example.com",
  "metadata": {
    "candidateName": "Jane Smith",
    "noteLength": 45
  }
}
```

### 5. Feedback Added
**Triggered when:** A recruiter adds feedback to a candidate

**Activity Type:** `feedback_added`

**Metadata includes:**
- `candidateName` - The candidate's full name
- `rating` - The rating (1-5) if provided

**Example:**
```json
{
  "activityType": "feedback_added",
  "description": "Added feedback to candidate: Jane Smith",
  "recruiter": {
    "id": "recruiter_id",
    "name": "John Recruiter",
    "email": "john@example.com",
    "role": "recruiter"
  },
  "recruiterName": "John Recruiter",
  "recruiterEmail": "john@example.com",
  "candidate": {
    "id": "candidate_id",
    "fullName": "Jane Smith",
    "email": "jane@example.com"
  },
  "candidateName": "Jane Smith",
  "candidateEmail": "jane@example.com",
  "metadata": {
    "candidateName": "Jane Smith",
    "rating": 5
  }
}
```

---

## Automatic Activity Logging

Activities are automatically logged when recruiters perform the following actions:

1. **Job Posting Created**: When a recruiter creates a job posting via `POST /v1/jobs`
2. **Interview Scheduled**: When a recruiter creates a meeting with a scheduled date via `POST /v1/meetings`
3. **Candidate Screened**: When a recruiter adds their first note to a candidate via `POST /v1/candidates/:candidateId/notes`
4. **Note Added**: When a recruiter adds a note to a candidate via `POST /v1/candidates/:candidateId/notes`
5. **Feedback Added**: When a recruiter adds feedback to a candidate via `POST /v1/candidates/:candidateId/feedback`

**Note:** Activities are only logged for users with the `recruiter` role. Admin actions are not logged unless the admin is also acting as a recruiter.

---

## Error Responses

### 401 Unauthorized
```json
{
  "code": 401,
  "message": "Please authenticate"
}
```

### 403 Forbidden
```json
{
  "code": 403,
  "message": "Forbidden: Admin access required"
}
```

### 400 Bad Request
```json
{
  "code": 400,
  "message": "Validation error message"
}
```

---

## Use Cases

### 1. View All Recruiter Activities
```bash
GET /v1/recruiter-activities/logs?page=1&limit=50
```

### 2. View Activities for Specific Recruiter
```bash
GET /v1/recruiter-activities/logs?recruiterId=69281cc833d819cb5bdb2758
```

### 3. View Activities by Type
```bash
GET /v1/recruiter-activities/logs?activityType=interview_scheduled
```

### 4. View Activities in Date Range
```bash
GET /v1/recruiter-activities/logs?startDate=2024-01-01&endDate=2024-01-31
```

### 5. View Activities for Specific Job
```bash
GET /v1/recruiter-activities/logs?jobId=job_id
```

### 6. View Activities for Specific Candidate
```bash
GET /v1/recruiter-activities/logs?candidateId=candidate_id
```

### 7. Get Summary of All Recruiters
```bash
GET /v1/recruiter-activities/logs/summary?startDate=2024-01-01&endDate=2024-01-31
```

### 8. Get Overall Statistics
```bash
GET /v1/recruiter-activities/logs/statistics?startDate=2024-01-01&endDate=2024-01-31
```

---

## Frontend Implementation Examples

### React/TypeScript Example

```typescript
// Get activity logs
const getActivityLogs = async (filters: {
  recruiterId?: string;
  activityType?: string;
  startDate?: string;
  endDate?: string;
  jobId?: string;
  candidateId?: string;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  
  if (filters.recruiterId) params.append('recruiterId', filters.recruiterId);
  if (filters.activityType) params.append('activityType', filters.activityType);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.jobId) params.append('jobId', filters.jobId);
  if (filters.candidateId) params.append('candidateId', filters.candidateId);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  
  const response = await fetch(`/v1/recruiter-activities/logs?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch activity logs');
  }
  
  return response.json();
};

// Get activity summary
const getActivitySummary = async (filters: {
  recruiterId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const params = new URLSearchParams();
  
  if (filters.recruiterId) params.append('recruiterId', filters.recruiterId);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  
  const response = await fetch(`/v1/recruiter-activities/logs/summary?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch activity summary');
  }
  
  return response.json();
};

// Get activity statistics
const getActivityStatistics = async (filters: {
  recruiterId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const params = new URLSearchParams();
  
  if (filters.recruiterId) params.append('recruiterId', filters.recruiterId);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  
  const response = await fetch(`/v1/recruiter-activities/logs/statistics?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch activity statistics');
  }
  
  return response.json();
};
```

### Displaying Activity Logs

```typescript
interface ActivityLog {
  id: string;
  recruiter: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  activityType: string;
  description: string;
  job?: {
    id: string;
    title: string;
    organisation: {
      name: string;
    };
  };
  candidate?: {
    id: string;
    fullName: string;
    email: string;
  };
  meeting?: {
    id: string;
    title: string;
    scheduledAt: string;
  };
  metadata?: any;
  createdAt: string;
}

const ActivityLogsList = ({ logs }: { logs: ActivityLog[] }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'job_posting_created':
        return '📝';
      case 'candidate_screened':
        return '👤';
      case 'interview_scheduled':
        return '📅';
      case 'note_added':
        return '📋';
      case 'feedback_added':
        return '⭐';
      default:
        return '📌';
    }
  };
  
  return (
    <div className="activity-logs">
      {logs.map((log) => (
        <div key={log.id} className="activity-log-item">
          <div className="activity-icon">{getActivityIcon(log.activityType)}</div>
          <div className="activity-content">
            <div className="activity-header">
              <span className="recruiter-name">{log.recruiterName || log.recruiter?.name}</span>
              <span className="activity-type">{log.activityType.replace(/_/g, ' ')}</span>
              <span className="activity-date">
                {new Date(log.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="activity-description">{log.description}</div>
            {log.job && (
              <div className="activity-reference">
                Job: {log.job.title} at {log.job.organisation.name}
              </div>
            )}
            {log.candidateName && (
              <div className="activity-reference">
                Candidate: {log.candidateName} ({log.candidateEmail})
              </div>
            )}
            {log.meeting && (
              <div className="activity-reference">
                Interview: {log.meeting.title} on {new Date(log.meeting.scheduledAt).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- All IDs are MongoDB ObjectIds
- Activities are automatically logged - no manual logging required
- Only recruiter actions are logged (not admin actions unless admin is acting as recruiter)
- Activities are stored permanently for historical tracking
- Pagination defaults: page=1, limit=10
- Date filters should be in ISO format: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ss.sssZ`
- All related entities (job, candidate, meeting) are automatically populated with relevant information
- **New Fields**: Each activity log now includes `recruiterName`, `recruiterEmail`, `candidateName`, and `candidateEmail` as top-level fields for easy access (null if not applicable)
- Summary endpoint groups activities by recruiter and activity type
- Statistics endpoint provides aggregate counts across all recruiters or a specific recruiter

---

## Best Practices

1. **Date Filtering**: Use date ranges to analyze recruiter performance over specific periods (weekly, monthly, quarterly)

2. **Performance Monitoring**: Use the summary endpoint to identify top-performing recruiters

3. **Activity Analysis**: Use statistics to understand overall recruitment activity trends

4. **Filtering**: Combine multiple filters to get specific insights (e.g., all interviews scheduled by a recruiter in January)

5. **Pagination**: Use pagination for large datasets to improve performance

6. **Real-time Updates**: Poll the logs endpoint periodically to show real-time activity updates

---

## Integration with Dashboard

The activity logs can be integrated into the admin dashboard to show:
- Recent recruiter activities
- Activity trends over time
- Top performing recruiters
- Activity breakdown by type

Example dashboard query:
```
GET /v1/recruiter-activities/logs?limit=20&sortBy=createdAt:desc
```

This returns the 20 most recent activities across all recruiters.

