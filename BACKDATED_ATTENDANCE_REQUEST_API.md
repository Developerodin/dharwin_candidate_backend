# Backdated Attendance Request API Documentation

## Overview

This API allows candidates to request backdated attendance (punch-in/punch-out for past dates) with admin approval workflow. Administrators can view, approve, reject, update, or comment on these requests. When approved, attendance records are automatically created or updated in the attendance calendar.

**Base URL:** `/v1/backdated-attendance-requests`

**Authentication:** All endpoints require JWT authentication:
```
Authorization: Bearer <your-jwt-token>
```

---

## Important Notes

### Two Ways to Handle Backdated Attendance

**1. Direct Update (Existing API - No Approval Required):**
- Use `POST /v1/attendance/punch-in/:candidateId` with `punchInTime` parameter
- Then `POST /v1/attendance/punch-out/:candidateId` with `punchOutTime` parameter
- **Use Case**: When admin or candidate owner directly updates attendance without needing approval
- **Access**: Candidate owner or admin can use directly
- **Example**: Admin correcting attendance immediately

**2. Request System (This API - Requires Approval):**
- Use `POST /v1/backdated-attendance-requests/candidate/:candidateId` to create request
- Admin reviews and approves/rejects
- **Use Case**: When candidates need to request backdated attendance and get admin approval
- **Access**: Candidates create requests, admin approves
- **Example**: Candidate forgot to punch in, needs approval

### Backdated Attendance Request Workflow
- **Candidate Flow**: Request → Pending → Approved/Rejected/Cancelled
- **Admin Flow**: View Pending → Approve/Reject/Update with Comment
- **Automatic Attendance Creation**: When approved, attendance record is automatically created/updated
- **Past Dates Only**: Requests can only be made for dates before today

### Permissions
- **Create Request**: Candidate owner or admin
- **View Requests**: Candidate sees own requests, admin sees all
- **Approve/Reject/Update**: Admin only (requires `manageCandidates` permission)
- **Cancel**: Candidate can cancel own pending requests, admin can cancel any pending

### Request Status
- `pending` - Request created, awaiting admin review
- `approved` - Admin approved, attendance record created/updated
- `rejected` - Admin rejected with optional comment
- `cancelled` - Request cancelled by candidate or admin

### Key Features
- **Multiple Dates**: Request backdated attendance for multiple dates in a single request
- **Individual Times**: Each date can have its own punch-in and punch-out times
- **Flexible Timezones**: Each date can have its own timezone
- **Admin Updates**: Admin can update requests before approval
- **Automatic Creation**: Automatic attendance record creation/update on approval (one record per date)
- **Smart Updates**: If attendance already exists for a date, it gets updated
- **Punch-in Only**: Supports punch-in only or punch-in/punch-out pairs
- **Duplicate Prevention**: Prevents duplicate dates within the same request
- **Partial Success**: If some dates fail, successful ones are still processed

---

## Endpoints

### 1. Create Backdated Attendance Request

Create a new backdated attendance request for a past date.

**Endpoint:** `POST /v1/backdated-attendance-requests/candidate/:candidateId`

**Access:** Candidate owner or admin

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `candidateId` | string | Candidate ID (ObjectId) |

**Request Body:**
```json
{
  "attendanceEntries": [
    {
      "date": "2024-01-15T00:00:00.000Z",
      "punchIn": "2024-01-15T09:00:00.000Z",
      "punchOut": "2024-01-15T18:00:00.000Z",
      "timezone": "Asia/Kolkata"
    },
    {
      "date": "2024-01-16T00:00:00.000Z",
      "punchIn": "2024-01-16T09:00:00.000Z",
      "punchOut": "2024-01-16T18:00:00.000Z",
      "timezone": "Asia/Kolkata"
    }
  ],
  "notes": "Forgot to punch in for multiple days"
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `attendanceEntries` | array | Yes | Array of attendance entries (min 1 entry) |
| `attendanceEntries[].date` | date | Yes | Date for the attendance (must be in the past) |
| `attendanceEntries[].punchIn` | date | Yes | Punch in time for this date |
| `attendanceEntries[].punchOut` | date | No | Punch out time for this date (optional, can be null) |
| `attendanceEntries[].timezone` | string | No | Timezone for this date (e.g., 'America/New_York', 'Asia/Kolkata'). Defaults to 'UTC' |
| `notes` | string | No | Optional notes for the entire request (max 1000 characters) |

**Request Example:**
```javascript
// Single date request
const response = await fetch('/v1/backdated-attendance-requests/candidate/507f1f77bcf86cd799439011', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <your-token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    attendanceEntries: [
      {
        date: '2024-01-15T00:00:00.000Z',
        punchIn: '2024-01-15T09:00:00.000Z',
        punchOut: '2024-01-15T18:00:00.000Z',
        timezone: 'Asia/Kolkata'
      }
    ],
    notes: 'Forgot to punch in yesterday'
  })
});

