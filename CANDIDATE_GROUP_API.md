# Candidate Group API Documentation

## Overview

This API allows administrators to create and manage groups of candidates, and assign holidays to entire groups at once. This simplifies bulk holiday assignment by organizing candidates into logical groups (e.g., "US Team", "India Team").

- **Base URL:** `/v1/candidate-groups`
- **Authentication:** All endpoints require JWT authentication:
  ```
  Authorization: Bearer <admin-token>
  ```
- **Access:** Admin only (role with `manageCandidates`)

---

## Data Model Notes

### CandidateGroup Model

```json
{
  "_id": "507f1f77bcf86cd799439030",
  "name": "US Team",
  "description": "United States based team members",
  "candidates": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012"
  ],
  "createdBy": "507f1f77bcf86cd799439001",
  "isActive": true,
  "createdAt": "2026-01-01T10:00:00.000Z",
  "updatedAt": "2026-01-01T10:00:00.000Z"
}
```

- `name`: Group name (required, unique per creator)
- `description`: Optional description of the group
- `candidates`: Array of candidate ObjectIds
- `createdBy`: User who created the group
- `isActive`: Whether the group is active

---

## Flow Summary

1. Admin creates candidate groups using `POST /v1/candidate-groups`
2. Admin adds candidates to groups using `POST /v1/candidate-groups/:groupId/candidates`
3. Admin creates holidays using the Holidays CRUD API (`/v1/holidays`)
4. Admin assigns holidays to groups using `POST /v1/candidate-groups/:groupId/holidays`
5. Backend automatically:
   - Adds holiday IDs to each candidate's `holidays` array
   - Creates `Attendance` records with `status: 'Holiday'` for each candidate × holiday date

---

## Endpoints

### 1. Create Candidate Group

Create a new candidate group. You can optionally add candidates during creation.

**Endpoint:** `POST /v1/candidate-groups`

**Access:** Admin only

---

#### Request

**Request Body:**

```json
{
  "name": "US Team",
  "description": "United States based team members",
  "candidateIds": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012"
  ]
}
```

**Fields:**

| Field         | Type   | Required | Description                                      |
|--------------|--------|----------|--------------------------------------------------|
| `name`       | string | Yes      | Group name (1-200 characters)                   |
| `description`| string | No       | Optional description (max 1000 characters)      |
| `candidateIds`| array | No       | Array of candidate ObjectIds to add initially    |

---

#### Success Response

**Status:** `201 Created`

```json
{
  "success": true,
  "message": "Candidate group created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "name": "US Team",
    "description": "United States based team members",
    "candidates": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "fullName": "John Doe",
        "email": "john@example.com",
        "employeeId": "DBS1"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "fullName": "Jane Smith",
        "email": "jane@example.com",
        "employeeId": "DBS2"
      }
    ],
    "createdBy": "507f1f77bcf86cd799439001",
    "isActive": true,
    "createdAt": "2026-01-01T10:00:00.000Z",
    "updatedAt": "2026-01-01T10:00:00.000Z"
  }
}
```

---

### 2. List Candidate Groups

Get all candidate groups with pagination support.

**Endpoint:** `GET /v1/candidate-groups`

**Access:** Authenticated users

---

#### Request

**Query Parameters:**

| Field     | Type    | Required | Description                                      |
|----------|---------|----------|--------------------------------------------------|
| `name`    | string  | No       | Filter by group name (partial match)             |
| `isActive`| boolean | No       | Filter by active status                         |
| `createdBy`| string | No       | Filter by creator ID                             |
| `sortBy`  | string  | No       | Sort field and order (e.g., `name:asc`, `createdAt:desc`) |
| `limit`   | number  | No       | Results per page (default: 10)                   |
| `page`    | number  | No       | Page number (default: 1)                          |

---

#### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "_id": "507f1f77bcf86cd799439030",
        "name": "US Team",
        "description": "United States based team members",
        "candidates": [
          {
            "_id": "507f1f77bcf86cd799439011",
            "fullName": "John Doe",
            "email": "john@example.com",
            "employeeId": "DBS1"
          }
        ],
        "createdBy": {
          "_id": "507f1f77bcf86cd799439001",
          "name": "Admin User",
          "email": "admin@example.com"
        },
        "isActive": true,
        "createdAt": "2026-01-01T10:00:00.000Z",
        "updatedAt": "2026-01-01T10:00:00.000Z"
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

