# Candidate Joining Date & Resign Date API Documentation

## Overview

This API allows administrators to manage candidate joining dates and resign dates. When a resign date is set and arrives, the candidate is automatically deactivated and loses access to the system.

**Base URL:** `/v1/candidates`

**Authentication:** All endpoints require JWT authentication with admin privileges:
```
Authorization: Bearer <admin-token>
```

---

## Important Notes

### Automatic Deactivation
- **Future Resign Dates**: If a resign date is set in the future, the candidate remains **active** until that date arrives
- **Automatic Deactivation**: On the resign date (or after), the system automatically deactivates the candidate
- **Scheduler**: A background scheduler runs every hour to check and deactivate candidates whose resign date has arrived
- **Login Block**: Once deactivated, candidates cannot log in or access the system

### Date Flexibility
- **Joining Date**: Can be set to any date (past or future)
- **Resign Date**: Can be set to any date (past or future)
- **Validation**: Resign date must be after joining date (if both are set)

---

## Endpoints

### 1. Update Candidate Joining Date

Set or update the joining date for a candidate.

**Endpoint:** `PATCH /v1/candidates/:candidateId/joining-date`

**Access:** Admin only

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `candidateId` | string | MongoDB ObjectId of the candidate |

**Request Body:**
```json
{
  "joiningDate": "2024-01-15T00:00:00.000Z"
}
```

