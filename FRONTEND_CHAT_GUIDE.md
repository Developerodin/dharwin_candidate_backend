# Frontend Chat Integration Guide

This guide explains how to integrate the live chat functionality into your frontend application.

## Prerequisites

1. **Install Socket.io Client**
```bash
npm install socket.io-client
# or
yarn add socket.io-client
```

2. **Backend URL**
   - Development: `http://localhost:3000`
   - Production: Your backend URL

## Overview

The chat system has two parts:
1. **WebSocket (Socket.io)** - For real-time messaging
2. **REST API** - For message history and management

## 1. Socket.io Client Setup

### Initialize Socket Connection

```javascript
import { io } from 'socket.io-client';

// Initialize socket connection
const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  reconnectionDelayMax: 5000,
});

// Connection event handlers
socket.on('connect', () => {
  console.log('Connected to chat server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from chat server');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

## 2. Join Meeting Chat

When a user joins a meeting, they need to join the chat room:

```javascript
const joinMeetingChat = (meetingId, userEmail, userName) => {
  socket.emit('join-meeting', {
    meetingId: meetingId,
    email: userEmail,
    name: userName,
  });
};

// Listen for join confirmation
socket.on('joined-meeting', (data) => {
  console.log('Successfully joined chat:', data);
  // data: { meetingId, message: 'Successfully joined meeting chat' }
});

// Listen for errors
socket.on('error', (error) => {
  console.error('Chat error:', error);
  // error: { message: string, code: string }
});
```

## 3. Send Messages

### Send a Chat Message

```javascript
const sendMessage = (meetingId, message, userEmail, userName) => {
  socket.emit('send-message', {
    meetingId: meetingId,
    message: message.trim(),
    email: userEmail,
    name: userName,
  });
};

// Listen for new messages (from all participants)
socket.on('message-received', (messageData) => {
  // messageData: {
  //   id: string,
  //   meetingId: string,
  //   senderEmail: string,
  //   senderName: string,
  //   message: string,
  //   messageType: 'text' | 'system' | 'file',
  //   timestamp: Date,
  //   editedAt: Date | null,
  //   isDeleted: boolean
  // }
  
  // Add message to your chat UI
  addMessageToChat(messageData);
});
```

### Example: React Component for Sending Messages

```javascript
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

function ChatComponent({ meetingId, userEmail, userName }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket
    const newSocket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    // Join meeting chat
    newSocket.emit('join-meeting', {
      meetingId,
      email: userEmail,
      name: userName,
    });

    // Listen for messages
    newSocket.on('message-received', (messageData) => {
      setMessages((prev) => [...prev, messageData]);
    });

    // Listen for user joined/left
    newSocket.on('user-joined', (data) => {
      console.log(`${data.name} joined the chat`);
    });

    newSocket.on('user-left', (data) => {
      console.log(`${data.name} left the chat`);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.emit('leave-meeting', { meetingId });
      newSocket.disconnect();
    };
  }, [meetingId, userEmail, userName]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket) return;

    socket.emit('send-message', {
      meetingId,
      message: inputMessage,
      email: userEmail,
      name: userName,
    });

    setInputMessage('');
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className="message">
            <strong>{msg.senderName}:</strong> {msg.message}
            {msg.editedAt && <span className="edited">(edited)</span>}
          </div>
        ))}
      </div>
      <form onSubmit={handleSendMessage}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          maxLength={1000}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

## 4. Typing Indicators

### Show Typing Indicator

```javascript
let typingTimeout;

const handleTyping = (meetingId, userEmail, userName) => {
  // Send typing indicator
  socket.emit('typing', {
    meetingId: meetingId,
    email: userEmail,
    name: userName,
  });

  // Clear existing timeout
  clearTimeout(typingTimeout);

  // Auto-stop typing after 3 seconds
  typingTimeout = setTimeout(() => {
    socket.emit('stop-typing', {
      meetingId: meetingId,
      email: userEmail,
    });
  }, 3000);
};

// Listen for typing indicators from others
socket.on('user-typing', (data) => {
  // data: { email, name, meetingId }
  // Show typing indicator in UI
  showTypingIndicator(data.name);
});

socket.on('user-stopped-typing', (data) => {
  // data: { email, meetingId }
  // Hide typing indicator in UI
  hideTypingIndicator(data.email);
});
```

### Example: React Hook for Typing Indicator

```javascript
import { useState, useEffect, useRef } from 'react';

function useTypingIndicator(socket, meetingId, userEmail, userName) {
  const [typingUsers, setTypingUsers] = useState(new Set());
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('user-typing', (data) => {
      setTypingUsers((prev) => new Set([...prev, data.name]));
    });

    socket.on('user-stopped-typing', (data) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        // Remove user by finding their name (you might need to track email->name mapping)
        next.delete(data.name);
        return next;
      });
    });

    return () => {
      socket.off('user-typing');
      socket.off('user-stopped-typing');
    };
  }, [socket]);

  const handleInputChange = () => {
    // Send typing indicator
    socket.emit('typing', {
      meetingId,
      email: userEmail,
      name: userName,
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', {
        meetingId,
        email: userEmail,
      });
    }, 3000);
  };

  return { typingUsers, handleInputChange };
}
```

