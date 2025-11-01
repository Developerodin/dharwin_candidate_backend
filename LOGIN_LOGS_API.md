# Login Logs API Documentation

The Login Logs API provides endpoints to view user login and logout history. **Only users with admin role can access these endpoints.**

## Base URL
```
/v1/login-logs
```

## Authentication
All endpoints require:
- **Bearer Token Authentication** (JWT)
- **Admin role** (user must have `getLoginLogs` permission)

### Headers
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

---

## How It Works

### Automatic Login/Logout Tracking

1. **On Login**: When a user successfully logs in via `/v1/auth/login`:
   - A `LoginLog` entry is automatically created
   - Login time, IP address, and user agent are recorded
   - The login log ID is stored in the refresh token

2. **On Logout**: When a user logs out via `/v1/auth/logout`:
   - The logout time is automatically updated in the corresponding login log
   - The `isActive` flag is set to `false`

### Data Captured

Each login log entry contains:
- **User Information**: User ID, email, role (admin/user)
- **Timestamps**: Login time, logout time (null if still active)
- **Session Info**: IP address, user agent (browser/device)
- **Status**: Active session indicator (`isActive: true/false`)

---

## API Endpoints

### 1. Get All Login Logs

Get all login logs with filtering and pagination support.

**Endpoint:** `GET /v1/login-logs`

**Authentication:** Required (Admin only)

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `email` | string | Filter by email address | `user@example.com` |
| `role` | string | Filter by role (`user` or `admin`) | `admin` |
| `userId` | string | Filter by user ID (MongoDB ObjectId) | `507f1f77bcf86cd799439011` |
| `isActive` | boolean | Filter active sessions | `true` or `false` |
| `startDate` | string (ISO 8601) | Filter logs from this date onwards | `2024-01-01T00:00:00.000Z` |
| `endDate` | string (ISO 8601) | Filter logs up to this date | `2024-01-31T23:59:59.999Z` |
| `sortBy` | string | Sort field and order | `loginTime:desc` or `loginTime:asc` |
| `limit` | number | Maximum results per page (default: 10) | `20` |
| `page` | number | Page number (default: 1) | `1` |

**Response:** `200 OK`

```json
{
  "results": [
    {
      "id": "507f1f77bcf86cd799439011",
      "user": {
        "id": "507f191e810c19729de860ea",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "admin"
      },
      "email": "john@example.com",
      "role": "admin",
      "loginTime": "2024-01-15T10:30:00.000Z",
      "logoutTime": "2024-01-15T12:45:00.000Z",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "isActive": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T12:45:00.000Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "totalResults": 50
}
```

**Example Requests:**

```bash
# Get all login logs (default pagination)
curl -X GET "http://localhost:3000/v1/login-logs" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filter by email
curl -X GET "http://localhost:3000/v1/login-logs?email=john@example.com" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Filter by role and date range
curl -X GET "http://localhost:3000/v1/login-logs?role=admin&startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-31T23:59:59.999Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get active sessions only
curl -X GET "http://localhost:3000/v1/login-logs?isActive=true" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Pagination with sorting
curl -X GET "http://localhost:3000/v1/login-logs?sortBy=loginTime:desc&limit=20&page=2" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 2. Get Login Statistics

Get aggregated statistics about login activity.

**Endpoint:** `GET /v1/login-logs/statistics`

**Authentication:** Required (Admin only)

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `startDate` | string (ISO 8601) | Filter from this date | `2024-01-01T00:00:00.000Z` |
| `endDate` | string (ISO 8601) | Filter up to this date | `2024-01-31T23:59:59.999Z` |
| `role` | string | Filter by role (`user` or `admin`) | `admin` |

**Response:** `200 OK`

```json
{
  "totalLogins": 1250,
  "activeSessions": 15,
  "totalAdmins": 450,
  "totalUsers": 800
}
```

**Response Fields:**
- `totalLogins` (integer): Total number of login events
- `activeSessions` (integer): Currently active sessions
- `totalAdmins` (integer): Total admin logins
- `totalUsers` (integer): Total user logins

**Example Requests:**

```bash
# Get overall statistics
curl -X GET "http://localhost:3000/v1/login-logs/statistics" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Statistics for specific date range
curl -X GET "http://localhost:3000/v1/login-logs/statistics?startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-31T23:59:59.999Z" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Statistics for admin role only
curl -X GET "http://localhost:3000/v1/login-logs/statistics?role=admin" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 3. Get Active Sessions