**Request Example:**
```javascript
// Using fetch
const response = await fetch('/v1/candidates/507f1f77bcf86cd799439011/joining-date', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <admin-token>'
  },
  body: JSON.stringify({
    joiningDate: '2024-01-15T00:00:00.000Z'
  })
});

const data = await response.json();
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Joining date updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "John Doe",
    "email": "john@example.com",
    "joiningDate": "2024-01-15T00:00:00.000Z",
    "resignDate": null,
    "isActive": true,
    "createdAt": "2024-01-10T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request - Invalid Date:**
```json
{
  "code": 400,
  "message": "Joining date cannot be after resign date"
}
```

**403 Forbidden:**
```json
{
  "code": 403,
  "message": "Only admin can update joining date"
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

### 2. Update Candidate Resign Date

Set or update the resign date for a candidate. This will automatically deactivate the candidate when the resign date arrives.

**Endpoint:** `PATCH /v1/candidates/:candidateId/resign-date`

**Access:** Admin only

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `candidateId` | string | MongoDB ObjectId of the candidate |

**Request Body:**
```json
{
  "resignDate": "2024-12-31T00:00:00.000Z"
}
```

**Request Example:**
```javascript
// Using fetch
const response = await fetch('/v1/candidates/507f1f77bcf86cd799439011/resign-date', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <admin-token>'
  },
  body: JSON.stringify({
    resignDate: '2024-12-31T00:00:00.000Z'
  })
});

const data = await response.json();
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Resign date updated successfully. Candidate is now inactive.",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "John Doe",
    "email": "john@example.com",
    "joiningDate": "2024-01-15T00:00:00.000Z",
    "resignDate": "2024-12-31T00:00:00.000Z",
    "isActive": true,
    "createdAt": "2024-01-10T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

**Note:** If `resignDate` is in the future, `isActive` will be `true` until the resign date arrives. The system automatically deactivates the candidate on the resign date.

**Error Responses:**

**400 Bad Request - Invalid Date:**
```json
{
  "code": 400,
  "message": "Resign date cannot be before joining date"
}
```

**403 Forbidden:**
```json
{
  "code": 403,
  "message": "Only admin can update resign date"
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

## Candidate Response Fields

When fetching candidate data, the following fields are now available:

```json
{
  "id": "507f1f77bcf86cd799439011",
  "fullName": "John Doe",
  "email": "john@example.com",
  "joiningDate": "2024-01-15T00:00:00.000Z",  // Date when candidate joined
  "resignDate": "2024-12-31T00:00:00.000Z",    // Date when candidate resigned/will resign
  "isActive": true,                            // Active status (false if resign date has arrived)
  // ... other candidate fields
}
```

---

## Frontend Implementation Examples

### React Component Example

```jsx
import React, { useState } from 'react';
import axios from 'axios';

const CandidateDateManagement = ({ candidateId, candidate }) => {
  const [joiningDate, setJoiningDate] = useState(
    candidate?.joiningDate ? new Date(candidate.joiningDate).toISOString().split('T')[0] : ''
  );
  const [resignDate, setResignDate] = useState(
    candidate?.resignDate ? new Date(candidate.resignDate).toISOString().split('T')[0] : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const updateJoiningDate = async () => {
    if (!joiningDate) {
      setError('Joining date is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `/v1/candidates/${candidateId}/joining-date`,
        {
          joiningDate: new Date(joiningDate).toISOString()
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess('Joining date updated successfully');
      console.log('Updated candidate:', response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update joining date');
    } finally {
      setLoading(false);
    }
  };

  const updateResignDate = async () => {
    if (!resignDate) {
      setError('Resign date is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `/v1/candidates/${candidateId}/resign-date`,
        {
          resignDate: new Date(resignDate).toISOString()
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const isFuture = new Date(resignDate) > new Date();
      setSuccess(
        isFuture
          ? `Resign date set. Candidate will be deactivated on ${resignDate}.`
          : 'Resign date updated. Candidate is now inactive.'
      );
      console.log('Updated candidate:', response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update resign date');
    } finally {
      setLoading(false);
    }
  };

  const clearResignDate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `/v1/candidates/${candidateId}/resign-date`,
        {
          resignDate: null
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setResignDate('');
      setSuccess('Resign date cleared. Candidate is now active.');
      console.log('Updated candidate:', response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to clear resign date');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="candidate-date-management">
      <h3>Joining & Resign Date Management</h3>

      {/* Joining Date */}
      <div className="form-group">
        <label htmlFor="joiningDate">Joining Date:</label>
        <input
          type="date"
          id="joiningDate"
          value={joiningDate}
          onChange={(e) => setJoiningDate(e.target.value)}
          max={resignDate || undefined}
        />
        <button
          onClick={updateJoiningDate}
          disabled={loading || !joiningDate}
        >
          {loading ? 'Updating...' : 'Update Joining Date'}
        </button>
      </div>

      {/* Resign Date */}
      <div className="form-group">
        <label htmlFor="resignDate">Resign Date:</label>
        <input
          type="date"
          id="resignDate"
          value={resignDate}
          onChange={(e) => setResignDate(e.target.value)}
          min={joiningDate || undefined}
        />
        <button
          onClick={updateResignDate}
          disabled={loading || !resignDate}
        >
          {loading ? 'Updating...' : 'Update Resign Date'}
        </button>
        {resignDate && (
          <button
            onClick={clearResignDate}
            disabled={loading}
            className="btn-clear"
          >
            Clear Resign Date
          </button>
        )}
      </div>

      {/* Status Display */}
      {candidate && (
        <div className="status-info">
          <p>
            <strong>Status:</strong>{' '}
            <span className={candidate.isActive ? 'active' : 'inactive'}>
              {candidate.isActive ? 'Active' : 'Inactive'}
            </span>
          </p>
          {candidate.resignDate && (
            <p>
              <strong>Resign Date:</strong>{' '}
              {new Date(candidate.resignDate).toLocaleDateString()}
              {new Date(candidate.resignDate) > new Date() && (
                <span className="future-date">
                  {' '}(Will be deactivated on this date)
                </span>
              )}
            </p>
          )}
        </div>
      )}

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
    </div>
  );
};

export default CandidateDateManagement;
```

### Using Fetch API

```javascript
// Update joining date
const updateJoiningDate = async (candidateId, joiningDate) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/v1/candidates/${candidateId}/joining-date`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        joiningDate: new Date(joiningDate).toISOString()
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating joining date:', error);
    throw error;
  }
};

// Update resign date
const updateResignDate = async (candidateId, resignDate) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/v1/candidates/${candidateId}/resign-date`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        resignDate: resignDate ? new Date(resignDate).toISOString() : null
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating resign date:', error);
    throw error;
  }
};

// Usage
await updateJoiningDate('507f1f77bcf86cd799439011', '2024-01-15');
await updateResignDate('507f1f77bcf86cd799439011', '2024-12-31');
```

### Using Axios