// Multiple dates request
const responseMultiple = await fetch('/v1/backdated-attendance-requests/candidate/507f1f77bcf86cd799439011', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <your-token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    attendanceEntries: [
      {
        date: '2024-01-15T00:00:00.000Z',
        punchIn: '2024-01-15T09:00:00.000Z',
        punchOut: '2024-01-15T18:00:00.000Z',
        timezone: 'Asia/Kolkata'
      },
      {
        date: '2024-01-16T00:00:00.000Z',
        punchIn: '2024-01-16T09:00:00.000Z',
        punchOut: '2024-01-16T18:00:00.000Z',
        timezone: 'Asia/Kolkata'
      },
      {
        date: '2024-01-17T00:00:00.000Z',
        punchIn: '2024-01-17T09:00:00.000Z',
        punchOut: null,  // Punch-in only
        timezone: 'Asia/Kolkata'
      }
    ],
    notes: 'Forgot to punch in for multiple days'
  })
});

const data = await response.json();
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Backdated attendance request created successfully",
  "data": {
    "_id": "695e41cf25efdc9d7322f608",
    "candidate": {
      "_id": "507f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "email": "john@example.com"
    },
    "candidateEmail": "john@example.com",
    "attendanceEntries": [
      {
        "date": "2024-01-15T00:00:00.000Z",
        "punchIn": "2024-01-15T09:00:00.000Z",
        "punchOut": "2024-01-15T18:00:00.000Z",
        "timezone": "Asia/Kolkata"
      },
      {
        "date": "2024-01-16T00:00:00.000Z",
        "punchIn": "2024-01-16T09:00:00.000Z",
        "punchOut": "2024-01-16T18:00:00.000Z",
        "timezone": "Asia/Kolkata"
      }
    ],
    "notes": "Forgot to punch in for multiple days",
    "status": "pending",
    "adminComment": null,
    "requestedBy": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "reviewedBy": null,
    "reviewedAt": null,
    "createdAt": "2024-01-16T10:00:00.000Z",
    "updatedAt": "2024-01-16T10:00:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request - Future Date:**
```json
{
  "code": 400,
  "message": "Backdated attendance requests can only be made for past dates"
}
```

**400 Bad Request - Invalid Punch Times:**
```json
{
  "code": 400,
  "message": "Punch out time must be after punch in time"
}
```

**400 Bad Request - Duplicate Pending Request:**
```json
{
  "code": 400,
  "message": "You already have pending backdated attendance requests for: 2024-01-15, 2024-01-16"
}
```

**400 Bad Request - Duplicate Dates in Request:**
```json
{
  "code": 400,
  "message": "Attendance entry 2: Duplicate date 2024-01-15 in the same request"
}
```

**400 Bad Request - Empty Entries:**
```json
{
  "code": 400,
  "message": "At least one attendance entry is required"
}
```

**403 Forbidden:**
```json
{
  "code": 403,
  "message": "You can only create backdated attendance requests for yourself"
}
```

---

### 2. Get Backdated Attendance Requests by Candidate

Get all backdated attendance requests for a specific candidate.

**Endpoint:** `GET /v1/backdated-attendance-requests/candidate/:candidateId`

**Access:** Candidate owner or admin

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `candidateId` | string | Candidate ID (ObjectId) |

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: `pending`, `approved`, `rejected`, `cancelled` |
| `sortBy` | string | Sort option (e.g., `createdAt:desc`, `date:asc`) |
| `limit` | number | Maximum results per page (default: 10) |
| `page` | number | Page number (default: 1) |

**Request Example:**
```javascript
const response = await fetch('/v1/backdated-attendance-requests/candidate/507f1f77bcf86cd799439011?status=pending', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer <your-token>'
  }
});

const data = await response.json();
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "_id": "695e41cf25efdc9d7322f608",
        "candidate": {
          "_id": "507f1f77bcf86cd799439011",
          "fullName": "John Doe",
          "email": "john@example.com"
        },
        "date": "2024-01-15T00:00:00.000Z",
        "punchIn": "2024-01-15T09:00:00.000Z",
        "punchOut": "2024-01-15T18:00:00.000Z",
        "status": "pending",
        "createdAt": "2024-01-16T10:00:00.000Z"
      }
    ],
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 1
  }
}
```

---

### 3. Get All Backdated Attendance Requests

Get all backdated attendance requests with optional filtering. Candidates see only their own requests, admins see all.

**Endpoint:** `GET /v1/backdated-attendance-requests`

**Access:** Authenticated users (filtered by ownership)

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `candidate` | string | Filter by candidate ID (admin only) |
| `status` | string | Filter by status: `pending`, `approved`, `rejected`, `cancelled` |
| `sortBy` | string | Sort option (e.g., `createdAt:desc`) |
| `limit` | number | Maximum results per page (default: 10) |
| `page` | number | Page number (default: 1) |

**Request Example:**
```javascript
// Get all pending requests (admin)
const response = await fetch('/v1/backdated-attendance-requests?status=pending&sortBy=createdAt:desc', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer <admin-token>'
  }
});

const data = await response.json();
```

---

### 4. Get Backdated Attendance Request by ID

Get a specific backdated attendance request by its ID.

**Endpoint:** `GET /v1/backdated-attendance-requests/:requestId`

**Access:** Candidate owner or admin

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `requestId` | string | Backdated attendance request ID (ObjectId) |

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "695e41cf25efdc9d7322f608",
    "candidate": {
      "_id": "507f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "email": "john@example.com"
    },
    "date": "2024-01-15T00:00:00.000Z",
    "punchIn": "2024-01-15T09:00:00.000Z",
    "punchOut": "2024-01-15T18:00:00.000Z",
    "timezone": "Asia/Kolkata",
    "notes": "Forgot to punch in yesterday",
    "status": "pending",
    "adminComment": null,
    "requestedBy": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "reviewedBy": null,
    "reviewedAt": null,
    "createdAt": "2024-01-16T10:00:00.000Z",
    "updatedAt": "2024-01-16T10:00:00.000Z"
  }
}
```

---

### 5. Approve Backdated Attendance Request

Approve a backdated attendance request. This automatically creates or updates the attendance record.

**Endpoint:** `PATCH /v1/backdated-attendance-requests/:requestId/approve`

**Access:** Admin only (requires `manageCandidates` permission)

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `requestId` | string | Backdated attendance request ID (ObjectId) |

**Request Body:**
```json
{
  "adminComment": "Approved - attendance updated"
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `adminComment` | string | No | Optional admin comment (max 1000 characters) |

**Request Example:**
```javascript
const response = await fetch('/v1/backdated-attendance-requests/695e41cf25efdc9d7322f608/approve', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer <admin-token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    adminComment: 'Approved - attendance updated'
  })
});

const data = await response.json();
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Backdated attendance request approved. 2 attendance record(s) created/updated successfully",
  "data": {
    "request": {
      "_id": "695e41cf25efdc9d7322f608",
      "status": "approved",
      "adminComment": "Approved - attendance updated",
      "attendanceEntries": [
        {
          "date": "2024-01-15T00:00:00.000Z",
          "punchIn": "2024-01-15T09:00:00.000Z",
          "punchOut": "2024-01-15T18:00:00.000Z"
        },
        {
          "date": "2024-01-16T00:00:00.000Z",
          "punchIn": "2024-01-16T09:00:00.000Z",
          "punchOut": "2024-01-16T18:00:00.000Z"
        }
      ],
      "reviewedBy": {
        "_id": "507f1f77bcf86cd799439030",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "reviewedAt": "2024-01-16T11:00:00.000Z"
    },
    "attendances": [
      {
        "_id": "ATTENDANCE_ID_1",
        "candidate": {
          "_id": "507f1f77bcf86cd799439011",
          "fullName": "John Doe",
          "email": "john@example.com"
        },
        "date": "2024-01-15T00:00:00.000Z",
        "punchIn": "2024-01-15T09:00:00.000Z",
        "punchOut": "2024-01-15T18:00:00.000Z",
        "duration": 32400000,
        "status": "Present"
      },
      {
        "_id": "ATTENDANCE_ID_2",
        "candidate": {
          "_id": "507f1f77bcf86cd799439011",
          "fullName": "John Doe",
          "email": "john@example.com"
        },
        "date": "2024-01-16T00:00:00.000Z",
        "punchIn": "2024-01-16T09:00:00.000Z",
        "punchOut": "2024-01-16T18:00:00.000Z",
        "duration": 32400000,
        "status": "Present"
      }
    ]
  }
}
```

**Note:** 
- If attendance already exists for the date, it gets updated
- If attendance doesn't exist, a new record is created
- If approval fails, the request status reverts to `pending`

---

### 6. Reject Backdated Attendance Request

Reject a backdated attendance request with an optional admin comment.

**Endpoint:** `PATCH /v1/backdated-attendance-requests/:requestId/reject`

**Access:** Admin only (requires `manageCandidates` permission)

**Request Body:**
```json
{
  "adminComment": "Cannot approve - date is too far in the past"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Backdated attendance request rejected successfully",
  "data": {
    "_id": "695e41cf25efdc9d7322f608",
    "status": "rejected",
    "adminComment": "Cannot approve - date is too far in the past",
    "reviewedBy": {
      "_id": "507f1f77bcf86cd799439030",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "reviewedAt": "2024-01-16T11:00:00.000Z"
  }
}
```

---

### 7. Update Backdated Attendance Request

Admin can update a pending backdated attendance request before approval.

**Endpoint:** `PATCH /v1/backdated-attendance-requests/:requestId`

**Access:** Admin only (requires `manageCandidates` permission)

**Request Body:**
```json
{
  "attendanceEntries": [
    {
      "date": "2024-01-15T00:00:00.000Z",
      "punchIn": "2024-01-15T09:30:00.000Z",
      "punchOut": "2024-01-15T18:30:00.000Z",
      "timezone": "Asia/Kolkata"
    },
    {
      "date": "2024-01-16T00:00:00.000Z",
      "punchIn": "2024-01-16T09:00:00.000Z",
      "punchOut": "2024-01-16T18:00:00.000Z",
      "timezone": "Asia/Kolkata"
    }
  ],
  "notes": "Updated times"
}
```

**Fields:** All fields are optional, but at least one must be provided:
- `attendanceEntries` - Update the entire array of attendance entries (replaces all entries)
- `notes` - Update notes

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Backdated attendance request updated successfully",
  "data": {
    "_id": "695e41cf25efdc9d7322f608",
    "punchIn": "2024-01-15T09:30:00.000Z",
    "punchOut": "2024-01-15T18:30:00.000Z",
    "notes": "Updated times"
  }
}
```

---

### 8. Cancel Backdated Attendance Request

Cancel a pending backdated attendance request. Candidates can cancel their own requests, admins can cancel any pending request.

**Endpoint:** `POST /v1/backdated-attendance-requests/:requestId/cancel`

**Access:** Candidate owner or admin

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Backdated attendance request cancelled successfully",
  "data": {
    "_id": "695e41cf25efdc9d7322f608",
    "status": "cancelled"
  }
}
```

