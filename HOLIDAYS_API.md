# Holidays API Documentation

## Overview

This API allows administrators to manage holidays with title and date. Simple CRUD operations for holiday management.

**Base URL:** `/v1/holidays`

**Authentication:** All endpoints require JWT authentication:
```
Authorization: Bearer <your-jwt-token>
```

---

## Important Notes

### Holiday Management
- **Admin Only**: Create, update, and delete operations require admin privileges
- **View**: Any authenticated user can view holidays
- **Date Normalization**: Dates are normalized to start of day (00:00:00) for consistent comparison

### Permissions
- **Create/Update/Delete**: Admin only (requires `manageCandidates` permission)
- **View**: Any authenticated user can view holidays

---

## Endpoints

### 1. Create Holiday

Create a new holiday.

**Endpoint:** `POST /v1/holidays`

**Access:** Admin only

**Request Body:**
```json
{
  "title": "New Year's Day",
  "date": "2024-01-01T00:00:00.000Z",
  "isActive": true
}
```

**Request Body Parameters:**
| Parameter | Type | Required | Description |
|----------|------|----------|-------------|
| `title` | string | Yes | Holiday title (max 200 characters) |
| `date` | date | Yes | Holiday date (ISO 8601 format) |
| `isActive` | boolean | No | Active status (default: true) |

**Request Example:**
```javascript
// Using fetch
const response = await fetch('/v1/holidays', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <admin-token>'
  },
  body: JSON.stringify({
    title: "Independence Day",
    date: '2024-07-04T00:00:00.000Z',
    isActive: true
  })
});

const data = await response.json();
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Holiday created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "title": "Independence Day",
    "date": "2024-07-04T00:00:00.000Z",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "code": 400,
  "message": "Holiday title is required"
}
```

**403 Forbidden:**
```json
{
  "code": 403,
  "message": "Only admin can create holidays"
}
```

---

### 2. Get All Holidays

Retrieve a list of holidays with optional filtering and pagination.

**Endpoint:** `GET /v1/holidays`

**Access:** Any authenticated user

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `title` | string | Filter by holiday title (partial match) |
| `date` | date | Filter by specific date |
| `startDate` | date | Filter holidays from this date onwards |
| `endDate` | date | Filter holidays up to this date |
| `isActive` | boolean | Filter by active status |
| `sortBy` | string | Sort field and order (e.g., "date:desc", "title:asc") |
| `limit` | number | Maximum number of results per page (default: 10) |
| `page` | number | Page number (default: 1) |

**Request Example:**
```javascript
// Get all holidays
const response = await fetch('/v1/holidays', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer <your-token>'
  }
});

// Get holidays in a date range
const response2 = await fetch('/v1/holidays?startDate=2024-01-01&endDate=2024-12-31', {
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
        "_id": "507f1f77bcf86cd799439020",
        "title": "Independence Day",
        "date": "2024-07-04T00:00:00.000Z",
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
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

### 3. Get Holiday by ID

Retrieve a specific holiday by its ID.

**Endpoint:** `GET /v1/holidays/:holidayId`

**Access:** Any authenticated user

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `holidayId` | string | MongoDB ObjectId of the holiday |

**Request Example:**
```javascript
const response = await fetch('/v1/holidays/507f1f77bcf86cd799439020', {
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
    "_id": "507f1f77bcf86cd799439020",
    "title": "Independence Day",
    "date": "2024-07-04T00:00:00.000Z",
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
  "message": "Holiday not found"
}
```

---

### 4. Update Holiday

Update an existing holiday.

**Endpoint:** `PATCH /v1/holidays/:holidayId`

**Access:** Admin only

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `holidayId` | string | MongoDB ObjectId of the holiday |

**Request Body (all fields optional):**
```json
{
  "title": "Updated Holiday Title",
  "date": "2024-12-25T00:00:00.000Z",
  "isActive": false
}
```

**Request Example:**
```javascript
const response = await fetch('/v1/holidays/507f1f77bcf86cd799439020', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <admin-token>'
  },
  body: JSON.stringify({
    title: 'Christmas Day',
    date: '2024-12-25T00:00:00.000Z',
    isActive: true
  })
});

const data = await response.json();
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Holiday updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "title": "Christmas Day",
    "date": "2024-12-25T00:00:00.000Z",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

**Error Responses:**

**403 Forbidden:**
```json
{
  "code": 403,
  "message": "Only admin can update holidays"
}
```

**404 Not Found:**
```json
{
  "code": 404,
  "message": "Holiday not found"
}
```

---

### 5. Delete Holiday

Delete a holiday.

**Endpoint:** `DELETE /v1/holidays/:holidayId`

**Access:** Admin only

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `holidayId` | string | MongoDB ObjectId of the holiday |

**Request Example:**
```javascript
const response = await fetch('/v1/holidays/507f1f77bcf86cd799439020', {
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
  "message": "Holiday deleted successfully"
}
```

**Error Responses:**

