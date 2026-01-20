# Admin User Registration API Documentation

The Admin User Registration API allows administrators to register new users with admin role. The registered users will have email verification automatically set to true (no email verification required), and can include a navigation permissions structure.

## Base URL
```
/v1/auth/register-user
```

## Authentication
This endpoint requires:
- **Bearer Token Authentication** (JWT)
- **Admin role** (user must have `manageUsers` permission)

### Headers
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

---

## Endpoint

### Register Admin User

**Endpoint:** `POST /v1/auth/register-user`

**Description:** Allows an admin to register a new user with admin role. The user will be created with `isEmailVerified: true`, so no email verification is required. Optionally, a navigation permissions structure can be included to control access to different features.

**Authentication:** Required (Admin only)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Full name of the user |
| `email` | string | Yes | Email address (must be unique) |
| `password` | string | Yes | Password (min 8 characters, must contain at least one letter and one number) |
| `phoneNumber` | string | No | Phone number (must match pattern: `^[\+]?[1-9][\d]{0,15}$`) |
| `countryCode` | string | No | Country code |
| `subRole` | string | No | Sub-role for the user (optional) |
| `subRoleId` | string | No | Sub-role ID to assign (optional, cannot be used with navigation) |
| `navigation` | object | No | Navigation permissions structure (nested object with boolean values) |

**Navigation Structure:**

The navigation object is a nested structure where each key represents a feature or section, and the value is either:
- `false` - Feature is disabled
- `true` - Feature is enabled
- Another nested object with the same structure