---

## Complete Workflow Example

### Step 1: Candidate Creates Request
```javascript
// Candidate creates backdated attendance request (multiple dates)
const createRequest = async () => {
  const response = await fetch('/v1/backdated-attendance-requests/candidate/507f1f77bcf86cd799439011', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer <candidate-token>',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      attendanceEntries: [
        {
          date: '2024-01-15T00:00:00.000Z',
          punchIn: '2024-01-15T09:00:00.000Z',
          punchOut: '2024-01-15T18:00:00.000Z',
          timezone: 'Asia/Kolkata'
        },
        {
          date: '2024-01-16T00:00:00.000Z',
          punchIn: '2024-01-16T09:00:00.000Z',
          punchOut: '2024-01-16T18:00:00.000Z',
          timezone: 'Asia/Kolkata'
        }
      ],
      notes: 'Forgot to punch in for multiple days'
    })
  });
  
  const data = await response.json();
  return data.data._id;
};
```

### Step 2: Admin Views Pending Requests
```javascript
// Admin views all pending requests
const getPendingRequests = async () => {
  const response = await fetch('/v1/backdated-attendance-requests?status=pending&sortBy=createdAt:desc', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer <admin-token>'
    }
  });
  
  const data = await response.json();
  return data.data.results;
};
```

### Step 3: Admin Updates Request (Optional)
```javascript
// Admin can update the request before approval
const updateRequest = async (requestId) => {
  const response = await fetch(`/v1/backdated-attendance-requests/${requestId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': 'Bearer <admin-token>',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      attendanceEntries: [
        {
          date: '2024-01-15T00:00:00.000Z',
          punchIn: '2024-01-15T09:30:00.000Z',
          punchOut: '2024-01-15T18:30:00.000Z',
          timezone: 'Asia/Kolkata'
        }
      ],
      notes: 'Corrected punch in time'
    })
  });
  
  return await response.json();
};
```

### Step 4: Admin Approves Request
```javascript
// Admin approves request
const approveRequest = async (requestId) => {
  const response = await fetch(`/v1/backdated-attendance-requests/${requestId}/approve`, {
    method: 'PATCH',
    headers: {
      'Authorization': 'Bearer <admin-token>',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      adminComment: 'Approved - attendance updated'
    })
  });
  
  const data = await response.json();
  console.log('Request approved, attendance created/updated:', data.data.attendance);
};
```

---

## Integration with Attendance System

### How Backdated Attendance Works

**Option 1: Direct Update (Existing APIs)**
```javascript
// Update backdated attendance directly (no approval needed)
// Step 1: Punch in for past date
POST /v1/attendance/punch-in/:candidateId
{
  "punchInTime": "2024-01-15T09:00:00.000Z",
  "timezone": "Asia/Kolkata",
  "notes": "Backdated punch in"
}