**403 Forbidden:**
```json
{
  "code": 403,
  "message": "Only admin can delete holidays"
}
```

**404 Not Found:**
```json
{
  "code": 404,
  "message": "Holiday not found"
}
```

---

## Frontend Implementation Examples

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HolidayManager = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    isActive: true
  });

  // Fetch all holidays
  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/v1/holidays', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setHolidays(response.data.data.results);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch holidays');
    } finally {
      setLoading(false);
    }
  };

  // Create holiday
  const createHoliday = async () => {
    if (!formData.title || !formData.date) {
      setError('Title and date are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await axios.post('/v1/holidays', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setHolidays([...holidays, response.data.data]);
      setFormData({ title: '', date: '', isActive: true });
      alert('Holiday created successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create holiday');
    } finally {
      setLoading(false);
    }
  };

  // Update holiday
  const updateHoliday = async (holidayId, updates) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.patch(`/v1/holidays/${holidayId}`, updates, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setHolidays(holidays.map(h => h._id === holidayId ? response.data.data : h));
      alert('Holiday updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update holiday');
    } finally {
      setLoading(false);
    }
  };

  // Delete holiday
  const deleteHoliday = async (holidayId) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(`/v1/holidays/${holidayId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setHolidays(holidays.filter(h => h._id !== holidayId));
      alert('Holiday deleted successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete holiday');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  return (
    <div className="holiday-manager">
      <h2>Holiday Management</h2>

      {/* Create Holiday Form */}
      <div className="create-holiday-form">
        <h3>Create New Holiday</h3>
        <input
          type="text"
          placeholder="Holiday Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        />
        <label>
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          />
          Active
        </label>
        <button onClick={createHoliday} disabled={loading}>
          {loading ? 'Creating...' : 'Create Holiday'}
        </button>
      </div>

      {/* Holidays List */}
      <div className="holidays-list">
        <h3>Holidays</h3>
        {loading && <p>Loading...</p>}
        {error && <div className="error">{error}</div>}
        {holidays.map(holiday => (
          <div key={holiday._id} className="holiday-item">
            <h4>{holiday.title}</h4>
            <p>Date: {new Date(holiday.date).toLocaleDateString()}</p>
            <p>Status: {holiday.isActive ? 'Active' : 'Inactive'}</p>
            <button onClick={() => updateHoliday(holiday._id, { isActive: !holiday.isActive })}>
              {holiday.isActive ? 'Deactivate' : 'Activate'}
            </button>
            <button onClick={() => deleteHoliday(holiday._id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HolidayManager;
```

### Using Fetch API

```javascript
// Create holiday
const createHoliday = async (holidayData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/v1/holidays', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(holidayData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating holiday:', error);
    throw error;
  }
};

// Get all holidays
const getHolidays = async (filters = {}) => {
  try {
    const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`/v1/holidays?${queryParams}`, {
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
    console.error('Error fetching holidays:', error);
    throw error;
  }
};

// Update holiday
const updateHoliday = async (holidayId, updates) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/v1/holidays/${holidayId}`, {
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
    console.error('Error updating holiday:', error);
    throw error;
  }
};

// Delete holiday
const deleteHoliday = async (holidayId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`/v1/holidays/${holidayId}`, {
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
    console.error('Error deleting holiday:', error);
    throw error;
  }
};

// Usage examples
await createHoliday({
  title: 'New Year\'s Day',
  date: '2024-01-01T00:00:00.000Z',
  isActive: true
});

const holidays = await getHolidays({ startDate: '2024-01-01', endDate: '2024-12-31' });
await updateHoliday('507f1f77bcf86cd799439020', { title: 'Updated Title' });
await deleteHoliday('507f1f77bcf86cd799439020');
```

### Using Axios

```javascript
import axios from 'axios';

const createHoliday = async (holidayData) => {
  const token = localStorage.getItem('token');
  const response = await axios.post('/v1/holidays', holidayData, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

const getHolidays = async (filters = {}) => {
  const token = localStorage.getItem('token');
  const response = await axios.get('/v1/holidays', {
    params: filters,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data;
};

const updateHoliday = async (holidayId, updates) => {
  const token = localStorage.getItem('token');
  const response = await axios.patch(`/v1/holidays/${holidayId}`, updates, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data;
};

const deleteHoliday = async (holidayId) => {
  const token = localStorage.getItem('token');
  const response = await axios.delete(`/v1/holidays/${holidayId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.data;
};
```

---

## Summary

- **Create Holiday**: `POST /v1/holidays`
- **Get All Holidays**: `GET /v1/holidays`
- **Get Holiday by ID**: `GET /v1/holidays/:holidayId`
- **Update Holiday**: `PATCH /v1/holidays/:holidayId`
- **Delete Holiday**: `DELETE /v1/holidays/:holidayId`
- **Access**: Create/Update/Delete requires admin, View requires authentication
- **Fields**: `title` (string), `date` (date), `isActive` (boolean)
- **Date Normalization**: Dates are normalized to start of day for consistent comparison

