# Shifts API Documentation

## Overview

This API allows administrators to manage shifts with timezone-aware time ranges. Shifts define work periods with start and end times in 24-hour format, associated with a specific timezone.

**Base URL:** `/v1/shifts`

**Authentication:** All endpoints require JWT authentication:
```
Authorization: Bearer <your-jwt-token>
```

---

## Important Notes

### Shift Management
- **Admin Only**: Create, update, and delete operations require admin privileges
- **View**: Any authenticated user can view shifts
- **Timezone-Aware**: Each shift is associated with a timezone (IANA format, e.g., 'America/New_York', 'Asia/Kolkata')
- **24-Hour Time Format**: Times are stored in "HH:mm" format (e.g., "10:00", "18:00")
- **Overnight Shifts**: Shifts can span midnight (e.g., 22:00 to 06:00)

### Permissions
- **Create/Update/Delete**: Admin only (requires `manageCandidates` permission)
- **View**: Any authenticated user can view shifts

### Time Format
- Times must be in **24-hour format** as "HH:mm" (e.g., "09:00", "17:30", "22:00")
- Valid range: 00:00 to 23:59
- End time cannot be the same as start time
- Overnight shifts are allowed (endTime < startTime means next day)

### Timezone Format
- Use IANA timezone identifiers (e.g., 'America/New_York', 'Asia/Kolkata', 'Europe/London', 'UTC')
- Common timezones:
  - `America/New_York` - US Eastern Time
  - `America/Los_Angeles` - US Pacific Time
  - `Asia/Kolkata` - India Standard Time (IST)
  - `Europe/London` - UK Time
  - `UTC` - Coordinated Universal Time

---

## Endpoints

### 1. Create Shift

Create a new shift with timezone and time range.

**Endpoint:** `POST /v1/shifts`

**Access:** Admin only

**Request Body:**
```json
{
  "name": "Morning Shift",
  "description": "Standard morning work shift",
  "timezone": "America/New_York",
  "startTime": "10:00",
  "endTime": "18:00",
  "isActive": true
}
```

**Request Body Parameters:**
| Parameter | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | string | Yes | Shift name (max 200 characters) |
| `description` | string | No | Shift description (max 1000 characters) |
| `timezone` | string | Yes | IANA timezone identifier (e.g., 'America/New_York', 'Asia/Kolkata') |
| `startTime` | string | Yes | Start time in HH:mm format (24-hour, e.g., "10:00") |
| `endTime` | string | Yes | End time in HH:mm format (24-hour, e.g., "18:00") |
| `isActive` | boolean | No | Active status (default: true) |

**Request Example:**
```javascript
// Using fetch
const response = await fetch('/v1/shifts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <admin-token>'
  },
  body: JSON.stringify({
    name: "Day Shift",
    description: "Standard day shift from 10 AM to 6 PM",
    timezone: 'America/New_York',
    startTime: '10:00',
    endTime: '18:00',
    isActive: true
  })
});

const data = await response.json();
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Shift created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439020",
    "name": "Day Shift",
    "description": "Standard day shift from 10 AM to 6 PM",
    "timezone": "America/New_York",
    "startTime": "10:00",
    "endTime": "18:00",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request - Missing Required Field:**
```json
{
  "code": 400,
  "message": "Shift name is required"
}
```

**400 Bad Request - Invalid Time Format:**
```json
{
  "code": 400,
  "message": "Time must be in HH:mm format (24-hour, e.g., \"10:00\", \"18:00\")"
}
```

**400 Bad Request - Invalid Time Range:**
```json
{
  "code": 400,
  "message": "End time cannot be the same as start time"
}
```

**403 Forbidden:**
```json
{
  "code": 403,
  "message": "Only admin can create shifts"
}
```

---

### 2. Get All Shifts

Retrieve a list of shifts with optional filtering and pagination.

**Endpoint:** `GET /v1/shifts`

**Access:** Any authenticated user

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Filter by shift name (partial match) |
| `timezone` | string | Filter by timezone |
| `isActive` | boolean | Filter by active status |
| `sortBy` | string | Sort field and order (e.g., "name:asc", "createdAt:desc") |
| `limit` | number | Maximum number of results per page (default: 10) |
| `page` | number | Page number (default: 1) |

**Request Example:**
```javascript
// Get all shifts
const response = await fetch('/v1/shifts', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer <your-token>'
  }
});

