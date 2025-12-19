# Attendance API Documentation

## Base URL
```
/v1/attendance
```

All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 1. Punch In

**Endpoint:** `POST /v1/attendance/punch-in/:candidateId`

**Description:** Record a punch-in for a candidate. Creates a new attendance record for the day.

**Permissions:** 
- Candidate owner (the user who owns the candidate profile)
- Admin users

**URL Parameters:**
- `candidateId` (required): MongoDB ObjectId of the candidate

**Request Body:**
```json
{
  "punchInTime": "2024-01-15T09:00:00.000Z",  // Optional: ISO 8601 date string. Defaults to current time if not provided
  "notes": "Starting work on project X",      // Optional: Additional notes
  "timezone": "America/New_York"              // Optional: IANA timezone (e.g., 'America/New_York', 'Asia/Kolkata', 'UTC'). Defaults to 'UTC'
}
```

**Request Example:**
```javascript
// Using fetch
const response = await fetch('/v1/attendance/punch-in/507f1f77bcf86cd799439011', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <your-jwt-token>'
  },
  body: JSON.stringify({
    notes: 'Starting work',
    timezone: 'America/New_York'
  })
});

const data = await response.json();
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Punched in successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "candidate": {
      "_id": "507f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "email": "john@example.com"
    },
    "candidateEmail": "john@example.com",
    "date": "2024-01-15T00:00:00.000Z",
    "day": "Monday",
    "punchIn": "2024-01-15T09:00:00.000Z",
    "punchOut": null,
    "duration": 0,
    "isActive": true,
    "notes": "Starting work",
    "timezone": "America/New_York",
    "createdAt": "2024-01-15T09:00:00.000Z",
    "updatedAt": "2024-01-15T09:00:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request - Already Punched In:**
```json
{
  "code": 400,
  "message": "You are already punched in. Please punch out first."
}
```

**403 Forbidden:**
```json
{
  "code": 403,
  "message": "Forbidden"
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

## 2. Punch Out

**Endpoint:** `POST /v1/attendance/punch-out/:candidateId`

**Description:** Record a punch-out for a candidate. Updates the active attendance record for the day.

**Permissions:** 
- Candidate owner (the user who owns the candidate profile)
- Admin users

**URL Parameters:**
- `candidateId` (required): MongoDB ObjectId of the candidate

**Request Body:**
```json
{
  "punchOutTime": "2024-01-15T18:00:00.000Z",  // Optional: ISO 8601 date string. Defaults to current time if not provided
  "notes": "Completed daily tasks"              // Optional: Additional notes
}
```

**Request Example:**
```javascript
const response = await fetch('/v1/attendance/punch-out/507f1f77bcf86cd799439011', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <your-jwt-token>'
  },
  body: JSON.stringify({
    notes: 'Completed daily tasks'
  })
});

const data = await response.json();
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Punched out successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "candidate": {
      "_id": "507f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "email": "john@example.com"
    },
    "candidateEmail": "john@example.com",
    "date": "2024-01-15T00:00:00.000Z",
    "day": "Monday",
    "punchIn": "2024-01-15T09:00:00.000Z",
    "punchOut": "2024-01-15T18:00:00.000Z",
    "duration": 32400000,  // Duration in milliseconds (9 hours)
    "isActive": true,
    "notes": "Completed daily tasks",
    "timezone": "America/New_York",
    "createdAt": "2024-01-15T09:00:00.000Z",
    "updatedAt": "2024-01-15T18:00:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request - No Active Punch In:**
```json
{
  "code": 400,
  "message": "No active punch in found. Please punch in first."
}
```

**400 Bad Request - Invalid Punch Out Time:**
```json
{
  "code": 400,
  "message": "Punch out time cannot be before punch in time."
}
```

**403 Forbidden:**
```json
{
  "code": 403,
  "message": "Forbidden"
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

## 3. Get Current Punch Status

**Endpoint:** `GET /v1/attendance/status/:candidateId`

**Description:** Check if a candidate is currently punched in (has an active punch-in without punch-out for today).

**Permissions:** 
- Candidate owner (the user who owns the candidate profile)
- Admin users

**URL Parameters:**
- `candidateId` (required): MongoDB ObjectId of the candidate

**Request Example:**
```javascript
const response = await fetch('/v1/attendance/status/507f1f77bcf86cd799439011', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer <your-jwt-token>'
  }
});

const data = await response.json();
```

**Success Response (200 OK):**

**When Punched In:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "candidate": {
      "_id": "507f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "email": "john@example.com"
    },
    "candidateEmail": "john@example.com",
    "date": "2024-01-15T00:00:00.000Z",
    "day": "Monday",
    "punchIn": "2024-01-15T09:00:00.000Z",
    "punchOut": null,
    "duration": 0,
    "isActive": true,
    "notes": "Starting work",
    "timezone": "America/New_York",
    "createdAt": "2024-01-15T09:00:00.000Z",
    "updatedAt": "2024-01-15T09:00:00.000Z"
  },
  "isPunchedIn": true
}
```

**When Not Punched In:**
```json
{
  "success": true,
  "data": null,
  "isPunchedIn": false
}
```

---

## 4. Get Candidate Attendance Records

**Endpoint:** `GET /v1/attendance/candidate/:candidateId`

**Description:** Get paginated attendance records for a specific candidate with optional date filtering.

**Permissions:** 
- Candidate owner (the user who owns the candidate profile)
- Admin users

**URL Parameters:**
- `candidateId` (required): MongoDB ObjectId of the candidate

**Query Parameters:**
- `startDate` (optional): Start date filter (ISO 8601 date string)
- `endDate` (optional): End date filter (ISO 8601 date string)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10)
- `sortBy` (optional): Sort field and order (e.g., `date:desc`, `date:asc`)

**Request Example:**
```javascript
const response = await fetch('/v1/attendance/candidate/507f1f77bcf86cd799439011?startDate=2024-01-01&endDate=2024-01-31&page=1&limit=10&sortBy=date:desc', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer <your-jwt-token>'
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
        "_id": "507f1f77bcf86cd799439012",
        "candidate": {
          "_id": "507f1f77bcf86cd799439011",
          "fullName": "John Doe",
          "email": "john@example.com"
        },
        "candidateEmail": "john@example.com",
        "date": "2024-01-15T00:00:00.000Z",
        "day": "Monday",
        "punchIn": "2024-01-15T09:00:00.000Z",
        "punchOut": "2024-01-15T18:00:00.000Z",
        "duration": 32400000,
        "isActive": true,
        "notes": "Completed daily tasks",
        "timezone": "America/New_York",
        "createdAt": "2024-01-15T09:00:00.000Z",
        "updatedAt": "2024-01-15T18:00:00.000Z"
      }
    ],
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "totalResults": 50
  }
}
```

---

## 5. Get Attendance Statistics

**Endpoint:** `GET /v1/attendance/statistics/:candidateId`

**Description:** Get aggregated statistics for a candidate's attendance (total days, hours, average hours per day, etc.).

**Permissions:** 
- Candidate owner (the user who owns the candidate profile)
- Admin users

**URL Parameters:**
- `candidateId` (required): MongoDB ObjectId of the candidate

**Query Parameters:**
- `startDate` (optional): Start date filter (ISO 8601 date string)
- `endDate` (optional): End date filter (ISO 8601 date string)

**Request Example:**
```javascript
const response = await fetch('/v1/attendance/statistics/507f1f77bcf86cd799439011?startDate=2024-01-01&endDate=2024-01-31', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer <your-jwt-token>'
  }
});