### 3. Get Candidate Group by ID

Get a specific candidate group with all its candidates.

**Endpoint:** `GET /v1/candidate-groups/:groupId`

**Access:** Authenticated users

---

#### Request

**Path Parameters:**

| Field     | Type   | Required | Description                                      |
|----------|--------|----------|--------------------------------------------------|
| `groupId` | string | Yes      | Candidate group ObjectId                          |

---

#### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "name": "US Team",
    "description": "United States based team members",
    "candidates": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "fullName": "John Doe",
        "email": "john@example.com",
        "employeeId": "DBS1"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "fullName": "Jane Smith",
        "email": "jane@example.com",
        "employeeId": "DBS2"
      }
    ],
    "createdBy": {
      "_id": "507f1f77bcf86cd799439001",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "isActive": true,
    "createdAt": "2026-01-01T10:00:00.000Z",
    "updatedAt": "2026-01-01T10:00:00.000Z"
  }
}
```

---

### 4. Update Candidate Group

Update a candidate group's name, description, candidates, or active status.

**Endpoint:** `PATCH /v1/candidate-groups/:groupId`

**Access:** Admin only

---

#### Request

**Path Parameters:**

| Field     | Type   | Required | Description                                      |
|----------|--------|----------|--------------------------------------------------|
| `groupId` | string | Yes      | Candidate group ObjectId                          |

**Request Body:**

```json
{
  "name": "US Team - Updated",
  "description": "Updated description",
  "candidateIds": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012",
    "507f1f77bcf86cd799439013"
  ],
  "isActive": true
}
```

**Fields:**

| Field         | Type    | Required | Description                                      |
|--------------|---------|----------|--------------------------------------------------|
| `name`       | string  | No       | Group name (1-200 characters)                   |
| `description`| string  | No       | Description (max 1000 characters)                |
| `candidateIds`| array  | No       | Replace all candidates with this array           |
| `isActive`   | boolean | No       | Active status                                    |

**Note:** At least one field must be provided.

---

#### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Candidate group updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "name": "US Team - Updated",
    "description": "Updated description",
    "candidates": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "fullName": "John Doe",
        "email": "john@example.com",
        "employeeId": "DBS1"
      }
    ],
    "isActive": true,
    "updatedAt": "2026-01-01T11:00:00.000Z"
  }
}
```

---

### 5. Delete Candidate Group

Delete a candidate group.

**Endpoint:** `DELETE /v1/candidate-groups/:groupId`

**Access:** Admin only

---

#### Request

**Path Parameters:**

| Field     | Type   | Required | Description                                      |
|----------|--------|----------|--------------------------------------------------|
| `groupId` | string | Yes      | Candidate group ObjectId                          |

---

#### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Candidate group deleted successfully"
}
```

---

### 6. Add Candidates to Group

Add one or more candidates to an existing group.

**Endpoint:** `POST /v1/candidate-groups/:groupId/candidates`

**Access:** Admin only

---

#### Request

**Path Parameters:**

| Field     | Type   | Required | Description                                      |
|----------|--------|----------|--------------------------------------------------|
| `groupId` | string | Yes      | Candidate group ObjectId                          |

**Request Body:**

```json
{
  "candidateIds": [
    "507f1f77bcf86cd799439013",
    "507f1f77bcf86cd799439014"
  ]
}
```

**Fields:**

| Field         | Type   | Required | Description                                      |
|--------------|--------|----------|--------------------------------------------------|
| `candidateIds` | array | Yes      | Array of candidate ObjectIds to add (min 1)      |

**Note:** Candidates already in the group will be skipped.

---

#### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Candidates added to group successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "name": "US Team",
    "candidates": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "fullName": "John Doe",
        "email": "john@example.com",
        "employeeId": "DBS1"
      },
      {
        "_id": "507f1f77bcf86cd799439013",
        "fullName": "Bob Johnson",
        "email": "bob@example.com",
        "employeeId": "DBS3"
      }
    ]
  }
}
```

---

### 7. Remove Candidates from Group

Remove one or more candidates from a group.

**Endpoint:** `POST /v1/candidate-groups/:groupId/candidates/remove`