// Get active shifts in a specific timezone
const response2 = await fetch('/v1/shifts?timezone=America/New_York&isActive=true', {
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
        "id": "507f1f77bcf86cd799439020",
        "name": "Day Shift",
        "description": "Standard day shift from 10 AM to 6 PM",
        "timezone": "America/New_York",
        "startTime": "10:00",
        "endTime": "18:00",
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "id": "507f1f77bcf86cd799439021",
        "name": "Night Shift",
        "description": "Overnight shift",
        "timezone": "America/New_York",
        "startTime": "22:00",
        "endTime": "06:00",
        "isActive": true,
        "createdAt": "2024-01-15T11:00:00.000Z",
        "updatedAt": "2024-01-15T11:00:00.000Z"
      }
    ],
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalResults": 2
  }
}
```

---

### 3. Get Shift by ID

Retrieve a specific shift by its ID.

**Endpoint:** `GET /v1/shifts/:shiftId`

**Access:** Any authenticated user

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `shiftId` | string | MongoDB ObjectId of the shift |

**Request Example:**
```javascript
const response = await fetch('/v1/shifts/507f1f77bcf86cd799439020', {
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
    "id": "507f1f77bcf86cd799439020",
    "name": "Day Shift",
    "description": "Standard day shift from 10 AM to 6 PM",
    "timezone": "America/New_York",
    "startTime": "10:00",
    "endTime": "18:00",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "code": 404,
  "message": "Shift not found"
}
```

---

### 4. Update Shift

Update an existing shift.

**Endpoint:** `PATCH /v1/shifts/:shiftId`

**Access:** Admin only

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `shiftId` | string | MongoDB ObjectId of the shift |

**Request Body (all fields optional):**
```json
{
  "name": "Updated Shift Name",
  "description": "Updated description",
  "timezone": "Asia/Kolkata",
  "startTime": "09:00",
  "endTime": "17:00",
  "isActive": false
}
```

**Request Example:**
```javascript
const response = await fetch('/v1/shifts/507f1f77bcf86cd799439020', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <admin-token>'
  },
  body: JSON.stringify({
    name: 'Morning Shift',
    startTime: '09:00',
    endTime: '17:00'
  })
});

const data = await response.json();
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Shift updated successfully",
  "data": {
    "id": "507f1f77bcf86cd799439020",
    "name": "Morning Shift",
    "description": "Standard day shift from 10 AM to 6 PM",
    "timezone": "America/New_York",
    "startTime": "09:00",
    "endTime": "17:00",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request - Invalid Time Range:**
```json
{
  "code": 400,
  "message": "End time cannot be the same as start time"
}
```

**403 Forbidden:**
```json
{
  "code": 403,
  "message": "Only admin can update shifts"
}
```

**404 Not Found:**
```json
{
  "code": 404,
  "message": "Shift not found"
}
```

---

### 5. Delete Shift

Delete a shift.

**Endpoint:** `DELETE /v1/shifts/:shiftId`

**Access:** Admin only

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `shiftId` | string | MongoDB ObjectId of the shift |

**Request Example:**
```javascript
const response = await fetch('/v1/shifts/507f1f77bcf86cd799439020', {
  method: 'DELETE',
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
  "message": "Shift deleted successfully"
}
```

**Error Responses:**

**403 Forbidden:**
```json
{
  "code": 403,
  "message": "Only admin can delete shifts"
}
```

**404 Not Found:**
```json
{
  "code": 404,
  "message": "Shift not found"
}
```

---

## Frontend Implementation Examples

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ShiftManager = () => {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    timezone: 'UTC',
    startTime: '',
    endTime: '',
    isActive: true
  });

  // Common timezones for dropdown
  const timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'US Eastern Time' },
    { value: 'America/Los_Angeles', label: 'US Pacific Time' },
    { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
    { value: 'Europe/London', label: 'UK Time' },
  ];

  // Fetch all shifts
  const fetchShifts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/v1/shifts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setShifts(response.data.data.results);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch shifts');
    } finally {
      setLoading(false);
    }
  };

  // Create shift
  const createShift = async () => {
    if (!formData.name || !formData.timezone || !formData.startTime || !formData.endTime) {
      setError('Name, timezone, start time, and end time are required');
      return;
    }

    // Validate time format
    const timeRegex = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formData.startTime) || !timeRegex.test(formData.endTime)) {
      setError('Times must be in HH:mm format (24-hour)');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.post('/v1/shifts', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setShifts([...shifts, response.data.data]);
      setFormData({ 
        name: '', 
        description: '', 
        timezone: 'UTC', 
        startTime: '', 
        endTime: '', 
        isActive: true 
      });
      alert('Shift created successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create shift');
    } finally {
      setLoading(false);
    }
  };

  // Update shift
  const updateShift = async (shiftId, updates) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.patch(`/v1/shifts/${shiftId}`, updates, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setShifts(shifts.map(s => s.id === shiftId ? response.data.data : s));
      alert('Shift updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update shift');
    } finally {
      setLoading(false);
    }
  };

  // Delete shift
  const deleteShift = async (shiftId) => {
    if (!window.confirm('Are you sure you want to delete this shift?')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(`/v1/shifts/${shiftId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setShifts(shifts.filter(s => s.id !== shiftId));
      alert('Shift deleted successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete shift');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  return (
    <div className="shift-manager">
      <h2>Shift Management</h2>

      {/* Create Shift Form */}
      <div className="create-shift-form">
        <h3>Create New Shift</h3>
        <input
          type="text"
          placeholder="Shift Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <textarea
          placeholder="Description (optional)"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
        <select
          value={formData.timezone}
          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
        >
          {timezones.map(tz => (
            <option key={tz.value} value={tz.value}>{tz.label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Start Time (HH:mm, e.g., 10:00)"
          value={formData.startTime}
          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
          pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$"
        />
        <input
          type="text"
          placeholder="End Time (HH:mm, e.g., 18:00)"
          value={formData.endTime}
          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
          pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$"
        />
        <label>
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          />
          Active
        </label>
        <button onClick={createShift} disabled={loading}>
          {loading ? 'Creating...' : 'Create Shift'}
        </button>
      </div>

      {/* Shifts List */}
      <div className="shifts-list">
        <h3>Shifts</h3>
        {loading && <p>Loading...</p>}
        {error && <div className="error">{error}</div>}
        {shifts.map(shift => (
          <div key={shift.id} className="shift-item">
            <h4>{shift.name}</h4>
            {shift.description && <p>{shift.description}</p>}
            <p>Timezone: {shift.timezone}</p>
            <p>Time: {shift.startTime} - {shift.endTime}</p>
            <p>Status: {shift.isActive ? 'Active' : 'Inactive'}</p>
            <button onClick={() => updateShift(shift.id, { isActive: !shift.isActive })}>
              {shift.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button onClick={() => deleteShift(shift.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShiftManager;
```

### Using Fetch API

```javascript
// Create shift
const createShift = async (shiftData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/v1/shifts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(shiftData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating shift:', error);
    throw error;
  }
};

// Get all shifts
const getShifts = async (filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`/v1/shifts?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching shifts:', error);
    throw error;
  }
};

// Update shift
const updateShift = async (shiftId, updates) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/v1/shifts/${shiftId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating shift:', error);
    throw error;
  }
};