const data = await response.json();
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalDays": 20,
    "totalHours": 180.5,
    "totalMinutes": 10830,
    "averageHoursPerDay": 9.025,
    "daysWithPunchOut": 20
  }
}
```

**Response Fields:**
- `totalDays`: Total number of attendance records
- `totalHours`: Total hours worked (sum of all durations)
- `totalMinutes`: Total minutes worked
- `averageHoursPerDay`: Average hours per day
- `daysWithPunchOut`: Number of days with completed punch-out

---

## 6. Get All Attendance Records (Admin Only)

**Endpoint:** `GET /v1/attendance`

**Description:** Get all attendance records across all candidates. Admin only.

**Permissions:** Admin users only

**Query Parameters:**
- `candidate` (optional): Filter by candidate ID
- `candidateEmail` (optional): Filter by candidate email
- `day` (optional): Filter by day of week (`Sunday`, `Monday`, `Tuesday`, `Wednesday`, `Thursday`, `Friday`, `Saturday`)
- `startDate` (optional): Start date filter (ISO 8601 date string)
- `endDate` (optional): End date filter (ISO 8601 date string)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10)
- `sortBy` (optional): Sort field and order (e.g., `date:desc`)

**Request Example:**
```javascript
const response = await fetch('/v1/attendance?startDate=2024-01-01&endDate=2024-01-31&page=1&limit=20', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer <your-jwt-token>'
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
        "_id": "507f1f77bcf86cd799439012",
        "candidate": {
          "_id": "507f1f77bcf86cd799439011",
          "fullName": "John Doe",
          "email": "john@example.com"
        },
        "candidateEmail": "john@example.com",
        "date": "2024-01-15T00:00:00.000Z",
        "day": "Monday",
        "punchIn": "2024-01-15T09:00:00.000Z",
        "punchOut": "2024-01-15T18:00:00.000Z",
        "duration": 32400000,
        "isActive": true,
        "notes": "Completed daily tasks",
        "timezone": "America/New_York",
        "createdAt": "2024-01-15T09:00:00.000Z",
        "updatedAt": "2024-01-15T18:00:00.000Z"
      }
    ],
    "page": 1,
    "limit": 20,
    "totalPages": 10,
    "totalResults": 200
  }
}
```

---

## 7. Get Attendance by ID

**Endpoint:** `GET /v1/attendance/:attendanceId`

**Description:** Get a specific attendance record by its ID.

**Permissions:** 
- Candidate owner (the user who owns the candidate profile)
- Admin users

**URL Parameters:**
- `attendanceId` (required): MongoDB ObjectId of the attendance record

**Request Example:**
```javascript
const response = await fetch('/v1/attendance/507f1f77bcf86cd799439012', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer <your-jwt-token>'
  }
});

