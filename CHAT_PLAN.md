# Live Chat Implementation Plan

## Overview
This document outlines the plan for implementing live chat functionality between participants in meetings. The chat will be real-time, meeting-scoped, and integrated with the existing meeting system.

## Architecture

### Components

1. **WebSocket Server** (Socket.io)
   - Real-time bidirectional communication
   - Room-based messaging (one room per meeting)
   - Connection management
   - Message broadcasting

2. **Chat Message Model** (`src/models/chatMessage.model.js`)
   - Store chat messages in MongoDB
   - Link messages to meetings
   - Track sender information
   - Support message types (text, system, etc.)

3. **Chat Service** (`src/services/chat.service.js`)
   - Business logic for chat operations
   - Message persistence
   - Message retrieval (history)
   - Message validation

4. **Chat Controller** (`src/controllers/chat.controller.js`)
   - HTTP endpoints for chat history
   - Message retrieval APIs

5. **Socket Handlers** (`src/sockets/chat.socket.js`)
   - WebSocket event handlers
   - Room management
   - Message broadcasting
   - Connection/disconnection handling

6. **Chat Routes** (`src/routes/v1/chat.route.js`)
   - RESTful endpoints for chat operations
   - Message history retrieval

## Implementation Details

### 1. Dependencies

Add Socket.io to `package.json`:
```json
{
  "socket.io": "^4.7.0"
}
```

### 2. Chat Message Model

**File**: `src/models/chatMessage.model.js`

```javascript
{
  meetingId: String (reference to Meeting),
  senderEmail: String,
  senderName: String,
  message: String,
  messageType: String (enum: ['text', 'system', 'file']),
  timestamp: Date,
  editedAt: Date,
  deletedAt: Date,
  isDeleted: Boolean
}
```

**Features**:
- Index on `meetingId` and `timestamp` for fast queries
- Support for message editing and deletion
- System messages (e.g., "User joined", "User left")
- Soft delete for message history

### 3. WebSocket Server Setup

**File**: `src/sockets/index.js` (new)
- Initialize Socket.io server
- Attach to Express HTTP server
- Configure CORS for Socket.io
- Set up connection middleware

**File**: `src/sockets/chat.socket.js` (new)
- Handle chat-specific socket events
- Room management (one room per meeting)
- Message broadcasting
- Participant tracking

**Socket Events**:
- `join-meeting`: Join a meeting chat room
- `leave-meeting`: Leave a meeting chat room
- `send-message`: Send a chat message
- `edit-message`: Edit a sent message
- `delete-message`: Delete a sent message
- `typing`: Broadcast typing indicator
- `stop-typing`: Stop typing indicator

**Socket Event Responses**:
- `message-received`: Broadcast new message to all participants
- `message-edited`: Broadcast edited message
- `message-deleted`: Broadcast deleted message
- `user-typing`: Broadcast typing indicator
- `user-stopped-typing`: Broadcast stop typing
- `user-joined`: Broadcast user joined chat
- `user-left`: Broadcast user left chat
- `error`: Send error messages

### 4. Chat Service

**File**: `src/services/chat.service.js` (new)

**Functions**:
- `saveMessage(meetingId, senderEmail, senderName, message, messageType)`
  - Save message to database
  - Return saved message
- `getChatHistory(meetingId, limit, beforeTimestamp)`
  - Retrieve chat history for a meeting
  - Support pagination
  - Return messages sorted by timestamp
- `editMessage(messageId, senderEmail, newMessage)`
  - Edit a message (only by sender)
  - Update `editedAt` timestamp
- `deleteMessage(messageId, senderEmail)`
  - Soft delete a message
  - Set `isDeleted` to true
- `validateMessage(message)`
  - Validate message content
  - Check length limits
  - Sanitize content

### 5. Chat Controller

**File**: `src/controllers/chat.controller.js` (new)

**Endpoints**:
- `GET /meetings/:meetingId/chat/history`
  - Get chat history
  - Query params: `limit`, `before` (timestamp)
  - Auth: Optional (for meeting participants)
- `GET /meetings/:meetingId/chat/messages/:messageId`
  - Get a specific message
  - Auth: Optional
- `PATCH /meetings/:meetingId/chat/messages/:messageId`
  - Edit a message
  - Auth: Required (sender only)
- `DELETE /meetings/:meetingId/chat/messages/:messageId`
  - Delete a message
  - Auth: Required (sender only)