**Example Request:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phoneNumber": "+1234567890",
  "countryCode": "+1",
  "subRole": "Senior Admin",
  "navigation": {
    "Dashboard": false,
    "ATS": {
      "Candidates": {
        "Candidates": {
          "Export Candidates": false,
          "Add Candidate": false,
          "Actions": {
            "View Details": false,
            "Edit Candidate": false,
            "View Documents": false,
            "Upload Salary Slip": false,
            "Share Candidate": false,
            "View Attendance": false,
            "Add Note": false,
            "Add Feedback": false,
            "Delete Candidate": false
          }
        },
        "Share Candidate Form": false,
        "Track Attendance": false
      },
      "Jobs": {
        "Manage Jobs": {
          "Create Job": false,
          "Export Excel": false,
          "Actions": {
            "Edit Job": false,
            "View Job": false,
            "Delete Job": false
          }
        }
      },
      "Interviews": {
        "Generate Meeting Link": false,
        "Manage Meetings": false
      }
    },
    "Project management": {
      "Manage Projects": {
        "New Project": false,
        "View Project": false,
        "Edit Project": false,
        "Delete Project": false
      },
      "Manage Tasks": {
        "New Board": false,
        "Add Task": false,
        "View Task": false,
        "Edit Task": false,
        "Delete Task": false
      }
    },
    "Support Tickets": {
      "Create Ticket": false,
      "Actions": {
        "View Details": false,
        "Delete Ticket": false
      }
    },
    "Settings": {
      "Master": {
        "Jobs": {
          "Manage Jobs Templates": {
            "Create Template": false,
            "Actions": {
              "View Template": false,
              "Edit Template": false,
              "Delete Template": false
            }
          }
        },
        "Attendance": {
          "Manage Week Off": false,
          "Holidays List": false,
          "Assign Holidays": false,
          "Candidate Groups": false,
          "Manage Shifts": false,
          "Assign Shift": false,
          "Assign Leave": false,
          "Leave Requests": false,
          "Backdated Attendance": false
        }
      },
      "Logs": {
        "Login Logs": false,
        "Recruiter Logs": false
      },
      "RBAC": {
        "Roles": false,
        "Manage Roles & Permissions": false
      }
    }
  }
}
```

**Response:** `201 Created`

```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "admin",
    "isEmailVerified": true,
    "phoneNumber": "+1234567890",
    "countryCode": "+1",
    "subRole": "Senior Admin",
    "navigation": {
      "Dashboard": false,
      "ATS": {
        "Candidates": {
          "Candidates": {
            "Export Candidates": false,
            "Add Candidate": false,
            "Actions": {
              "View Details": false,
              "Edit Candidate": false,
              "View Documents": false,
              "Upload Salary Slip": false,
              "Share Candidate": false,
              "View Attendance": false,
              "Add Note": false,
              "Add Feedback": false,
              "Delete Candidate": false
            }
          },
          "Share Candidate Form": false,
          "Track Attendance": false
        },
        "Jobs": {
          "Manage Jobs": {
            "Create Job": false,
            "Export Excel": false,
            "Actions": {
              "Edit Job": false,
              "View Job": false,
              "Delete Job": false
            }
          }
        },
        "Interviews": {
          "Generate Meeting Link": false,
          "Manage Meetings": false
        }
      },
      "Project management": {
        "Manage Projects": {
          "New Project": false,
          "View Project": false,
          "Edit Project": false,
          "Delete Project": false
        },
        "Manage Tasks": {
          "New Board": false,
          "Add Task": false,
          "View Task": false,
          "Edit Task": false,
          "Delete Task": false
        }
      },
      "Support Tickets": {
        "Create Ticket": false,
        "Actions": {
          "View Details": false,
          "Delete Ticket": false
        }
      },
      "Settings": {
        "Master": {
          "Jobs": {
            "Manage Jobs Templates": {
              "Create Template": false,
              "Actions": {
                "View Template": false,
                "Edit Template": false,
                "Delete Template": false
              }
            }
          },
          "Attendance": {
            "Manage Week Off": false,
            "Holidays List": false,
            "Assign Holidays": false,
            "Candidate Groups": false,
            "Manage Shifts": false,
            "Assign Shift": false,
            "Assign Leave": false,
            "Leave Requests": false,
            "Backdated Attendance": false
          }
        },
        "Logs": {
          "Login Logs": false,
          "Recruiter Logs": false
        }
      }
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Example Requests:**

```bash
# Register user without navigation structure
curl -X POST "http://localhost:3000/v1/auth/register-user" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phoneNumber": "+1234567890",
    "countryCode": "+1",
    "subRole": "Senior Admin"
  }'

# Register user with navigation structure
curl -X POST "http://localhost:3000/v1/auth/register-user" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "password": "password123",
    "phoneNumber": "+1234567890",
    "countryCode": "+1",
    "navigation": {
      "Dashboard": true,
      "ATS": {
        "Candidates": {
          "Candidates": {
            "Export Candidates": true,
            "Add Candidate": true,
            "Actions": {
              "View Details": true,
              "Edit Candidate": true,
              "View Documents": true,
              "Upload Salary Slip": true,
              "Share Candidate": true,
              "View Attendance": true,
              "Add Note": true,
              "Add Feedback": true,
              "Delete Candidate": true
            }
          },
          "Share Candidate Form": false,
          "Track Attendance": false
        },
        "Jobs": {
          "Manage Jobs": {
            "Create Job": true,
            "Export Excel": true,
            "Actions": {
              "Edit Job": true,
              "View Job": true,
              "Delete Job": true
            }
          }
        },
        "Interviews": {
          "Generate Meeting Link": true,
          "Manage Meetings": true
        }
      },
      "Project management": {
        "Manage Projects": {
          "New Project": false,
          "View Project": false,
          "Edit Project": false,
          "Delete Project": false
        },
        "Manage Tasks": {
          "New Board": false,
          "Add Task": false,
          "View Task": false,
          "Edit Task": false,
          "Delete Task": false
        }
      },
      "Support Tickets": {
        "Create Ticket": true,
        "Actions": {
          "View Details": true,
          "Delete Ticket": true
        }
      },
      "Settings": {
        "Master": {
          "Jobs": {
            "Manage Jobs Templates": {
              "Create Template": false,
              "Actions": {
                "View Template": false,
                "Edit Template": false,
                "Delete Template": false
              }
            }
          },
          "Attendance": {
            "Manage Week Off": false,
            "Holidays List": false,
            "Assign Holidays": false,
            "Candidate Groups": false,
            "Manage Shifts": false,
            "Assign Shift": false,
            "Assign Leave": false,
            "Leave Requests": false,
            "Backdated Attendance": false
          }
        },
        "Logs": {
          "Login Logs": true,
          "Recruiter Logs": false
        }
      }
    }
  }'
```

---

## Response Schema

### User Object

```json
{
  "id": "string (ObjectId)",
  "name": "string",
  "email": "string",
  "role": "string (always 'admin' for this endpoint)",
  "isEmailVerified": "boolean (always true)",
  "phoneNumber": "string | null",
  "countryCode": "string | null",
  "subRole": "string | null",
  "navigation": "object | null",
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

---

## Error Responses

### 400 Bad Request

**Duplicate Email:**
```json
{
  "code": 400,
  "message": "Email already taken"
}
```

**Validation Error:**
```json
{
  "code": 400,
  "message": "Validation error message"
}
```

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

---

## Important Notes

### Role Assignment
- The registered user will **always** have the role `admin`
- This cannot be changed through this endpoint

### Email Verification
- `isEmailVerified` is automatically set to `true`
- No email verification is required
- The user can immediately log in after registration

### Sub Role
- The `subRole` field is **optional**
- If not provided, the field will be `null` in the database
- Can be any string value to categorize or further classify the admin user
- Examples: "Senior Admin", "Junior Admin", "HR Admin", etc.

### Navigation Structure
- The `navigation` field is **optional**
- If not provided, the field will be `null` in the database
- The structure is stored exactly as provided from the frontend
- Each feature can be set to `true` (enabled) or `false` (disabled)
- The structure supports nested objects for hierarchical permissions
- The navigation structure can be updated later through the user update endpoint

### Password Requirements
- Minimum 8 characters
- Must contain at least one letter
- Must contain at least one number

### Phone Number Format
- Must match pattern: `^[\+]?[1-9][\d]{0,15}$`
- Optional field
- Examples: `+1234567890`, `1234567890`

---

## Example Usage

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/v1';
const JWT_TOKEN = 'your_jwt_token_here';

async function registerAdminUser() {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/register-user`,
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        countryCode: '+1',
        subRole: 'Senior Admin',
        navigation: {
          Dashboard: true,
          ATS: {
            Candidates: {
              Candidates: {
                'Export Candidates': true,
                'Add Candidate': true,
                Actions: {
                  'View Details': true,
                  'Edit Candidate': true,
                  'View Documents': true,
                  'Upload Salary Slip': true,
                  'Share Candidate': true,
                  'View Attendance': true,
                  'Add Note': true,
                  'Add Feedback': true,
                  'Delete Candidate': true
                }
              },
              'Share Candidate Form': false,
              'Track Attendance': false
            },
            Jobs: {
              'Manage Jobs': {
                'Create Job': true,
                'Export Excel': true,
                Actions: {
                  'Edit Job': true,
                  'View Job': true,
                  'Delete Job': true
                }
              }
            },
            Interviews: {
              'Generate Meeting Link': true,
              'Manage Meetings': true
            }
          },
          'Project management': {
            'Manage Projects': {
              'New Project': false,
              'View Project': false,
              'Edit Project': false,
              'Delete Project': false
            },
            'Manage Tasks': {
              'New Board': false,
              'Add Task': false,
              'View Task': false,
              'Edit Task': false,
              'Delete Task': false
            }
          },
          'Support Tickets': {
            'Create Ticket': true,
            Actions: {
              'View Details': true,
              'Delete Ticket': true
            }
          },
          Settings: {
            Master: {
              Jobs: {
                'Manage Jobs Templates': {
                  'Create Template': false,
                  Actions: {
                    'View Template': false,
                    'Edit Template': false,
                    'Delete Template': false
                  }
                }
              },
              Attendance: {
                'Manage Week Off': false,
                'Holidays List': false,
                'Assign Holidays': false,
                'Manage Shifts': false,
                'Assign Shift': false,
                'Assign Leave': false,
                'Leave Requests': false,
                'Backdated Attendance': false
              }
            },
            Logs: {
              'Login Logs': true,
              'Recruiter Logs': false
            }
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('User registered:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

registerAdminUser();
```

### Python Example

```python
import requests

API_BASE_URL = 'http://localhost:3000/v1'
JWT_TOKEN = 'your_jwt_token_here'

headers = {
    'Authorization': f'Bearer {JWT_TOKEN}',
    'Content-Type': 'application/json'
}

payload = {
    'name': 'John Doe',
    'email': 'john@example.com',
    'password': 'password123',
    'phoneNumber': '+1234567890',
    'countryCode': '+1',
    'subRole': 'Senior Admin',
    'navigation': {
        'Dashboard': True,
        'ATS': {
            'Candidates': {
                'Candidates': {
                    'Export Candidates': True,
                    'Add Candidate': True,
                    'Actions': {
                        'View Details': True,
                        'Edit Candidate': True,
                        'View Documents': True,
                        'Upload Salary Slip': True,
                        'Share Candidate': True,
                        'View Attendance': True,
                        'Add Note': True,
                        'Add Feedback': True,
                        'Delete Candidate': True
                    }
                },
                'Share Candidate Form': False,
                'Track Attendance': False
            },
            'Jobs': {
                'Manage Jobs': {
                    'Create Job': True,
                    'Export Excel': True,
                    'Actions': {
                        'Edit Job': True,
                        'View Job': True,
                        'Delete Job': True
                    }
                }
            },
            'Interviews': {
                'Generate Meeting Link': True,
                'Manage Meetings': True
            }
        },
        'Project management': {
            'Manage Projects': {
                'New Project': False,
                'View Project': False,
                'Edit Project': False,
                'Delete Project': False
            },
            'Manage Tasks': {
                'New Board': False,
                'Add Task': False,
                'View Task': False,
                'Edit Task': False,
                'Delete Task': False
            }
        },
        'Support Tickets': {
            'Create Ticket': True,
            'Actions': {
                'View Details': True,
                'Delete Ticket': True
            }
        },
        'Settings': {
            'Master': {
                'Jobs': {
                    'Manage Jobs Templates': {
                        'Create Template': False,
                        'Actions': {
                            'View Template': False,
                            'Edit Template': False,
                            'Delete Template': False
                        }
                    }
                },
                'Attendance': {
                    'Manage Week Off': False,
                    'Holidays List': False,
                    'Assign Holidays': False,
                    'Manage Shifts': False,
                    'Assign Shift': False,
                    'Assign Leave': False,
                    'Leave Requests': False,
                    'Backdated Attendance': False
                }
            },
            'Logs': {
                'Login Logs': True,
                'Recruiter Logs': False
            }
        }
    }
}

response = requests.post(
    f'{API_BASE_URL}/auth/register-user',
    json=payload,
    headers=headers
)

if response.status_code == 201:
    user = response.json()
    print(f"User registered: {user['user']['email']}")
    print(f"Navigation: {user['user']['navigation']}")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

---

## Common Use Cases

### 1. Register Admin Without Navigation
Register a new admin user without specifying navigation permissions. Navigation will be `null` and can be set later.

```bash
POST /v1/auth/register-user
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "securepass123",
  "subRole": "Senior Admin"
}
```

### 2. Register Admin With Full Navigation Structure
Register a new admin user with complete navigation permissions structure.

```bash
POST /v1/auth/register-user
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "securepass123",
  "navigation": { ... }
}
```

### 3. Register Admin With Partial Permissions
Register a new admin user with only specific features enabled.

```bash
POST /v1/auth/register-user
{
  "name": "Limited Admin",
  "email": "limited@example.com",
  "password": "securepass123",
  "navigation": {
    "Dashboard": true,
    "ATS": {
      "Candidates": {
        "Candidates": {
          "Export Candidates": true,
          "Add Candidate": true,
          "Actions": {
            "View Details": true,
            "Edit Candidate": true,
            "View Documents": true,
            "Upload Salary Slip": true,
            "Share Candidate": true,
            "View Attendance": true,
            "Add Note": true,
            "Add Feedback": true,
            "Delete Candidate": true
          }
        }
      }
    }
  }
}
```

---

---

## Update Registered User

**Endpoint:** `PATCH /v1/auth/register-user/:userId`

**Description:** Allows an admin to update a user that was registered via the `register-user` endpoint. Email and password fields cannot be updated through this endpoint.

**Authentication:** Required (Admin only)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | User ID (MongoDB ObjectId) |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Full name of the user |
| `phoneNumber` | string | No | Phone number (must match pattern: `^[\+]?[1-9][\d]{0,15}$`) |
| `countryCode` | string | No | Country code |
| `subRole` | string | No | Sub-role for the user |
| `subRoleId` | string | No | Sub-role ID to assign (optional, cannot be used with navigation) |
| `isActive` | boolean | No | Active status of the user (default: true). If set to false, user cannot login |
| `navigation` | object | No | Navigation permissions structure (nested object with boolean values) |

**Note:** At least one field must be provided for update. Email and password fields are excluded and cannot be updated through this endpoint.

**Example Request:**

```json
{
  "name": "John Doe Updated",
  "phoneNumber": "+1987654321",
  "countryCode": "+1",
  "subRole": "Senior Admin",
  "navigation": {
    "Dashboard": true,
    "ATS": {
      "Candidates": {
        "Candidates": true,
        "Share Candidate Form": false,
        "Track Attendance": false
      },
      "Jobs": {
        "Manage Jobs": true
      },
      "Interviews": {
        "Generate Meeting Link": true,
        "Manage Meetings": true
      }
    },
    "Project management": {
      "Manage Projects": false,
      "Manage Tasks": false
    },
    "Support Tickets": true,
      "Settings": {
        "Master": {
          "Jobs": {
            "Manage Jobs Templates": false
          },
          "Attendance": {
            "Manage Week Off": false,
            "Holidays List": false,
            "Assign Holidays": false,
            "Candidate Groups": false,
            "Manage Shifts": false,
            "Assign Shift": false,
            "Assign Leave": false,
            "Leave Requests": false,
            "Backdated Attendance": false
          }
        },
        "Logs": {
          "Login Logs": true,
          "Recruiter Logs": false
        },
        "RBAC": {
          "Roles": false,
          "Manage Roles & Permissions": false
        }
      }
  }
}
```

**Response:** `200 OK`

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "John Doe Updated",
  "email": "john@example.com",
  "role": "admin",
  "isEmailVerified": true,
  "phoneNumber": "+1987654321",
  "countryCode": "+1",
  "subRole": "Senior Admin",
    "navigation": {
      "Dashboard": true,
      "ATS": {
        "Candidates": {
          "Candidates": {
            "Export Candidates": true,
            "Add Candidate": true,
            "Actions": {
              "View Details": true,
              "Edit Candidate": true,
              "View Documents": true,
              "Upload Salary Slip": true,
              "Share Candidate": true,
              "View Attendance": true,
              "Add Note": true,
              "Add Feedback": true,
              "Delete Candidate": true
            }
          },
          "Share Candidate Form": false,
          "Track Attendance": false
        },
        "Jobs": {
          "Manage Jobs": {
            "Create Job": true,
            "Export Excel": true,
            "Actions": {
              "Edit Job": true,
              "View Job": true,
              "Delete Job": true
            }
          }
        },
        "Interviews": {
          "Generate Meeting Link": true,
          "Manage Meetings": true
        }
      },
      "Project management": {
        "Manage Projects": {
          "New Project": false,
          "View Project": false,
          "Edit Project": false,
          "Delete Project": false
        },
        "Manage Tasks": {
          "New Board": false,
          "Add Task": false,
          "View Task": false,
          "Edit Task": false,
          "Delete Task": false
        }
      },
      "Support Tickets": {
        "Create Ticket": true,
        "Actions": {
          "View Details": true,
          "Delete Ticket": true
        }
      },
      "Settings": {
        "Master": {
          "Jobs": {
            "Manage Jobs Templates": {
              "Create Template": false,
              "Actions": {
                "View Template": false,
                "Edit Template": false,
                "Delete Template": false
              }
            }
          },
          "Attendance": {
            "Manage Week Off": false,
            "Holidays List": false,
            "Assign Holidays": false,
            "Candidate Groups": false,
            "Manage Shifts": false,
            "Assign Shift": false,
            "Assign Leave": false,
            "Leave Requests": false,
            "Backdated Attendance": false
          }
        },
        "Logs": {
          "Login Logs": true,
          "Recruiter Logs": false
        }
      }
    },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:45:00.000Z"
}
```

**Example Requests:**

```bash
# Update user name and subRole
curl -X PATCH "http://localhost:3000/v1/auth/register-user/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe Updated",
    "subRole": "Senior Admin",
    "isActive": true
  }'

# Deactivate user (set to inactive)
curl -X PATCH "http://localhost:3000/v1/auth/register-user/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false
  }'

# Update navigation structure only
curl -X PATCH "http://localhost:3000/v1/auth/register-user/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "navigation": {
      "Dashboard": true,
      "ATS": {
        "Candidates": {
          "Candidates": {
            "Export Candidates": true,
            "Add Candidate": true,
            "Actions": {
              "View Details": true,
              "Edit Candidate": true,
              "View Documents": true,
              "Upload Salary Slip": true,
              "Share Candidate": true,
              "View Attendance": true,
              "Add Note": true,
              "Add Feedback": true,
              "Delete Candidate": true
            }
          }
        }
      }
    }
  }'