**Access:** Admin only

---

#### Request

**Path Parameters:**

| Field     | Type   | Required | Description                                      |
|----------|--------|----------|--------------------------------------------------|
| `groupId` | string | Yes      | Candidate group ObjectId                          |

**Request Body:**

```json
{
  "candidateIds": [
    "507f1f77bcf86cd799439013",
    "507f1f77bcf86cd799439014"
  ]
}
```

**Fields:**

| Field         | Type   | Required | Description                                      |
|--------------|--------|----------|--------------------------------------------------|
| `candidateIds` | array | Yes      | Array of candidate ObjectIds to remove (min 1)  |

---

#### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Candidates removed from group successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "name": "US Team",
    "candidates": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "fullName": "John Doe",
        "email": "john@example.com",
        "employeeId": "DBS1"
      }
    ]
  }
}
```

---

### 8. Assign Holidays to Group

Assign one or more holidays to all candidates in a group. This automatically:
- Adds holiday IDs to each candidate's `holidays` array
- Creates `Attendance` records with `status: 'Holiday'` for each candidate × holiday date

**Endpoint:** `POST /v1/candidate-groups/:groupId/holidays`

**Access:** Admin only

---

#### Request

**Path Parameters:**

| Field     | Type   | Required | Description                                      |
|----------|--------|----------|--------------------------------------------------|
| `groupId` | string | Yes      | Candidate group ObjectId                          |

**Request Body:**

```json
{
  "holidayIds": [
    "507f1f77bcf86cd799439020",
    "507f1f77bcf86cd799439021"
  ]
}
```

**Fields:**

| Field         | Type   | Required | Description                                      |
|--------------|--------|----------|--------------------------------------------------|
| `holidayIds`   | array | Yes      | Array of holiday ObjectIds (min 1)               |

Both arrays must contain valid MongoDB ObjectIds that exist in the database.

---

#### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Holidays assigned to group \"US Team\". Added to 10 candidate(s). Created 20 attendance record(s).",
  "data": {
    "groupId": "507f1f77bcf86cd799439030",
    "groupName": "US Team",
    "candidatesUpdated": 10,
    "holidaysAdded": 2,
    "attendanceRecordsCreated": 20,
    "createdRecords": [
      {
        "_id": "ATTENDANCE_ID",
        "candidate": {
          "_id": "507f1f77bcf86cd799439011",
          "fullName": "John Doe",
          "email": "john@example.com"
        },
        "candidateEmail": "john@example.com",
        "date": "2026-01-01T00:00:00.000Z",
        "punchIn": "2026-01-01T00:00:00.000Z",
        "punchOut": null,
        "duration": 0,
        "notes": "Holiday: New Year",
        "timezone": "UTC",
        "status": "Holiday",
        "createdAt": "2026-01-01T10:00:00.000Z",
        "updatedAt": "2026-01-01T10:00:00.000Z"
      }
    ],
    "skipped": [
      {
        "candidateId": "507f1f77bcf86cd799439011",
        "candidateName": "John Doe",
        "holidayId": "507f1f77bcf86cd799439020",
        "holidayTitle": "New Year",
        "date": "2026-01-01T00:00:00.000Z",
        "reason": "Attendance already exists for this date"
      }
    ]
  }
}
```

