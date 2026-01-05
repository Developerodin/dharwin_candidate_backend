# Support Ticket API Documentation

## Overview

The Support Ticket API allows candidates to raise support tickets for issues they encounter on the platform. Admins can view all tickets, manage them, and add comments. Candidates can only view and manage their own tickets.

**Base URL:** `/v1/support-tickets`

**Authentication:** All endpoints require JWT authentication token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## Endpoints

### 1. Create Support Ticket

Create a new support ticket with optional image/video attachments.

**Endpoint:** `POST /v1/support-tickets`

**Access:** Authenticated users (candidates)

**Content-Type:** `multipart/form-data` (when uploading files) or `application/json` (without files)

**Request Body (JSON - without files):**
```json
{
  "title": "Issue with profile upload",
  "description": "I'm unable to upload my profile picture. The upload button is not working.",
  "priority": "Medium",  // Optional: "Low" | "Medium" | "High" | "Urgent" (default: "Medium")
  "category": "Technical"  // Optional: Any string (default: "General")
}
```

**Request Body (FormData - with files):**
```
Content-Type: multipart/form-data

Fields:
- title: "Issue with profile upload" (required)
- description: "I'm unable to upload my profile picture..." (required)
- priority: "Medium" (optional)
- category: "Technical" (optional)
- attachments: [File] (optional, can be multiple)
```

**File Upload Requirements:**
- **Field Name:** `attachments` (use the same field name for all files)
- **Maximum Files:** 10 files per request
- **File Size Limit:** 100MB per file
- **Allowed Image Types:** JPEG, JPG, PNG, GIF, WEBP, BMP, SVG
- **Allowed Video Types:** MP4, WEBM, MOV, AVI, MKV

**Response:** `201 Created`
```json
{
  "id": "507f1f77bcf86cd799439011",
  "ticketId": "TKT-LX8K2M-ABC123",
  "title": "Issue with profile upload",
  "description": "I'm unable to upload my profile picture. The upload button is not working.",
  "status": "Open",
  "priority": "Medium",
  "category": "Technical",
  "attachments": [
    {
      "key": "support-tickets/user123/2024-01-15/screenshot.png",
      "url": "https://s3.amazonaws.com/bucket/support-tickets/...?X-Amz-Algorithm=...",
      "originalName": "screenshot.png",
      "size": 245678,
      "mimeType": "image/png",
      "uploadedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "key": "support-tickets/user123/2024-01-15/error-video.mp4",
      "url": "https://s3.amazonaws.com/bucket/support-tickets/...?X-Amz-Algorithm=...",
      "originalName": "error-video.mp4",
      "size": 5242880,
      "mimeType": "video/mp4",
      "uploadedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "createdBy": {
    "id": "507f1f77bcf86cd799439012",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "candidate": {
    "id": "507f1f77bcf86cd799439013",
    "fullName": "John Doe",
    "email": "john@example.com"
  },
  "assignedTo": null,
  "comments": [],
  "resolvedAt": null,
  "resolvedBy": null,
  "closedAt": null,
  "closedBy": null,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Validation Rules:**
- `title`: Required, 5-200 characters
- `description`: Required, 10-5000 characters
- `priority`: Optional, must be one of: "Low", "Medium", "High", "Urgent"
- `category`: Optional, max 100 characters
- `attachments`: Optional, up to 10 files, 100MB per file

**Error Responses:**

**400 Bad Request - Invalid File Type:**
```json
{
  "code": 400,
  "message": "File type application/pdf is not allowed. Allowed types: Images (JPEG, PNG, GIF, WEBP, BMP, SVG) and Videos (MP4, WEBM, MOV, AVI, MKV)"
}
```

**400 Bad Request - File Too Large:**
```json
{
  "code": 400,
  "message": "File size too large. Maximum size is 100MB per file."
}
```

**400 Bad Request - Too Many Files:**
```json
{
  "code": 400,
  "message": "Too many files. Maximum 10 files allowed."
}
```

**Frontend Implementation Examples:**

**Using Fetch API:**
```javascript
const createSupportTicketWithFiles = async (ticketData, files) => {
  const formData = new FormData();
  
  // Add text fields
  formData.append('title', ticketData.title);
  formData.append('description', ticketData.description);
  if (ticketData.priority) {
    formData.append('priority', ticketData.priority);
  }
  if (ticketData.category) {
    formData.append('category', ticketData.category);
  }
  
  // Add files (multiple files with same field name)
  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append('attachments', file);
    });
  }
  
  const response = await fetch('/v1/support-tickets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
      // Don't set Content-Type header - browser will set it automatically with boundary
    },
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.json();
};

