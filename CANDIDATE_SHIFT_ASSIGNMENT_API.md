# Candidate Shift Assignment API Documentation

## Overview

This API allows administrators to assign shifts to multiple candidates at once. Shift information is referenced by shift ID from the shifts API.

- **Base URL (Shifts CRUD):** `/v1/shifts`
- **Base URL (Shift Assignment to Candidates):** `/v1/candidates`
- **Authentication:** All endpoints require JWT authentication:
  ```
  Authorization: Bearer <admin-token>
  ```
- **Access:** Admin only (role with `manageCandidates`)

---

## Data Model Notes

### Shift Model (Summary)

```json
{
  "_id": "507f1f77bcf86cd799439020",
  "name": "Day Shift",
  "description": "Standard day shift from 10 AM to 6 PM",
  "timezone": "America/New_York",
  "startTime": "10:00",
  "endTime": "18:00",
  "isActive": true
}
```

### Candidate Model (Relevant Field)

After shift assignment, the candidate model includes a `shift` reference:

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "fullName": "John Doe",
  "email": "john@example.com",
  "shift": "507f1f77bcf86cd799439020"
}
```

When populated, the shift field contains the full shift object:

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "fullName": "John Doe",
  "email": "john@example.com",
  "shift": {
    "_id": "507f1f77bcf86cd799439020",
    "name": "Day Shift",
    "description": "Standard day shift from 10 AM to 6 PM",
    "timezone": "America/New_York",
    "startTime": "10:00",
    "endTime": "18:00",
    "isActive": true
  }
}
```

- `shift`: ObjectId reference to the `Shift` model. When populated, contains the full shift object.

---

## Flow Summary

1. Admin creates shift definitions using the Shifts CRUD API (`/v1/shifts`).
2. Admin assigns a shift to multiple candidates using:
   - `POST /v1/candidates/assign-shift`
3. Backend:
   - Validates that the shift exists.
   - Stores shift ObjectId reference in each candidate's `shift` field.
   - Overwrites any existing shift assignment for the selected candidates.

---

## Endpoints

### 1. Assign Shift to Multiple Candidates

Assign shift information to multiple candidates at once.

**Endpoint:** `POST /v1/candidates/assign-shift`

**Access:** Admin only

**Description:**
- Assigns a shift (by ID) to a list of candidates (by ID).
- For each candidate:
  - Stores the shift ObjectId reference in `candidate.shift`.
  - Overwrites any existing shift assignment.

---

### Request

**Request Body:**

```json
{
  "candidateIds": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012"
  ],
  "shiftId": "507f1f77bcf86cd799439020"
}
```

**Fields:**

| Field         | Type   | Required | Description                                      |
|--------------|--------|----------|--------------------------------------------------|
| `candidateIds` | array | Yes      | Array of candidate ObjectIds (min 1)           |
| `shiftId`      | string | Yes      | Shift ObjectId from the shifts API             |

**Note:** The shift must exist in the shifts API. Use `GET /v1/shifts` to fetch available shifts and their IDs.

---

### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Shift assigned to 2 candidate(s)",
  "data": {
    "updatedCount": 2,
    "shift": {
      "id": "507f1f77bcf86cd799439020",
      "name": "Day Shift",
      "description": "Standard day shift from 10 AM to 6 PM",
      "timezone": "America/New_York",
      "startTime": "10:00",
      "endTime": "18:00",
      "isActive": true
    },
    "candidates": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "fullName": "John Doe",
        "email": "john@example.com",
        "shift": {
          "_id": "507f1f77bcf86cd799439020",
          "name": "Day Shift",
          "description": "Standard day shift from 10 AM to 6 PM",
          "timezone": "America/New_York",
          "startTime": "10:00",
          "endTime": "18:00",
          "isActive": true
        },
        "owner": {
          "_id": "507f1f77bcf86cd799439030",
          "name": "Admin User",
          "email": "admin@example.com"
        },
        "adminId": {
          "_id": "507f1f77bcf86cd799439030",
          "name": "Admin User",
          "email": "admin@example.com"
        }
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "fullName": "Jane Smith",
        "email": "jane@example.com",
        "shift": {
          "_id": "507f1f77bcf86cd799439020",
          "name": "Day Shift",
          "description": "Standard day shift from 10 AM to 6 PM",
          "timezone": "America/New_York",
          "startTime": "10:00",
          "endTime": "18:00",
          "isActive": true
        },
        "owner": {
          "_id": "507f1f77bcf86cd799439030",
          "name": "Admin User",
          "email": "admin@example.com"
        },
        "adminId": {
          "_id": "507f1f77bcf86cd799439030",
          "name": "Admin User",
          "email": "admin@example.com"
        }
      }
    ]
  }
}
```

**Notes:**
- `updatedCount`: Number of candidates that were successfully updated.
- `shift`: The shift information that was assigned (summary from shift document).
- `candidates`: Array of updated candidate documents with populated shift, owner, and adminId fields.

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
  "message": "Shift ID is required"
}
```

