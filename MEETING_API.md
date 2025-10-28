# Meeting Link Generation API

This API provides a complete meeting management system with shareable meeting links that allow anyone to join with just their name and email.

## Features

- ✅ **Create Meeting Links**: Generate shareable meeting URLs
- ✅ **Join Without Authentication**: Anyone can join with name + email
- ✅ **Multiple Participants**: Support for up to 100 participants per meeting
- ✅ **Real-time Video**: Integrated with Agora for video/audio calls
- ✅ **Meeting Management**: Full CRUD operations for meetings
- ✅ **Participant Tracking**: Track who joined and when
- ✅ **Meeting Status**: Scheduled, Active, Ended, Cancelled states

## Environment Variables

Make sure to set the following environment variables:

```bash
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate
FRONTEND_URL=https://your-frontend-url.com
```

## API Endpoints

### 1. Create Meeting

**POST** `/api/v1/meetings`

Create a new meeting with a shareable link.

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Interview with John Doe",
  "description": "Technical interview for Software Engineer position",
  "scheduledAt": "2024-01-15T14:00:00Z",
  "duration": 60,
  "maxParticipants": 10,
  "allowGuestJoin": true,
  "requireApproval": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "meetingId": "meeting_abc123def456",
    "title": "Interview with John Doe",
    "description": "Technical interview for Software Engineer position",
    "meetingUrl": "https://your-frontend-url.com/meeting/meeting_abc123def456?token=xyz789",
    "joinToken": "xyz789",
    "channelName": "meeting_meeting_abc123def456_1705320000000",
    "appId": "your_agora_app_id",
    "status": "scheduled",
    "createdBy": "user_id_here",
    "scheduledAt": "2024-01-15T14:00:00.000Z",
    "duration": 60,
    "maxParticipants": 10,
    "currentParticipants": 0,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "message": "Meeting created successfully"
}
```

### 2. Join Meeting (Public - No Auth Required)

**POST** `/api/v1/meetings/{meetingId}/join`

Join a meeting with just name and email. No authentication required!

**Request Body:**
```json
{
  "joinToken": "xyz789",
  "name": "John Doe",
  "email": "john.doe@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "meeting": {
      "meetingId": "meeting_abc123def456",
      "title": "Interview with John Doe",
      "status": "active",
      "currentParticipants": 1
    },
    "participant": {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "role": "participant",
      "joinedAt": "2024-01-15T14:05:00.000Z",
      "isActive": true
    },
    "agoraToken": {
      "token": "generated_agora_token",
      "channelName": "meeting_meeting_abc123def456_1705320000000",
      "account": "john.doe@example.com",
      "role": 1,
      "expirationTime": 1705323600,
      "appId": "your_agora_app_id"
    },
    "meetingUrl": "https://your-frontend-url.com/meeting/meeting_abc123def456?token=xyz789"
  },
  "message": "Successfully joined the meeting"
}
```

### 3. Get Meeting Info (Public - No Auth Required)

**GET** `/api/v1/meetings/{meetingId}/info?token={joinToken}`

Get public meeting information for joining.

**Response:**
```json
{
  "success": true,
  "data": {
    "meetingId": "meeting_abc123def456",
    "title": "Interview with John Doe",
    "description": "Technical interview for Software Engineer position",
    "status": "scheduled",
    "scheduledAt": "2024-01-15T14:00:00.000Z",
    "duration": 60,
    "maxParticipants": 10,
    "currentParticipants": 0,
    "canJoin": true,
    "meetingUrl": "https://your-frontend-url.com/meeting/meeting_abc123def456?token=xyz789",
    "appId": "your_agora_app_id",
    "channelName": "meeting_meeting_abc123def456_1705320000000"
  },
  "message": "Meeting info retrieved successfully"
}
```

### 4. Leave Meeting

**POST** `/api/v1/meetings/{meetingId}/leave`

Leave a meeting.

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

### 5. Get User's Meetings

**GET** `/api/v1/meetings`

Get all meetings created by the authenticated user.

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Query Parameters:**
- `status` (optional): Filter by status (scheduled, active, ended, cancelled)
- `limit` (optional): Number of meetings to return (default: 20, max: 100)
- `page` (optional): Page number (default: 1)

### 6. Get Meeting Participants

**GET** `/api/v1/meetings/{meetingId}/participants`

Get list of meeting participants (meeting creator only).

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

### 7. End Meeting

**POST** `/api/v1/meetings/{meetingId}/end`

End a meeting (meeting creator only).

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

### 8. Update Meeting

**PATCH** `/api/v1/meetings/{meetingId}`

Update meeting details (meeting creator only).

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

### 9. Delete Meeting

**DELETE** `/api/v1/meetings/{meetingId}`

Delete a meeting (meeting creator only).

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

## Meeting Workflow

### 1. Create Meeting
```javascript
// Create a meeting
const response = await fetch('/api/v1/meetings', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + jwtToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Interview with John Doe',
    description: 'Technical interview',
    duration: 60,
    maxParticipants: 10
  })
});

