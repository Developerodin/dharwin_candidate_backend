# Tasks API Documentation

## Base URL
```
/v1/tasks
```

All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 1. Create Task

**Endpoint:** `POST /v1/tasks`

**Description:** Create a new task connected to a project.

**Request Body:**
```json
{
  "title": "Update ynex new project design",
  "description": "The current website design needs a refresh to improve user experience and enhance visual appeal. The goal is to create a modern and responsive design that aligns with the latest web design trends. The updated design should ensure seamless navigation, easy readability, and a cohesive visual identity.",
  "project": "507f1f77bcf86cd799439014",
  "status": "New",
  "priority": "High",
  "assignedDate": "2025-06-24T00:00:00.000Z",
  "dueDate": "2025-07-05T00:00:00.000Z",
  "assignedBy": "507f1f77bcf86cd799439010",
  "assignedTo": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012",
    "507f1f77bcf86cd799439013"
  ],
  "progress": 0,
  "efforts": {
    "hours": 0,
    "minutes": 0,
    "seconds": 0
  },
  "tags": ["UI/UX", "Designing", "Development"],
  "taskKey": "SPK",
  "subTasks": [
    {
      "title": "Conduct Website Design Analysis",
      "description": "Analyze current design and identify improvement areas",
      "isCompleted": false,
      "order": 1
    },
    {
      "title": "Collaborate with UI/UX Team",
      "description": "Work with design team to develop wireframes",
      "isCompleted": false,
      "order": 2
    },
    {
      "title": "Refine Design Iteratively",
      "description": "Iterate on design based on feedback",
      "isCompleted": false,
      "order": 3
    }
  ],
  "attachments": []
}
```

**Response (201 Created):**
```json
{
  "id": "507f1f77bcf86cd799439020",
  "taskId": "SPK-123",
  "title": "Update ynex new project design",
  "description": "The current website design needs a refresh to improve user experience and enhance visual appeal. The goal is to create a modern and responsive design that aligns with the latest web design trends. The updated design should ensure seamless navigation, easy readability, and a cohesive visual identity.",
  "project": {
    "id": "507f1f77bcf86cd799439014",
    "projectName": "Website Redesign Project",
    "status": "Inprogress",
    "priority": "High"
  },
  "status": "New",
  "priority": "High",
  "assignedDate": "2025-06-24T00:00:00.000Z",
  "dueDate": "2025-07-05T00:00:00.000Z",
  "assignedBy": {
    "id": "507f1f77bcf86cd799439010",
    "name": "Admin Administrator",
    "email": "admin@example.com"
  },
  "assignedTo": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Angelina May",
      "email": "angelina@example.com"
    },
    {
      "id": "507f1f77bcf86cd799439012",
      "name": "Alex Carey",
      "email": "alex@example.com"
    },
    {
      "id": "507f1f77bcf86cd799439013",
      "name": "Alexa Biss",
      "email": "alexa@example.com"
    }
  ],
  "progress": 0,
  "efforts": {
    "hours": 0,
    "minutes": 0,
    "seconds": 0
  },
  "tags": ["UI/UX", "Designing", "Development"],
  "taskKey": "SPK",
  "subTasks": [
    {
      "id": "507f1f77bcf86cd799439021",
      "title": "Conduct Website Design Analysis",
      "description": "Analyze current design and identify improvement areas",
      "isCompleted": false,
      "order": 1,
      "createdAt": "2025-06-24T10:30:00.000Z",
      "updatedAt": "2025-06-24T10:30:00.000Z"
    },
    {
      "id": "507f1f77bcf86cd799439022",
      "title": "Collaborate with UI/UX Team",
      "description": "Work with design team to develop wireframes",
      "isCompleted": false,
      "order": 2,
      "createdAt": "2025-06-24T10:30:00.000Z",
      "updatedAt": "2025-06-24T10:30:00.000Z"
    },
    {
      "id": "507f1f77bcf86cd799439023",
      "title": "Refine Design Iteratively",
      "description": "Iterate on design based on feedback",
      "isCompleted": false,
      "order": 3,
      "createdAt": "2025-06-24T10:30:00.000Z",
      "updatedAt": "2025-06-24T10:30:00.000Z"
    }
  ],
  "attachments": [],
  "createdBy": {
    "id": "507f1f77bcf86cd799439010",
    "name": "Admin Administrator",
    "email": "admin@example.com"
  },
  "updatedBy": null,
  "createdAt": "2025-06-24T10:30:00.000Z",
  "updatedAt": "2025-06-24T10:30:00.000Z"
}
```

