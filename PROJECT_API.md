# Project API Documentation

## Base URL
```
/v1/projects
```

All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 1. Create Project

**Endpoint:** `POST /v1/projects`

**Description:** Create a new project with all the fields from the form.

**Request Body:**
```json
{
  "projectName": "Website Redesign Project",
  "projectManager": "John Doe",
  "clientStakeholder": "ABC Corporation",
  "projectDescription": "<h1>Project Overview</h1><p>This project involves redesigning the company website with modern UI/UX principles.</p><ol><li>Conducting a comprehensive analysis of the existing website design.</li><li>Collaborating with the UI/UX team to develop wireframes and mockups.</li><li>Iteratively refining the design based on feedback.</li><li>Implementing the finalized design changes using HTML, CSS, and JavaScript.</li></ol>",
  "startDate": "2025-11-05T00:00:00.000Z",
  "endDate": "2025-11-11T00:00:00.000Z",
  "status": "Inprogress",
  "priority": "High",
  "assignedTo": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012",
    "507f1f77bcf86cd799439013"
  ],
  "tags": ["Marketing", "Sales", "Development", "Design", "Research"],
  "attachments": [
    {
      "label": "Project Brief",
      "url": "https://s3.amazonaws.com/bucket/project-brief.pdf",
      "key": "projects/attachments/project-brief.pdf",
      "originalName": "project-brief.pdf",
      "size": 1024000,
      "mimeType": "application/pdf"
    },
    {
      "label": "Design Mockup",
      "url": "https://s3.amazonaws.com/bucket/design-mockup.png",
      "key": "projects/attachments/design-mockup.png",
      "originalName": "design-mockup.png",
      "size": 512000,
      "mimeType": "image/png"
    }
  ],
  "goals": [
    "Improve user experience and engagement",
    {
      "title": "Increase conversion rate",
      "description": "Target 20% increase in website conversions"
    },
    "Enhance mobile responsiveness"
  ],
  "objectives": [
    "Complete UI/UX redesign of all pages",
    "Implement responsive design for mobile devices",
    {
      "title": "Optimize page load times",
      "description": "Achieve page load time under 2 seconds"
    }
  ],
  "deliverables": [
    {
      "title": "Design Mockups",
      "description": "High-fidelity mockups for all major pages",
      "dueDate": "2025-11-10T00:00:00.000Z",
      "status": "Pending"
    },
    {
      "title": "Responsive Website",
      "description": "Fully responsive website implementation",
      "dueDate": "2025-11-11T00:00:00.000Z",
      "status": "Pending"
    }
  ],
  "techStack": ["React", "Node.js", "MongoDB", "AWS", "Figma"],
  "resources": [
    {
      "type": "Budget",
      "name": "Development Budget",
      "description": "Budget allocated for development work",
      "cost": 50000,
      "unit": "USD"
    },
    {
      "type": "Tool",
      "name": "Figma License",
      "description": "Design tool licenses for UI/UX team",
      "quantity": 3,
      "unit": "licenses"
    },
    {
      "type": "Software",
      "name": "AWS Services",
      "description": "Cloud hosting and services",
      "cost": 500,
      "unit": "USD/month"
    }
  ],
  "stakeholders": [
    {
      "name": "John Smith",
      "role": "Client",
      "email": "john.smith@abccorp.com",
      "phone": "+1-555-0100",
      "organization": "ABC Corporation",
      "notes": "Primary contact for project decisions"
    },
    {
      "name": "Sarah Johnson",
      "role": "Technical Lead",
      "email": "sarah.johnson@abccorp.com",
      "organization": "ABC Corporation"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "id": "507f1f77bcf86cd799439014",
  "projectName": "Website Redesign Project",
  "projectManager": "John Doe",
  "clientStakeholder": "ABC Corporation",
  "projectDescription": "<h1>Project Overview</h1><p>This project involves redesigning the company website with modern UI/UX principles.</p><ol><li>Conducting a comprehensive analysis of the existing website design.</li><li>Collaborating with the UI/UX team to develop wireframes and mockups.</li><li>Iteratively refining the design based on feedback.</li><li>Implementing the finalized design changes using HTML, CSS, and JavaScript.</li></ol>",
  "startDate": "2025-11-05T00:00:00.000Z",
  "endDate": "2025-11-11T00:00:00.000Z",
  "status": "Inprogress",
  "priority": "High",
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
  "tags": ["Marketing", "Sales", "Development", "Design", "Research"],
  "attachments": [
    {
      "label": "Project Brief",
      "url": "https://s3.amazonaws.com/bucket/project-brief.pdf",
      "key": "projects/attachments/project-brief.pdf",
      "originalName": "project-brief.pdf",
      "size": 1024000,
      "mimeType": "application/pdf"
    },
    {
      "label": "Design Mockup",
      "url": "https://s3.amazonaws.com/bucket/design-mockup.png",
      "key": "projects/attachments/design-mockup.png",
      "originalName": "design-mockup.png",
      "size": 512000,
      "mimeType": "image/png"
    }
  ],
  "goals": [
    "Improve user experience and engagement",
    {
      "title": "Increase conversion rate",
      "description": "Target 20% increase in website conversions"
    },
    "Enhance mobile responsiveness"
  ],
  "objectives": [
    "Complete UI/UX redesign of all pages",
    "Implement responsive design for mobile devices",
    {
      "title": "Optimize page load times",
      "description": "Achieve page load time under 2 seconds"
    }
  ],
  "deliverables": [
    {
      "title": "Design Mockups",
      "description": "High-fidelity mockups for all major pages",
      "dueDate": "2025-11-10T00:00:00.000Z",
      "status": "Pending"
    },
    {
      "title": "Responsive Website",
      "description": "Fully responsive website implementation",
      "dueDate": "2025-11-11T00:00:00.000Z",
      "status": "Pending"
    }
  ],
  "techStack": ["React", "Node.js", "MongoDB", "AWS", "Figma"],
  "resources": [
    {
      "type": "Budget",
      "name": "Development Budget",
      "description": "Budget allocated for development work",
      "cost": 50000,
      "unit": "USD"
    },
    {
      "type": "Tool",
      "name": "Figma License",
      "description": "Design tool licenses for UI/UX team",
      "quantity": 3,
      "unit": "licenses"
    }
  ],
  "stakeholders": [
    {
      "name": "John Smith",
      "role": "Client",
      "email": "john.smith@abccorp.com",
      "phone": "+1-555-0100",
      "organization": "ABC Corporation",
      "notes": "Primary contact for project decisions"
    }
  ],
  "createdBy": {
    "id": "507f1f77bcf86cd799439010",
    "name": "Admin Administrator",
    "email": "admin@example.com"
  },
  "createdAt": "2025-11-01T10:30:00.000Z",
  "updatedAt": "2025-11-01T10:30:00.000Z"
}
```

