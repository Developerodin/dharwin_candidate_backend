# Job Posting Management API Documentation

## Base URL
```
/v1/jobs
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Job Endpoints

### 1. Create Job
**POST** `/v1/jobs`

**Request Body:**
```json
{
  "title": "Senior Software Engineer",
  "organisation": {
    "name": "Tech Corp",
    "website": "https://techcorp.com",
    "email": "hr@techcorp.com",
    "phone": "+1234567890",
    "address": "123 Tech Street, San Francisco, CA",
    "description": "Leading technology company"
  },
  "jobDescription": "We are looking for an experienced software engineer...",
  "jobType": "Full-time",
  "location": "San Francisco, CA",
  "skillTags": ["JavaScript", "Node.js", "React", "MongoDB"],
  "salaryRange": {
    "min": 120000,
    "max": 180000,
    "currency": "USD"
  },
  "experienceLevel": "Senior Level",
  "status": "Active",
  "templateId": "optional_template_id"
}
```

**Response:** `201 Created`
```json
{
  "id": "job_id",
  "title": "Senior Software Engineer",
  "organisation": {
    "name": "Tech Corp",
    "website": "https://techcorp.com",
    "email": "hr@techcorp.com",
    "phone": "+1234567890",
    "address": "123 Tech Street, San Francisco, CA",
    "description": "Leading technology company"
  },
  "jobDescription": "We are looking for an experienced software engineer...",
  "jobType": "Full-time",
  "location": "San Francisco, CA",
  "skillTags": ["JavaScript", "Node.js", "React", "MongoDB"],
  "salaryRange": {
    "min": 120000,
    "max": 180000,
    "currency": "USD"
  },
  "experienceLevel": "Senior Level",
  "status": "Active",
  "createdBy": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

### 2. List Jobs (with Search, Filter, Sort, Pagination)
**GET** `/v1/jobs`

**Query Parameters:**
- `title` (string, optional) - Filter by job title
- `jobType` (string, optional) - Filter by job type: `Full-time`, `Part-time`, `Contract`, `Temporary`, `Internship`, `Freelance`
- `location` (string, optional) - Filter by location
- `status` (string, optional) - Filter by status: `Draft`, `Active`, `Closed`, `Archived`
- `experienceLevel` (string, optional) - Filter by experience: `Entry Level`, `Mid Level`, `Senior Level`, `Executive`
- `createdBy` (string, optional) - Filter by creator user ID
- `search` (string, optional) - Search across title, organisation name, description, location, and skill tags
- `sortBy` (string, optional) - Sort field and order (e.g., `createdAt:desc`, `title:asc`)
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Results per page (default: 10)

**Example Request:**
```
GET /v1/jobs?search=engineer&jobType=Full-time&status=Active&sortBy=createdAt:desc&page=1&limit=10
```

**Response:** `200 OK`
```json
{
  "results": [
    {
      "id": "job_id",
      "title": "Senior Software Engineer",
      "organisation": {
        "name": "Tech Corp",
        "website": "https://techcorp.com",
        "email": "hr@techcorp.com",
        "phone": "+1234567890",
        "address": "123 Tech Street, San Francisco, CA",
        "description": "Leading technology company"
      },
      "jobDescription": "We are looking for...",
      "jobType": "Full-time",
      "location": "San Francisco, CA",
      "skillTags": ["JavaScript", "Node.js", "React"],
      "salaryRange": {
        "min": 120000,
        "max": 180000,
        "currency": "USD"
      },
      "experienceLevel": "Senior Level",
      "status": "Active",
      "createdBy": {
        "id": "user_id",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "totalResults": 50
}
```

---

### 3. Get Job by ID
**GET** `/v1/jobs/:jobId`

**Response:** `200 OK`
```json
{
  "id": "job_id",
  "title": "Senior Software Engineer",
  "organisation": {
    "name": "Tech Corp",
    "website": "https://techcorp.com",
    "email": "hr@techcorp.com",
    "phone": "+1234567890",
    "address": "123 Tech Street, San Francisco, CA",
    "description": "Leading technology company"
  },
  "jobDescription": "We are looking for an experienced software engineer...",
  "jobType": "Full-time",
  "location": "San Francisco, CA",
  "skillTags": ["JavaScript", "Node.js", "React", "MongoDB"],
  "salaryRange": {
    "min": 120000,
    "max": 180000,
    "currency": "USD"
  },
  "experienceLevel": "Senior Level",
  "status": "Active",
  "templateId": {
    "id": "template_id",
    "name": "Software Engineer Template"
  },
  "createdBy": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

### 4. Update Job
**PATCH** `/v1/jobs/:jobId`

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Job Title",
  "status": "Closed",
  "skillTags": ["JavaScript", "Node.js", "React", "TypeScript"]
}
```

**Response:** `200 OK` (returns updated job object)

---

### 5. Delete Job
**DELETE** `/v1/jobs/:jobId`

**Response:** `204 No Content`

---

### 6. Export Jobs to Excel
**GET** `/v1/jobs/export/excel`

**Query Parameters:** (same filters as list endpoint)
- `title`, `jobType`, `location`, `status`, `experienceLevel`, `createdBy`

**Response:** `200 OK`
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- File download with filename: `jobs_export_[timestamp].xlsx`

**Excel Columns:**
- Job Title
- Organisation Name
- Organisation Website
- Organisation Email
- Organisation Phone
- Organisation Address
- Job Type
- Location
- Skill Tags
- Job Description
- Salary Min
- Salary Max
- Salary Currency
- Experience Level
- Status
- Template Used
- Created By
- Created At
- Updated At

---

### 7. Import Jobs from Excel
**POST** `/v1/jobs/import/excel`

**Request:** `multipart/form-data`
- `file` (file, required) - Excel file (.xlsx)

**Excel Format:**
The Excel file should have the following columns (case-insensitive):
- Job Title (required)
- Organisation Name (required)
- Organisation Website
- Organisation Email
- Organisation Phone
- Organisation Address
- Organisation Description
- Job Type (required, must be: Full-time, Part-time, Contract, Temporary, Internship, Freelance)
- Location (required)
- Skill Tags (semicolon-separated: `JavaScript; Node.js; React`)
- Job Description
- Salary Min
- Salary Max
- Salary Currency
- Experience Level (Entry Level, Mid Level, Senior Level, Executive)
- Status (Draft, Active, Closed, Archived)

**Response:** `201 Created` (if all successful) or `207 Multi-Status` (if partial)
```json
{
  "message": "Some jobs imported successfully, some failed",
  "successful": [
    {
      "row": 2,
      "jobId": "job_id_1",
      "title": "Software Engineer"
    },
    {
      "row": 3,
      "jobId": "job_id_2",
      "title": "Product Manager"
    }
  ],
  "failed": [
    {
      "row": 4,
      "error": "Missing required fields: Title, Organisation Name, and Location are required",
      "data": { ... }
    }
  ],
  "summary": {
    "total": 3,
    "successful": 2,
    "failed": 1
  }
}
```

---

## Job Template Endpoints

### 8. Create Job Template
**POST** `/v1/jobs/templates`

**Request Body:**
```json
{
  "name": "Software Engineer Template",
  "description": "Template for software engineering positions",
  "templateContent": "We are looking for a {{jobTitle}} at {{organisationName}} located in {{location}}. The ideal candidate should have...",
  "defaultJobType": "Full-time",
  "defaultSkillTags": ["JavaScript", "Node.js"],
  "defaultLocation": "San Francisco, CA",
  "variables": [
    {
      "name": "organisationName",
      "description": "Name of the organisation",
      "defaultValue": ""
    },
    {
      "name": "jobTitle",
      "description": "Job title",
      "defaultValue": ""
    },
    {
      "name": "location",
      "description": "Job location",
      "defaultValue": "San Francisco, CA"
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "id": "template_id",
  "name": "Software Engineer Template",
  "description": "Template for software engineering positions",
  "templateContent": "We are looking for a {{jobTitle}} at {{organisationName}}...",
  "defaultJobType": "Full-time",
  "defaultSkillTags": ["JavaScript", "Node.js"],
  "defaultLocation": "San Francisco, CA",
  "variables": [...],
  "createdBy": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "usageCount": 0,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

### 9. List Job Templates
**GET** `/v1/jobs/templates`

**Query Parameters:**
- `name` (string, optional) - Filter by template name
- `createdBy` (string, optional) - Filter by creator user ID
- `sortBy` (string, optional) - Sort field and order
- `page` (number, optional) - Page number (default: 1)
- `limit` (number, optional) - Results per page (default: 10)

**Response:** `200 OK` (paginated format same as jobs list)

---

### 10. Get Job Template by ID
**GET** `/v1/jobs/templates/:templateId`

**Response:** `200 OK` (template object)

---

### 11. Update Job Template
**PATCH** `/v1/jobs/templates/:templateId`

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Template Name",
  "templateContent": "Updated template content..."
}
```

**Response:** `200 OK` (returns updated template)

---

### 12. Delete Job Template
**DELETE** `/v1/jobs/templates/:templateId`

**Response:** `204 No Content`

---

### 13. Create Job from Template
**POST** `/v1/jobs/templates/:templateId/create-job`

**Request Body:**
```json
{
  "title": "Senior Software Engineer",
  "organisation": {
    "name": "Tech Corp",
    "website": "https://techcorp.com",
    "email": "hr@techcorp.com",
    "phone": "+1234567890",
    "address": "123 Tech Street, San Francisco, CA"
  },
  "location": "San Francisco, CA",
  "jobType": "Full-time",
  "skillTags": ["JavaScript", "Node.js", "React"],
  "salaryRange": {
    "min": 120000,
    "max": 180000,
    "currency": "USD"
  },
  "experienceLevel": "Senior Level",
  "status": "Active",
  "templateVariables": {
    "customVar1": "value1",
    "customVar2": "value2"
  }
}
```

**Response:** `201 Created` (job object with template variables replaced in description)

---

## Error Responses

### 400 Bad Request
```json
{
  "code": 400,
  "message": "Validation error message"
}
```

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
  "message": "Forbidden"
}
```

### 404 Not Found
```json
{
  "code": 404,
  "message": "Job not found"
}
```

---

## Notes

1. **Access Control:**
   - Users can only access their own jobs (unless admin)
   - Admin users have full access to all jobs

2. **Search Functionality:**
   - The `search` parameter searches across: title, organisation name, job description, location, and skill tags
   - Search is case-insensitive

3. **Template Variables:**
   - Common variables: `{{organisationName}}`, `{{jobTitle}}`, `{{location}}`
   - Custom variables can be defined in template and replaced via `templateVariables` object

4. **Excel Import:**
   - Supports multiple column name variations (e.g., "Job Title" or "Title")
   - Skill tags can be semicolon-separated
   - Returns detailed error report for failed rows

5. **Pagination:**
   - Default page size: 10
   - Maximum recommended page size: 100
   - Response includes: `page`, `limit`, `totalPages`, `totalResults`

