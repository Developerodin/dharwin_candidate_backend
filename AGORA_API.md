# Agora Token Generation API

This API provides secure token generation for Agora video/audio communication using the Agora SDK.

## Environment Variables

Make sure to set the following environment variables:

```bash
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate
```

## API Endpoints

### 1. Generate Single Token

**POST** `/api/v1/agora/token`

Generate a single Agora RTC token for a user.

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "channelName": "meeting-room-123",
  "uid": 12345,
  "role": 1,
  "expirationTimeInSeconds": 3600
}
```

**Alternative with account:**
```json
{
  "channelName": "meeting-room-123",
  "account": "user123",
  "role": 1,
  "expirationTimeInSeconds": 3600
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "generated_agora_token",
    "channelName": "meeting-room-123",
    "uid": 12345,
    "role": 1,
    "expirationTime": 1640995200,
    "appId": "your_agora_app_id"
  },
  "message": "Agora token generated successfully"
}
```

### 2. Generate Multiple Tokens

**POST** `/api/v1/agora/tokens`

Generate multiple Agora RTC tokens for different users.

**Headers:**
```
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "users": [
    {
      "channelName": "meeting-room-123",
      "uid": 12345,
      "role": 1
    },
    {
      "channelName": "meeting-room-123",
      "uid": 12346,
      "role": 2
    }
  ],
  "expirationTimeInSeconds": 3600
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tokens": [
      {
        "token": "generated_agora_token_1",
        "channelName": "meeting-room-123",
        "uid": 12345,
        "role": 1,
        "expirationTime": 1640995200,
        "appId": "your_agora_app_id"
      },
      {
        "token": "generated_agora_token_2",
        "channelName": "meeting-room-123",
        "uid": 12346,
        "role": 2,
        "expirationTime": 1640995200,
        "appId": "your_agora_app_id"
      }
    ],
    "count": 2
  },
  "message": "Agora tokens generated successfully"
}
```

### 3. Get Agora Configuration

**GET** `/api/v1/agora/config`

Get the Agora App ID for client configuration.

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "appId": "your_agora_app_id"
  },
  "message": "Agora configuration retrieved successfully"
}
```

## Parameters

### Channel Name
- **Type:** String
- **Required:** Yes
- **Description:** The channel name for the video/audio session
- **Length:** 1-64 characters

### User ID (uid)
- **Type:** Integer
- **Required:** Either `uid` or `account` must be provided
- **Description:** User ID (0 for auto-generated)
- **Range:** 0-4294967295

### Account
- **Type:** String
- **Required:** Either `uid` or `account` must be provided
- **Description:** User account (alternative to uid)
- **Length:** 1-255 characters

### Role
- **Type:** Integer
- **Required:** No (default: 1)
- **Values:**
  - `1`: Publisher (can publish audio/video)
  - `2`: Subscriber (can only subscribe to audio/video)

### Expiration Time
- **Type:** Integer
- **Required:** No (default: 3600 seconds)
- **Description:** Token expiration time in seconds
- **Range:** 1-86400 seconds (1 second to 24 hours)

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Please authenticate"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to generate Agora token"
}
```

## Usage Examples

### JavaScript/Node.js
```javascript
// Generate a token for a user
const response = await fetch('/api/v1/agora/token', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + jwtToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    channelName: 'meeting-room-123',
    uid: 12345,
    role: 1,
    expirationTimeInSeconds: 3600
  })
});

const data = await response.json();
const agoraToken = data.data.token;
```

### cURL
```bash
curl -X POST "http://localhost:3000/api/v1/agora/token" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channelName": "meeting-room-123",
    "uid": 12345,
    "role": 1,
    "expirationTimeInSeconds": 3600
  }'
```

## Security Notes

1. **Authentication Required:** All endpoints require valid JWT authentication
2. **Token Expiration:** Tokens have a maximum expiration time of 24 hours
3. **Channel Names:** Use unique, secure channel names to prevent unauthorized access
4. **User Roles:** Properly assign roles based on user permissions (publisher vs subscriber)

## Integration with Agora SDK

Once you have the token, you can use it with the Agora SDK:

```javascript
// Initialize Agora client
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

// Join channel with token
await client.join(appId, channelName, token, uid);
```