**Minimal Request (only required field):**
```json
{
  "projectName": "New Project"
}
```

---

## 2. List Projects

**Endpoint:** `GET /v1/projects`

**Description:** Get a paginated list of projects. Non-admin users can only see projects they created or are assigned to.

**Query Parameters:**
- `projectName` (string, optional) - Filter by project name
- `projectManager` (string, optional) - Filter by project manager name
- `status` (string, optional) - Filter by status: 'Not Started', 'Inprogress', 'On Hold', 'Completed', 'Cancelled'
- `priority` (string, optional) - Filter by priority: 'Low', 'Medium', 'High', 'Critical'
- `createdBy` (ObjectId, optional) - Filter by creator user ID
- `assignedTo` (ObjectId, optional) - Filter by assigned user ID
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Items per page (default: 10)
- `sortBy` (string, optional) - Sort field (e.g., 'createdAt:desc', 'projectName:asc')

**Example Request:**
```
GET /v1/projects?status=Inprogress&priority=High&page=1&limit=10&sortBy=createdAt:desc
```

**Response (200 OK):**
```json
{
  "results": [
    {
      "id": "507f1f77bcf86cd799439014",
      "projectName": "Website Redesign Project",
      "projectManager": "John Doe",
      "clientStakeholder": "ABC Corporation",
      "projectDescription": "<h1>Project Overview</h1><p>This project involves...</p>",
      "startDate": "2025-11-05T00:00:00.000Z",
      "endDate": "2025-11-11T00:00:00.000Z",
      "status": "Inprogress",
      "priority": "High",
      "assignedTo": [
        {
          "id": "507f1f77bcf86cd799439011",
          "name": "Angelina May",
          "email": "angelina@example.com"
        }
      ],
  "tags": ["Marketing", "Sales", "Development"],
  "attachments": [],
  "goals": ["Improve user experience"],
  "objectives": ["Complete UI/UX redesign"],
  "deliverables": [],
  "techStack": ["React", "Node.js"],
  "resources": [],
  "stakeholders": [],
  "createdBy": {
    "id": "507f1f77bcf86cd799439010",
    "name": "Admin Administrator",
    "email": "admin@example.com"
  },
  "createdAt": "2025-11-01T10:30:00.000Z",
  "updatedAt": "2025-11-01T10:30:00.000Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "totalResults": 47
}
```