**Minimal Request (only required fields):**
```json
{
  "title": "New Dashboard design",
  "project": "507f1f77bcf86cd799439014"
}
```

**Error Response (400 Bad Request - Missing required field):**
```json
{
  "code": 400,
  "message": "Task title is required"
}
```

**Error Response (404 Not Found - Project not found):**
```json
{
  "code": 404,
  "message": "Project not found"
}
```

---

## 2. List Tasks

**Endpoint:** `GET /v1/tasks`

**Description:** Get a paginated list of tasks. Non-admin users can only see tasks from projects they created or are assigned to, or tasks assigned to them.

**Query Parameters:**
- `title` (string, optional) - Filter by task title (partial match)
- `project` (ObjectId, optional) - Filter by project ID
- `status` (string, optional) - Filter by status: 'New', 'Todo', 'On Going', 'In Review', 'Completed'
- `priority` (string, optional) - Filter by priority: 'Low', 'Medium', 'High', 'Critical'
- `assignedTo` (ObjectId, optional) - Filter by assigned user ID
- `createdBy` (ObjectId, optional) - Filter by creator user ID
- `tags` (string, optional) - Filter by tags (comma-separated)
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 10)
- `sortBy` (string, optional) - Sort field (e.g., 'createdAt:desc', 'dueDate:asc', 'priority:desc')

**Example Request:**
```
GET /v1/tasks?status=On Going&priority=High&project=507f1f77bcf86cd799439014&page=1&limit=10&sortBy=dueDate:asc
```

**Response (200 OK):**
```json
{
  "results": [
    {
      "id": "507f1f77bcf86cd799439020",
      "taskId": "SPK-123",
      "title": "Update ynex new project design",
      "description": "The current website design needs a refresh...",
      "project": {
        "id": "507f1f77bcf86cd799439014",
        "projectName": "Website Redesign Project",
        "status": "Inprogress",
        "priority": "High"
      },
      "status": "On Going",
      "priority": "High",
      "assignedDate": "2025-06-24T00:00:00.000Z",
      "dueDate": "2025-07-05T00:00:00.000Z",
      "assignedBy": {
        "id": "507f1f77bcf86cd799439010",
        "name": "Admin Administrator",
        "email": "admin@example.com"
      },
      "assignedTo": [
        {
          "id": "507f1f77bcf86cd799439011",
          "name": "Angelina May",
          "email": "angelina@example.com"
        }
      ],
      "progress": 70,
      "efforts": {
        "hours": 45,
        "minutes": 35,
        "seconds": 45
      },
      "tags": ["UI/UX", "Designing", "Development"],
      "taskKey": "SPK",
      "subTasks": [
        {
          "id": "507f1f77bcf86cd799439021",
          "title": "Conduct Website Design Analysis",
          "isCompleted": true,
          "order": 1
        },
        {
          "id": "507f1f77bcf86cd799439022",
          "title": "Collaborate with UI/UX Team",
          "isCompleted": true,
          "order": 2
        },
        {
          "id": "507f1f77bcf86cd799439023",
          "title": "Refine Design Iteratively",
          "isCompleted": false,
          "order": 3
        }
      ],
      "attachments": [],
      "createdBy": {
        "id": "507f1f77bcf86cd799439010",
        "name": "Admin Administrator",
        "email": "admin@example.com"
      },
      "createdAt": "2025-06-24T10:30:00.000Z",
      "updatedAt": "2025-06-24T15:45:00.000Z"
    },
    {
      "id": "507f1f77bcf86cd799439024",
      "taskId": "SPK-124",
      "title": "New Dashboard design",
      "description": "Create a modern dashboard with improved UX",
      "project": {
        "id": "507f1f77bcf86cd799439014",
        "projectName": "Website Redesign Project",
        "status": "Inprogress",
        "priority": "High"
      },
      "status": "Todo",
      "priority": "Medium",
      "assignedDate": "2025-06-25T00:00:00.000Z",
      "dueDate": "2025-07-10T00:00:00.000Z",
      "assignedBy": {
        "id": "507f1f77bcf86cd799439010",
        "name": "Admin Administrator",
        "email": "admin@example.com"
      },
      "assignedTo": [
        {
          "id": "507f1f77bcf86cd799439012",
          "name": "Alex Carey",
          "email": "alex@example.com"
        }
      ],
      "progress": 0,
      "efforts": {
        "hours": 0,
        "minutes": 0,
        "seconds": 0
      },
      "tags": ["UI/UX"],
      "taskKey": "SPK",
      "subTasks": [],
      "attachments": [],
      "createdBy": {
        "id": "507f1f77bcf86cd799439010",
        "name": "Admin Administrator",
        "email": "admin@example.com"
      },
      "createdAt": "2025-06-25T09:15:00.000Z",
      "updatedAt": "2025-06-25T09:15:00.000Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "totalResults": 47
}
```