**Notes:**
- `createdRecords`: Full list of newly-created `Attendance` documents (populated with candidate's name and email).
- `skipped`: Optional array; present only when some candidate/date combinations were skipped because an attendance record already existed.

---

#### Error Responses

##### 400 Bad Request

Group has no candidates:

```json
{
  "code": 400,
  "message": "Group has no candidates"
}
```

##### 403 Forbidden

Non-admin user:

```json
{
  "code": 403,
  "message": "Only admin can assign holidays to groups"
}
```

##### 404 Not Found

Group not found:

```json
{
  "code": 404,
  "message": "Candidate group not found"
}
```

Some holiday IDs do not exist or are inactive:

```json
{
  "code": 404,
  "message": "Some holidays not found or inactive: 507f1f77bcf86cd799439020"
}
```

---

### 9. Remove Holidays from Group

Remove one or more holidays from all candidates in a group. This automatically:
- Removes holiday IDs from each candidate's `holidays` array
- Deletes `Attendance` records with `status: 'Holiday'` for those dates

**Endpoint:** `DELETE /v1/candidate-groups/:groupId/holidays`

**Access:** Admin only

---

#### Request

**Path Parameters:**

| Field     | Type   | Required | Description                                      |
|----------|--------|----------|--------------------------------------------------|
| `groupId` | string | Yes      | Candidate group ObjectId                          |

**Request Body:**

```json
{
  "holidayIds": [
    "507f1f77bcf86cd799439020",
    "507f1f77bcf86cd799439021"
  ]
}
```

**Fields:**

| Field         | Type   | Required | Description                                      |
|--------------|--------|----------|--------------------------------------------------|
| `holidayIds`   | array | Yes      | Array of holiday ObjectIds (min 1)               |

---

#### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Holidays removed from group \"US Team\". Removed from 10 candidate(s). Deleted 20 attendance record(s).",
  "data": {
    "groupId": "507f1f77bcf86cd799439030",
    "groupName": "US Team",
    "candidatesUpdated": 10,
    "holidaysRemoved": 2,
    "attendanceRecordsDeleted": 20,
    "deletedRecords": [
      {
        "candidateId": "507f1f77bcf86cd799439011",
        "candidateName": "John Doe",
        "holidayId": "507f1f77bcf86cd799439020",
        "holidayTitle": "New Year",
        "date": "2026-01-01T00:00:00.000Z",
        "attendanceId": "ATTENDANCE_ID"
      }
    ],
    "skipped": [
      {
        "candidateId": "507f1f77bcf86cd799439011",
        "candidateName": "John Doe",
        "holidayId": "507f1f77bcf86cd799439020",
        "holidayTitle": "New Year",
        "date": "2026-01-01T00:00:00.000Z",
        "reason": "No holiday attendance record found for this date"
      }
    ]
  }
}
```

**Notes:**
- `deletedRecords`: List of deleted attendance records with details.
- `skipped`: Optional array; present only when some candidate/date combinations were skipped because no holiday attendance record was found.

---

#### Error Responses

Same error responses as the assign holidays endpoint (400, 403, 404).

---

## Frontend Implementation Examples

### Using Fetch API

```javascript
// Create a candidate group
const createGroup = async (name, description, candidateIds = []) => {
  const token = localStorage.getItem('token');

  const res = await fetch('/v1/candidate-groups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ name, description, candidateIds })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to create group');
  }
  return data;
};