### 6. Chat Routes

**File**: `src/routes/v1/chat.route.js` (new)

- Mount at `/meetings/:meetingId/chat`
- Include validation middleware
- Optional auth for public endpoints
- Required auth for edit/delete

### 7. Socket Integration

**Integration Points**:
1. **App Initialization** (`src/index.js`)
   - Create HTTP server from Express app
   - Initialize Socket.io server
   - Attach socket handlers

2. **Meeting Join Flow**
   - When participant joins meeting, automatically join chat room
   - Send system message: "User joined the chat"

3. **Meeting Leave Flow**
   - When participant leaves meeting, leave chat room
   - Send system message: "User left the chat"

### 8. Meeting Model Updates

**Optional Enhancement**:
- Add `chatEnabled: Boolean` field to meeting model
- Allow meeting creator to enable/disable chat
- Default: `true`

## API Endpoints

### RESTful Endpoints

#### 1. Get Chat History
```
GET /api/v1/meetings/:meetingId/chat/history
Query Params:
  - limit: number (default: 50, max: 100)
  - before: ISO timestamp (for pagination)
```

**Response**:
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "message_id",
        "meetingId": "meeting_id",
        "senderEmail": "user@example.com",
        "senderName": "John Doe",
        "message": "Hello everyone!",
        "messageType": "text",
        "timestamp": "2024-01-15T14:00:00.000Z",
        "editedAt": null,
        "isDeleted": false
      }
    ],
    "hasMore": false,
    "total": 25
  }
}
```

#### 2. Get Single Message
```
GET /api/v1/meetings/:meetingId/chat/messages/:messageId
```

#### 3. Edit Message
```
PATCH /api/v1/meetings/:meetingId/chat/messages/:messageId
Body: { "message": "Updated message text" }
Auth: Required (sender only)
```

#### 4. Delete Message
```
DELETE /api/v1/meetings/:meetingId/chat/messages/:messageId
Auth: Required (sender only)
```

### WebSocket Events

#### Client → Server

**Join Meeting Chat**:
```javascript
socket.emit('join-meeting', {
  meetingId: 'meeting_abc123',
  email: 'user@example.com',
  name: 'John Doe'
});
```

**Send Message**:
```javascript
socket.emit('send-message', {
  meetingId: 'meeting_abc123',
  message: 'Hello everyone!',
  email: 'user@example.com',
  name: 'John Doe'
});
```

**Edit Message**:
```javascript
socket.emit('edit-message', {
  messageId: 'msg_123',
  meetingId: 'meeting_abc123',
  newMessage: 'Updated message',
  email: 'user@example.com'
});
```

**Delete Message**:
```javascript
socket.emit('delete-message', {
  messageId: 'msg_123',
  meetingId: 'meeting_abc123',
  email: 'user@example.com'
});
```

**Typing Indicator**:
```javascript
socket.emit('typing', {
  meetingId: 'meeting_abc123',
  email: 'user@example.com',
  name: 'John Doe'
});
```

**Stop Typing**:
```javascript
socket.emit('stop-typing', {
  meetingId: 'meeting_abc123',
  email: 'user@example.com'
});
```

#### Server → Client

**Message Received**:
```javascript
socket.on('message-received', (data) => {
  // data: { message, senderEmail, senderName, timestamp, messageId }
});
```

**Message Edited**:
```javascript
socket.on('message-edited', (data) => {
  // data: { messageId, newMessage, editedAt }
});
```

**Message Deleted**:
```javascript
socket.on('message-deleted', (data) => {
  // data: { messageId }
});
```

**User Typing**:
```javascript
socket.on('user-typing', (data) => {
  // data: { email, name, meetingId }
});
```

**User Stopped Typing**:
```javascript
socket.on('user-stopped-typing', (data) => {
  // data: { email, meetingId }
});
```

**User Joined Chat**:
```javascript
socket.on('user-joined', (data) => {
  // data: { email, name, meetingId }
});
```

**User Left Chat**:
```javascript
socket.on('user-left', (data) => {
  // data: { email, name, meetingId }
});
```

**Error**:
```javascript
socket.on('error', (data) => {
  // data: { message, code }
});
```

## Security Considerations

1. **Room Access Control**
   - Verify user is a participant in the meeting before allowing room join
   - Validate meeting exists and is active
   - Check join token for public meetings

2. **Message Validation**
   - Sanitize message content (XSS prevention)
   - Enforce message length limits (e.g., max 1000 characters)
   - Rate limiting for message sending

3. **Authentication**
   - Optional auth for public meeting participants
   - Required auth for message editing/deletion
   - Verify sender owns message before edit/delete

4. **Rate Limiting**
   - Limit messages per user per minute (e.g., 30 messages/min)
   - Limit typing indicators (e.g., 1 per second)

5. **Content Moderation** (Future)
   - Profanity filtering
   - Spam detection
   - Report functionality

## Database Schema

### ChatMessage Collection

```javascript
{
  _id: ObjectId,
  meetingId: String (indexed),
  senderEmail: String (indexed),
  senderName: String,
  message: String,
  messageType: String (enum: ['text', 'system', 'file']),
  timestamp: Date (indexed),
  editedAt: Date,
  deletedAt: Date,
  isDeleted: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `{ meetingId: 1, timestamp: -1 }` - For chat history queries
- `{ senderEmail: 1 }` - For user message queries
- `{ meetingId: 1, isDeleted: 1 }` - For active messages

## Frontend Integration

### Socket.io Client Setup

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});
```

### Join Meeting Chat

```javascript
socket.emit('join-meeting', {
  meetingId: meetingId,
  email: userEmail,
  name: userName
});

