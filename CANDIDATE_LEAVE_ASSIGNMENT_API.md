# Candidate Leave Assignment API Documentation

## Overview

This API allows administrators to assign leaves (casual, sick, or unpaid) to multiple candidates for specific dates and automatically create leave entries in their attendance calendar.

- **Base URL:** `/v1/attendance`
- **Authentication:** All endpoints require JWT authentication:
  ```
  Authorization: Bearer <admin-token>
  ```
- **Access:** Admin only (role with `manageCandidates`)

### Connection with Leave Request API

**Two Ways to Assign Leaves:**

1. **Direct Leave Assignment** (This API):
   - Admin directly assigns leaves without request
   - **Endpoint**: `POST /v1/attendance/leaves`
   - **Use Case**: Admin-initiated leave assignment (bulk assignment, emergency leaves, etc.)

2. **Leave Request System** (Alternative):
   - Candidate creates a request → Admin approves → Leave automatically assigned
   - **Endpoint**: `POST /v1/leave-requests/candidate/:candidateId` → `PATCH /v1/leave-requests/:requestId/approve`
   - **Use Case**: Candidate-initiated leave requests with approval workflow

**Both systems:**
- Use the same underlying `assignLeavesToCandidates()` function
- Create the same data structure:
  - Add entries to `candidate.leaves[]` array
  - Create `Attendance` records with `status: 'Leave'`
- Validate the same leave limits
- Support the same leave types: `casual`, `sick`, `unpaid`

**See also:** [Leave Request API](./LEAVE_REQUEST_API.md) for candidate-initiated leave requests

---

## Data Model Notes

### Candidate Model (Relevant Field)