---

## 3. Get Task by ID

**Endpoint:** `GET /v1/tasks/:taskId`

**Description:** Get a specific task by ID. User must have access to the task (admin, project creator, project member, or assigned user).

**Example Request:**
```
GET /v1/tasks/507f1f77bcf86cd799439020
```

**Response (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439020",
  "taskId": "SPK-123",
  "title": "Update ynex new project design",
  "description": "The current website design needs a refresh to improve user experience and enhance visual appeal. The goal is to create a modern and responsive design that aligns with the latest web design trends. The updated design should ensure seamless navigation, easy readability, and a cohesive visual identity.",
  "project": {
    "id": "507f1f77bcf86cd799439014",
    "projectName": "Website Redesign Project",
    "status": "Inprogress",
    "priority": "High"
  },
  "status": "On Going",
  "priority": "High",
  "assignedDate": "2025-06-24T00:00:00.000Z",
  "dueDate": "2025-07-05T00:00:00.000Z",
  "assignedBy": {
    "id": "507f1f77bcf86cd799439010",
    "name": "H.J.Taylor",
    "email": "hjtaylor@example.com"
  },
  "assignedTo": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Angelina May",
      "email": "angelina@example.com"
    },
    {
      "id": "507f1f77bcf86cd799439012",
      "name": "Alex Carey",
      "email": "alex@example.com"
    }
  ],
  "progress": 70,
  "efforts": {
    "hours": 45,
    "minutes": 35,
    "seconds": 45
  },
  "tags": ["UI/UX", "Designing", "Development"],
  "taskKey": "SPK",
  "subTasks": [
    {
      "id": "507f1f77bcf86cd799439021",
      "title": "Conduct Website Design Analysis",
      "description": "Analyze current design and identify improvement areas",
      "isCompleted": true,
      "completedAt": "2025-06-25T14:00:00.000Z",
      "completedBy": {
        "id": "507f1f77bcf86cd799439011",
        "name": "Angelina May",
        "email": "angelina@example.com"
      },
      "order": 1,
      "createdAt": "2025-06-24T10:30:00.000Z",
      "updatedAt": "2025-06-25T14:00:00.000Z"
    },
    {
      "id": "507f1f77bcf86cd799439022",
      "title": "Collaborate with UI/UX Team",
      "description": "Work with design team to develop wireframes",
      "isCompleted": true,
      "completedAt": "2025-06-26T10:00:00.000Z",
      "completedBy": {
        "id": "507f1f77bcf86cd799439012",
        "name": "Alex Carey",
        "email": "alex@example.com"
      },
      "order": 2,
      "createdAt": "2025-06-24T10:30:00.000Z",
      "updatedAt": "2025-06-26T10:00:00.000Z"
    },
    {
      "id": "507f1f77bcf86cd799439023",
      "title": "Refine Design Iteratively",
      "description": "Iterate on design based on feedback",
      "isCompleted": false,
      "order": 3,
      "createdAt": "2025-06-24T10:30:00.000Z",
      "updatedAt": "2025-06-24T10:30:00.000Z"
    },
    {
      "id": "507f1f77bcf86cd799439024",
      "title": "Implement Design Changes",
      "description": "Implement the finalized design changes using HTML, CSS, and JavaScript",
      "isCompleted": false,
      "order": 4,
      "createdAt": "2025-06-24T10:30:00.000Z",
      "updatedAt": "2025-06-24T10:30:00.000Z"
    },
    {
      "id": "507f1f77bcf86cd799439025",
      "title": "Test Responsive and Cross-Browser Compatibility",
      "description": "Test the website across different devices and browsers",
      "isCompleted": false,
      "order": 5,
      "createdAt": "2025-06-24T10:30:00.000Z",
      "updatedAt": "2025-06-24T10:30:00.000Z"
    },
    {
      "id": "507f1f77bcf86cd799439026",
      "title": "Review and Polish Design Elements",
      "description": "Conduct a final review to ensure all design elements are consistent",
      "isCompleted": true,
      "completedAt": "2025-06-27T16:00:00.000Z",
      "completedBy": {
        "id": "507f1f77bcf86cd799439011",
        "name": "Angelina May",
        "email": "angelina@example.com"
      },
      "order": 6,
      "createdAt": "2025-06-24T10:30:00.000Z",
      "updatedAt": "2025-06-27T16:00:00.000Z"
    }
  ],
  "attachments": [
    {
      "id": "507f1f77bcf86cd799439027",
      "label": "Full Project",
      "url": "https://s3.amazonaws.com/bucket/tasks/attachments/full-project.zip",
      "key": "tasks/attachments/full-project.zip",
      "originalName": "full-project.zip",
      "size": 471859,
      "mimeType": "application/zip",
      "uploadedBy": {
        "id": "507f1f77bcf86cd799439011",
        "name": "Angelina May",
        "email": "angelina@example.com"
      },
      "uploadedAt": "2025-06-25T10:00:00.000Z"
    },
    {
      "id": "507f1f77bcf86cd799439028",
      "label": "assets.zip",
      "url": "https://s3.amazonaws.com/bucket/tasks/attachments/assets.zip",
      "key": "tasks/attachments/assets.zip",
      "originalName": "assets.zip",
      "size": 1038090,
      "mimeType": "application/zip",
      "uploadedBy": {
        "id": "507f1f77bcf86cd799439012",
        "name": "Alex Carey",
        "email": "alex@example.com"
      },
      "uploadedAt": "2025-06-26T14:30:00.000Z"
    },
    {
      "id": "507f1f77bcf86cd799439029",
      "label": "image-1.png",
      "url": "https://s3.amazonaws.com/bucket/tasks/attachments/image-1.png",
      "key": "tasks/attachments/image-1.png",
      "originalName": "image-1.png",
      "size": 250880,
      "mimeType": "image/png",
      "uploadedBy": {
        "id": "507f1f77bcf86cd799439011",
        "name": "Angelina May",
        "email": "angelina@example.com"
      },
      "uploadedAt": "2025-06-27T09:00:00.000Z"
    }
  ],
  "createdBy": {
    "id": "507f1f77bcf86cd799439010",
    "name": "Admin Administrator",
    "email": "admin@example.com"
  },
  "updatedBy": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Angelina May",
    "email": "angelina@example.com"
  },
  "createdAt": "2025-06-24T10:30:00.000Z",
  "updatedAt": "2025-06-27T16:00:00.000Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "code": 404,
  "message": "Task not found"
}
```

**Error Response (403 Forbidden):**
```json
{
  "code": 403,
  "message": "Forbidden"
}
```

---

## 4. Update Task

**Endpoint:** `PATCH /v1/tasks/:taskId`

**Description:** Update a task. Only admin, project creator, or assigned user can update.

**Example Request:**
```
PATCH /v1/tasks/507f1f77bcf86cd799439020
```

**Request Body (all fields optional):**
```json
{
  "title": "Update ynex new project design - Revised",
  "status": "In Review",
  "priority": "Critical",
  "progress": 85,
  "dueDate": "2025-07-10T00:00:00.000Z",
  "assignedTo": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012",
    "507f1f77bcf86cd799439013",
    "507f1f77bcf86cd799439014"
  ],
  "efforts": {
    "hours": 50,
    "minutes": 20,
    "seconds": 15
  },
  "tags": ["UI/UX", "Designing", "Development", "Review"],
  "subTasks": [
    {
      "id": "507f1f77bcf86cd799439021",
      "title": "Conduct Website Design Analysis",
      "isCompleted": true,
      "order": 1
    },
    {
      "id": "507f1f77bcf86cd799439022",
      "title": "Collaborate with UI/UX Team",
      "isCompleted": true,
      "order": 2
    },
    {
      "id": "507f1f77bcf86cd799439023",
      "title": "Refine Design Iteratively",
      "isCompleted": true,
      "order": 3
    },
    {
      "id": "507f1f77bcf86cd799439024",
      "title": "Implement Design Changes",
      "isCompleted": true,
      "order": 4
    },
    {
      "id": "507f1f77bcf86cd799439025",
      "title": "Test Responsive and Cross-Browser Compatibility",
      "isCompleted": false,
      "order": 5
    },
    {
      "id": "507f1f77bcf86cd799439026",
      "title": "Review and Polish Design Elements",
      "isCompleted": true,
      "order": 6
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439020",
  "taskId": "SPK-123",
  "title": "Update ynex new project design - Revised",
  "description": "The current website design needs a refresh...",
  "project": {
    "id": "507f1f77bcf86cd799439014",
    "projectName": "Website Redesign Project",
    "status": "Inprogress",
    "priority": "High"
  },
  "status": "In Review",
  "priority": "Critical",
  "assignedDate": "2025-06-24T00:00:00.000Z",
  "dueDate": "2025-07-10T00:00:00.000Z",
  "assignedBy": {
    "id": "507f1f77bcf86cd799439010",
    "name": "H.J.Taylor",
    "email": "hjtaylor@example.com"
  },
  "assignedTo": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Angelina May",
      "email": "angelina@example.com"
    },
    {
      "id": "507f1f77bcf86cd799439012",
      "name": "Alex Carey",
      "email": "alex@example.com"
    },
    {
      "id": "507f1f77bcf86cd799439013",
      "name": "Alexa Biss",
      "email": "alexa@example.com"
    },
    {
      "id": "507f1f77bcf86cd799439014",
      "name": "John Smith",
      "email": "john@example.com"
    }
  ],
  "progress": 83,
  "efforts": {
    "hours": 50,
    "minutes": 20,
    "seconds": 15
  },
  "tags": ["UI/UX", "Designing", "Development", "Review"],
  "taskKey": "SPK",
  "subTasks": [
    {
      "id": "507f1f77bcf86cd799439021",
      "title": "Conduct Website Design Analysis",
      "isCompleted": true,
      "order": 1
    },
    {
      "id": "507f1f77bcf86cd799439022",
      "title": "Collaborate with UI/UX Team",
      "isCompleted": true,
      "order": 2
    },
    {
      "id": "507f1f77bcf86cd799439023",
      "title": "Refine Design Iteratively",
      "isCompleted": true,
      "order": 3
    },
    {
      "id": "507f1f77bcf86cd799439024",
      "title": "Implement Design Changes",
      "isCompleted": true,
      "order": 4
    },
    {
      "id": "507f1f77bcf86cd799439025",
      "title": "Test Responsive and Cross-Browser Compatibility",
      "isCompleted": false,
      "order": 5
    },
    {
      "id": "507f1f77bcf86cd799439026",
      "title": "Review and Polish Design Elements",
      "isCompleted": true,
      "order": 6
    }
  ],
  "attachments": [],
  "createdBy": {
    "id": "507f1f77bcf86cd799439010",
    "name": "Admin Administrator",
    "email": "admin@example.com"
  },
  "updatedBy": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Angelina May",
    "email": "angelina@example.com"
  },
  "createdAt": "2025-06-24T10:30:00.000Z",
  "updatedAt": "2025-06-28T11:20:00.000Z"
}
```

**Note:** When updating `subTasks`, the progress is automatically recalculated based on completed sub-tasks. In this example, 5 out of 6 sub-tasks are completed, so progress is 83% (rounded from 83.33%).

**Error Response (400 Bad Request - Due date before assigned date):**
```json
{
  "code": 400,
  "message": "Due date must be after assigned date"
}
```

---

## 5. Delete Task

**Endpoint:** `DELETE /v1/tasks/:taskId`

**Description:** Delete a task. Only admin or project creator can delete.

**Example Request:**
```
DELETE /v1/tasks/507f1f77bcf86cd799439020
```

**Response (204 No Content):**
```
(No response body)
```

**Error Response (404 Not Found):**
```json
{
  "code": 404,
  "message": "Task not found"
}
```

**Error Response (403 Forbidden):**
```json
{
  "code": 403,
  "message": "Forbidden"
}
```

---

## 6. Get Kanban Board Tasks

**Endpoint:** `GET /v1/tasks/kanban-board`

**Description:** Get tasks organized by status for Kanban board view. Returns tasks grouped by status columns.

**Query Parameters:**
- `project` (ObjectId, optional) - Filter by project ID
- `priority` (string, optional) - Filter by priority: 'Low', 'Medium', 'High', 'Critical'
- `assignedTo` (ObjectId, optional) - Filter by assigned user ID
- `tags` (string, optional) - Filter by tags (comma-separated)

**Example Request:**
```
GET /v1/tasks/kanban-board?project=507f1f77bcf86cd799439014
```

**Response (200 OK):**
```json
{
  "New": [
    {
      "id": "507f1f77bcf86cd799439030",
      "taskId": "SPK-11",
      "title": "New Dashboard design",
      "description": "Create a modern dashboard with improved UX",
      "project": {
        "id": "507f1f77bcf86cd799439014",
        "projectName": "Website Redesign Project",
        "status": "Inprogress",
        "priority": "High"
      },
      "status": "New",
      "priority": "Medium",
      "assignedDate": "2025-05-28T00:00:00.000Z",
      "dueDate": "2025-06-10T00:00:00.000Z",
      "assignedTo": [
        {
          "id": "507f1f77bcf86cd799439011",
          "name": "Angelina May",
          "email": "angelina@example.com"
        }
      ],
      "progress": 0,
      "tags": ["UI/UX"],
      "createdAt": "2025-05-28T10:00:00.000Z"
    },
    {
      "id": "507f1f77bcf86cd799439031",
      "taskId": "SPK-05",
      "title": "Marketing next projects",
      "description": "Plan and execute marketing campaigns",
      "project": {
        "id": "507f1f77bcf86cd799439014",
        "projectName": "Website Redesign Project",
        "status": "Inprogress",
        "priority": "High"
      },
      "status": "New",
      "priority": "High",
      "assignedDate": "2025-05-30T00:00:00.000Z",
      "dueDate": "2025-06-12T00:00:00.000Z",
      "assignedTo": [
        {
          "id": "507f1f77bcf86cd799439012",
          "name": "Alex Carey",
          "email": "alex@example.com"
        }
      ],
      "progress": 0,
      "tags": ["Marketing", "Finance"],
      "createdAt": "2025-05-30T09:00:00.000Z"
    }
  ],
  "Todo": [
    {
      "id": "507f1f77bcf86cd799439032",
      "taskId": "SPK-07",
      "title": "Adding Authentication Pages",
      "description": "Implement user authentication system",
      "project": {
        "id": "507f1f77bcf86cd799439014",
        "projectName": "Website Redesign Project",
        "status": "Inprogress",
        "priority": "High"
      },
      "status": "Todo",
      "priority": "High",
      "assignedDate": "2025-06-01T00:00:00.000Z",
      "dueDate": "2025-06-11T00:00:00.000Z",
      "assignedTo": [
        {
          "id": "507f1f77bcf86cd799439013",
          "name": "Alexa Biss",
          "email": "alexa@example.com"
        }
      ],
      "progress": 0,
      "tags": ["Admin", "Authentication"],
      "createdAt": "2025-06-01T08:00:00.000Z"
    }
  ],
  "On Going": [
    {
      "id": "507f1f77bcf86cd799439020",
      "taskId": "SPK-123",
      "title": "Update ynex new project design",
      "description": "The current website design needs a refresh...",
      "project": {
        "id": "507f1f77bcf86cd799439014",
        "projectName": "Website Redesign Project",
        "status": "Inprogress",
        "priority": "High"
      },
      "status": "On Going",
      "priority": "High",
      "assignedDate": "2025-06-24T00:00:00.000Z",
      "dueDate": "2025-07-05T00:00:00.000Z",
      "assignedTo": [
        {
          "id": "507f1f77bcf86cd799439011",
          "name": "Angelina May",
          "email": "angelina@example.com"
        },
        {
          "id": "507f1f77bcf86cd799439012",
          "name": "Alex Carey",
          "email": "alex@example.com"
        }
      ],
      "progress": 70,
      "tags": ["UI/UX", "Designing", "Development"],
      "createdAt": "2025-06-24T10:30:00.000Z"
    },
    {
      "id": "507f1f77bcf86cd799439033",
      "taskId": "SPK-13",
      "title": "Create Calendar & Mail pages",
      "description": "Develop calendar and email functionality",
      "project": {
        "id": "507f1f77bcf86cd799439014",
        "projectName": "Website Redesign Project",
        "status": "Inprogress",
        "priority": "High"
      },
      "status": "On Going",
      "priority": "Medium",
      "assignedDate": "2025-06-02T00:00:00.000Z",
      "dueDate": "2025-06-07T00:00:00.000Z",
      "assignedTo": [
        {
          "id": "507f1f77bcf86cd799439011",
          "name": "Angelina May",
          "email": "angelina@example.com"
        }
      ],
      "progress": 45,
      "tags": ["UI Design", "Development"],
      "createdAt": "2025-06-02T11:00:00.000Z"
    }
  ],
  "In Review": [
    {
      "id": "507f1f77bcf86cd799439034",
      "taskId": "SPK-15",
      "title": "Design Architecture strategy",
      "description": "Design system architecture for scalability",
      "project": {
        "id": "507f1f77bcf86cd799439014",
        "projectName": "Website Redesign Project",
        "status": "Inprogress",
        "priority": "High"
      },
      "status": "In Review",
      "priority": "High",
      "assignedDate": "2025-06-05T00:00:00.000Z",
      "dueDate": "2025-06-19T00:00:00.000Z",
      "assignedTo": [
        {
          "id": "507f1f77bcf86cd799439013",
          "name": "Alexa Biss",
          "email": "alexa@example.com"
        }
      ],
      "progress": 95,
      "tags": ["Review"],
      "createdAt": "2025-06-05T14:00:00.000Z"
    }
  ],
  "Completed": [
    {
      "id": "507f1f77bcf86cd799439035",
      "taskId": "SPK-04",
      "title": "Sash project update",
      "description": "Update Sash project with latest features",
      "project": {
        "id": "507f1f77bcf86cd799439014",
        "projectName": "Website Redesign Project",
        "status": "Inprogress",
        "priority": "High"
      },
      "status": "Completed",
      "priority": "Medium",
      "assignedDate": "2025-06-12T00:00:00.000Z",
      "dueDate": "2025-06-20T00:00:00.000Z",
      "assignedTo": [
        {
          "id": "507f1f77bcf86cd799439011",
          "name": "Angelina May",
          "email": "angelina@example.com"
        }
      ],
      "progress": 100,
      "tags": ["UI/UX"],
      "createdAt": "2025-06-12T09:00:00.000Z"
    },
    {
      "id": "507f1f77bcf86cd799439036",
      "taskId": "SPK-10",
      "title": "React JS new version update",
      "description": "Update React to latest version",
      "project": {
        "id": "507f1f77bcf86cd799439014",
        "projectName": "Website Redesign Project",
        "status": "Inprogress",
        "priority": "High"
      },
      "status": "Completed",
      "priority": "Low",
      "assignedDate": "2025-06-10T00:00:00.000Z",
      "dueDate": "2025-06-15T00:00:00.000Z",
      "assignedTo": [
        {
          "id": "507f1f77bcf86cd799439012",
          "name": "Alex Carey",
          "email": "alex@example.com"
        }
      ],
      "progress": 100,
      "tags": ["Development"],
      "createdAt": "2025-06-10T10:00:00.000Z"
    }
  ]
}
```

---

## 7. Get Task Statistics

**Endpoint:** `GET /v1/tasks/statistics`

**Description:** Get task statistics grouped by status.

**Query Parameters:**
- `project` (ObjectId, optional) - Filter by project ID
- `priority` (string, optional) - Filter by priority: 'Low', 'Medium', 'High', 'Critical'
- `assignedTo` (ObjectId, optional) - Filter by assigned user ID
- `tags` (string, optional) - Filter by tags (comma-separated)

**Example Request:**
```
GET /v1/tasks/statistics?project=507f1f77bcf86cd799439014
```

**Response (200 OK):**
```json
{
  "New": 42,
  "Todo": 36,
  "On Going": 25,
  "In Review": 2,
  "Completed": 36,
  "total": 141
}
```

---

## 8. Update Task Status

**Endpoint:** `PATCH /v1/tasks/:taskId/status`

**Description:** Update only the task status (useful for drag-and-drop in Kanban board).

**Example Request:**
```
PATCH /v1/tasks/507f1f77bcf86cd799439020/status
```

**Request Body:**
```json
{
  "status": "In Review"
}
```

**Response (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439020",
  "taskId": "SPK-123",
  "title": "Update ynex new project design",
  "status": "In Review",
  "priority": "High",
  "project": {
    "id": "507f1f77bcf86cd799439014",
    "projectName": "Website Redesign Project",
    "status": "Inprogress",
    "priority": "High"
  },
  "assignedDate": "2025-06-24T00:00:00.000Z",
  "dueDate": "2025-07-05T00:00:00.000Z",
  "progress": 70,
  "updatedAt": "2025-06-28T12:00:00.000Z"
}
```