```javascript
import axios from 'axios';

const updateJoiningDate = async (candidateId, joiningDate) => {
  const token = localStorage.getItem('token');
  const response = await axios.patch(
    `/v1/candidates/${candidateId}/joining-date`,
    {
      joiningDate: new Date(joiningDate).toISOString()
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

const updateResignDate = async (candidateId, resignDate) => {
  const token = localStorage.getItem('token');
  const response = await axios.patch(
    `/v1/candidates/${candidateId}/resign-date`,
    {
      resignDate: resignDate ? new Date(resignDate).toISOString() : null
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
```

---

## Important Behaviors

### 1. Future Resign Dates
- If resign date is set to a **future date**, candidate remains **active**
- Candidate can log in and access the system normally
- On the resign date, the system automatically deactivates the candidate

### 2. Past/Current Resign Dates
- If resign date is set to **today or past**, candidate is **immediately inactive**
- Candidate cannot log in
- Login attempts will return: "Your account has been deactivated. Please contact your administrator for assistance."

### 3. Clearing Resign Date
- To reactivate a candidate, set `resignDate` to `null`
- This will set `isActive` back to `true`
- Candidate can log in again

### 4. Date Validation
- Resign date must be **after** joining date (if both are set)
- Both dates can be in the past or future
- No restriction on future dates

---

## Status Indicators

### Frontend Display Recommendations

```jsx
// Status badge component
const CandidateStatusBadge = ({ candidate }) => {
  if (!candidate.resignDate) {
    return <span className="badge active">Active</span>;
  }

  const resignDate = new Date(candidate.resignDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  resignDate.setHours(0, 0, 0, 0);

  if (resignDate > today) {
    // Future resign date - still active
    const daysUntil = Math.ceil((resignDate - today) / (1000 * 60 * 60 * 24));
    return (
      <span className="badge warning">
        Active (Resigns in {daysUntil} day{daysUntil !== 1 ? 's' : ''})
      </span>
    );
  } else {
    // Resigned - inactive
    return <span className="badge inactive">Inactive (Resigned)</span>;
  }
};
```

---

## Error Handling

### Common Errors

1. **403 Forbidden**: User is not an admin
   ```json
   {
     "code": 403,
     "message": "Only admin can update joining date"
   }
   ```

2. **400 Bad Request**: Invalid date relationship
   ```json
   {
     "code": 400,
     "message": "Resign date cannot be before joining date"
   }
   ```

3. **404 Not Found**: Candidate doesn't exist
   ```json
   {
     "code": 404,
     "message": "Candidate not found"
   }
   ```

### Error Handling Example

```javascript
try {
  await updateResignDate(candidateId, resignDate);
} catch (error) {
  if (error.response?.status === 403) {
    alert('You do not have permission to update resign dates');
  } else if (error.response?.status === 400) {
    alert(error.response.data.message);
  } else if (error.response?.status === 404) {
    alert('Candidate not found');
  } else {
    alert('An error occurred. Please try again.');
  }
}
```

---

## Testing Scenarios

### Scenario 1: Set Future Resign Date
- **Today**: January 6, 2024
- **Action**: Set resign date to January 10, 2024
- **Result**: Candidate remains active until January 10
- **On January 10**: Candidate automatically deactivated

### Scenario 2: Set Past Resign Date
- **Today**: January 6, 2024
- **Action**: Set resign date to January 1, 2024
- **Result**: Candidate immediately deactivated

### Scenario 3: Clear Resign Date
- **Action**: Set resign date to `null`
- **Result**: Candidate reactivated, can log in again

### Scenario 4: Update Joining Date After Resign Date
- **Current**: Joining date: Jan 1, Resign date: Jan 10
- **Action**: Try to set joining date to Jan 15
- **Result**: Error - "Joining date cannot be after resign date"

---

## Summary

- **Joining Date API**: `PATCH /v1/candidates/:candidateId/joining-date`
- **Resign Date API**: `PATCH /v1/candidates/:candidateId/resign-date`
- **Access**: Admin only
- **Automatic Deactivation**: Candidates are automatically deactivated when resign date arrives
- **Future Dates**: Candidates remain active until resign date arrives
- **Date Flexibility**: Both dates can be set to past or future dates