# Update multiple fields
curl -X PATCH "http://localhost:3000/v1/auth/register-user/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe Updated",
    "phoneNumber": "+1987654321",
    "countryCode": "+1",
    "subRole": "Senior Admin",
    "navigation": {
      "Dashboard": true,
      "ATS": {
        "Candidates": {
          "Candidates": {
            "Export Candidates": true,
            "Add Candidate": true,
            "Actions": {
              "View Details": true,
              "Edit Candidate": true,
              "View Documents": true,
              "Upload Salary Slip": true,
              "Share Candidate": true,
              "View Attendance": true,
              "Add Note": true,
              "Add Feedback": true,
              "Delete Candidate": true
            }
          }
        }
      }
    }
  }'
```

**Error Responses:**

### 400 Bad Request
```json
{
  "code": 400,
  "message": "At least one field must be provided for update"
}
```

### 404 Not Found
```json
{
  "code": 404,
  "message": "User not found"
}
```

---

## Delete Registered User

**Endpoint:** `DELETE /v1/auth/register-user/:userId`

**Description:** Allows an admin to delete a user that was registered via the `register-user` endpoint.

**Authentication:** Required (Admin only)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | User ID (MongoDB ObjectId) |

**Response:** `204 No Content`

**Example Request:**

```bash
curl -X DELETE "http://localhost:3000/v1/auth/register-user/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Error Responses:**

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
  "message": "User not found"
}
```

---

## Active/Inactive Status

Users have an `isActive` field that controls whether they can log in:

- **`isActive: true`** (default) - User can log in normally
- **`isActive: false`** - User cannot log in and will receive an error message

**Setting User to Inactive:**

You can set a user to inactive by updating the `isActive` field:

```bash
PATCH /v1/auth/register-user/:userId
{
  "isActive": false
}
```

**Login Behavior:**

- If a user tries to log in with `isActive: false`, they will receive:
  ```json
  {
    "code": 403,
    "message": "Your account has been deactivated. Please contact your administrator for assistance."
  }
  ```

---

## Using Sub-Role ID

Instead of providing the `navigation` structure directly, you can use `subRoleId` to assign a pre-defined sub-role:

- If `subRoleId` is provided:
  - The server fetches the corresponding sub-role
  - The user's `subRole` (string) is automatically set to the sub-role's name
  - The user's `navigation` is automatically populated from the sub-role's navigation structure
- If `navigation` is provided directly:
  - It will be stored as-is
- **You cannot provide both `subRoleId` and `navigation` together** in the same request

### Example: Register User with Sub-Role ID

```bash
curl -X POST "http://localhost:3000/v1/auth/register-user" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Admin",
    "email": "jane.admin@example.com",
    "password": "password123",
    "subRoleId": "65f1f77bcf86cd7994390111"
  }'