---

## Field Descriptions

### Required Fields
- `title` (string) - Task title (min 3, max 200 characters)
- `project` (ObjectId) - Project ID that the task belongs to

### Optional Fields
- `description` (string) - Task description (max 5000 characters, supports HTML)
- `status` (enum) - Task status: 'New', 'Todo', 'On Going', 'In Review', 'Completed' (default: 'New')
- `priority` (enum) - Task priority: 'Low', 'Medium', 'High', 'Critical' (default: 'Medium')
- `assignedDate` (Date/ISO string) - Date when task was assigned (defaults to current date)
- `dueDate` (Date/ISO string) - Task deadline
- `assignedBy` (ObjectId) - User ID who assigned the task (auto-set if assignedTo is provided)
- `assignedTo` (array of ObjectIds) - Array of user IDs assigned to the task
- `progress` (number) - Progress percentage 0-100 (default: 0, auto-calculated from sub-tasks if present)
- `efforts` (object) - Time tracking with:
  - `hours` (number, default: 0)
  - `minutes` (number, 0-59, default: 0)
  - `seconds` (number, 0-59, default: 0)
- `tags` (array of strings) - Array of tag strings (max 10 tags)
- `taskKey` (string) - Prefix for task ID generation (default: 'SPK')
- `subTasks` (array of objects) - Array of sub-task objects with:
  - `title` (string, required) - Sub-task title (min 1, max 200 characters)
  - `description` (string, optional) - Sub-task description (max 1000 characters)
  - `isCompleted` (boolean, default: false) - Completion status
  - `completedAt` (Date, optional) - Date when sub-task was completed
  - `completedBy` (ObjectId, optional) - User ID who completed the sub-task
  - `order` (number, default: 0) - Order for sorting sub-tasks
