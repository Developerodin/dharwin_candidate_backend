# Recruiter Notes and Feedback API Documentation

## Overview
This API allows recruiters and admins to add notes and feedback to candidate profiles. Notes can be added multiple times to track ongoing observations, while feedback provides a final assessment with an optional rating.

## Base URL
```
/v1/candidates
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Role-Based Access
- **Recruiter**: Can add notes and feedback to any candidate
- **Admin**: Can add notes and feedback to any candidate, and assign recruiters
- **Regular Users**: Cannot access these endpoints

---

## Add Note to Candidate

**POST** `/v1/candidates/:candidateId/notes`

Add a note to a candidate's profile. Notes are stored in chronological order and can be added multiple times.

**Authorization:**
- Recruiter and Admin roles

**Path Parameters:**
- `candidateId` (string, required) - The candidate's ID

**Request Body:**
```json
{
  "note": "Initial screening completed. Strong technical skills. Good communication. Scheduled for technical interview next week."
}
```

**Response:** `200 OK`
```json
{
  "id": "candidate_id",
  "fullName": "Jane Smith",
  "email": "jane@example.com",
  "recruiterNotes": [
    {
      "note": "Initial screening completed. Strong technical skills. Good communication. Scheduled for technical interview next week.",
      "addedBy": {
        "id": "recruiter_id",
        "name": "John Recruiter",
        "email": "john@example.com",
        "role": "recruiter"
      },
      "addedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "assignedRecruiter": {
    "id": "recruiter_id",
    "name": "John Recruiter",
    "email": "john@example.com",
    "role": "recruiter"
  },
  "createdAt": "2024-01-10T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Responses:**

**400 Bad Request** - Invalid input
```json
{
  "code": 400,
  "message": "Note is required"
}
```

**403 Forbidden** - User doesn't have permission
```json
{
  "code": 403,
  "message": "Only recruiters and admins can add notes"
}
```

**404 Not Found** - Candidate not found
```json
{
  "code": 404,
  "message": "Candidate not found"
}
```

---

## Add Feedback to Candidate

**POST** `/v1/candidates/:candidateId/feedback`

Add feedback and optional rating to a candidate's profile. This is typically used for final assessments.

**Authorization:**
- Recruiter and Admin roles

**Path Parameters:**
- `candidateId` (string, required) - The candidate's ID

**Request Body:**
```json
{
  "feedback": "Excellent candidate. Strong technical background with 5+ years of experience in Node.js and React. Good cultural fit. Excellent problem-solving skills. Recommended for next round.",
  "rating": 5
}
```

**Response:** `200 OK`
```json
{
  "id": "candidate_id",
  "fullName": "Jane Smith",
  "email": "jane@example.com",
  "recruiterFeedback": "Excellent candidate. Strong technical background with 5+ years of experience in Node.js and React. Good cultural fit. Excellent problem-solving skills. Recommended for next round.",
  "recruiterRating": 5,
  "recruiterNotes": [
    {
      "note": "Initial screening completed",
      "addedBy": {
        "id": "recruiter_id",
        "name": "John Recruiter",
        "email": "john@example.com",
        "role": "recruiter"
      },
      "addedAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "assignedRecruiter": {
    "id": "recruiter_id",
    "name": "John Recruiter",
    "email": "john@example.com",
    "role": "recruiter"
  },
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

**Request Body Fields:**
- `feedback` (string, required) - The feedback text (minimum 1 character)
- `rating` (number, optional) - Rating from 1 to 5 (1 = Poor, 5 = Excellent)

**Error Responses:**

**400 Bad Request** - Invalid input
```json
{
  "code": 400,
  "message": "Feedback is required"
}
```

**403 Forbidden** - User doesn't have permission
```json
{
  "code": 403,
  "message": "Only recruiters and admins can add feedback"
}
```

**404 Not Found** - Candidate not found
```json
{
  "code": 404,
  "message": "Candidate not found"
}
```

---

## Assign Recruiter to Candidate

**POST** `/v1/candidates/:candidateId/assign-recruiter`

Assign a recruiter to a specific candidate. This helps track which recruiter is responsible for managing the candidate.

**Authorization:**
- Admin only

**Path Parameters:**
- `candidateId` (string, required) - The candidate's ID

**Request Body:**
```json
{
  "recruiterId": "recruiter_user_id"
}
```

**Response:** `200 OK`
```json
{
  "id": "candidate_id",
  "fullName": "Jane Smith",
  "email": "jane@example.com",
  "assignedRecruiter": {
    "id": "recruiter_id",
    "name": "John Recruiter",
    "email": "john@example.com",
    "role": "recruiter"
  },
  "updatedAt": "2024-01-15T12:00:00.000Z"
}
```

**Error Responses:**

**400 Bad Request** - Invalid input
```json
{
  "code": 400,
  "message": "User is not a recruiter"
}
```

**403 Forbidden** - User doesn't have permission
```json
{
  "code": 403,
  "message": "Only admins can assign recruiters"
}
```

**404 Not Found** - Candidate or recruiter not found
```json
{
  "code": 404,
  "message": "Candidate not found"
}
```
or
```json
{
  "code": 404,
  "message": "Recruiter not found"
}
```

---

## Get Candidate with Notes and Feedback

**GET** `/v1/candidates/:candidateId`

Get a candidate's full profile including all recruiter notes and feedback.

**Authorization:**
- Recruiter, Admin, and Candidate Owner

**Path Parameters:**
- `candidateId` (string, required) - The candidate's ID

**Response:** `200 OK`
```json
{
  "id": "candidate_id",
  "fullName": "Jane Smith",
  "email": "jane@example.com",
  "phoneNumber": "1234567890",
  "profilePicture": {
    "url": "https://example.com/profile.jpg",
    "key": "profile_key",
    "originalName": "profile.jpg",
    "size": 102400,
    "mimeType": "image/jpeg"
  },
  "shortBio": "Experienced software engineer",
  "recruiterNotes": [
    {
      "note": "Initial screening completed. Strong technical skills.",
      "addedBy": {
        "id": "recruiter_id_1",
        "name": "John Recruiter",
        "email": "john@example.com",
        "role": "recruiter"
      },
      "addedAt": "2024-01-15T10:00:00.000Z"
    },
    {
      "note": "Technical interview scheduled for next week.",
      "addedBy": {
        "id": "recruiter_id_1",
        "name": "John Recruiter",
        "email": "john@example.com",
        "role": "recruiter"
      },
      "addedAt": "2024-01-16T09:00:00.000Z"
    }
  ],
  "recruiterFeedback": "Excellent candidate. Strong technical background and good cultural fit. Recommended for next round.",
  "recruiterRating": 5,
  "assignedRecruiter": {
    "id": "recruiter_id_1",
    "name": "John Recruiter",
    "email": "john@example.com",
    "role": "recruiter"
  },
  "owner": {
    "id": "owner_id",
    "name": "Owner Name",
    "email": "owner@example.com"
  },
  "adminId": {
    "id": "admin_id",
    "name": "Admin Name",
    "email": "admin@example.com"
  },
  "qualifications": [...],
  "experiences": [...],
  "skills": [...],
  "createdAt": "2024-01-10T10:00:00.000Z",
  "updatedAt": "2024-01-16T09:00:00.000Z"
}
```

---

## List Candidates with Notes and Feedback

**GET** `/v1/candidates`

Get a list of candidates. For recruiters and admins, this includes all candidates with their recruiter notes and feedback.

**Authorization:**
- Recruiter: Can see all candidates
- Admin: Can see all candidates
- Regular Users: Can only see their own candidates

**Query Parameters:**
- Standard candidate search parameters (see CANDIDATE_SEARCH_API.md)
- All candidates returned will include `recruiterNotes`, `recruiterFeedback`, `recruiterRating`, and `assignedRecruiter` fields if present

**Response:** `200 OK`
```json
{
  "results": [
    {
      "id": "candidate_id",
      "fullName": "Jane Smith",
      "email": "jane@example.com",
      "recruiterNotes": [
        {
          "note": "Initial screening completed",
          "addedBy": {
            "id": "recruiter_id",
            "name": "John Recruiter",
            "email": "john@example.com",
            "role": "recruiter"
          },
          "addedAt": "2024-01-15T10:00:00.000Z"
        }
      ],
      "recruiterFeedback": "Strong candidate",
      "recruiterRating": 4,
      "assignedRecruiter": {
        "id": "recruiter_id",
        "name": "John Recruiter",
        "email": "john@example.com",
        "role": "recruiter"
      }
    }
  ],
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "totalResults": 50
}
```

---

## Data Structure

### Recruiter Notes
Each note in the `recruiterNotes` array contains:
- `note` (string) - The note text
- `addedBy` (object) - User who added the note:
  - `id` (string) - User ID
  - `name` (string) - User name
  - `email` (string) - User email
  - `role` (string) - User role (typically "recruiter")
- `addedAt` (Date) - Timestamp when note was added

### Recruiter Feedback
- `recruiterFeedback` (string|null) - The feedback text
- `recruiterRating` (number|null) - Rating from 1 to 5

### Assigned Recruiter
- `assignedRecruiter` (object|null) - The assigned recruiter:
  - `id` (string) - Recruiter user ID
  - `name` (string) - Recruiter name
  - `email` (string) - Recruiter email
  - `role` (string) - User role ("recruiter")

---

## Example Workflow

### 1. Assign Recruiter to Candidate (Admin)
```bash
POST /v1/candidates/69271a17c4a63ce9bbc5f981/assign-recruiter
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "recruiterId": "69281cc833d819cb5bdb2758"
}
```

### 2. Add Initial Note (Recruiter)
```bash
POST /v1/candidates/69271a17c4a63ce9bbc5f981/notes
Authorization: Bearer <recruiter_token>
Content-Type: application/json

{
  "note": "Initial screening completed. Candidate has strong technical background in JavaScript and React. Good communication skills."
}
```

### 3. Add Follow-up Note (Recruiter)
```bash
POST /v1/candidates/69271a17c4a63ce9bbc5f981/notes
Authorization: Bearer <recruiter_token>
Content-Type: application/json

{
  "note": "Technical interview scheduled for January 20th, 2024. Candidate confirmed availability."
}
```

### 4. Add Final Feedback (Recruiter)
```bash
POST /v1/candidates/69271a17c4a63ce9bbc5f981/feedback
Authorization: Bearer <recruiter_token>
Content-Type: application/json

{
  "feedback": "Excellent candidate. Performed well in technical interview. Strong problem-solving skills and good cultural fit. Recommended for offer.",
  "rating": 5
}
```

### 5. View Candidate with All Notes and Feedback
```bash
GET /v1/candidates/69271a17c4a63ce9bbc5f981
Authorization: Bearer <recruiter_token>
```

---

## Best Practices

1. **Notes vs Feedback:**
   - Use **notes** for ongoing observations, updates, and timeline tracking
   - Use **feedback** for final assessments and recommendations

2. **Note Frequency:**
   - Add notes after each significant interaction (screening, interview, follow-up)
   - Keep notes concise but informative
   - Include dates and next steps when relevant

3. **Rating Guidelines:**
   - 5 = Excellent - Highly recommended, exceeds expectations
   - 4 = Very Good - Strong candidate, recommended
   - 3 = Good - Meets requirements, acceptable
   - 2 = Fair - Below expectations, not recommended
   - 1 = Poor - Does not meet requirements

4. **Feedback Content:**
   - Include technical assessment
   - Mention soft skills and cultural fit
   - Provide clear recommendation
   - Be professional and constructive

5. **Recruiter Assignment:**
   - Assign recruiters early in the process
   - One recruiter per candidate for clarity
   - Admins can reassign if needed

---

## Integration Notes

### Candidate Model Fields
When fetching candidates, the following fields are automatically included:
- `recruiterNotes` - Array of note objects (chronologically ordered)
- `recruiterFeedback` - String or null
- `recruiterRating` - Number (1-5) or null
- `assignedRecruiter` - User object or null

### Populated Fields
All recruiter-related fields are automatically populated with user information:
- `recruiterNotes[].addedBy` - Full user object with name, email, role
- `assignedRecruiter` - Full user object with name, email, role

### Filtering Candidates by Recruiter
You can filter candidates by assigned recruiter using the standard candidate search API:
```
GET /v1/candidates?assignedRecruiter=recruiter_id
```

---

## Error Handling

All endpoints follow standard HTTP status codes:
- `200 OK` - Success
- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - User doesn't have required permissions
- `404 Not Found` - Candidate or recruiter not found
- `500 Internal Server Error` - Server error

---

## Example Frontend Implementation

### React/TypeScript Example

```typescript
// Add note to candidate
const addNoteToCandidate = async (candidateId: string, note: string) => {
  const response = await fetch(`/v1/candidates/${candidateId}/notes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ note }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add note');
  }
  
  return response.json();
};

// Add feedback to candidate
const addFeedbackToCandidate = async (
  candidateId: string, 
  feedback: string, 
  rating?: number
) => {
  const response = await fetch(`/v1/candidates/${candidateId}/feedback`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ feedback, rating }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add feedback');
  }
  
  return response.json();
};

// Assign recruiter to candidate (Admin only)
const assignRecruiter = async (candidateId: string, recruiterId: string) => {
  const response = await fetch(`/v1/candidates/${candidateId}/assign-recruiter`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ recruiterId }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to assign recruiter');
  }
  
  return response.json();
};
```

### Displaying Notes in UI

```typescript
interface RecruiterNote {
  note: string;
  addedBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  addedAt: string;
}

// Component example
const CandidateNotes = ({ candidate }) => {
  return (
    <div>
      <h3>Recruiter Notes</h3>
      {candidate.recruiterNotes?.map((note: RecruiterNote, index: number) => (
        <div key={index} className="note-card">
          <p>{note.note}</p>
          <div className="note-meta">
            <span>By: {note.addedBy.name}</span>
            <span>Date: {new Date(note.addedAt).toLocaleDateString()}</span>
          </div>
        </div>
      ))}
      
      {candidate.recruiterFeedback && (
        <div className="feedback-section">
          <h4>Feedback</h4>
          <p>{candidate.recruiterFeedback}</p>
          {candidate.recruiterRating && (
            <div>Rating: {'⭐'.repeat(candidate.recruiterRating)}</div>
          )}
        </div>
      )}
    </div>
  );
};
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- All IDs are MongoDB ObjectIds
- Notes are stored in chronological order (oldest first)
- Multiple notes can be added to the same candidate
- Feedback can be updated by posting again (replaces previous feedback)
- Rating is optional but recommended when providing feedback
- Recruiters can add notes and feedback to any candidate
- Only admins can assign recruiters to candidates
- All recruiter-related fields are automatically populated with user information

