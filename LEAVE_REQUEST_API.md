# Leave Request API Documentation

## Overview

This API allows candidates to request leaves with multiple dates, leave types, and notes. Administrators can then approve, reject, or comment on these requests. When approved, leaves are automatically assigned to the candidate's attendance calendar using the existing leave assignment system.

**Base URL:** `/v1/leave-requests`

**Authentication:** All endpoints require JWT authentication:
```
Authorization: Bearer <your-jwt-token>
```

---

## Important Notes

### Leave Request Workflow
- **Candidate Flow**: Request → Pending → Approved/Rejected/Cancelled
- **Admin Flow**: View Pending → Approve/Reject with Comment
- **Automatic Assignment**: When approved, leave is automatically assigned using the existing leave assignment system (`POST /v1/attendance/leaves`)
- **Leave Limits**: System validates leave limits (casual: 21, sick: 5, unpaid: unlimited)

### Connection with Leave Assignment API

**Two Ways to Assign Leaves:**

1. **Leave Request System** (This API):
   - Candidate creates a request → Admin approves → Leave automatically assigned
   - **Endpoint**: `POST /v1/leave-requests/candidate/:candidateId` → `PATCH /v1/leave-requests/:requestId/approve`
   - **Use Case**: Candidate-initiated leave requests with approval workflow

2. **Direct Leave Assignment** (Existing API):
   - Admin directly assigns leaves without request
   - **Endpoint**: `POST /v1/attendance/leaves`
   - **Use Case**: Admin-initiated leave assignment (bulk assignment, emergency leaves, etc.)

**Both systems:**
- Use the same underlying `assignLeavesToCandidates()` function
- Create the same data structure:
  - Add entries to `candidate.leaves[]` array
  - Create `Attendance` records with `status: 'Leave'`
- Validate the same leave limits
- Support the same leave types: `casual`, `sick`, `unpaid`

**When a leave request is approved:**
- The system automatically calls `POST /v1/attendance/leaves` internally
- Creates leave entries in `candidate.leaves[]` array
- Creates `Attendance` records with `status: 'Leave'` and `leaveType`
- If assignment fails, the request status reverts to `pending`

**See also:** [Candidate Leave Assignment API](./CANDIDATE_LEAVE_ASSIGNMENT_API.md) for direct leave assignment

### Permissions
- **Create Request**: Candidate owner or admin
- **View Requests**: Candidate sees own requests, admin sees all
- **Approve/Reject**: Admin only (requires `manageCandidates` permission)
- **Cancel**: Candidate can cancel own pending requests, admin can cancel any pending

### Request Status
- `pending` - Request created, awaiting admin review
- `approved` - Admin approved, leave automatically assigned
- `rejected` - Admin rejected with optional comment
- `cancelled` - Request cancelled by candidate or admin

### Leave Types
- `casual` - Casual leave (paid, limit: 21 days)
- `sick` - Sick leave (paid, limit: 5 days)
- `unpaid` - Unpaid leave (no limit)

---

## Endpoints

### 1. Create Leave Request

Create a new leave request with multiple dates, leave type, and optional notes.

**Endpoint:** `POST /v1/leave-requests/candidate/:candidateId`

**Access:** Candidate owner or admin

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `candidateId` | string | Candidate ID (ObjectId) |

**Request Body:**
```json
{
  "dates": [
    "2024-01-15T00:00:00.000Z",
    "2024-01-16T00:00:00.000Z",
    "2024-01-17T00:00:00.000Z"
  ],
  "leaveType": "casual",
  "notes": "Family vacation"
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `dates` | array | Yes | Array of ISO 8601 date strings (min 1 date) |
| `leaveType` | string | Yes | Leave type: `"casual"`, `"sick"`, or `"unpaid"` |
| `notes` | string | No | Optional notes (max 1000 characters) |

**Request Example:**
```javascript
const response = await fetch('/v1/leave-requests/candidate/507f1f77bcf86cd799439011', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <your-token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    dates: [
      '2024-01-15T00:00:00.000Z',
      '2024-01-16T00:00:00.000Z',
      '2024-01-17T00:00:00.000Z'
    ],
    leaveType: 'casual',
    notes: 'Family vacation'
  })
});