- `attachments` (array of objects) - Array of attachment objects with:
  - `label` (string, optional) - Display label for the attachment
  - `url` (string, optional) - URL to the file
  - `key` (string, optional) - S3 file key
  - `originalName` (string, optional) - Original filename
  - `size` (number, optional) - File size in bytes
  - `mimeType` (string, optional) - File MIME type
  - `uploadedBy` (ObjectId, optional) - User ID who uploaded the file
  - `uploadedAt` (Date, optional) - Upload timestamp

---

## Status Values
- `New` - Task is newly created (Backlog)
- `Todo` - Task is ready to be worked on
- `On Going` - Task is currently in progress
- `In Review` - Task is being reviewed
- `Completed` - Task is finished

## Priority Values
- `Low` - Low priority
- `Medium` - Medium priority (default)
- `High` - High priority
- `Critical` - Critical priority

---

## Access Control

- **Admin users**: Can view, create, update, and delete all tasks
- **Project creators**: Can view, create, update, and delete tasks in their projects
- **Project members**: Can view tasks in projects they're assigned to
- **Assigned users**: Can view and update tasks assigned to them
- **Others**: No access

---

## Progress Calculation

- **Manual**: User can set progress percentage directly (0-100)
- **Automatic**: If sub-tasks exist, progress is automatically calculated as:
  ```
  Progress = (Completed Sub-tasks / Total Sub-tasks) * 100
  ```
