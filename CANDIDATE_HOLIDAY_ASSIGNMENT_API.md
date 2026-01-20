# Candidate Holiday Assignment API Documentation

## Overview

This API allows administrators to assign existing holidays to multiple candidates and automatically create holiday entries in their attendance calendar.

- **Base URL (Holidays CRUD):** `/v1/holidays`
- **Base URL (Holiday Assignment to Candidates):** `/v1/attendance`
- **Authentication:** All endpoints require JWT authentication:
  ```
  Authorization: Bearer <admin-token>
  ```
- **Access:** Admin only (role with `manageCandidates`)

---

## Data Model Notes

### Holiday Model (Summary)

```json
{
  "_id": "507f1f77bcf86cd799439020",
  "title": "New Year",
  "date": "2026-01-01T00:00:00.000Z",
  "isActive": true
}
```

### Candidate Model (Relevant Field)

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "fullName": "John Doe",
  "email": "john@example.com",
  "holidays": [
    "507f1f77bcf86cd799439020",
    "507f1f77bcf86cd799439021"
  ]
}
```

- `holidays`: array of ObjectIds referencing the `Holiday` model.

### Attendance Model (Holiday Records)

Holiday assignment also creates `Attendance` records:

```json
{
  "_id": "ATTENDANCE_ID",
  "candidate": "507f1f77bcf86cd799439011",
  "candidateEmail": "john@example.com",
  "date": "2026-01-01T00:00:00.000Z",
  "punchIn": "2026-01-01T00:00:00.000Z",
  "punchOut": null,
  "duration": 0,
  "notes": "Holiday: New Year",
  "timezone": "UTC",
  "status": "Holiday"
}
```

- `status: "Holiday"` marks the day as a holiday in the attendance calendar.

---

## Flow Summary

1. Admin creates holidays using the Holidays CRUD API (`/v1/holidays`).
2. Admin assigns those holidays to multiple candidates using:
   - `POST /v1/attendance/holidays`
3. Backend:
   - Adds holiday IDs into `candidate.holidays`
   - Creates `Attendance` records with `status: 'Holiday'` for each candidate × holiday date where no attendance exists yet.

---

## Endpoints

### 1. Assign Holidays to Candidate Attendance Calendar

Assign one or more existing holidays to multiple candidates.

**Endpoint:** `POST /v1/attendance/holidays`

**Access:** Admin only

**Description:**
- Assigns existing holidays (by ID) to a list of candidates (by ID).
- For each candidate × holiday:
  - Adds the holiday ID to `candidate.holidays` if not already present.
  - Creates an `Attendance` record for that date with `status: 'Holiday'` if no attendance exists for that date.

---

### Request

**Request Body:**

```json
{
  "candidateIds": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012"
  ],
  "holidayIds": [
    "507f1f77bcf86cd799439020",
    "507f1f77bcf86cd799439021"
  ]
}
```

**Fields:**

| Field         | Type   | Required | Description                                      |
|--------------|--------|----------|--------------------------------------------------|
| `candidateIds` | array | Yes      | Array of candidate ObjectIds (min 1)           |
| `holidayIds`   | array | Yes      | Array of holiday ObjectIds (min 1)             |

Both arrays must contain valid MongoDB ObjectIds that exist in the database.

---

### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Holidays added to 2 candidate(s). Created 4 attendance record(s).",
  "data": {
    "candidatesUpdated": 2,
    "holidaysAdded": 2,
    "attendanceRecordsCreated": 4,
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
- `createdRecords`: Full list of newly-created `Attendance` documents (populated with candidate’s name and email).
- `skipped`: Optional array; present only when some candidate/date combinations were skipped because an attendance record already existed.

---

### Error Responses

#### 400 Bad Request

Missing or invalid arrays:

```json
{
  "code": 400,
  "message": "At least one candidate ID is required"
}
```

```json
{
  "code": 400,
  "message": "At least one holiday ID is required"
}
```

#### 403 Forbidden

Non-admin user:

```json
{
  "code": 403,
  "message": "Only admin can add holidays to candidate calendar"
}
```

#### 404 Not Found

Some candidate IDs do not exist:

```json
{
  "code": 404,
  "message": "Some candidates not found: 507f1f77bcf86cd799439099"
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

## Frontend Implementation Examples

### Using Fetch API

```javascript
// Assign holidays to multiple candidates
const addHolidaysToCandidates = async (candidateIds, holidayIds) => {
  const token = localStorage.getItem('token');

  const res = await fetch('/v1/attendance/holidays', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ candidateIds, holidayIds })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to add holidays');
  }
  return data;
};

// Example usage
await addHolidaysToCandidates(
  ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  ['507f1f77bcf86cd799439020', '507f1f77bcf86cd799439021']
);
```

### Using Axios

```javascript
import axios from 'axios';

export const addHolidaysToCandidates = async (candidateIds, holidayIds) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    '/v1/attendance/holidays',
    { candidateIds, holidayIds },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};
```

---

## Integration Tips

### 1. Admin Flow

1. Use `POST /v1/holidays` to create holiday definitions (title + date).
2. Use `GET /v1/holidays` to fetch holiday IDs and show them in a multi-select.
3. Use `GET /v1/candidates` to select candidates.
4. Call `POST /v1/attendance/holidays` with selected `candidateIds` and `holidayIds`.

### 2. Calendar Rendering

When rendering attendance:

- Treat any `Attendance` record with `status: 'Holiday'` as a holiday.
- Display `attendance.notes` (e.g., `"Holiday: New Year"`) as the holiday label on that date.

### 3. Idempotency / Safety

- You can safely call the assignment API multiple times with the same candidate/holiday combinations:
  - It will not add duplicate holiday IDs to `candidate.holidays`.
  - It will not create duplicate attendance records for the same candidate and date.

---

---

### 2. Remove Holidays from Candidate Attendance Calendar

Remove one or more assigned holidays from multiple candidates.

**Endpoint:** `DELETE /v1/attendance/holidays`

**Access:** Admin only

**Description:**
- Removes existing holidays (by ID) from a list of candidates (by ID).
- For each candidate × holiday:
  - Removes the holiday ID from `candidate.holidays` if present.
  - Deletes `Attendance` records with `status: 'Holiday'` for that date.

---

#### Request

**Request Body:**

```json
{
  "candidateIds": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012"
  ],
  "holidayIds": [
    "507f1f77bcf86cd799439020",
    "507f1f77bcf86cd799439021"
  ]
}
```

**Fields:**

| Field         | Type   | Required | Description                                      |
|--------------|--------|----------|--------------------------------------------------|
| `candidateIds` | array | Yes      | Array of candidate ObjectIds (min 1)           |
| `holidayIds`   | array | Yes      | Array of holiday ObjectIds (min 1)             |

Both arrays must contain valid MongoDB ObjectIds that exist in the database.

---

#### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Holidays removed from 2 candidate(s). Deleted 4 attendance record(s).",
  "data": {
    "candidatesUpdated": 2,
    "holidaysRemoved": 2,
    "attendanceRecordsDeleted": 4,
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

Same error responses as the add holidays endpoint (400, 403, 404).

---

## Summary

- **Create Holiday Definitions:** `POST /v1/holidays`
- **Assign Holidays to Candidates:** `POST /v1/attendance/holidays`
- **Remove Holidays from Candidates:** `DELETE /v1/attendance/holidays`
- **Data Stored:**
  - Candidate: `holidays: [HolidayId, ...]`
  - Attendance: `status: 'Holiday'`, `notes: 'Holiday: <title>'`
- **Access:** Holiday assignment/removal requires admin with `manageCandidates`
- **Use Case:** Bulk-assign or remove multiple holidays from multiple candidates and reflect them in their attendance calendar.