const data = await response.json();
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Leave request created successfully",
  "data": {
    "_id": "695e41cf25efdc9d7322f608",
    "candidate": {
      "_id": "507f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "email": "john@example.com"
    },
    "candidateEmail": "john@example.com",
    "dates": [
      "2024-01-15T00:00:00.000Z",
      "2024-01-16T00:00:00.000Z",
      "2024-01-17T00:00:00.000Z"
    ],
    "leaveType": "casual",
    "notes": "Family vacation",
    "status": "pending",
    "adminComment": null,
    "requestedBy": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "reviewedBy": null,
    "reviewedAt": null,
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T10:00:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request - Empty Dates:**
```json
{
  "code": 400,
  "message": "At least one date is required"
}
```

**400 Bad Request - Invalid Leave Type:**
```json
{
  "code": 400,
  "message": "Leave type must be either \"casual\", \"sick\", or \"unpaid\""
}
```

**400 Bad Request - Duplicate Pending Request:**
```json
{
  "code": 400,
  "message": "You already have pending leave requests for: 2024-01-15, 2024-01-16"
}
```

**403 Forbidden:**
```json
{
  "code": 403,
  "message": "You can only create leave requests for yourself"
}
```

**404 Not Found:**
```json
{
  "code": 404,
  "message": "Candidate not found"
}
```

---

### 2. Get Leave Requests by Candidate

Get all leave requests for a specific candidate with optional filtering.

**Endpoint:** `GET /v1/leave-requests/candidate/:candidateId`

**Access:** Candidate owner or admin

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `candidateId` | string | Candidate ID (ObjectId) |

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status: `pending`, `approved`, `rejected`, `cancelled` |
| `sortBy` | string | Sort option (e.g., `createdAt:desc`, `status:asc`) |
| `limit` | number | Maximum results per page (default: 10) |
| `page` | number | Page number (default: 1) |

**Request Example:**
```javascript
// Get all requests for a candidate
const response = await fetch('/v1/leave-requests/candidate/507f1f77bcf86cd799439011', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer <your-token>'
  }
});

// Get only pending requests
const response2 = await fetch('/v1/leave-requests/candidate/507f1f77bcf86cd799439011?status=pending', {
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
        "dates": [
          "2024-01-15T00:00:00.000Z",
          "2024-01-16T00:00:00.000Z"
        ],
        "leaveType": "casual",
        "notes": "Family vacation",
        "status": "pending",
        "adminComment": null,
        "requestedBy": {
          "_id": "507f1f77bcf86cd799439020",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "reviewedBy": null,
        "reviewedAt": null,
        "createdAt": "2024-01-10T10:00:00.000Z",
        "updatedAt": "2024-01-10T10:00:00.000Z"
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

### 3. Get All Leave Requests

Get all leave requests with optional filtering. Candidates see only their own requests, admins see all.

**Endpoint:** `GET /v1/leave-requests`

**Access:** Authenticated users (filtered by ownership)

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `candidate` | string | Filter by candidate ID (admin only) |
| `status` | string | Filter by status: `pending`, `approved`, `rejected`, `cancelled` |
| `leaveType` | string | Filter by leave type: `casual`, `sick`, `unpaid` |
| `sortBy` | string | Sort option (e.g., `createdAt:desc`) |
| `limit` | number | Maximum results per page (default: 10) |
| `page` | number | Page number (default: 1) |

**Request Example:**
```javascript
// Get all pending requests (admin)
const response = await fetch('/v1/leave-requests?status=pending&sortBy=createdAt:desc', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer <admin-token>'
  }
});