After leave assignment, the candidate model includes a `leaves` array:

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "fullName": "John Doe",
  "email": "john@example.com",
  "leaves": [
    {
      "_id": "695f466689151f918930032e",
      "date": "2024-01-15T00:00:00.000Z",
      "leaveType": "casual",
      "notes": "Personal leave",
      "assignedAt": "2024-01-10T10:00:00.000Z"
    },
    {
      "_id": "695f466689151f918930032f",
      "date": "2024-01-16T00:00:00.000Z",
      "leaveType": "casual",
      "notes": "Personal leave",
      "assignedAt": "2024-01-10T10:00:00.000Z"
    },
    {
      "_id": "695f466689151f9189300330",
      "date": "2024-01-17T00:00:00.000Z",
      "leaveType": "casual",
      "notes": "Personal leave",
      "assignedAt": "2024-01-10T10:00:00.000Z"
    }
  ]
}
```

- `leaves`: Array of leave objects, one per date. Each object contains a single date, leave type, notes, and assignment timestamp.
- If a leave spans multiple days, multiple entries are created (one for each date).

### Attendance Model (Leave Records)

Leave assignment also creates `Attendance` records:

```json
{
  "_id": "ATTENDANCE_ID",
  "candidate": "507f1f77bcf86cd799439011",
  "candidateEmail": "john@example.com",
  "date": "2024-01-15T00:00:00.000Z",
  "punchIn": "2024-01-15T00:00:00.000Z",
  "punchOut": null,
  "duration": 0,
  "notes": "Casual Leave",
  "timezone": "UTC",
  "status": "Leave",
  "leaveType": "casual"
}
```

- `status: "Leave"` marks the day as a leave in the attendance calendar.
- `leaveType`: Either `"casual"`, `"sick"`, or `"unpaid"` to distinguish between leave types.

---

## Flow Summary

1. Admin selects multiple candidates and specifies:
   - One or more specific dates for the leave
   - Leave type: `"casual"`, `"sick"`, or `"unpaid"`
   - Optional notes
2. Admin calls `POST /v1/attendance/leaves` with the leave details.
3. Backend:
   - Adds leave information to `candidate.leaves` array (one entry per date).
   - Creates `Attendance` records with `status: 'Leave'` and `leaveType` for each candidate × date where no attendance exists yet.

---

## Endpoints

### 1. Assign Leaves to Candidate Attendance Calendar

Assign leaves (casual, sick, or unpaid) to multiple candidates for specific dates.

**Endpoint:** `POST /v1/attendance/leaves`

**Access:** Admin only

**Description:**
- Assigns leaves to a list of candidates (by ID) for specific dates.
- For each candidate × date:
  - Adds a leave entry to `candidate.leaves` array (one entry per date).
  - Creates an `Attendance` record for that date with `status: 'Leave'` and `leaveType` if no attendance exists for that date.
  - Skips dates where attendance already exists.

---

### Request

**Request Body:**

```json
{
  "candidateIds": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012"
  ],
  "dates": [
    "2024-01-15T00:00:00.000Z",
    "2024-01-17T00:00:00.000Z",
    "2024-01-20T00:00:00.000Z"
  ],
  "leaveType": "casual",
  "notes": "Personal leave"
}
```

**Fields:**

| Field         | Type   | Required | Description                                      |
|--------------|--------|----------|--------------------------------------------------|
| `candidateIds` | array | Yes      | Array of candidate ObjectIds (min 1)           |
| `dates`         | array  | Yes      | Array of dates for leave (ISO 8601 format, min 1) |
| `leaveType`     | string | Yes      | Type of leave: `"casual"`, `"sick"`, or `"unpaid"`         |
| `notes`         | string | No       | Optional notes for the leave                   |

**Notes:**
- `dates` must be an array with at least one date.
- Duplicate dates in the array will be automatically removed.
- `leaveType` must be exactly `"casual"`, `"sick"`, or `"unpaid"`.
- Each date in the array will have a leave record created.
- If `notes` is not provided, it defaults to `"Casual Leave"`, `"Sick Leave"`, or `"Unpaid Leave"` based on `leaveType`.

---

### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Leaves assigned to 2 candidate(s). Created 6 attendance record(s).",
  "data": {
    "candidatesUpdated": 2,
    "leaveType": "casual",
    "dates": [
      "2024-01-15T00:00:00.000Z",
      "2024-01-17T00:00:00.000Z",
      "2024-01-20T00:00:00.000Z"
    ],
    "totalDays": 3,
    "attendanceRecordsCreated": 6,
    "createdRecords": [
      {
        "_id": "ATTENDANCE_ID_1",
        "candidate": {
          "_id": "507f1f77bcf86cd799439011",
          "fullName": "John Doe",
          "email": "john@example.com"
        },
        "candidateEmail": "john@example.com",
        "date": "2024-01-15T00:00:00.000Z",
        "punchIn": "2024-01-15T00:00:00.000Z",
        "punchOut": null,
        "duration": 0,
        "notes": "Personal leave",
        "timezone": "UTC",
        "status": "Leave",
        "leaveType": "casual",
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "skipped": [
      {
        "candidateId": "507f1f77bcf86cd799439011",
        "candidateName": "John Doe",
        "date": "2024-01-16T00:00:00.000Z",
        "reason": "Attendance already exists for this date"
      }
    ]
  }
}
```