const data = await response.json();
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "candidate": {
      "_id": "507f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "email": "john@example.com",
      "owner": {
        "_id": "507f1f77bcf86cd799439010",
        "name": "Admin User",
        "email": "admin@example.com"
      }
    },
    "candidateEmail": "john@example.com",
    "date": "2024-01-15T00:00:00.000Z",
    "day": "Monday",
    "punchIn": "2024-01-15T09:00:00.000Z",
    "punchOut": "2024-01-15T18:00:00.000Z",
    "duration": 32400000,
    "isActive": true,
    "notes": "Completed daily tasks",
    "timezone": "America/New_York",
    "createdAt": "2024-01-15T09:00:00.000Z",
    "updatedAt": "2024-01-15T18:00:00.000Z"
  }
}
```

---

## Frontend Implementation Examples

### React Hook Example

```javascript
import { useState, useEffect } from 'react';

const useAttendance = (candidateId) => {
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [currentAttendance, setCurrentAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    try {
      const response = await fetch(`/v1/attendance/status/${candidateId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setIsPunchedIn(data.isPunchedIn);
      setCurrentAttendance(data.data);
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setLoading(false);
    }
  };

  const punchIn = async (notes, timezone) => {
    try {
      const response = await fetch(`/v1/attendance/punch-in/${candidateId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          notes,
          timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      const data = await response.json();
      setIsPunchedIn(true);
      setCurrentAttendance(data.data);
      return data;
    } catch (error) {
      console.error('Error punching in:', error);
      throw error;
    }
  };

  const punchOut = async (notes) => {
    try {
      const response = await fetch(`/v1/attendance/punch-out/${candidateId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ notes })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      const data = await response.json();
      setIsPunchedIn(false);
      setCurrentAttendance(null);
      return data;
    } catch (error) {
      console.error('Error punching out:', error);
      throw error;
    }
  };

  useEffect(() => {
    checkStatus();
  }, [candidateId]);

  return {
    isPunchedIn,
    currentAttendance,
    loading,
    punchIn,
    punchOut,
    refreshStatus: checkStatus
  };
};

export default useAttendance;
```

### Usage in Component

```javascript
import React from 'react';
import useAttendance from './hooks/useAttendance';

const AttendanceButton = ({ candidateId }) => {
  const { isPunchedIn, currentAttendance, loading, punchIn, punchOut } = useAttendance(candidateId);

  const handlePunchIn = async () => {
    try {
      await punchIn('Starting work', 'America/New_York');
      alert('Punched in successfully!');
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handlePunchOut = async () => {
    try {
      await punchOut('Completed work');
      alert('Punched out successfully!');
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {isPunchedIn ? (
        <div>
          <p>Punched in at: {new Date(currentAttendance.punchIn).toLocaleString()}</p>
          <button onClick={handlePunchOut}>Punch Out</button>
        </div>
      ) : (
        <button onClick={handlePunchIn}>Punch In</button>
      )}
    </div>
  );
};

export default AttendanceButton;
```

---

## Important Notes

1. **Timezone Handling:**
   - Timezone is stored per attendance record
   - If not provided, defaults to 'UTC'
   - Recommended: Use browser's timezone: `Intl.DateTimeFormat().resolvedOptions().timeZone`
   - Common timezones: `'America/New_York'`, `'America/Los_Angeles'`, `'Asia/Kolkata'`, `'UTC'`

2. **Auto Punch-Out:**
   - Candidates are automatically punched out after 9 hours (configurable)
   - Auto punch-out respects the timezone stored with the attendance record
   - Check occurs every 15 minutes (configurable)

3. **Date Format:**
   - All dates should be in ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`
   - Example: `"2024-01-15T09:00:00.000Z"`

4. **Duration:**
   - Duration is stored in milliseconds
   - To convert to hours: `duration / (1000 * 60 * 60)`
   - To convert to minutes: `duration / (1000 * 60)`

5. **Permissions:**
   - Only the candidate owner or admin can punch in/out
   - Only the candidate owner or admin can view attendance records
   - Admin can view all attendance records

6. **Error Handling:**
   - Always check `response.ok` before parsing JSON
   - Error responses follow the format: `{ "code": <status>, "message": "<error message>" }`
   - Common errors:
     - `400`: Bad request (already punched in, no active punch-in, invalid time)
     - `403`: Forbidden (insufficient permissions)
     - `404`: Not found (candidate or attendance not found)