const meeting = await response.json();
const meetingUrl = meeting.data.meetingUrl;
const joinToken = meeting.data.joinToken;
```

### 2. Share Meeting Link
```javascript
// Share the meeting URL with participants
// The URL format is: https://your-frontend-url.com/meeting/{meetingId}?token={joinToken}
console.log('Share this link:', meetingUrl);
```

### 3. Join Meeting (Frontend)
```javascript
// On the frontend, when someone clicks the meeting link
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const meetingId = window.location.pathname.split('/').pop();

// First, get meeting info to get App ID and channel name
const meetingInfoResponse = await fetch(`/api/v1/meetings/${meetingId}/info?token=${token}`);
const meetingInfo = await meetingInfoResponse.json();

// Join the meeting
const joinResponse = await fetch(`/api/v1/meetings/${meetingId}/join`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    joinToken: token,
    name: 'John Doe',
    email: 'john.doe@example.com'
  })
});

const joinData = await joinResponse.json();
const agoraToken = joinData.data.agoraToken;

// Use the Agora token to join the video call
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
await client.join(
  meetingInfo.data.appId, 
  meetingInfo.data.channelName, 
  agoraToken.token, 
  agoraToken.account
);
```

## Frontend Integration Example

### HTML Page for Meeting Join
```html
<!DOCTYPE html>
<html>
<head>
    <title>Join Meeting</title>
</head>
<body>
    <div id="meeting-container">
        <h1>Join Meeting</h1>
        <form id="join-form">
            <input type="text" id="name" placeholder="Your Name" required>
            <input type="email" id="email" placeholder="Your Email" required>
            <button type="submit">Join Meeting</button>
        </form>
        <div id="video-container"></div>
    </div>

    <script>
        // Get meeting info from URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const meetingId = window.location.pathname.split('/').pop();

        // Get meeting info
        async function getMeetingInfo() {
            const response = await fetch(`/api/v1/meetings/${meetingId}/info?token=${token}`);
            const data = await response.json();
            
            if (data.success) {
                document.querySelector('h1').textContent = `Join: ${data.data.title}`;
                if (!data.data.canJoin) {
                    document.querySelector('#join-form').innerHTML = '<p>This meeting is not available for joining.</p>';
                } else {
                    // Store meeting info for later use
                    window.meetingInfo = data.data;
                }
            }
        }

        // Join meeting
        document.getElementById('join-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            
            try {
                const response = await fetch(`/api/v1/meetings/${meetingId}/join`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        joinToken: token,
                        name: name,
                        email: email
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Initialize Agora video call
                    const agoraToken = data.data.agoraToken;
                    const meetingInfo = window.meetingInfo;
                    
                    // Use the App ID and channel name from meeting info
                    const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
                    await client.join(
                        meetingInfo.appId, 
                        meetingInfo.channelName, 
                        agoraToken.token, 
                        agoraToken.account
                    );
                    
                    document.querySelector('#join-form').style.display = 'none';
                    document.querySelector('#video-container').innerHTML = '<p>Successfully joined the meeting!</p>';
                } else {
                    alert('Failed to join meeting: ' + data.message);
                }
            } catch (error) {
                alert('Error joining meeting: ' + error.message);
            }
        });

        // Load meeting info on page load
        getMeetingInfo();
    </script>
</body>
</html>
```

## Security Features

1. **Unique Join Tokens**: Each meeting has a unique, unguessable join token
2. **Token Validation**: Join tokens are validated for each join request
3. **Meeting Status**: Meetings can be scheduled, active, ended, or cancelled
4. **Participant Limits**: Configurable maximum participants per meeting
5. **Creator Permissions**: Only meeting creators can manage their meetings
6. **Agora Integration**: Secure token generation for video calls

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation error message"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Please authenticate"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Only meeting creator can perform this action"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Meeting not found or invalid token"
}
```

## Testing

Run the meeting tests:
```bash
npm test -- --testPathPattern=meeting.test.js
```

## Usage Examples

### cURL Examples

**Create Meeting:**
```bash
curl -X POST "http://localhost:3000/api/v1/meetings" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Team Meeting",
    "description": "Weekly team sync",
    "duration": 60,
    "maxParticipants": 20
  }'
```

**Join Meeting:**
```bash
curl -X POST "http://localhost:3000/api/v1/meetings/meeting_abc123def456/join" \
  -H "Content-Type: application/json" \
  -d '{
    "joinToken": "xyz789",
    "name": "John Doe",
    "email": "john.doe@example.com"
  }'
```

**Get Meeting Info:**
```bash
curl "http://localhost:3000/api/v1/meetings/meeting_abc123def456/info?token=xyz789"
```

This meeting system provides a complete solution for creating shareable meeting links where anyone can join with just their name and email, making it perfect for interviews, consultations, and collaborative sessions.
