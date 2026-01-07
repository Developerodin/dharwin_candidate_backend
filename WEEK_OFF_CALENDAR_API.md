# Week-Off Calendar API Documentation

## Overview

This API allows administrators to manage week-off calendars for candidates. Week-off days are stored in the database and can be used to determine which days are off for attendance tracking. Admins can set week-off days for multiple candidates at once (e.g., Saturday and Sunday, or just Sunday).

**Base URL:** `/v1/candidates`

**Authentication:** All endpoints require JWT authentication:
```
Authorization: Bearer <your-jwt-token>
```

---

## Important Notes

### Week-Off Days
- **Valid Days**: `Sunday`, `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`
- **Multiple Days**: Can set multiple week-off days (e.g., `["Saturday", "Sunday"]`)
- **Single Day**: Can set just one day (e.g., `["Sunday"]`)
- **Empty Array**: Can clear week-off by setting to empty array `[]`
- **Unique Values**: Duplicate days are automatically removed

### Permissions
- **Update Week-Off**: Admin only (requires `manageCandidates` permission)
- **Get Week-Off**: Any authenticated user can view week-off for candidates they have access to

### Database Storage
- Week-off days are stored in the `weekOff` field in the Candidate model
- Field type: Array of strings
- Indexed for efficient queries

---

## Endpoints

### 1. Update Week-Off Calendar for Multiple Candidates

Set or update week-off days for one or more candidates at once.

**Endpoint:** `POST /v1/candidates/week-off`

**Access:** Admin only

**Request Body:**
```json
{
  "candidateIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"],
  "weekOff": ["Saturday", "Sunday"]
}
```

**Request Body Parameters:**
| Parameter | Type | Required | Description |
|----------|------|----------|-------------|
| `candidateIds` | array | Yes | Array of candidate MongoDB ObjectIds (minimum 1) |
| `weekOff` | array | Yes | Array of week-off day names. Valid values: `Sunday`, `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday` |

**Request Examples:**

**Example 1: Set Saturday and Sunday as week-off for multiple candidates**
```javascript
// Using fetch
const response = await fetch('/v1/candidates/week-off', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <admin-token>'
  },
  body: JSON.stringify({
    candidateIds: [
      '507f1f77bcf86cd799439011',
      '507f1f77bcf86cd799439012',
      '507f1f77bcf86cd799439013'
    ],
    weekOff: ['Saturday', 'Sunday']
  })
});

const data = await response.json();
```

**Example 2: Set only Sunday as week-off**
```javascript
const response = await fetch('/v1/candidates/week-off', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <admin-token>'
  },
  body: JSON.stringify({
    candidateIds: ['507f1f77bcf86cd799439011'],
    weekOff: ['Sunday']
  })
});
```

**Example 3: Clear week-off (set to empty array)**
```javascript
const response = await fetch('/v1/candidates/week-off', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <admin-token>'
  },
  body: JSON.stringify({
    candidateIds: ['507f1f77bcf86cd799439011'],
    weekOff: []
  })
});
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Week-off calendar updated for 3 candidate(s)",
  "data": {
    "updatedCount": 3,
    "candidates": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "fullName": "John Doe",
        "email": "john@example.com",
        "weekOff": ["Saturday", "Sunday"],
        "owner": {
          "_id": "507f1f77bcf86cd799439010",
          "name": "Recruiter Name",
          "email": "recruiter@example.com"
        },
        "adminId": {
          "_id": "507f1f77bcf86cd799439009",
          "name": "Admin Name",
          "email": "admin@example.com"
        },
        "createdAt": "2024-01-10T10:30:00.000Z",
        "updatedAt": "2024-01-15T12:00:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "fullName": "Jane Smith",
        "email": "jane@example.com",
        "weekOff": ["Saturday", "Sunday"],
        // ... other fields
      }
    ]
  }
}
```

**Error Responses:**

**400 Bad Request - Missing Required Fields:**
```json
{
  "code": 400,
  "message": "At least one candidate ID is required"
}
```

**400 Bad Request - Invalid Week-Off Days:**
```json
{
  "code": 400,
  "message": "\"weekOff\" must contain at least one valid day"
}
```

**403 Forbidden - Not Admin:**
```json
{
  "code": 403,
  "message": "Only admin can update week-off calendar"
}
```

**404 Not Found - Some Candidates Not Found:**
```json
{
  "code": 404,
  "message": "Some candidates not found: 507f1f77bcf86cd799439099"
}
```

---

### 2. Get Week-Off Calendar for a Candidate

Retrieve the week-off days for a specific candidate.

**Endpoint:** `GET /v1/candidates/:candidateId/week-off`