- When updating sub-tasks, progress is automatically recalculated
- If no sub-tasks exist, manual progress is used

---

## Task ID Generation

- Format: `{TASK_KEY}-{SEQUENCE_NUMBER}`
- Example: `SPK-123`, `SPK-124`, `SPK-125`
- Task IDs are auto-generated on task creation
- Each task key (e.g., 'SPK') maintains its own sequence
- Task IDs are globally unique

---

## Example cURL Commands

### Create Task
```bash
curl -X POST http://localhost:3000/v1/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Update ynex new project design",
    "description": "The current website design needs a refresh...",
    "project": "507f1f77bcf86cd799439014",
    "status": "New",
    "priority": "High",
    "dueDate": "2025-07-05T00:00:00.000Z",
    "assignedTo": ["507f1f77bcf86cd799439011"],
    "tags": ["UI/UX", "Designing", "Development"],
    "subTasks": [
      {
        "title": "Conduct Website Design Analysis",
        "description": "Analyze current design",
        "order": 1
      }
    ]
  }'
```

### List Tasks
```bash
curl -X GET "http://localhost:3000/v1/tasks?status=On Going&priority=High&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Task
```bash
curl -X GET http://localhost:3000/v1/tasks/507f1f77bcf86cd799439020 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Task
```bash
curl -X PATCH http://localhost:3000/v1/tasks/507f1f77bcf86cd799439020 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "In Review",
    "progress": 85
  }'
```

### Update Task Status (Drag-and-Drop)
```bash
curl -X PATCH http://localhost:3000/v1/tasks/507f1f77bcf86cd799439020/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "On Going"
  }'
```

### Get Kanban Board
```bash
curl -X GET "http://localhost:3000/v1/tasks/kanban-board?project=507f1f77bcf86cd799439014" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Statistics
```bash
curl -X GET "http://localhost:3000/v1/tasks/statistics?project=507f1f77bcf86cd799439014" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Delete Task
```bash
curl -X DELETE http://localhost:3000/v1/tasks/507f1f77bcf86cd799439020 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Notes

- All date fields should be in ISO 8601 format (e.g., `2025-06-24T10:30:00.000Z`)
- Task IDs are auto-generated and cannot be manually set
- When updating sub-tasks, include the `_id` field for existing sub-tasks to update them, or omit it to create new ones
- Attachments should be uploaded using the upload endpoint first, then the attachment object should be added to the task
- Progress is automatically recalculated when sub-tasks are updated
- Tasks must belong to a project - the project must exist before creating a task