```

The created user will have:
- `role: "admin"`
- `isEmailVerified: true`
- `subRole: "Senior Admin"` (from sub-role name)
- `subRoleId: "65f1f77bcf86cd7994390111"`
- `navigation`: copied from the sub-role's navigation structure

For more information about managing sub-roles, see the [Sub-Roles API Documentation](./SUB_ROLES_API.md).

---

## Related Endpoints

- `POST /v1/auth/register` - Public user registration (requires email verification)
- `POST /v1/auth/register-supervisor` - Register supervisor (Admin only)
- `POST /v1/auth/register-recruiter` - Register recruiter (Admin only)
- `PATCH /v1/users/:userId` - Update user (including email and password)
- `GET /v1/users/:userId` - Get user details (including navigation structure)
- `GET /v1/sub-roles` - List all sub-roles
- `POST /v1/sub-roles` - Create a new sub-role

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- The navigation structure is stored as a MongoDB Mixed type, allowing flexible nested structures
- Navigation permissions can be updated later through the `PATCH /v1/auth/register-user/:userId` endpoint
- You can use `subRoleId` to assign a pre-defined sub-role instead of providing navigation directly
- If `subRoleId` is used, the navigation structure is automatically copied from the sub-role
- **Important:** When a sub-role's navigation is updated, all users assigned to that sub-role automatically receive the updated permissions. This ensures consistency across users with the same sub-role.
- Email addresses must be unique across all users
- The registered user will have `role: 'admin'` and `isEmailVerified: true` automatically
- Password is hashed using bcrypt before storage
- The navigation structure is stored exactly as provided from the frontend
- Email and password fields cannot be updated through the `PATCH /v1/auth/register-user/:userId` endpoint
- To update email or password, use the general user update endpoint `PATCH /v1/users/:userId`
- Users have an `isActive` field (default: `true`) that controls login access
- If `isActive` is set to `false`, the user cannot log in and will receive a deactivation message
- You can delete registered users using `DELETE /v1/auth/register-user/:userId`
- Setting `subRoleId` to `null` in the update endpoint will clear both `subRoleId`, `subRole`, and `navigation`