**Access:** Any authenticated user (with access to the candidate)

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `candidateId` | string | MongoDB ObjectId of the candidate |

**Request Example:**
```javascript
// Using fetch
const response = await fetch('/v1/candidates/507f1f77bcf86cd799439011/week-off', {
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
    "candidateId": "507f1f77bcf86cd799439011",
    "candidateName": "John Doe",
    "candidateEmail": "john@example.com",
    "weekOff": ["Saturday", "Sunday"]
  }
}
```

**Response when candidate has no week-off:**
```json
{
  "success": true,
  "data": {
    "candidateId": "507f1f77bcf86cd799439011",
    "candidateName": "John Doe",
    "candidateEmail": "john@example.com",
    "weekOff": []
  }
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "code": 404,
  "message": "Candidate not found"
}
```

---

## Frontend Implementation Examples

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const WeekOffCalendarManager = ({ candidateIds = [] }) => {
  const [selectedDays, setSelectedDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [candidateWeekOffs, setCandidateWeekOffs] = useState({});

  const daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ];

  // Fetch week-off for a specific candidate
  const fetchCandidateWeekOff = async (candidateId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/v1/candidates/${candidateId}/week-off`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data.data.weekOff;
    } catch (err) {
      console.error('Error fetching week-off:', err);
      return [];
    }
  };

  // Update week-off for multiple candidates
  const updateWeekOff = async () => {
    if (candidateIds.length === 0) {
      setError('Please select at least one candidate');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/v1/candidates/week-off',
        {
          candidateIds,
          weekOff: selectedDays
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess(response.data.message);
      console.log('Updated candidates:', response.data.data.candidates);
      
      // Refresh week-off data for all candidates
      for (const candidateId of candidateIds) {
        const weekOff = await fetchCandidateWeekOff(candidateId);
        setCandidateWeekOffs(prev => ({
          ...prev,
          [candidateId]: weekOff
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update week-off calendar');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  return (
    <div className="week-off-calendar-manager">
      <h3>Week-Off Calendar Management</h3>

      {/* Day Selection */}
      <div className="day-selection">
        <label>Select Week-Off Days:</label>
        <div className="days-grid">
          {daysOfWeek.map(day => (
            <label key={day} className="day-checkbox">
              <input
                type="checkbox"
                checked={selectedDays.includes(day)}
                onChange={() => toggleDay(day)}
              />
              <span>{day}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Selected Days Display */}
      {selectedDays.length > 0 && (
        <div className="selected-days">
          <strong>Selected:</strong> {selectedDays.join(', ')}
        </div>
      )}

      {/* Update Button */}
      <button
        onClick={updateWeekOff}
        disabled={loading || candidateIds.length === 0}
        className="btn-primary"
      >
        {loading ? 'Updating...' : `Update Week-Off for ${candidateIds.length} Candidate(s)`}
      </button>

      {/* Candidate Week-Off Display */}
      {Object.keys(candidateWeekOffs).length > 0 && (
        <div className="candidate-week-offs">
          <h4>Current Week-Off Status:</h4>
          {candidateIds.map(candidateId => (
            <div key={candidateId} className="candidate-week-off-item">
              <strong>Candidate {candidateId}:</strong>{' '}
              {candidateWeekOffs[candidateId]?.length > 0
                ? candidateWeekOffs[candidateId].join(', ')
                : 'No week-off set'}
            </div>
          ))}
        </div>
      )}

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
    </div>
  );
};

export default WeekOffCalendarManager;
```

### Using Fetch API

```javascript
// Update week-off for multiple candidates
const updateWeekOff = async (candidateIds, weekOff) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/v1/candidates/week-off', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        candidateIds,
        weekOff
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating week-off:', error);
    throw error;
  }
};

// Get week-off for a candidate
const getCandidateWeekOff = async (candidateId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/v1/candidates/${candidateId}/week-off`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching week-off:', error);
    throw error;
  }
};

// Usage examples
// Set Saturday and Sunday as week-off for multiple candidates
await updateWeekOff(
  ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  ['Saturday', 'Sunday']
);

// Set only Sunday as week-off
await updateWeekOff(
  ['507f1f77bcf86cd799439011'],
  ['Sunday']
);

// Clear week-off
await updateWeekOff(
  ['507f1f77bcf86cd799439011'],
  []
);

// Get week-off for a candidate
const weekOffData = await getCandidateWeekOff('507f1f77bcf86cd799439011');
console.log('Week-off days:', weekOffData.weekOff);
```

### Using Axios

```javascript
import axios from 'axios';