#### 403 Forbidden

Non-admin user:

```json
{
  "code": 403,
  "message": "Only admin can assign shifts to candidates"
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

Shift ID does not exist:

```json
{
  "code": 404,
  "message": "Shift not found"
}
```

---

## Frontend Implementation Examples

### Using Fetch API

```javascript
// Assign shift to multiple candidates
const assignShiftToCandidates = async (candidateIds, shiftId) => {
  const token = localStorage.getItem('token');

  const res = await fetch('/v1/candidates/assign-shift', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      candidateIds,
      shiftId
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to assign shift');
  }
  return data;
};

// Example usage - Assign shift by ID
await assignShiftToCandidates(
  ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  '507f1f77bcf86cd799439020' // Shift ID from /v1/shifts
);
```

### Using Axios

```javascript
import axios from 'axios';

export const assignShiftToCandidates = async (candidateIds, shiftId) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    '/v1/candidates/assign-shift',
    {
      candidateIds,
      shiftId
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
await assignShiftToCandidates(
  ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  '507f1f77bcf86cd799439020' // Shift ID from /v1/shifts
);
```

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ShiftAssignmentForm = ({ selectedCandidates }) => {
  const [shifts, setShifts] = useState([]);
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch available shifts
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/v1/shifts', {
          headers: { 'Authorization': `Bearer ${token}` },
          params: { isActive: true, limit: 100 }
        });
        setShifts(response.data.data.results);
      } catch (err) {
        console.error('Failed to fetch shifts:', err);
      }
    };
    fetchShifts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCandidates || selectedCandidates.length === 0) {
      setError('Please select at least one candidate');
      return;
    }

    if (!selectedShiftId) {
      setError('Please select a shift');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const token = localStorage.getItem('token');
      const candidateIds = selectedCandidates.map(c => c._id || c.id);

      const response = await axios.post(
        '/v1/candidates/assign-shift',
        {
          candidateIds,
          shiftId: selectedShiftId
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess(true);
      setSelectedShiftId('');
      
      alert(`Shift assigned to ${response.data.data.updatedCount} candidate(s)`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign shift');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="shift-assignment-form">
      <h3>Assign Shift to {selectedCandidates?.length || 0} Candidate(s)</h3>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">Shift assigned successfully!</div>}

      <div className="form-group">
        <label>Select Shift *</label>
        <select
          value={selectedShiftId}
          onChange={(e) => setSelectedShiftId(e.target.value)}
          required
        >
          <option value="">-- Select a shift --</option>
          {shifts.map(shift => (
            <option key={shift.id} value={shift.id}>
              {shift.name} ({shift.startTime} - {shift.endTime}, {shift.timezone})
            </option>
          ))}
        </select>
        {selectedShiftId && (
          <div className="shift-details">
            {(() => {
              const selectedShift = shifts.find(s => s.id === selectedShiftId);
              return selectedShift ? (
                <div>
                  <p><strong>Description:</strong> {selectedShift.description || 'N/A'}</p>
                  <p><strong>Timezone:</strong> {selectedShift.timezone}</p>
                  <p><strong>Time Range:</strong> {selectedShift.startTime} - {selectedShift.endTime}</p>
                  <p><strong>Status:</strong> {selectedShift.isActive ? 'Active' : 'Inactive'}</p>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Assigning...' : 'Assign Shift'}
      </button>
    </form>
  );
};

export default ShiftAssignmentForm;
```

---

## Integration Tips

### 1. Admin Flow

1. Use `GET /v1/shifts` to fetch available shifts and their IDs.
2. Use `GET /v1/candidates` to fetch and select candidates.
3. Call `POST /v1/candidates/assign-shift` with selected `candidateIds` and `shiftId`.

### 2. Displaying Shift Information

When displaying candidate information:

- Populate the `shift` field when fetching candidates: `.populate('shift')`
- Access `candidate.shift` to show shift details (will be populated with full shift object).
- Display shift name, time range, and timezone.
- Use timezone-aware time formatting for display.

### 3. Bulk Assignment

- You can assign the same shift to multiple candidates in a single API call.
- The shift reference will overwrite any existing shift assignment for each candidate.
- If a shift is updated in the shifts API, all candidates assigned to that shift will reflect the updated information when populated.

---

## Summary

- **Create Shift Definitions:** `POST /v1/shifts`
- **Get Available Shifts:** `GET /v1/shifts`
- **Assign Shift to Candidates:** `POST /v1/candidates/assign-shift`
- **Data Stored:**
  - Candidate: `shift: ObjectId` (reference to Shift model)
  - When populated: Full shift object with name, description, timezone, startTime, endTime, isActive
- **Access:** Shift assignment requires admin with `manageCandidates`
- **Use Case:** Bulk-assign shift references to multiple candidates. Shift details are managed centrally in the shifts API.
- **Benefits:** 
  - Centralized shift management
  - Updates to shifts automatically reflect for all assigned candidates
  - No data duplication