**Response Fields:**
- `candidatesUpdated`: Number of candidates that were processed.
- `leaveType`: The type of leave that was assigned.
- `dates`: Array of dates for which leaves were assigned.
- `totalDays`: Total number of dates in the array.
- `attendanceRecordsCreated`: Number of attendance records created.
- `createdRecords`: Full list of newly-created `Attendance` documents (populated with candidate's name and email).
- `skipped`: Optional array; present only when some candidate/date combinations were skipped because an attendance record already existed.

---

### Error Responses

#### 400 Bad Request

Missing or invalid fields:

```json
{
  "code": 400,
  "message": "At least one candidate ID is required"
}
```

```json
{
  "code": 400,
  "message": "At least one date is required"
}
```

```json
{
  "code": 400,
  "message": "Dates are required"
}
```

```json
{
  "code": 400,
  "message": "Leave type is required"
}
```

```json
{
  "code": 400,
  "message": "Leave type must be either \"casual\", \"sick\", or \"unpaid\""
}
```


#### 403 Forbidden

Non-admin user:

```json
{
  "code": 403,
  "message": "Only admin can assign leaves to candidates"
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

---

### 2. Update a Leave

Update an existing leave for a candidate.

**Endpoint:** `PATCH /v1/attendance/leaves/:candidateId/:leaveId`

**Access:** Admin only

**Description:**
- Updates a specific leave entry for a candidate.
- Can update the date, leave type, or notes (at least one field required).
- Also updates the corresponding attendance record automatically.
- **Date Change Behavior:**
  - If the date is changed, the attendance record is moved to the new date.
  - If an attendance record already exists for the new date, the old leave attendance record is deleted (to avoid duplicates).
  - If the date doesn't change, only the leave type and notes are updated in the attendance record.
- **Leave Type Update:**
  - When leave type is updated, the attendance record's `leaveType` and `notes` are automatically updated.
  - If notes are not provided, default notes are generated (e.g., "Casual Leave", "Sick Leave", "Unpaid Leave").

---

### Request

**URL Parameters:**
- `candidateId` (required): MongoDB ObjectId of the candidate
- `leaveId` (required): MongoDB ObjectId of the leave entry (from candidate.leaves array)

**Request Body:**

All fields are optional, but at least one must be provided:

```json
{
  "date": "2024-01-20T00:00:00.000Z",
  "leaveType": "sick",
  "notes": "Updated notes"
}
```

**Request Examples:**

Update only the date:
```json
{
  "date": "2024-01-25T00:00:00.000Z"
}
```

Update only the leave type:
```json
{
  "leaveType": "unpaid"
}
```

Update only the notes:
```json
{
  "notes": "Updated leave notes"
}
```

Update multiple fields:
```json
{
  "date": "2024-01-20T00:00:00.000Z",
  "leaveType": "unpaid",
  "notes": "Unpaid leave for personal reasons"
}
```

**Fields:**

| Field         | Type   | Required | Description                                      |
|--------------|--------|----------|--------------------------------------------------|
| `date`         | date   | No       | New date for the leave (ISO 8601 format)        |
| `leaveType`     | string | No       | New leave type: `"casual"`, `"sick"`, or `"unpaid"`         |
| `notes`         | string | No       | New notes for the leave                         |

**Note:** At least one field must be provided for update.

---

### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Leave updated successfully",
  "data": {
    "candidate": {
      "_id": "507f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "email": "john@example.com",
      "leaves": [
        {
          "_id": "695f466689151f918930032e",
          "date": "2024-01-20T00:00:00.000Z",
          "leaveType": "sick",
          "notes": "Updated notes",
          "assignedAt": "2024-01-10T10:00:00.000Z"
        }
      ]
    },
    "leave": {
      "_id": "695f466689151f918930032e",
      "date": "2024-01-20T00:00:00.000Z",
      "leaveType": "sick",
      "notes": "Updated notes",
      "assignedAt": "2024-01-10T10:00:00.000Z"
    }
  }
}
```

---

### Error Responses

#### 400 Bad Request

```json
{
  "code": 400,
  "message": "At least one field must be provided for update"
}
```

```json
{
  "code": 400,
  "message": "Leave type must be either \"casual\", \"sick\", or \"unpaid\""
}
```

#### 403 Forbidden

```json
{
  "code": 403,
  "message": "Only admin can update leaves"
}
```

#### 404 Not Found

```json
{
  "code": 404,
  "message": "Candidate not found"
}
```

```json
{
  "code": 404,
  "message": "Leave not found"
}
```

---

### 3. Delete a Leave

Delete an existing leave for a candidate.

**Endpoint:** `DELETE /v1/attendance/leaves/:candidateId/:leaveId`

**Access:** Admin only

**Description:**
- Deletes a specific leave entry from a candidate's leaves array.
- Also automatically deletes the corresponding attendance record with matching date and leave type.
- The deletion is permanent and cannot be undone.
- Both the leave entry in the candidate's `leaves` array and the attendance record are removed.

---

### Request

**URL Parameters:**
- `candidateId` (required): MongoDB ObjectId of the candidate
- `leaveId` (required): MongoDB ObjectId of the leave entry (from candidate.leaves array)

---

### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Leave deleted successfully",
  "data": {
    "candidateId": "507f1f77bcf86cd799439011",
    "leaveId": "695f466689151f918930032e"
  }
}
```

---

### Error Responses

#### 403 Forbidden

```json
{
  "code": 403,
  "message": "Only admin can delete leaves"
}
```

#### 404 Not Found

```json
{
  "code": 404,
  "message": "Candidate not found"
}
```

```json
{
  "code": 404,
  "message": "Leave not found"
}
```

---

### 4. Cancel a Leave

Cancel an existing leave for a candidate. This endpoint provides an alternative to delete with cancellation semantics.

**Endpoint:** `POST /v1/attendance/leaves/:candidateId/:leaveId/cancel`

**Access:** Admin only

**Description:**
- Cancels a specific leave entry from a candidate's leaves array.
- Also automatically deletes the corresponding attendance record with matching date and leave type.
- Functionally similar to delete, but with cancellation semantics for better UX.
- The cancellation is permanent and cannot be undone.

---

### Request

**URL Parameters:**
- `candidateId` (required): MongoDB ObjectId of the candidate
- `leaveId` (required): MongoDB ObjectId of the leave entry (from candidate.leaves array)

**Request Body:** None (empty body)

---

### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Leave cancelled successfully",
  "data": {
    "candidateId": "507f1f77bcf86cd799439011",
    "leaveId": "695f466689151f918930032e"
  }
}
```