// Update week-off for multiple candidates
const updateWeekOff = async (candidateIds, weekOff) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    '/v1/candidates/week-off',
    {
      candidateIds,
      weekOff
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

// Get week-off for a candidate
const getCandidateWeekOff = async (candidateId) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(
    `/v1/candidates/${candidateId}/week-off`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  return response.data.data;
};

// Usage
await updateWeekOff(
  ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
  ['Saturday', 'Sunday']
);

const weekOffData = await getCandidateWeekOff('507f1f77bcf86cd799439011');
```

---

## Candidate Response Fields

When fetching candidate data, the `weekOff` field is now available:

```json
{
  "id": "507f1f77bcf86cd799439011",
  "fullName": "John Doe",
  "email": "john@example.com",
  "weekOff": ["Saturday", "Sunday"],  // Array of week-off days
  // ... other candidate fields
}
```

---

## Use Cases

### Use Case 1: Set Standard Weekend Off
Set Saturday and Sunday as week-off for multiple candidates:
```javascript
await updateWeekOff(
  ['candidateId1', 'candidateId2', 'candidateId3'],
  ['Saturday', 'Sunday']
);
```

### Use Case 2: Set Custom Week-Off
Set only Sunday as week-off for a specific candidate:
```javascript
await updateWeekOff(
  ['candidateId1'],
  ['Sunday']
);
```

### Use Case 3: Different Week-Offs for Different Candidates
```javascript
// Set Saturday-Sunday for group 1
await updateWeekOff(
  ['candidateId1', 'candidateId2'],
  ['Saturday', 'Sunday']
);

// Set Friday-Saturday for group 2
await updateWeekOff(
  ['candidateId3', 'candidateId4'],
  ['Friday', 'Saturday']
);
```

### Use Case 4: Clear Week-Off
Remove all week-off days for a candidate:
```javascript
await updateWeekOff(
  ['candidateId1'],
  []
);
```

### Use Case 5: Check if Day is Week-Off
```javascript
const weekOffData = await getCandidateWeekOff(candidateId);
const isWeekOff = (day) => weekOffData.weekOff.includes(day);

// Check if today is a week-off day
const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
if (isWeekOff(today)) {
  console.log('Today is a week-off day');
}
```

---

## Integration with Attendance System

The week-off calendar can be used to determine attendance expectations:

```javascript
// Check if a candidate should be working on a specific day
const shouldBeWorking = async (candidateId, date) => {
  const weekOffData = await getCandidateWeekOff(candidateId);
  const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
  
  return !weekOffData.weekOff.includes(dayName);
};

// Example: Check if candidate should work today
const candidateId = '507f1f77bcf86cd799439011';
const today = new Date();
const shouldWork = await shouldBeWorking(candidateId, today);

if (!shouldWork) {
  console.log('Today is a week-off day for this candidate');
}
```

---

## Error Handling

### Common Errors

1. **403 Forbidden - Not Admin:**
   ```json
   {
     "code": 403,
     "message": "Only admin can update week-off calendar"
   }
   ```

2. **400 Bad Request - Invalid Candidate IDs:**
   ```json
   {
     "code": 400,
     "message": "At least one candidate ID is required"
   }
   ```

3. **400 Bad Request - Invalid Week-Off Days:**
   ```json
   {
     "code": 400,
     "message": "\"weekOff\" must contain at least one valid day"
   }
   ```

4. **404 Not Found - Candidate Not Found:**
   ```json
   {
     "code": 404,
     "message": "Some candidates not found: 507f1f77bcf86cd799439099"
   }
   ```

### Error Handling Example

```javascript
try {
  await updateWeekOff(candidateIds, weekOff);
} catch (error) {
  if (error.response?.status === 403) {
    alert('You do not have permission to update week-off calendars. Admin access required.');
  } else if (error.response?.status === 400) {
    alert(error.response.data.message);
  } else if (error.response?.status === 404) {
    alert('One or more candidates not found');
  } else {
    alert('An error occurred. Please try again.');
  }
}
```

---

## Validation Rules

1. **Candidate IDs:**
   - Must be an array
   - Must contain at least one valid MongoDB ObjectId
   - All IDs must exist in the database

2. **Week-Off Days:**
   - Must be an array
   - Each day must be one of: `Sunday`, `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`
   - Duplicate days are automatically removed
   - Can be empty array `[]` to clear week-off

---

## Summary

- **Update Week-Off API**: `POST /v1/candidates/week-off`
- **Get Week-Off API**: `GET /v1/candidates/:candidateId/week-off`
- **Access**: Update requires admin, Get requires authentication
- **Multiple Candidates**: Can update week-off for multiple candidates in one request
- **Flexible Days**: Can set any combination of days or clear all week-off days
- **Database Storage**: Week-off days stored in `weekOff` field in Candidate model
- **Use Cases**: Attendance tracking, scheduling, reporting