// Usage
const files = document.getElementById('fileInput').files; // FileList
const ticket = await createSupportTicketWithFiles(
  {
    title: 'Bug Report',
    description: 'The application crashes when clicking this button.',
    priority: 'High',
    category: 'Technical'
  },
  Array.from(files)
);
```

**Using Axios:**
```javascript
import axios from 'axios';

const createSupportTicketWithFiles = async (ticketData, files) => {
  const formData = new FormData();
  
  // Add text fields
  formData.append('title', ticketData.title);
  formData.append('description', ticketData.description);
  if (ticketData.priority) {
    formData.append('priority', ticketData.priority);
  }
  if (ticketData.category) {
    formData.append('category', ticketData.category);
  }
  
  // Add files
  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append('attachments', file);
    });
  }
  
  const response = await axios.post('/v1/support-tickets', formData, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data;
};

// Usage
const files = document.getElementById('fileInput').files;
const ticket = await createSupportTicketWithFiles(
  {
    title: 'Bug Report',
    description: 'The application crashes when clicking this button.',
    priority: 'High',
    category: 'Technical'
  },
  Array.from(files)
);
```

**React Component Example:**
```jsx
import React, { useState } from 'react';
import axios from 'axios';

const SupportTicketForm = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [category, setCategory] = useState('General');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('priority', priority);
      formData.append('category', category);
      
      // Add all selected files
      files.forEach((file) => {
        formData.append('attachments', file);
      });

      const token = localStorage.getItem('token');
      const response = await axios.post('/v1/support-tickets', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Ticket created:', response.data);
      // Reset form or redirect
      setTitle('');
      setDescription('');
      setFiles([]);
      alert('Support ticket created successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create support ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Title:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={5}
          maxLength={200}
        />
      </div>
      
      <div>
        <label>Description:</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          minLength={10}
          maxLength={5000}
        />
      </div>
      
      <div>
        <label>Priority:</label>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>
      </div>
      
      <div>
        <label>Category:</label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          maxLength={100}
        />
      </div>
      
      <div>
        <label>Attachments (Images/Videos):</label>
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileChange}
        />
        <small>
          Maximum 10 files, 100MB per file. Allowed: Images (JPEG, PNG, GIF, WEBP, BMP, SVG) 
          and Videos (MP4, WEBM, MOV, AVI, MKV)
        </small>
        {files.length > 0 && (
          <ul>
            {files.map((file, index) => (
              <li key={index}>
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {error && <div style={{ color: 'red' }}>{error}</div>}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Support Ticket'}
      </button>
    </form>
  );
};

export default SupportTicketForm;
```

**Important Notes:**
1. **Content-Type Header:** When using FormData, do NOT manually set `Content-Type: multipart/form-data`. The browser/axios will automatically set it with the correct boundary parameter.
2. **File Field Name:** All files must use the field name `attachments` (plural).
3. **Presigned URLs:** Attachment URLs are presigned S3 URLs valid for 7 days. If you need longer access, you may need to implement a URL refresh mechanism.
4. **File Validation:** Files are validated on the server. Invalid file types or oversized files will return a 400 error.
5. **Optional Files:** File uploads are optional. You can create tickets without any attachments.

---

### 2. Get All Support Tickets

Get a list of support tickets with pagination and filtering.

**Endpoint:** `GET /v1/support-tickets`

**Access:**
- **Candidates:** Only their own tickets
- **Admins:** All tickets

**Query Parameters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `status` | string | Filter by status | `Open`, `In Progress`, `Resolved`, `Closed` |
| `priority` | string | Filter by priority | `Low`, `Medium`, `High`, `Urgent` |
| `category` | string | Filter by category | `Technical`, `General`, etc. |
| `page` | number | Page number (default: 1) | `1` |
| `limit` | number | Items per page (default: 10) | `20` |
| `sortBy` | string | Sort field and order | `createdAt:desc`, `status:asc` |

**Example Request:**
```
GET /v1/support-tickets?status=Open&priority=High&page=1&limit=20&sortBy=createdAt:desc
```

**Response:** `200 OK`
```json
{
  "results": [
    {
      "id": "507f1f77bcf86cd799439011",
      "ticketId": "TKT-LX8K2M-ABC123",
      "title": "Issue with profile upload",
      "description": "I'm unable to upload my profile picture...",
      "status": "Open",
      "priority": "High",
      "category": "Technical",
      "createdBy": {
        "id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user"
      },
      "candidate": {
        "id": "507f1f77bcf86cd799439013",
        "fullName": "John Doe",
        "email": "john@example.com"
      },
      "assignedTo": null,
      "attachments": [
        {
          "key": "support-tickets/user123/2024-01-15/screenshot.png",
          "url": "https://s3.amazonaws.com/bucket/support-tickets/...?X-Amz-Algorithm=...",
          "originalName": "screenshot.png",
          "size": 245678,
          "mimeType": "image/png",
          "uploadedAt": "2024-01-15T10:30:00.000Z"
        }
      ],
      "comments": [
        {
          "id": "507f1f77bcf86cd799439014",
          "content": "We're looking into this issue.",
          "commentedBy": {
            "id": "507f1f77bcf86cd799439015",
            "name": "Admin User",
            "email": "admin@example.com",
            "role": "admin"
          },
          "isAdminComment": true,
          "createdAt": "2024-01-15T11:00:00.000Z",
          "updatedAt": "2024-01-15T11:00:00.000Z"
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "totalPages": 5,
  "totalResults": 100
}
```

---

### 3. Get Single Support Ticket

Get detailed information about a specific support ticket.

**Endpoint:** `GET /v1/support-tickets/:ticketId`

**Access:**
- **Candidates:** Only their own tickets
- **Admins:** Any ticket

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `ticketId` | string | MongoDB ObjectId of the ticket |

**Example Request:**
```
GET /v1/support-tickets/507f1f77bcf86cd799439011
```

**Response:** `200 OK`
```json
{
  "id": "507f1f77bcf86cd799439011",
  "ticketId": "TKT-LX8K2M-ABC123",
  "title": "Issue with profile upload",
  "description": "I'm unable to upload my profile picture. The upload button is not working.",
  "status": "In Progress",
  "priority": "High",
  "category": "Technical",
  "createdBy": {
    "id": "507f1f77bcf86cd799439012",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "candidate": {
    "id": "507f1f77bcf86cd799439013",
    "fullName": "John Doe",
    "email": "john@example.com"
  },
  "assignedTo": {
    "id": "507f1f77bcf86cd799439016",
    "name": "Support Admin",
    "email": "support@example.com",
    "role": "admin"
  },
  "attachments": [
    {
      "key": "support-tickets/user123/2024-01-15/screenshot.png",
      "url": "https://s3.amazonaws.com/bucket/support-tickets/...?X-Amz-Algorithm=...",
      "originalName": "screenshot.png",
      "size": 245678,
      "mimeType": "image/png",
      "uploadedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "comments": [
    {
      "id": "507f1f77bcf86cd799439014",
      "content": "We're looking into this issue. Can you try clearing your browser cache?",
      "commentedBy": {
        "id": "507f1f77bcf86cd799439015",
        "name": "Admin User",
        "email": "admin@example.com",
        "role": "admin"
      },
      "isAdminComment": true,
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    },
    {
      "id": "507f1f77bcf86cd799439017",
      "content": "I cleared the cache but the issue persists.",
      "commentedBy": {
        "id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user"
      },
      "isAdminComment": false,
      "createdAt": "2024-01-15T11:30:00.000Z",
      "updatedAt": "2024-01-15T11:30:00.000Z"
    }
  ],
  "resolvedAt": null,
  "resolvedBy": null,
  "closedAt": null,
  "closedBy": null,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:30:00.000Z"
}
```

**Error Responses:**
- `404 Not Found`: Ticket not found
- `403 Forbidden`: User trying to access another user's ticket

---

### 4. Update Support Ticket

Update a support ticket (status, priority, category, assignment).

**Endpoint:** `PATCH /v1/support-tickets/:ticketId`

**Access:**
- **Candidates:** Can only close their own tickets (`status: "Closed"`)
- **Admins:** Can update all fields

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `ticketId` | string | MongoDB ObjectId of the ticket |

**Request Body (Admin):**
```json
{
  "status": "In Progress",  // Optional: "Open" | "In Progress" | "Resolved" | "Closed"
  "priority": "High",  // Optional: "Low" | "Medium" | "High" | "Urgent"
  "category": "Technical",  // Optional: Any string
  "assignedTo": "507f1f77bcf86cd799439016"  // Optional: User ID to assign ticket to
}
```

**Request Body (Candidate - can only close):**
```json
{
  "status": "Closed"
}
```

**Example Request:**
```
PATCH /v1/support-tickets/507f1f77bcf86cd799439011
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "Resolved",
  "priority": "Medium"
}
```

**Response:** `200 OK`
```json
{
  "id": "507f1f77bcf86cd799439011",
  "ticketId": "TKT-LX8K2M-ABC123",
  "title": "Issue with profile upload",
  "description": "I'm unable to upload my profile picture...",
  "status": "Resolved",
  "priority": "Medium",
  "category": "Technical",
  "createdBy": { ... },
  "candidate": { ... },
  "assignedTo": { ... },
  "attachments": [ ... ],
  "resolvedAt": "2024-01-15T12:00:00.000Z",
  "resolvedBy": {
    "id": "507f1f77bcf86cd799439015",
    "name": "Admin User",
    "email": "admin@example.com"
  },
  "comments": [ ... ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T12:00:00.000Z"
}
```

**Note:** When status is updated to "Resolved" or "Closed", the system automatically sets `resolvedAt`/`resolvedBy` or `closedAt`/`closedBy` fields.

---

### 5. Add Comment to Ticket

Add a comment to a support ticket.

**Endpoint:** `POST /v1/support-tickets/:ticketId/comments`

**Access:** 
- **Candidates:** Can comment on their own tickets
- **Admins:** Can comment on any ticket

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `ticketId` | string | MongoDB ObjectId of the ticket |

**Request Body:**
```json
{
  "content": "We're looking into this issue. Can you try clearing your browser cache?"
}
```

**Example Request:**
```
POST /v1/support-tickets/507f1f77bcf86cd799439011/comments
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "We're looking into this issue. Can you try clearing your browser cache?"
}
```

**Response:** `200 OK`
```json
{
  "id": "507f1f77bcf86cd799439011",
  "ticketId": "TKT-LX8K2M-ABC123",
  "title": "Issue with profile upload",
  "description": "I'm unable to upload my profile picture...",
  "status": "Open",
  "priority": "High",
  "category": "Technical",
  "createdBy": { ... },
  "candidate": { ... },
  "attachments": [ ... ],
  "comments": [
    {
      "id": "507f1f77bcf86cd799439014",
      "content": "We're looking into this issue. Can you try clearing your browser cache?",
      "commentedBy": {
        "id": "507f1f77bcf86cd799439015",
        "name": "Admin User",
        "email": "admin@example.com",
        "role": "admin"
      },
      "isAdminComment": true,
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
    }
  ],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

**Validation Rules:**
- `content`: Required, 5-2000 characters

**Error Responses:**
- `400 Bad Request`: Cannot add comment to closed ticket
- `404 Not Found`: Ticket not found
- `403 Forbidden`: User trying to comment on another user's ticket

---

### 6. Delete Support Ticket

Delete a support ticket (admin only).

**Endpoint:** `DELETE /v1/support-tickets/:ticketId`

**Access:** Admin only

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `ticketId` | string | MongoDB ObjectId of the ticket |

**Example Request:**
```
DELETE /v1/support-tickets/507f1f77bcf86cd799439011
Authorization: Bearer <admin_token>
```

**Response:** `204 No Content`

**Error Responses:**
- `404 Not Found`: Ticket not found
- `403 Forbidden`: Only admin can delete tickets

---

## Ticket Status Flow

```
Open → In Progress → Resolved → Closed
  ↓                              ↑
  └──────────────────────────────┘
  (Can be closed directly from any status)
```

**Status Descriptions:**
- **Open:** Newly created ticket, awaiting review
- **In Progress:** Ticket is being worked on
- **Resolved:** Issue has been resolved
- **Closed:** Ticket is closed (can be closed by candidate or admin)

---

## Priority Levels

- **Low:** Minor issues, can be addressed later
- **Medium:** Standard priority (default)
- **High:** Important issues requiring attention
- **Urgent:** Critical issues requiring immediate attention

---

## Permission Matrix

| Action | Candidate | Admin |
|--------|-----------|-------|
| Create ticket | ✅ | ✅ |
| View own tickets | ✅ | ✅ |
| View all tickets | ❌ | ✅ |
| View any ticket | ❌ | ✅ |
| Update own ticket (close only) | ✅ | ✅ |
| Update any ticket | ❌ | ✅ |
| Comment on own ticket | ✅ | ✅ |
| Comment on any ticket | ❌ | ✅ |
| Delete ticket | ❌ | ✅ |

---

## Error Responses

All endpoints may return the following error responses:

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
  "message": "Forbidden - You don't have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "code": 404,
  "message": "Support ticket not found"
}
```

### 500 Internal Server Error
```json
{
  "code": 500,
  "message": "Internal server error"
}
```

---

## Frontend Integration Examples

### React/JavaScript Example

```javascript
// Create a support ticket
const createTicket = async (ticketData) => {
  const response = await fetch('/v1/support-tickets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      title: ticketData.title,
      description: ticketData.description,
      priority: ticketData.priority || 'Medium',
      category: ticketData.category || 'General'
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.json();
};

// Get all tickets
const getTickets = async (filters = {}) => {
  const queryParams = new URLSearchParams({
    page: filters.page || 1,
    limit: filters.limit || 20,
    ...(filters.status && { status: filters.status }),
    ...(filters.priority && { priority: filters.priority }),
    ...(filters.category && { category: filters.category }),
    ...(filters.sortBy && { sortBy: filters.sortBy })
  });
  
  const response = await fetch(`/v1/support-tickets?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  return await response.json();
};

// Get single ticket
const getTicket = async (ticketId) => {
  const response = await fetch(`/v1/support-tickets/${ticketId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.json();
};

// Add comment
const addComment = async (ticketId, content) => {
  const response = await fetch(`/v1/support-tickets/${ticketId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ content })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.json();
};

// Update ticket (admin only)
const updateTicket = async (ticketId, updateData) => {
  const response = await fetch(`/v1/support-tickets/${ticketId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(updateData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.json();
};
```

---

## Notes for Frontend Developers

1. **Ticket ID vs MongoDB ID:**
   - Use `ticketId` (e.g., "TKT-LX8K2M-ABC123") for display purposes
   - Use `id` (MongoDB ObjectId) for API calls

2. **Comment Visibility:**
   - All comments are visible to both candidate and admin
   - Use `isAdminComment` field to differentiate admin comments in the UI

3. **Status Updates:**
   - When a ticket is resolved or closed, the system automatically sets timestamps and user references
   - Candidates can only close their own tickets, not resolve them

4. **Real-time Updates:**
   - Consider implementing polling or WebSocket connections to show new comments in real-time
   - Poll the ticket endpoint every few seconds or use Socket.io if available

5. **Error Handling:**
   - Always check response status before parsing JSON
   - Handle 403 errors gracefully (show permission denied message)
   - Handle 404 errors (ticket may have been deleted)

6. **Pagination:**
   - Use the `totalPages` and `totalResults` fields to implement pagination UI
   - Default page size is 10, but can be adjusted with `limit` parameter

---

## Quick Reference

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/v1/support-tickets` | Create ticket | ✅ |
| GET | `/v1/support-tickets` | List tickets | ✅ |
| GET | `/v1/support-tickets/:id` | Get ticket | ✅ |
| PATCH | `/v1/support-tickets/:id` | Update ticket | ✅ |
| POST | `/v1/support-tickets/:id/comments` | Add comment | ✅ |
| DELETE | `/v1/support-tickets/:id` | Delete ticket | ✅ (Admin) |

---

**Last Updated:** January 2024