---

## 3. Get Project by ID

**Endpoint:** `GET /v1/projects/:projectId`

**Description:** Get a specific project by ID. User must be admin, creator, or assigned to the project.

**Example Request:**
```
GET /v1/projects/507f1f77bcf86cd799439014
```

**Response (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439014",
  "projectName": "Website Redesign Project",
  "projectManager": "John Doe",
  "clientStakeholder": "ABC Corporation",
  "projectDescription": "<h1>Project Overview</h1><p>This project involves redesigning the company website with modern UI/UX principles.</p><ol><li>Conducting a comprehensive analysis of the existing website design.</li><li>Collaborating with the UI/UX team to develop wireframes and mockups.</li><li>Iteratively refining the design based on feedback.</li><li>Implementing the finalized design changes using HTML, CSS, and JavaScript.</li></ol>",
  "startDate": "2025-11-05T00:00:00.000Z",
  "endDate": "2025-11-11T00:00:00.000Z",
  "status": "Inprogress",
  "priority": "High",
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
  "tags": ["Marketing", "Sales", "Development", "Design", "Research"],
  "attachments": [
    {
      "label": "Project Brief",
      "url": "https://s3.amazonaws.com/bucket/project-brief.pdf",
      "key": "projects/attachments/project-brief.pdf",
      "originalName": "project-brief.pdf",
      "size": 1024000,
      "mimeType": "application/pdf"
    }
  ],
  "goals": [
    "Improve user experience and engagement",
    {
      "title": "Increase conversion rate",
      "description": "Target 20% increase in website conversions"
    }
  ],
  "objectives": [
    "Complete UI/UX redesign of all pages",
    "Implement responsive design for mobile devices"
  ],
  "deliverables": [
    {
      "title": "Design Mockups",
      "description": "High-fidelity mockups for all major pages",
      "dueDate": "2025-11-10T00:00:00.000Z",
      "status": "Pending"
    }
  ],
  "techStack": ["React", "Node.js", "MongoDB", "AWS"],
  "resources": [
    {
      "type": "Budget",
      "name": "Development Budget",
      "cost": 50000,
      "unit": "USD"
    }
  ],
  "stakeholders": [
    {
      "name": "John Smith",
      "role": "Client",
      "email": "john.smith@abccorp.com",
      "organization": "ABC Corporation"
    }
  ],
  "createdBy": {
    "id": "507f1f77bcf86cd799439010",
    "name": "Admin Administrator",
    "email": "admin@example.com"
  },
  "createdAt": "2025-11-01T10:30:00.000Z",
  "updatedAt": "2025-11-01T10:30:00.000Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "code": 404,
  "message": "Project not found"
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

## 4. Update Project

**Endpoint:** `PATCH /v1/projects/:projectId`

**Description:** Update a project. Only admin or project creator can update.

**Example Request:**
```
PATCH /v1/projects/507f1f77bcf86cd799439014
```

**Request Body (all fields optional):**
```json
{
  "projectName": "Updated Website Redesign Project",
  "status": "Completed",
  "priority": "Medium",
  "endDate": "2025-11-15T00:00:00.000Z",
  "tags": ["Marketing", "Sales", "Development", "Design", "Research", "Completed"],
  "assignedTo": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012"
  ],
  "goals": [
    "Improve user experience and engagement",
    "Increase conversion rate by 20%"
  ],
  "deliverables": [
    {
      "title": "Design Mockups",
      "description": "High-fidelity mockups for all major pages",
      "dueDate": "2025-11-10T00:00:00.000Z",
      "status": "Completed"
    }
  ],
  "techStack": ["React", "Node.js", "MongoDB", "AWS", "Figma"],
  "resources": [
    {
      "type": "Budget",
      "name": "Development Budget",
      "cost": 50000,
      "unit": "USD"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439014",
  "projectName": "Updated Website Redesign Project",
  "projectManager": "John Doe",
  "clientStakeholder": "ABC Corporation",
  "projectDescription": "<h1>Project Overview</h1><p>This project involves...</p>",
  "startDate": "2025-11-05T00:00:00.000Z",
  "endDate": "2025-11-15T00:00:00.000Z",
  "status": "Completed",
  "priority": "Medium",
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
  "tags": ["Marketing", "Sales", "Development", "Design", "Research", "Completed"],
  "attachments": [],
  "goals": [
    "Improve user experience and engagement",
    "Increase conversion rate by 20%"
  ],
  "objectives": [
    "Complete UI/UX redesign of all pages",
    "Implement responsive design for mobile devices"
  ],
  "deliverables": [
    {
      "title": "Design Mockups",
      "description": "High-fidelity mockups for all major pages",
      "dueDate": "2025-11-10T00:00:00.000Z",
      "status": "Completed"
    }
  ],
  "techStack": ["React", "Node.js", "MongoDB", "AWS", "Figma"],
  "resources": [
    {
      "type": "Budget",
      "name": "Development Budget",
      "cost": 50000,
      "unit": "USD"
    }
  ],
  "stakeholders": [],
  "createdBy": {
    "id": "507f1f77bcf86cd799439010",
    "name": "Admin Administrator",
    "email": "admin@example.com"
  },
  "createdAt": "2025-11-01T10:30:00.000Z",
  "updatedAt": "2025-11-01T11:45:00.000Z"
}
```

**Error Response (400 Bad Request - End date before start date):**
```json
{
  "code": 400,
  "message": "End date must be after start date"
}
```

---

## 5. Delete Project

**Endpoint:** `DELETE /v1/projects/:projectId`

**Description:** Delete a project. Only admin or project creator can delete.

**Example Request:**
```
DELETE /v1/projects/507f1f77bcf86cd799439014
```

**Response (204 No Content):**
```
(No response body)
```

**Error Response (404 Not Found):**
```json
{
  "code": 404,
  "message": "Project not found"
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

## Field Descriptions

### Required Fields
- `projectName` (string) - The name of the project

### Optional Fields
- `projectManager` (string) - Name of the project manager
- `clientStakeholder` (string) - Name of the client or stakeholder
- `projectDescription` (string) - Rich text/HTML description of the project
- `startDate` (Date/ISO string) - Project start date
- `endDate` (Date/ISO string) - Project end date (must be after startDate if both provided)
- `status` (enum) - Project status: 'Not Started', 'Inprogress', 'On Hold', 'Completed', 'Cancelled' (default: 'Inprogress')
- `priority` (enum) - Project priority: 'Low', 'Medium', 'High', 'Critical' (default: 'High')
- `assignedTo` (array of ObjectIds) - Array of user IDs assigned to the project
- `tags` (array of strings) - Array of tag strings
- `attachments` (array of objects) - Array of attachment objects with:
  - `label` (string, optional) - Display label for the attachment
  - `url` (string, optional) - URL to the file
  - `key` (string, optional) - S3 file key
  - `originalName` (string, optional) - Original filename
  - `size` (number, optional) - File size in bytes
  - `mimeType` (string, optional) - File MIME type

### Project Briefs
- `goals` (array) - Array of project goals. Can be:
  - Simple strings: `["Goal 1", "Goal 2"]`
  - Objects with `title` and `description`: `[{"title": "Goal Title", "description": "Goal description"}]`
  - Mixed: `["Simple goal", {"title": "Detailed goal", "description": "Description"}]`
- `objectives` (array) - Array of project objectives. Same format as goals (strings or objects)
- `deliverables` (array of objects) - Array of deliverable objects with:
  - `title` (string, required) - Deliverable title
  - `description` (string, optional) - Deliverable description
  - `dueDate` (Date/ISO string, optional) - Due date for the deliverable
  - `status` (enum, optional) - Deliverable status: 'Pending', 'In Progress', 'Completed', 'Delayed' (default: 'Pending')

### Project Scope
- `techStack` (array of strings) - Array of technologies/frameworks used in the project (e.g., `["React", "Node.js", "MongoDB"]`)
- `resources` (array of objects) - Array of resource objects with:
  - `type` (enum, required) - Resource type: 'Budget', 'Equipment', 'Tool', 'Software', 'Service', 'Other'
  - `name` (string, required) - Resource name
  - `description` (string, optional) - Resource description
  - `quantity` (number, optional) - Quantity of the resource
  - `cost` (number, optional) - Cost of the resource
  - `unit` (string, optional) - Unit of measurement (e.g., 'USD', 'hours', 'licenses', 'units')
- `stakeholders` (array of objects) - Array of stakeholder objects with:
  - `name` (string, required) - Stakeholder name
  - `role` (string, optional) - Stakeholder role (e.g., 'Client', 'Sponsor', 'End User', 'Technical Lead')
  - `email` (string, optional) - Stakeholder email address
  - `phone` (string, optional) - Stakeholder phone number
  - `organization` (string, optional) - Stakeholder organization
  - `notes` (string, optional) - Additional notes about the stakeholder

---

## Status Values
- `Not Started` - Project has not begun
- `Inprogress` - Project is currently in progress
- `On Hold` - Project is temporarily paused
- `Completed` - Project is finished
- `Cancelled` - Project has been cancelled

## Priority Values
- `Low` - Low priority
- `Medium` - Medium priority
- `High` - High priority
- `Critical` - Critical priority

---

## Access Control

- **Admin users**: Can view, create, update, and delete all projects
- **Regular users**: Can only view projects they created or are assigned to
- **Project creators**: Can update and delete their own projects
- **Assigned users**: Can view projects they are assigned to (read-only)

---

## Example cURL Commands

### Create Project
```bash
curl -X POST http://localhost:3000/v1/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "projectName": "Website Redesign Project",
    "projectManager": "John Doe",
    "clientStakeholder": "ABC Corporation",
    "status": "Inprogress",
    "priority": "High",
    "tags": ["Marketing", "Sales", "Development"],
    "goals": ["Improve user experience", "Increase conversion rate"],
    "objectives": ["Complete UI/UX redesign", "Implement responsive design"],
    "techStack": ["React", "Node.js", "MongoDB"],
    "resources": [
      {
        "type": "Budget",
        "name": "Development Budget",
        "cost": 50000,
        "unit": "USD"
      }
    ],
    "stakeholders": [
      {
        "name": "John Smith",
        "role": "Client",
        "email": "john@example.com",
        "organization": "ABC Corporation"
      }
    ]
  }'
```

### List Projects
```bash
curl -X GET "http://localhost:3000/v1/projects?status=Inprogress&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Project
```bash
curl -X GET http://localhost:3000/v1/projects/507f1f77bcf86cd799439014 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update Project
```bash
curl -X PATCH http://localhost:3000/v1/projects/507f1f77bcf86cd799439014 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Completed",
    "priority": "Medium"
  }'
```

### Delete Project
```bash
curl -X DELETE http://localhost:3000/v1/projects/507f1f77bcf86cd799439014 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