socket.on('user-joined', (data) => {
  console.log(`${data.name} joined the chat`);
});

socket.on('message-received', (data) => {
  // Add message to chat UI
  addMessageToChat(data);
});
```

### Send Message

```javascript
const sendMessage = (message) => {
  socket.emit('send-message', {
    meetingId: meetingId,
    message: message,
    email: userEmail,
    name: userName
  });
};
```

### Typing Indicator

```javascript
let typingTimeout;

const handleTyping = () => {
  socket.emit('typing', {
    meetingId: meetingId,
    email: userEmail,
    name: userName
  });

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('stop-typing', {
      meetingId: meetingId,
      email: userEmail
    });
  }, 3000);
};

socket.on('user-typing', (data) => {
  // Show typing indicator for user
  showTypingIndicator(data.name);
});
```

## Testing Strategy

1. **Unit Tests**
   - Chat service functions
   - Message validation
   - Message persistence

2. **Integration Tests**
   - Socket connection
   - Room joining/leaving
   - Message broadcasting
   - REST API endpoints

3. **E2E Tests**
   - Full chat flow
   - Multiple participants
   - Message history retrieval

## Performance Considerations

1. **Message Pagination**
   - Load messages in chunks (e.g., 50 at a time)
   - Implement infinite scroll
   - Cache recent messages

2. **Database Optimization**
   - Index on `meetingId` and `timestamp`
   - Archive old messages (optional)
   - Clean up deleted messages periodically

3. **Socket Connection Management**
   - Connection pooling
   - Graceful disconnection handling
   - Reconnection logic

4. **Rate Limiting**
   - Prevent message spam
   - Limit typing indicators
   - Throttle socket events

## Future Enhancements

1. **File Sharing**
   - Upload files/images in chat
   - Store in S3
   - Generate presigned URLs

2. **Message Reactions**
   - Emoji reactions to messages
   - Reaction counts

3. **Mentions**
   - @mention users
   - Notifications for mentions

4. **Read Receipts**
   - Track message read status
   - Show "read by" indicators

5. **Message Search**
   - Search messages within a meeting
   - Full-text search

6. **Chat Export**
   - Export chat history as text file
   - Include in meeting transcript

## Implementation Order

1. ✅ Install Socket.io dependency
2. ✅ Create ChatMessage model
3. ✅ Set up Socket.io server
4. ✅ Create chat service
5. ✅ Create socket handlers
6. ✅ Create chat controller
7. ✅ Create chat routes
8. ✅ Integrate with Express app
9. ✅ Add validation
10. ✅ Write tests
11. ✅ Update API documentation

## Environment Variables

Add to `.env`:
```bash
# Socket.io configuration
SOCKET_IO_CORS_ORIGIN=http://localhost:3001,https://main.d17v4yz0vw03r0.amplifyapp.com
```

## Notes

- Chat messages are scoped to meetings
- Messages persist in database for history
- Real-time updates via WebSocket
- REST API for message history and management
- Support for message editing and deletion
- Typing indicators for better UX
- System messages for join/leave events

