# Sub-Roles API Documentation

The Sub-Roles API allows administrators to manage reusable navigation permission presets (sub-roles). Each sub-role defines a name and a full navigation permissions structure. These sub-roles can then be assigned to admin users during registration or update, so their `navigation` is automatically derived from the selected sub-role.

---

## Base URL

`/v1/sub-roles`

All endpoints below are prefixed with `/v1`.

---

## Authentication

All Sub-Roles API endpoints require:

- **Bearer Token Authentication** (JWT)
- **Admin role** with `manageUsers` permission

### Required Headers

```http
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

---

## Sub-Role Object

### Schema

```json
{
  "id": "string (ObjectId)",
  "name": "string",
  "description": "string | null",
  "navigation": "object",
  "isActive": "boolean",
  "createdBy": {
    "id": "string (ObjectId)",
    "name": "string",
    "email": "string"
  },
  "createdAt": "string (ISO 8601 date)",
  "updatedAt": "string (ISO 8601 date)"
}
```

### Navigation Structure

The `navigation` field is a nested object where each key represents a feature or section, and the value is either:

- `false` - Feature is disabled
- `true` - Feature is enabled
- Another nested object with the same structure

Complete Navigation Structure Example:

```json
{
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
```

---

## 1. Create Sub-Role

**Endpoint:** `POST /v1/sub-roles`

**Description:** Create a new sub-role with a name, optional description, and navigation permissions structure.

**Authentication:** Required (Admin with `manageUsers`)

### Request Body

| Field        | Type   | Required | Description                                       |
|-------------|--------|----------|---------------------------------------------------|
| `name`      | string | Yes      | Unique sub-role name (e.g. `"Senior Admin"`)     |
| `description` | string | No     | Optional description of the sub-role             |
| `navigation` | object | Yes     | Navigation permissions structure (nested object) |
| `isActive`  | boolean| No       | Whether the sub-role is active (default: `true`) |

### Example Request

```bash
curl -X POST "http://localhost:3000/v1/sub-roles" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Senior Admin",
    "description": "Full access to most admin features",
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
          "Share Candidate Form": true,
          "Track Attendance": true
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
          "New Project": true,
          "View Project": true,
          "Edit Project": true,
          "Delete Project": true
        },
        "Manage Tasks": {
          "New Board": true,
          "Add Task": true,
          "View Task": true,
          "Edit Task": true,
          "Delete Task": true
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
              "Create Template": true,
              "Actions": {
                "View Template": true,
                "Edit Template": true,
                "Delete Template": true
              }
            }
          },
          "Attendance": {
            "Manage Week Off": true,
            "Holidays List": true,
            "Assign Holidays": true,
            "Manage Shifts": true,
            "Assign Shift": true,
            "Assign Leave": true,
            "Leave Requests": true,
            "Backdated Attendance": true
          }
        },
        "Logs": {
          "Login Logs": true,
          "Recruiter Logs": true
        },
        "RBAC": {
          "Roles": true,
          "Manage Roles & Permissions": true
        }
      }
    },
    "isActive": true
  }'