// Add candidates to a group
const addCandidatesToGroup = async (groupId, candidateIds) => {
  const token = localStorage.getItem('token');

  const res = await fetch(`/v1/candidate-groups/${groupId}/candidates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ candidateIds })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to add candidates');
  }
  return data;
};

// Assign holidays to a group
const assignHolidaysToGroup = async (groupId, holidayIds) => {
  const token = localStorage.getItem('token');

  const res = await fetch(`/v1/candidate-groups/${groupId}/holidays`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ holidayIds })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to assign holidays');
  }
  return data;
};

// Remove holidays from a group
const removeHolidaysFromGroup = async (groupId, holidayIds) => {
  const token = localStorage.getItem('token');

  const res = await fetch(`/v1/candidate-groups/${groupId}/holidays`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ holidayIds })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to remove holidays');
  }
  return data;
};

// Example usage
const group = await createGroup('US Team', 'United States based team', [
  '507f1f77bcf86cd799439011',
  '507f1f77bcf86cd799439012'
]);

await addCandidatesToGroup(group.data._id, ['507f1f77bcf86cd799439013']);

await assignHolidaysToGroup(group.data._id, [
  '507f1f77bcf86cd799439020', // Halloween
  '507f1f77bcf86cd799439021'  // 4th July
]);
```

### Using Axios

```javascript
import axios from 'axios';

export const candidateGroupAPI = {
  create: async (name, description, candidateIds = []) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      '/v1/candidate-groups',
      { name, description, candidateIds },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  },

  list: async (filters = {}) => {
    const token = localStorage.getItem('token');
    const response = await axios.get('/v1/candidate-groups', {
      params: filters,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  get: async (groupId) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`/v1/candidate-groups/${groupId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  update: async (groupId, updates) => {
    const token = localStorage.getItem('token');
    const response = await axios.patch(
      `/v1/candidate-groups/${groupId}`,
      updates,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  },

  delete: async (groupId) => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`/v1/candidate-groups/${groupId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  },

  addCandidates: async (groupId, candidateIds) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `/v1/candidate-groups/${groupId}/candidates`,
      { candidateIds },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  },

  removeCandidates: async (groupId, candidateIds) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `/v1/candidate-groups/${groupId}/candidates/remove`,
      { candidateIds },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  },

  assignHolidays: async (groupId, holidayIds) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `/v1/candidate-groups/${groupId}/holidays`,
      { holidayIds },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  },

  removeHolidays: async (groupId, holidayIds) => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(
      `/v1/candidate-groups/${groupId}/holidays`,
      {
        data: { holidayIds },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  }
};
```

---

## Integration Tips

### 1. Typical Workflow

1. **Create Groups:**
   - Use `POST /v1/candidate-groups` to create groups (e.g., "US Team", "India Team")
   - Optionally add candidates during creation, or add them later

2. **Manage Group Members:**
   - Use `POST /v1/candidate-groups/:groupId/candidates` to add candidates
   - Use `POST /v1/candidate-groups/:groupId/candidates/remove` to remove candidates
   - Use `PATCH /v1/candidate-groups/:groupId` with `candidateIds` to replace all candidates

3. **Create Holidays:**
   - Use `POST /v1/holidays` to create holiday definitions (title + date)

4. **Assign Holidays to Groups:**
   - Use `POST /v1/candidate-groups/:groupId/holidays` to assign holidays to all candidates in a group
   - This automatically creates attendance records for each candidate

### 2. Example Scenario

**Create Groups:**
```javascript
const usTeam = await createGroup('US Team', 'United States based team');
const indiaTeam = await createGroup('India Team', 'India based team');
```

**Add Candidates:**
```javascript
await addCandidatesToGroup(usTeam.data._id, [
  'candidate1', 'candidate2', 'candidate3' // ... 10 candidates
]);

await addCandidatesToGroup(indiaTeam.data._id, [
  'candidate11', 'candidate12', 'candidate13' // ... 10 candidates
]);
```

**Create Holidays:**
```javascript
const halloween = await createHoliday('Halloween', '2026-10-31');
const july4th = await createHoliday('4th July', '2026-07-04');
const christmas = await createHoliday('Christmas', '2026-12-25');
const diwali = await createHoliday('Diwali', '2026-10-20');
const holi = await createHoliday('Holi', '2026-03-14');
const independenceDay = await createHoliday('Independence Day', '2026-08-15');
```

**Assign Holidays to Groups:**
```javascript
// US Team: Halloween, 4th July, Christmas
await assignHolidaysToGroup(usTeam.data._id, [
  halloween.data._id,
  july4th.data._id,
  christmas.data._id
]);

// India Team: Holi, Diwali, Independence Day
await assignHolidaysToGroup(indiaTeam.data._id, [
  holi.data._id,
  diwali.data._id,
  independenceDay.data._id
]);
```

### 3. Idempotency / Safety

- You can safely call the assignment API multiple times with the same group/holiday combinations:
  - It will not add duplicate holiday IDs to `candidate.holidays`.
  - It will not create duplicate attendance records for the same candidate and date.
- Adding candidates that are already in the group will be skipped.
- Removing candidates that are not in the group will return an error.

---

## Summary

- **Create Groups:** `POST /v1/candidate-groups`
- **List Groups:** `GET /v1/candidate-groups`
- **Get Group:** `GET /v1/candidate-groups/:groupId`
- **Update Group:** `PATCH /v1/candidate-groups/:groupId`
- **Delete Group:** `DELETE /v1/candidate-groups/:groupId`
- **Add Candidates:** `POST /v1/candidate-groups/:groupId/candidates`
- **Remove Candidates:** `POST /v1/candidate-groups/:groupId/candidates/remove`
- **Assign Holidays to Group:** `POST /v1/candidate-groups/:groupId/holidays`
- **Remove Holidays from Group:** `DELETE /v1/candidate-groups/:groupId/holidays`
- **Access:** Group management requires admin with `manageCandidates`
- **Use Case:** Organize candidates into groups and bulk-assign or remove holidays from entire groups, simplifying holiday management for teams based on location, department, or other criteria.