// Get casual leave requests for a specific candidate (admin)
const response2 = await fetch('/v1/leave-requests?candidate=507f1f77bcf86cd799439011&leaveType=casual', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer <admin-token>'
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
        "dates": ["2024-01-15T00:00:00.000Z"],
        "leaveType": "casual",
        "status": "pending",
        "createdAt": "2024-01-10T10:00:00.000Z"
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

### 4. Get Leave Request by ID

Get a specific leave request by its ID.

**Endpoint:** `GET /v1/leave-requests/:requestId`

**Access:** Candidate owner or admin

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `requestId` | string | Leave request ID (ObjectId) |

**Request Example:**
```javascript
const response = await fetch('/v1/leave-requests/695e41cf25efdc9d7322f608', {
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
    "_id": "695e41cf25efdc9d7322f608",
    "candidate": {
      "_id": "507f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "email": "john@example.com"
    },
    "candidateEmail": "john@example.com",
    "dates": [
      "2024-01-15T00:00:00.000Z",
      "2024-01-16T00:00:00.000Z"
    ],
    "leaveType": "casual",
    "notes": "Family vacation",
    "status": "pending",
    "adminComment": null,
    "requestedBy": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "reviewedBy": null,
    "reviewedAt": null,
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T10:00:00.000Z"
  }
}
```

**404 Not Found:**
```json
{
  "code": 404,
  "message": "Leave request not found"
}
```

---

### 5. Approve Leave Request

Approve a leave request. This automatically assigns the leave to the candidate's attendance calendar.

**Endpoint:** `PATCH /v1/leave-requests/:requestId/approve`

**Access:** Admin only (requires `manageCandidates` permission)

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `requestId` | string | Leave request ID (ObjectId) |

**Request Body:**
```json
{
  "adminComment": "Approved - enjoy your vacation!"
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `adminComment` | string | No | Optional admin comment (max 1000 characters) |

**Request Example:**
```javascript
const response = await fetch('/v1/leave-requests/695e41cf25efdc9d7322f608/approve', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer <admin-token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    adminComment: 'Approved - enjoy your vacation!'
  })
});