## 5. Load Chat History

Use the REST API to load previous messages when joining a meeting:

```javascript
const loadChatHistory = async (meetingId, limit = 50) => {
  try {
    const response = await fetch(
      `http://localhost:3000/api/v1/meetings/${meetingId}/chat/history?limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    
    if (data.success) {
      // data.data.messages - array of messages
      // data.data.hasMore - boolean
      // data.data.total - total message count
      return data.data.messages;
    }
  } catch (error) {
    console.error('Error loading chat history:', error);
  }
};

// Load more messages (pagination)
const loadMoreMessages = async (meetingId, beforeTimestamp, limit = 50) => {
  try {
    const response = await fetch(
      `http://localhost:3000/api/v1/meetings/${meetingId}/chat/history?limit=${limit}&before=${beforeTimestamp.toISOString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    return data.data.messages;
  } catch (error) {
    console.error('Error loading more messages:', error);
  }
};
```

### Example: React Hook for Chat History

```javascript
import { useState, useEffect } from 'react';

function useChatHistory(meetingId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [oldestTimestamp, setOldestTimestamp] = useState(null);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:3000/api/v1/meetings/${meetingId}/chat/history?limit=50`
        );
        const data = await response.json();
        
        if (data.success) {
          setMessages(data.data.messages);
          setHasMore(data.data.hasMore);
          if (data.data.messages.length > 0) {
            setOldestTimestamp(new Date(data.data.messages[0].timestamp));
          }
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      } finally {
        setLoading(false);
      }
    };

    if (meetingId) {
      loadHistory();
    }
  }, [meetingId]);

  const loadMore = async () => {
    if (!hasMore || !oldestTimestamp) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/meetings/${meetingId}/chat/history?limit=50&before=${oldestTimestamp.toISOString()}`
      );
      const data = await response.json();
      
      if (data.success && data.data.messages.length > 0) {
        setMessages((prev) => [...data.data.messages, ...prev]);
        setHasMore(data.data.hasMore);
        setOldestTimestamp(new Date(data.data.messages[0].timestamp));
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    }
  };

  return { messages, loading, hasMore, loadMore };
}
```

## 6. Edit Messages

### Edit a Message

```javascript
const editMessage = async (meetingId, messageId, newMessage, userEmail) => {
  try {
    const response = await fetch(
      `http://localhost:3000/api/v1/meetings/${meetingId}/chat/messages/${messageId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage,
          email: userEmail, // Required for public endpoints
        }),
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error editing message:', error);
  }
};