Get all currently active login sessions (users who are logged in and haven't logged out).

**Endpoint:** `GET /v1/login-logs/active`

**Authentication:** Required (Admin only)

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `sortBy` | string | Sort field and order | `loginTime:desc` |
| `limit` | number | Maximum results per page (default: 10) | `20` |
| `page` | number | Page number (default: 1) | `1` |

**Response:** `200 OK`

```json
{
  "results": [
    {
      "id": "507f1f77bcf86cd799439011",
      "user": {
        "id": "507f191e810c19729de860ea",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "admin"
      },
      "email": "john@example.com",
      "role": "admin",
      "loginTime": "2024-01-15T10:30:00.000Z",
      "logoutTime": null,
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "totalPages": 2,
  "totalResults": 15
}
```

**Example Requests:**

```bash
# Get all active sessions
curl -X GET "http://localhost:3000/v1/login-logs/active" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# With pagination
curl -X GET "http://localhost:3000/v1/login-logs/active?limit=20&page=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 4. Get Login Log by ID

Get a specific login log entry by its ID.

**Endpoint:** `GET /v1/login-logs/:loginLogId`

**Authentication:** Required (Admin only)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `loginLogId` | string | Login log ID (MongoDB ObjectId) |

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "user": {
    "id": "507f191e810c19729de860ea",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin"
  },
  "email": "john@example.com",
  "role": "admin",
  "loginTime": "2024-01-15T10:30:00.000Z",
  "logoutTime": "2024-01-15T12:45:00.000Z",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "isActive": false,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T12:45:00.000Z"
}
```

**Example Request:**

```bash
curl -X GET "http://localhost:3000/v1/login-logs/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Error Responses:**
- `404 Not Found` - Login log not found

---

### 5. Get Login Logs by User ID

Get all login logs for a specific user.

**Endpoint:** `GET /v1/login-logs/user/:userId`

**Authentication:** Required (Admin only)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | User ID (MongoDB ObjectId) |

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `sortBy` | string | Sort field and order | `loginTime:desc` |
| `limit` | number | Maximum results per page (default: 10) | `20` |
| `page` | number | Page number (default: 1) | `1` |

**Response:** `200 OK`

```json
{
  "results": [
    {
      "id": "507f1f77bcf86cd799439011",
      "user": {
        "id": "507f191e810c19729de860ea",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "admin"
      },
      "email": "john@example.com",
      "role": "admin",
      "loginTime": "2024-01-15T10:30:00.000Z",
      "logoutTime": "2024-01-15T12:45:00.000Z",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "isActive": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T12:45:00.000Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "totalPages": 3,
  "totalResults": 25
}
```

**Example Request:**

```bash
curl -X GET "http://localhost:3000/v1/login-logs/user/507f191e810c19729de860ea?sortBy=loginTime:desc&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Response Schema

### LoginLog Object

```json
{
  "id": "string (ObjectId)",
  "user": {
    "id": "string (ObjectId)",
    "name": "string",
    "email": "string",
    "role": "string (user|admin)"
  },
  "email": "string",
  "role": "string (user|admin)",
  "loginTime": "string (ISO 8601 date)",
  "logoutTime": "string (ISO 8601 date) | null",
  "ipAddress": "string",
  "userAgent": "string",
  "isActive": "boolean",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "code": 401,
  "message": "Please authenticate"
}
```

### 403 Forbidden
```json
{
  "code": 403,
  "message": "Forbidden"
}
```

### 404 Not Found
```json
{
  "code": 404,
  "message": "Login log not found"
}
```

### 400 Bad Request
```json
{
  "code": 400,
  "message": "Validation error message"
}
```

---

## Example Usage

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/v1';
const JWT_TOKEN = 'your_jwt_token_here';

// Get all login logs
async function getAllLoginLogs() {
  try {
    const response = await axios.get(`${API_BASE_URL}/login-logs`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      params: {
        role: 'admin',
        limit: 20,
        page: 1,
        sortBy: 'loginTime:desc'
      }
    });
    console.log('Login logs:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Get login statistics
async function getStatistics() {
  try {
    const response = await axios.get(`${API_BASE_URL}/login-logs/statistics`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      params: {
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T23:59:59.999Z'
      }
    });
    console.log('Statistics:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Get active sessions
async function getActiveSessions() {
  try {
    const response = await axios.get(`${API_BASE_URL}/login-logs/active`, {
      headers: {
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Active sessions:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Get login logs by user ID
async function getLogsByUser(userId) {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/login-logs/user/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        params: {
          sortBy: 'loginTime:desc',
          limit: 50
        }
      }
    );
    console.log('User login logs:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}
```

### Python Example

```python
import requests
from datetime import datetime

API_BASE_URL = 'http://localhost:3000/v1'
JWT_TOKEN = 'your_jwt_token_here'

headers = {
    'Authorization': f'Bearer {JWT_TOKEN}',
    'Content-Type': 'application/json'
}

# Get all login logs
response = requests.get(
    f'{API_BASE_URL}/login-logs',
    headers=headers,
    params={
        'role': 'admin',
        'limit': 20,
        'page': 1,
        'sortBy': 'loginTime:desc'
    }
)
if response.status_code == 200:
    data = response.json()
    print(f"Total results: {data['totalResults']}")
    for log in data['results']:
        print(f"User: {log['email']}, Login: {log['loginTime']}")

# Get statistics
response = requests.get(
    f'{API_BASE_URL}/login-logs/statistics',
    headers=headers,
    params={
        'startDate': '2024-01-01T00:00:00.000Z',
        'endDate': '2024-01-31T23:59:59.999Z'
    }
)
if response.status_code == 200:
    stats = response.json()
    print(f"Total logins: {stats['totalLogins']}")
    print(f"Active sessions: {stats['activeSessions']}")

# Get active sessions
response = requests.get(f'{API_BASE_URL}/login-logs/active', headers=headers)
if response.status_code == 200:
    data = response.json()
    print(f"Active sessions: {data['totalResults']}")
```

---

## Common Use Cases

### 1. Monitor Active Sessions
```bash
GET /v1/login-logs/active
```
See who is currently logged into the system.

### 2. User Activity Report
```bash
GET /v1/login-logs/user/{userId}?sortBy=loginTime:desc
```
Get complete login history for a specific user.

### 3. Security Audit
```bash
GET /v1/login-logs?startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-31T23:59:59.999Z&role=admin
```
Review admin login activity for a specific time period.

### 4. Session Analytics
```bash
GET /v1/login-logs/statistics?startDate=2024-01-01T00:00:00.000Z&endDate=2024-01-31T23:59:59.999Z
```
Get aggregated statistics for reporting.

### 5. Suspicious Activity Detection
```bash
GET /v1/login-logs?email=suspicious@example.com&sortBy=loginTime:desc
```
Review login patterns for a specific email address.

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- `logoutTime` will be `null` for active sessions
- `isActive` is `true` when a user is logged in and hasn't logged out
- IP addresses are captured from request headers (`x-forwarded-for`, `x-real-ip`, etc.)
- User agent strings contain browser and device information
- Login logs are automatically created when users log in via `/v1/auth/login`
- Logout times are automatically updated when users log out via `/v1/auth/logout`