---

### Error Responses

#### 403 Forbidden

```json
{
  "code": 403,
  "message": "Only admin can cancel leaves"
}
```

#### 404 Not Found

```json
{
  "code": 404,
  "message": "Candidate not found"
}
```

```json
{
  "code": 404,
  "message": "Leave not found"
}
```

---

## Frontend Implementation Examples

### Using Fetch API

```javascript
// Assign leaves to multiple candidates
const assignLeavesToCandidates = async (candidateIds, dates, leaveType, notes) => {
  const token = localStorage.getItem('token');

  const res = await fetch('/v1/attendance/leaves', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      candidateIds,
      dates: dates.map(date => new Date(date).toISOString()),
      leaveType,
      notes
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to assign leaves');
  }
  return data;
};

// Example usage - Assign casual leave for specific dates
await assignLeavesToCandidates(
  ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  ['2024-01-15', '2024-01-17', '2024-01-20'],
  'casual',
  'Personal leave'
);

// Example usage - Assign sick leave for a single date
await assignLeavesToCandidates(
  ['507f1f77bcf86cd799439011'],
  ['2024-01-20'],
  'sick',
  'Medical appointment'
);
```

### Using Axios

```javascript
import axios from 'axios';

export const assignLeavesToCandidates = async (candidateIds, dates, leaveType, notes) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    '/v1/attendance/leaves',
    {
      candidateIds,
      dates: dates.map(date => new Date(date).toISOString()),
      leaveType,
      notes
    },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

// Example usage
await assignLeavesToCandidates(
  ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  ['2024-01-15', '2024-01-17', '2024-01-20'],
  'casual',
  'Personal leave'
);
```

### Update Leave Example

```javascript
// Update a leave
const updateLeave = async (candidateId, leaveId, updateData) => {
  const token = localStorage.getItem('token');

  const res = await fetch(`/v1/attendance/leaves/${candidateId}/${leaveId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updateData)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update leave');
  }
  return data;
};

// Example usage - Update leave date and type
await updateLeave(
  '507f1f77bcf86cd799439011',
  '695f466689151f918930032e',
  {
    date: '2024-01-20T00:00:00.000Z',
    leaveType: 'sick',
    notes: 'Updated notes'
  }
);

// Example - Update only leave type to unpaid
await updateLeave(
  '507f1f77bcf86cd799439011',
  '695f466689151f918930032e',
  {
    leaveType: 'unpaid',
    notes: 'Unpaid leave'
  }
);