// Step 2: Punch out for past date
POST /v1/attendance/punch-out/:candidateId
{
  "punchOutTime": "2024-01-15T18:00:00.000Z",
  "timezone": "Asia/Kolkata",
  "notes": "Backdated punch out"
}
```
- **Access**: Candidate owner or admin
- **No approval required**: Directly creates/updates attendance
- **Use when**: Admin or candidate owner can directly update

**Option 2: Request System (This API)**
```javascript
// Create request for approval
POST /v1/backdated-attendance-requests/candidate/:candidateId
{
  "date": "2024-01-15T00:00:00.000Z",
  "punchIn": "2024-01-15T09:00:00.000Z",
  "punchOut": "2024-01-15T18:00:00.000Z",
  "notes": "Forgot to punch in"
}

// Admin approves
PATCH /v1/backdated-attendance-requests/:requestId/approve
```
- **Access**: Candidates create requests, admin approves
- **Approval required**: Admin must approve before attendance is created/updated
- **Use when**: Candidate needs to request and get approval

**When a backdated attendance request is approved:**

1. System processes each attendance entry in the request
2. For each entry:
   - Checks if attendance record exists for that date
   - **If exists**: Updates the existing attendance record with new punch-in/punch-out times
   - **If not exists**: Creates a new attendance record
   - Sets `status: 'Present'` and calculates duration
3. Returns array of all created/updated attendance records
4. If all entries fail, request status reverts to `pending`
5. If some entries succeed and some fail, partial success is returned with errors

**This ensures:**
- No duplicate attendance records
- Existing attendance can be corrected via backdated requests
- Seamless integration with existing attendance calendar
- Both direct update and request system work together

---

## Summary

### Endpoints
- **Create Request**: `POST /v1/backdated-attendance-requests/candidate/:candidateId`
- **Get Requests**: `GET /v1/backdated-attendance-requests` (with filters)
- **Get by Candidate**: `GET /v1/backdated-attendance-requests/candidate/:candidateId`
- **Get by ID**: `GET /v1/backdated-attendance-requests/:requestId`
- **Update**: `PATCH /v1/backdated-attendance-requests/:requestId` (admin only)
- **Approve**: `PATCH /v1/backdated-attendance-requests/:requestId/approve` (admin only)
- **Reject**: `PATCH /v1/backdated-attendance-requests/:requestId/reject` (admin only)
- **Cancel**: `POST /v1/backdated-attendance-requests/:requestId/cancel`

### Key Features
- Request backdated attendance for past dates only
- Admin can update requests before approval
- Automatic attendance record creation/update on approval
- Updates existing attendance if record already exists
- Supports punch-in only or punch-in/punch-out pairs
- Admin comments on approval/rejection
- Permission-based access control
- Status tracking (pending/approved/rejected/cancelled)

### Use Cases

**When to use Direct Update API (`/v1/attendance/punch-in` and `/v1/attendance/punch-out`):**
- Admin directly correcting attendance
- Candidate owner updating their own attendance
- Immediate updates without approval workflow
- Bulk corrections by admin

**When to use Request System (`/v1/backdated-attendance-requests`):**
- Candidate forgot to punch in/out and needs approval
- Candidate wants to request backdated attendance
- Admin wants to review and approve requests before creating attendance
- Audit trail needed for backdated attendance changes
- Policy requires approval for backdated entries