// Delete shift
const deleteShift = async (shiftId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/v1/shifts/${shiftId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting shift:', error);
    throw error;
  }
};

// Usage examples
await createShift({
  name: 'Morning Shift',
  description: 'Standard morning work shift',
  timezone: 'America/New_York',
  startTime: '10:00',
  endTime: '18:00',
  isActive: true
});

// Create overnight shift
await createShift({
  name: 'Night Shift',
  description: 'Overnight shift',
  timezone: 'America/New_York',
  startTime: '22:00',
  endTime: '06:00',
  isActive: true
});

const shifts = await getShifts({ timezone: 'America/New_York', isActive: true });
await updateShift('507f1f77bcf86cd799439020', { startTime: '09:00', endTime: '17:00' });
await deleteShift('507f1f77bcf86cd799439020');
```

### Using Axios

```javascript
import axios from 'axios';

const createShift = async (shiftData) => {
  const token = localStorage.getItem('token');
  const response = await axios.post('/v1/shifts', shiftData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

const getShifts = async (filters = {}) => {
  const token = localStorage.getItem('token');
  const response = await axios.get('/v1/shifts', {
    params: filters,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data;
};

const updateShift = async (shiftId, updates) => {
  const token = localStorage.getItem('token');
  const response = await axios.patch(`/v1/shifts/${shiftId}`, updates, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

const deleteShift = async (shiftId) => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(`/v1/shifts/${shiftId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data;
};
```

---

## Time Format Examples

### Valid Time Formats
- `09:00` - 9:00 AM
- `10:30` - 10:30 AM
- `13:00` - 1:00 PM
- `17:30` - 5:30 PM
- `22:00` - 10:00 PM
- `23:59` - 11:59 PM

### Invalid Time Formats
- `9:00` - Missing leading zero (should be `09:00`)
- `25:00` - Invalid hour (max is 23)
- `10:60` - Invalid minute (max is 59)
- `10:0` - Missing trailing zero (should be `10:00`)
- `10.00` - Wrong separator (should use colon)

### Overnight Shift Examples
- `22:00` to `06:00` - Night shift (10 PM to 6 AM next day)
- `23:00` to `07:00` - Late night shift
- `00:00` to `08:00` - Early morning shift

---

## Summary

- **Create Shift**: `POST /v1/shifts`
- **Get All Shifts**: `GET /v1/shifts`
- **Get Shift by ID**: `GET /v1/shifts/:shiftId`
- **Update Shift**: `PATCH /v1/shifts/:shiftId`
- **Delete Shift**: `DELETE /v1/shifts/:shiftId`
- **Access**: Create/Update/Delete requires admin, View requires authentication
- **Fields**: 
  - `name` (string, required) - Shift name
  - `description` (string, optional) - Shift description
  - `timezone` (string, required) - IANA timezone identifier
  - `startTime` (string, required) - Start time in HH:mm format (24-hour)
  - `endTime` (string, required) - End time in HH:mm format (24-hour)
  - `isActive` (boolean, optional) - Active status (default: true)
- **Time Format**: HH:mm in 24-hour format (e.g., "10:00", "18:00")
- **Overnight Shifts**: Supported (endTime < startTime means next day)
- **Timezone**: IANA format (e.g., 'America/New_York', 'Asia/Kolkata', 'UTC')