// Example - Update only the date
await updateLeave(
  '507f1f77bcf86cd799439011',
  '695f466689151f918930032e',
  {
    date: '2024-01-25T00:00:00.000Z'
  }
);
```

### Delete Leave Example

```javascript
// Delete a leave
const deleteLeave = async (candidateId, leaveId) => {
  const token = localStorage.getItem('token');

  const res = await fetch(`/v1/attendance/leaves/${candidateId}/${leaveId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to delete leave');
  }
  return data;
};

// Example usage
await deleteLeave(
  '507f1f77bcf86cd799439011',
  '695f466689151f918930032e'
);
```

### Delete Leave Example (Axios)

```javascript
import axios from 'axios';

const deleteLeave = async (candidateId, leaveId) => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(
    `/v1/attendance/leaves/${candidateId}/${leaveId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.data;
};

// Example usage
await deleteLeave(
  '507f1f77bcf86cd799439011',
  '695f466689151f918930032e'
);
```

### Cancel Leave Example

```javascript
// Cancel a leave
const cancelLeave = async (candidateId, leaveId) => {
  const token = localStorage.getItem('token');

  const res = await fetch(`/v1/attendance/leaves/${candidateId}/${leaveId}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to cancel leave');
  }
  return data;
};

// Example usage
await cancelLeave(
  '507f1f77bcf86cd799439011',
  '695f466689151f918930032e'
);
```

### Cancel Leave Example (Axios)

```javascript
import axios from 'axios';

const cancelLeave = async (candidateId, leaveId) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `/v1/attendance/leaves/${candidateId}/${leaveId}/cancel`,
    {},
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};

// Example usage
await cancelLeave(
  '507f1f77bcf86cd799439011',
  '695f466689151f918930032e'
);
```

### React Component Example

```jsx
import React, { useState } from 'react';
import axios from 'axios';

const LeaveAssignmentForm = ({ selectedCandidates }) => {
  const [selectedDates, setSelectedDates] = useState([]);
  const [dateInput, setDateInput] = useState('');
  const [leaveType, setLeaveType] = useState('casual');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleAddDate = () => {
    if (dateInput) {
      const date = new Date(dateInput);
      const dateStr = date.toISOString().split('T')[0];
      if (!selectedDates.includes(dateStr)) {
        setSelectedDates([...selectedDates, dateStr].sort());
        setDateInput('');
      }
    }
  };

  const handleRemoveDate = (dateToRemove) => {
    setSelectedDates(selectedDates.filter(d => d !== dateToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCandidates || selectedCandidates.length === 0) {
      setError('Please select at least one candidate');
      return;
    }

    if (selectedDates.length === 0) {
      setError('Please select at least one date');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const token = localStorage.getItem('token');
      const candidateIds = selectedCandidates.map(c => c._id || c.id);

      const response = await axios.post(
        '/v1/attendance/leaves',
        {
          candidateIds,
          dates: selectedDates.map(d => new Date(d).toISOString()),
          leaveType,
          notes: notes || undefined
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess(true);
      setSelectedDates([]);
      setNotes('');
      
      alert(`Leaves assigned to ${response.data.data.candidatesUpdated} candidate(s). Created ${response.data.data.attendanceRecordsCreated} attendance record(s).`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign leaves');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="leave-assignment-form">
      <h3>Assign Leave to {selectedCandidates?.length || 0} Candidate(s)</h3>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">Leaves assigned successfully!</div>}

      <div className="form-group">
        <label>Leave Type *</label>
        <select
          value={leaveType}
          onChange={(e) => setLeaveType(e.target.value)}
          required
        >
          <option value="casual">Casual Leave</option>
          <option value="sick">Sick Leave</option>
          <option value="unpaid">Unpaid Leave</option>
        </select>
      </div>

      <div className="form-group">
        <label>Select Dates *</label>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
          />
          <button type="button" onClick={handleAddDate}>
            Add Date
          </button>
        </div>
        {selectedDates.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <small>Selected dates ({selectedDates.length}):</small>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
              {selectedDates.map(date => (
                <span key={date} style={{ 
                  padding: '5px 10px', 
                  background: '#e3f2fd', 
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  {date}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveDate(date)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="form-group">
        <label>Notes (Optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter leave notes (optional)"
          rows={3}
        />
      </div>

      <button type="submit" disabled={loading || selectedDates.length === 0}>
        {loading ? 'Assigning...' : 'Assign Leave'}
      </button>
    </form>
  );
};

export default LeaveAssignmentForm;
```

---

## Integration Tips

### 1. Admin Flow

1. Use `GET /v1/candidates` to fetch and select candidates.
2. Select leave type (casual, sick, or unpaid).
3. Select one or more specific dates for the leave.
4. Optionally add notes.
5. Call `POST /v1/attendance/leaves` with selected `candidateIds`, `dates` array, `leaveType`, and optional `notes`.

### 2. Calendar Rendering

When rendering attendance:

- Treat any `Attendance` record with `status: 'Leave'` as a leave.
- Use `attendance.leaveType` to distinguish between `"casual"`, `"sick"`, and `"unpaid"` leaves.
- Display `attendance.notes` (e.g., `"Casual Leave"`, `"Sick Leave"`, `"Unpaid Leave"` or custom notes) as the leave label on that date.
- Use different colors/icons for casual, sick, and unpaid leaves in the calendar view.

### 3. Date Selection

- The API accepts an array of specific dates.
- Duplicate dates in the array are automatically removed.
- Dates are sorted automatically.
- For example, if `dates` is `['2024-01-15', '2024-01-17', '2024-01-20']`, it will create records for exactly those three dates.

### 4. Idempotency / Safety

- You can safely call the assignment API multiple times with the same candidate/date combinations:
  - It will not create duplicate attendance records for the same candidate and date.
  - Dates where attendance already exists will be skipped and reported in the `skipped` array.

### 5. Date Format

- All dates should be in ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`
- Example: `"2024-01-15T00:00:00.000Z"`
- When using date inputs in HTML forms, convert to ISO format before sending:
  ```javascript
  new Date(dateInput.value).toISOString()
  ```

---

## Summary

### Endpoints

- **Assign Leaves to Candidates:** `POST /v1/attendance/leaves`
  - Assign leaves to multiple candidates for specific dates
  - Creates leave entries in candidate's `leaves` array
  - Creates corresponding attendance records
  
- **Update a Leave:** `PATCH /v1/attendance/leaves/:candidateId/:leaveId`
  - Update date, leave type, or notes for an existing leave
  - Automatically updates corresponding attendance record
  - Handles date changes intelligently (moves or deletes attendance records as needed)
  
- **Delete a Leave:** `DELETE /v1/attendance/leaves/:candidateId/:leaveId`
  - Delete a leave entry from candidate's `leaves` array
  - Automatically deletes corresponding attendance record
  - Permanent deletion (cannot be undone)

### Data Model

- **Candidate Model:**
  - `leaves: [{ date, leaveType, notes, assignedAt }]` (one entry per date)
  - Each leave entry has a unique `_id` that can be used for update/delete operations

- **Attendance Model:**
  - `status: 'Leave'` - Marks the day as a leave
  - `leaveType: 'casual' | 'sick' | 'unpaid'` - Type of leave
  - `notes: <custom or default>` - Leave notes (defaults to "Casual Leave", "Sick Leave", or "Unpaid Leave" if not provided)

### Access Control

- **All leave operations require admin with `manageCandidates` permission**
- Regular users cannot assign, update, or delete leaves

### Use Cases

- **Bulk Assignment:** Assign leaves (casual, sick, or unpaid) to multiple candidates for specific dates
- **Update Leave:** Modify leave details (date, type, notes) for a specific leave
- **Delete Leave:** Remove a leave and its corresponding attendance record
- **Cancel Leave:** Cancel a leave with cancellation semantics (alternative to delete)

### Leave Types

- **`casual`**: Casual leave (paid)
- **`sick`**: Sick leave (paid)
- **`unpaid`**: Unpaid leave

### Important Notes

- **Date Format:** All dates must be in ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`
- **Date Changes:** When updating a leave date, the system automatically handles attendance record updates:
  - If no attendance exists for the new date, the attendance record is moved
  - If attendance already exists for the new date, the old leave attendance record is deleted
- **Default Notes:** If notes are not provided during assignment, default notes are generated based on leave type
- **Idempotency:** You can safely call the assignment API multiple times - duplicate attendance records are not created