const data = await response.json();
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Leave request approved and leave assigned successfully",
  "data": {
    "leaveRequest": {
      "_id": "695e41cf25efdc9d7322f608",
      "candidate": {
        "_id": "507f1f77bcf86cd799439011",
        "fullName": "John Doe",
        "email": "john@example.com"
      },
      "dates": ["2024-01-15T00:00:00.000Z"],
      "leaveType": "casual",
      "status": "approved",
      "adminComment": "Approved - enjoy your vacation!",
      "reviewedBy": {
        "_id": "507f1f77bcf86cd799439030",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "reviewedAt": "2024-01-11T09:00:00.000Z"
    },
    "leaveAssignment": {
      "success": true,
      "message": "Leaves assigned to 1 candidate(s). Created 1 attendance record(s).",
      "data": {
        "candidatesUpdated": 1,
        "leaveType": "casual",
        "dates": ["2024-01-15T00:00:00.000Z"],
        "totalDays": 1,
        "attendanceRecordsCreated": 1,
        "createdRecords": [...]
      }
    }
  }
}
```

**Error Responses:**

**400 Bad Request - Invalid Status:**
```json
{
  "code": 400,
  "message": "Cannot approve leave request. Current status is: rejected"
}
```

**400 Bad Request - Leave Limit Exceeded:**
```json
{
  "code": 400,
  "message": "Cannot assign 3 casual leave(s). Candidate already has 20 casual leave(s). Maximum allowed: 21 casual leave(s)."
}
```

**403 Forbidden:**
```json
{
  "code": 403,
  "message": "Only admin can approve leave requests"
}
```

**500 Internal Server Error - Assignment Failed:**
```json
{
  "code": 500,
  "message": "Failed to assign leave: [error details]"
}
```

**Note:** 
- If leave assignment fails, the request status is automatically reverted to `pending`
- The approval process internally calls `POST /v1/attendance/leaves` to assign the leave
- This creates the same data structure as direct leave assignment (see [Candidate Leave Assignment API](./CANDIDATE_LEAVE_ASSIGNMENT_API.md))

---

### 6. Reject Leave Request

Reject a leave request with an optional admin comment.

**Endpoint:** `PATCH /v1/leave-requests/:requestId/reject`

**Access:** Admin only (requires `manageCandidates` permission)

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `requestId` | string | Leave request ID (ObjectId) |

**Request Body:**
```json
{
  "adminComment": "Not enough casual leave balance remaining"
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `adminComment` | string | No | Optional admin comment explaining rejection (max 1000 characters) |

**Request Example:**
```javascript
const response = await fetch('/v1/leave-requests/695e41cf25efdc9d7322f608/reject', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer <admin-token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    adminComment: 'Not enough casual leave balance remaining'
  })
});

const data = await response.json();
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Leave request rejected successfully",
  "data": {
    "_id": "695e41cf25efdc9d7322f608",
    "candidate": {
      "_id": "507f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "email": "john@example.com"
    },
    "dates": ["2024-01-15T00:00:00.000Z"],
    "leaveType": "casual",
    "status": "rejected",
    "adminComment": "Not enough casual leave balance remaining",
    "reviewedBy": {
      "_id": "507f1f77bcf86cd799439030",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "reviewedAt": "2024-01-11T09:00:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request - Invalid Status:**
```json
{
  "code": 400,
  "message": "Cannot reject leave request. Current status is: approved"
}
```

**403 Forbidden:**
```json
{
  "code": 403,
  "message": "Only admin can reject leave requests"
}
```

---

### 7. Cancel Leave Request

Cancel a pending leave request. Candidates can cancel their own requests, admins can cancel any pending request.

**Endpoint:** `POST /v1/leave-requests/:requestId/cancel`

**Access:** Candidate owner or admin

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `requestId` | string | Leave request ID (ObjectId) |

**Request Example:**
```javascript
const response = await fetch('/v1/leave-requests/695e41cf25efdc9d7322f608/cancel', {
  method: 'POST',
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
  "message": "Leave request cancelled successfully",
  "data": {
    "_id": "695e41cf25efdc9d7322f608",
    "candidate": {
      "_id": "507f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "email": "john@example.com"
    },
    "dates": ["2024-01-15T00:00:00.000Z"],
    "leaveType": "casual",
    "status": "cancelled",
    "requestedBy": {
      "_id": "507f1f77bcf86cd799439020",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

**Error Responses:**

**400 Bad Request - Invalid Status:**
```json
{
  "code": 400,
  "message": "Cannot cancel leave request. Current status is: approved"
}
```

**403 Forbidden:**
```json
{
  "code": 403,
  "message": "You can only cancel your own leave requests"
}
```

---

## Complete Workflow Example

### Step 1: Candidate Creates Request
```javascript
// Candidate creates leave request
const createRequest = async () => {
  const response = await fetch('/v1/leave-requests/candidate/507f1f77bcf86cd799439011', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer <candidate-token>',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      dates: [
        '2024-01-15T00:00:00.000Z',
        '2024-01-16T00:00:00.000Z'
      ],
      leaveType: 'casual',
      notes: 'Family vacation'
    })
  });
  
  const data = await response.json();
  console.log('Request created:', data.data._id);
  return data.data._id;
};
```

### Step 2: Admin Views Pending Requests
```javascript
// Admin views all pending requests
const getPendingRequests = async () => {
  const response = await fetch('/v1/leave-requests?status=pending&sortBy=createdAt:desc', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer <admin-token>'
    }
  });
  
  const data = await response.json();
  return data.data.results;
};
```

### Step 3: Admin Approves Request
```javascript
// Admin approves request
const approveRequest = async (requestId) => {
  const response = await fetch(`/v1/leave-requests/${requestId}/approve`, {
    method: 'PATCH',
    headers: {
      'Authorization': 'Bearer <admin-token>',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      adminComment: 'Approved - enjoy your vacation!'
    })
  });
  
  const data = await response.json();
  console.log('Request approved, leave assigned:', data.data.leaveAssignment);
};
```

### Step 4: Candidate Views Their Requests
```javascript
// Candidate views their own requests
const getMyRequests = async (candidateId) => {
  const response = await fetch(`/v1/leave-requests/candidate/${candidateId}`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer <candidate-token>'
    }
  });
  
  const data = await response.json();
  return data.data.results;
};
```

---

## Frontend Integration Tips

### 1. Date Format
Always use ISO 8601 format for dates:
```javascript
const date = new Date('2024-01-15');
const isoDate = date.toISOString(); // "2024-01-15T00:00:00.000Z"
```

### 2. Status Badge Colors
```javascript
const statusColors = {
  pending: 'yellow',    // Pending review
  approved: 'green',    // Approved and assigned
  rejected: 'red',      // Rejected by admin
  cancelled: 'gray'     // Cancelled by user
};
```

### 3. Permission Checks
```javascript
// Check if user can create request
const canCreateRequest = (user, candidate) => {
  return user.role === 'admin' || String(candidate.owner) === String(user.id);
};

// Check if user can approve/reject
const canApproveReject = (user) => {
  return user.role === 'admin';
};

// Check if user can cancel
const canCancel = (user, request) => {
  if (request.status !== 'pending') return false;
  if (user.role === 'admin') return true;
  return String(request.requestedBy._id) === String(user.id);
};
```

### 4. Display Leave Type
```javascript
const leaveTypeLabels = {
  casual: 'Casual Leave',
  sick: 'Sick Leave',
  unpaid: 'Unpaid Leave'
};

const leaveTypeColors = {
  casual: 'blue',
  sick: 'orange',
  unpaid: 'purple'
};
```

### 5. Format Dates for Display
```javascript
const formatDates = (dates) => {
  return dates.map(date => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }).join(', ');
};

// Example: "Jan 15, 2024, Jan 16, 2024"
```

### 6. Handle Approval Response
```javascript
const handleApproval = async (requestId, adminComment) => {
  try {
    const response = await approveRequest(requestId, adminComment);
    
    // Show success message
    showNotification('Leave request approved and assigned successfully');
    
    // Refresh leave requests list
    await refreshLeaveRequests();
    
    // Optionally refresh attendance calendar
    await refreshAttendanceCalendar();
    
  } catch (error) {
    if (error.message.includes('leave balance')) {
      showError('Cannot approve: Leave limit exceeded');
    } else {
      showError('Failed to approve request');
    }
  }
};
```

### 7. Real-time Updates
Consider polling for pending requests or using WebSocket for real-time updates:
```javascript
// Poll for pending requests (admin dashboard)
const pollPendingRequests = () => {
  setInterval(async () => {
    const requests = await getPendingRequests();
    updatePendingRequestsList(requests);
  }, 30000); // Poll every 30 seconds
};
```

---

## Error Handling

### Common Error Scenarios

1. **Duplicate Request**
   - Error: "You already have pending leave requests for: [dates]"
   - Solution: Check for existing pending requests before creating new one

2. **Leave Limit Exceeded**
   - Error: "Cannot assign X casual leave(s). Maximum allowed: 21"
   - Solution: Show remaining leave balance before approval

3. **Invalid Status**
   - Error: "Cannot approve leave request. Current status is: [status]"
   - Solution: Disable approve/reject buttons for non-pending requests

4. **Permission Denied**
   - Error: "Only admin can approve leave requests"
   - Solution: Hide admin actions for non-admin users

---

## Status Flow Diagram

```
┌─────────┐
│ pending │ ← Created by candidate
└────┬────┘
     │
     ├──────────────┬──────────────┐
     │              │              │
     ▼              ▼              ▼
┌─────────┐   ┌──────────┐   ┌──────────┐
│approved │   │ rejected │   │cancelled │
└─────────┘   └──────────┘   └──────────┘
     │
     ▼
Leave automatically assigned
to attendance calendar
```

---

## Summary

### Endpoints
- **Create Request**: `POST /v1/leave-requests/candidate/:candidateId`
- **Get Requests**: `GET /v1/leave-requests` (with filters)
- **Get by Candidate**: `GET /v1/leave-requests/candidate/:candidateId`
- **Get by ID**: `GET /v1/leave-requests/:requestId`
- **Approve**: `PATCH /v1/leave-requests/:requestId/approve` (admin only)
- **Reject**: `PATCH /v1/leave-requests/:requestId/reject` (admin only)
- **Cancel**: `POST /v1/leave-requests/:requestId/cancel`

### Key Features
- Multiple dates per request
- Automatic leave assignment on approval (uses `POST /v1/attendance/leaves` internally)
- Leave limit validation (casual: 21, sick: 5, unpaid: unlimited)
- Admin comments on approval/rejection
- Permission-based access control
- Status tracking (pending/approved/rejected/cancelled)

### Integration with Leave Assignment System

**How They Work Together:**

1. **Leave Request → Approval → Assignment:**
   ```
   Candidate creates request
   → Admin approves
   → System automatically calls assignLeavesToCandidates()
   → Creates candidate.leaves[] entries
   → Creates Attendance records with status: 'Leave'
   ```

2. **Direct Assignment (Alternative):**
   ```
   Admin directly assigns leave
   → POST /v1/attendance/leaves
   → Creates candidate.leaves[] entries
   → Creates Attendance records with status: 'Leave'
   ```

**Both methods create identical data:**
- Same `candidate.leaves[]` structure
- Same `Attendance` records with `status: 'Leave'`
- Same leave limit validation
- Same leave types supported

**When to use each:**
- **Leave Request API**: When candidates need to request leave and get approval
- **Direct Assignment API**: When admin needs to assign leaves directly (bulk, emergency, etc.)

**Related Documentation:**
- [Candidate Leave Assignment API](./CANDIDATE_LEAVE_ASSIGNMENT_API.md) - Direct leave assignment
- Both APIs share the same underlying leave assignment logic