```

### Response: `201 Created`

```json
{
  "id": "65f1f77bcf86cd7994390111",
  "name": "Senior Admin",
  "description": "Full access to most admin features",
  "navigation": { "...": "..." },
  "isActive": true,
  "createdBy": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Main Admin",
    "email": "admin@example.com"
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

## 2. List Sub-Roles

**Endpoint:** `GET /v1/sub-roles`

**Description:** Retrieve a paginated list of sub-roles.

**Authentication:** Required (Admin with `manageUsers`)

### Query Parameters

| Parameter | Type    | Required | Description                             |
|----------|---------|----------|-----------------------------------------|
| `name`   | string  | No       | Filter by sub-role name (partial match) |
| `isActive` | boolean | No     | Filter by active status                 |
| `sortBy` | string  | No       | Sort, e.g. `name:asc` or `createdAt:desc` |
| `limit`  | number  | No       | Page size (default: 10)                 |
| `page`   | number  | No       | Page number (default: 1)                |

### Example Request

```bash
curl -X GET "http://localhost:3000/v1/sub-roles?isActive=true&limit=10&page=1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Response: `200 OK`

```json
{
  "results": [
    {
      "id": "65f1f77bcf86cd7994390111",
      "name": "Senior Admin",
      "description": "Full access to most admin features",
      "navigation": { "...": "..." },
      "isActive": true,
      "createdBy": {
        "id": "507f1f77bcf86cd799439011",
        "name": "Main Admin",
        "email": "admin@example.com"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "totalResults": 1
}
```

---

## 3. Get Sub-Role by ID

**Endpoint:** `GET /v1/sub-roles/:subRoleId`

**Description:** Retrieve details of a specific sub-role by its ID.

**Authentication:** Required (Admin with `manageUsers`)

### Path Parameters

| Parameter   | Type   | Description                  |
|------------|--------|------------------------------|
| `subRoleId`| string | Sub-role ID (MongoDB ObjectId) |

### Example Request

```bash
curl -X GET "http://localhost:3000/v1/sub-roles/65f1f77bcf86cd7994390111" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Response: `200 OK`

```json
{
  "id": "65f1f77bcf86cd7994390111",
  "name": "Senior Admin",
  "description": "Full access to most admin features",
  "navigation": { "...": "..." },
  "isActive": true,
  "createdBy": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Main Admin",
    "email": "admin@example.com"
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Error Responses

- `404 Not Found` – Sub-role not found

---

## 4. Update Sub-Role

**Endpoint:** `PATCH /v1/sub-roles/:subRoleId`

**Description:** Update one or more fields of an existing sub-role. At least one field must be provided.

**Important:** When you update a sub-role's `navigation` or `name`, the changes are automatically propagated to all users who have this sub-role assigned. This ensures that all users with the same sub-role always have consistent permissions.

**Authentication:** Required (Admin with `manageUsers`)

### Path Parameters

| Parameter   | Type   | Description                  |
|------------|--------|------------------------------|
| `subRoleId`| string | Sub-role ID (MongoDB ObjectId) |

### Request Body

| Field        | Type    | Required | Description                                  |
|-------------|---------|----------|----------------------------------------------|
| `name`      | string  | No       | New sub-role name (must be unique)          |
| `description` | string| No       | New description                              |
| `navigation` | object | No       | New navigation permissions structure         |
| `isActive`  | boolean | No       | New active status                            |

### Example Request

```bash
curl -X PATCH "http://localhost:3000/v1/sub-roles/65f1f77bcf86cd7994390111" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description for Senior Admin",
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
          "Share Candidate Form": true,
          "Track Attendance": true
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
          "New Project": true,
          "View Project": true,
          "Edit Project": true,
          "Delete Project": true
        },
        "Manage Tasks": {
          "New Board": true,
          "Add Task": true,
          "View Task": true,
          "Edit Task": true,
          "Delete Task": true
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
              "Create Template": true,
              "Actions": {
                "View Template": true,
                "Edit Template": true,
                "Delete Template": true
              }
            }
          },
          "Attendance": {
            "Manage Week Off": true,
            "Holidays List": true,
            "Assign Holidays": true,
            "Manage Shifts": true,
            "Assign Shift": true,
            "Assign Leave": true,
            "Leave Requests": true,
            "Backdated Attendance": true
          }
        },
        "Logs": {
          "Login Logs": true,
          "Recruiter Logs": true
        },
        "RBAC": {
          "Roles": true,
          "Manage Roles & Permissions": true
        }
      }
    }
  }'
```

### Response: `200 OK`

```json
{
  "id": "65f1f77bcf86cd7994390111",
  "name": "Senior Admin",
  "description": "Updated description for Senior Admin",
  "navigation": { "...": "..." },
  "isActive": true,
  "createdBy": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Main Admin",
    "email": "admin@example.com"
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

### Error Responses

- `400 Bad Request` – Validation error or duplicate name
- `404 Not Found` – Sub-role not found

---

## 5. Delete Sub-Role

**Endpoint:** `DELETE /v1/sub-roles/:subRoleId`

**Description:** Delete a sub-role by its ID.

**Authentication:** Required (Admin with `manageUsers`)

### Path Parameters

| Parameter   | Type   | Description                  |
|------------|--------|------------------------------|
| `subRoleId`| string | Sub-role ID (MongoDB ObjectId) |

### Example Request

```bash
curl -X DELETE "http://localhost:3000/v1/sub-roles/65f1f77bcf86cd7994390111" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Response: `204 No Content`

### Error Responses

- `401 Unauthorized` – Missing or invalid JWT
- `403 Forbidden` – Missing `manageUsers` permission
- `404 Not Found` – Sub-role not found

---

## Using Sub-Roles During Admin User Registration

The `subRoleId` field can be used when registering or updating admin users via the **Admin User Registration API** (`/v1/auth/register-user`):

- If `subRoleId` is provided:
  - The server loads the corresponding sub-role.
  - The user’s `subRole` (string) is set to the sub-role’s `name`.
  - The user’s `navigation` is set to the sub-role’s `navigation`.
- If `navigation` is provided directly:
  - It will be stored as-is.
- **You cannot provide both `subRoleId` and `navigation` together** in the same request.

### Example: Register Admin User with Sub-Role

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
- `navigation`: copied from the sub-role’s `navigation`.

---

## Notes

- Sub-roles are intended as reusable permission templates for admin users.
- **Automatic Updates:** When you update a sub-role's `navigation` or `name`, all users assigned to that sub-role are automatically updated with the new values. This ensures consistency across all users with the same sub-role.
- **Deleting a Sub-Role:** Deleting a sub-role **does not** automatically change existing users that were assigned that sub-role; their `navigation` and `subRole` values remain as stored. However, their `subRoleId` will still reference the deleted sub-role.
- **Bulk Permission Updates:** To change permissions for many users at once, simply update the sub-role's `navigation` - all users with that `subRoleId` will automatically receive the updated permissions.
- **Individual User Overrides:** If a user needs different permissions than their assigned sub-role, you can update that specific user's `navigation` directly via `PATCH /v1/auth/register-user/:userId`. However, if the sub-role is updated later, those individual overrides will be overwritten.
- To change permissions for many users at once, you can:
  - Update the sub-role’s `navigation`, then
  - Update users to re-sync their navigation from the updated sub-role (if desired) via `PATCH /v1/auth/register-user/:userId`.