// Listen for edited messages from socket
socket.on('message-edited', (data) => {
  // data: { messageId, newMessage, editedAt }
  // Update message in UI
  updateMessageInUI(data.messageId, data.newMessage, data.editedAt);
});
```

## 7. Delete Messages

### Delete a Message

```javascript
const deleteMessage = async (meetingId, messageId, userEmail) => {
  try {
    const response = await fetch(
      `http://localhost:3000/api/v1/meetings/${meetingId}/chat/messages/${messageId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail, // Required for public endpoints
        }),
      }
    );

    return response.status === 204; // Success
  } catch (error) {
    console.error('Error deleting message:', error);
    return false;
  }
};

// Listen for deleted messages from socket
socket.on('message-deleted', (data) => {
  // data: { messageId }
  // Remove message from UI
  removeMessageFromUI(data.messageId);
});
```

## 8. Leave Meeting Chat

When a user leaves the meeting, they should leave the chat room:

```javascript
const leaveMeetingChat = (meetingId) => {
  socket.emit('leave-meeting', {
    meetingId: meetingId,
  });
};

// Listen for user left events
socket.on('user-left', (data) => {
  // data: { email, name, meetingId, timestamp }
  console.log(`${data.name} left the chat`);
});
```

## 9. Complete React Chat Component Example

```javascript
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

function MeetingChat({ meetingId, userEmail, userName }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize socket and load history
  useEffect(() => {
    // Initialize socket
    const newSocket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    // Load chat history
    const loadHistory = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/v1/meetings/${meetingId}/chat/history?limit=50`
        );
        const data = await response.json();
        if (data.success) {
          setMessages(data.data.messages);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();

    // Join meeting chat
    newSocket.emit('join-meeting', {
      meetingId,
      email: userEmail,
      name: userName,
    });

    // Socket event handlers
    newSocket.on('message-received', (messageData) => {
      setMessages((prev) => [...prev, messageData]);
      scrollToBottom();
    });

    newSocket.on('message-edited', (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? { ...msg, message: data.newMessage, editedAt: data.editedAt }
            : msg
        )
      );
    });

    newSocket.on('message-deleted', (data) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== data.messageId));
    });

    newSocket.on('user-typing', (data) => {
      setTypingUsers((prev) => new Set([...prev, data.name]));
    });

    newSocket.on('user-stopped-typing', (data) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        // You might need to track email->name mapping
        next.delete(data.name);
        return next;
      });
    });

    newSocket.on('user-joined', (data) => {
      console.log(`${data.name} joined the chat`);
    });

    newSocket.on('user-left', (data) => {
      console.log(`${data.name} left the chat`);
    });

    newSocket.on('error', (error) => {
      console.error('Chat error:', error);
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      newSocket.emit('leave-meeting', { meetingId });
      newSocket.disconnect();
    };
  }, [meetingId, userEmail, userName]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket) return;

    socket.emit('send-message', {
      meetingId,
      message: inputMessage,
      email: userEmail,
      name: userName,
    });

    setInputMessage('');
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    // Send typing indicator
    if (socket) {
      socket.emit('typing', {
        meetingId,
        email: userEmail,
        name: userName,
      });

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Auto-stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop-typing', {
          meetingId,
          email: userEmail,
        });
      }, 3000);
    }
  };

  const handleEditMessage = async (messageId, newMessage) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/meetings/${meetingId}/chat/messages/${messageId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: newMessage,
            email: userEmail,
          }),
        }
      );

      if (response.ok) {
        // Message will be updated via socket event
      }
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/meetings/${meetingId}/chat/messages/${messageId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userEmail,
          }),
        }
      );

      if (response.status === 204) {
        // Message will be removed via socket event
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  if (loading) {
    return <div>Loading chat...</div>;
  }

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.senderEmail === userEmail ? 'own-message' : ''}`}
          >
            <div className="message-header">
              <strong>{msg.senderName}</strong>
              <span className="timestamp">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
              {msg.editedAt && <span className="edited">(edited)</span>}
            </div>
            <div className="message-content">{msg.message}</div>
            {msg.senderEmail === userEmail && !msg.isDeleted && (
              <div className="message-actions">
                <button onClick={() => handleEditMessage(msg.id, prompt('Edit message:', msg.message))}>
                  Edit
                </button>
                <button onClick={() => handleDeleteMessage(msg.id)}>Delete</button>
              </div>
            )}
          </div>
        ))}
        {typingUsers.size > 0 && (
          <div className="typing-indicator">
            {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="chat-input">
        <input
          type="text"
          value={inputMessage}
          onChange={handleInputChange}
          placeholder="Type a message..."
          maxLength={1000}
        />
        <button type="submit" disabled={!inputMessage.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

export default MeetingChat;
```

## 10. Error Handling

```javascript
// Handle connection errors
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  // Show error message to user
  // Retry connection logic
});

// Handle chat errors
socket.on('error', (error) => {
  console.error('Chat error:', error);
  // error: { message: string, code: string }
  
  switch (error.code) {
    case 'MEETING_NOT_FOUND':
      // Show: "Meeting not found"
      break;
    case 'MEETING_UNAVAILABLE':
      // Show: "Meeting is not available"
      break;
    case 'INVALID_DATA':
      // Show: "Invalid data"
      break;
    default:
      // Show generic error
      break;
  }
});
```

## 11. Environment Configuration

Create a config file for your frontend:

```javascript
// config.js
const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  socketUrl: process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000',
};

export default config;
```

## 12. Best Practices

1. **Reconnection**: Socket.io handles reconnection automatically, but you can add custom logic
2. **Message Queue**: Queue messages if socket is disconnected and send when reconnected
3. **Rate Limiting**: Don't send typing indicators too frequently (already handled with timeout)
4. **Message Validation**: Validate message length (max 1000 characters) before sending
5. **Scroll Management**: Auto-scroll to bottom on new messages
6. **Performance**: Virtualize message list for large chat histories
7. **Security**: Sanitize user input before displaying messages

## 13. Testing

Test the integration:

1. **Connection Test**: Verify socket connects successfully
2. **Join Test**: Verify user can join meeting chat
3. **Send Test**: Verify messages are sent and received
4. **History Test**: Verify chat history loads correctly
5. **Typing Test**: Verify typing indicators work
6. **Edit/Delete Test**: Verify message editing and deletion
7. **Multi-user Test**: Test with multiple users in same meeting

## Summary

The frontend needs to:

1. ✅ Install `socket.io-client`
2. ✅ Connect to Socket.io server
3. ✅ Join meeting chat room when user joins meeting
4. ✅ Send/receive messages via WebSocket
5. ✅ Load chat history via REST API
6. ✅ Handle typing indicators
7. ✅ Handle message editing/deletion
8. ✅ Leave chat room when user leaves meeting
9. ✅ Handle errors and reconnections
10. ✅ Display messages in UI

All WebSocket events and REST API endpoints are documented above. The chat system is fully functional and ready for frontend integration!

