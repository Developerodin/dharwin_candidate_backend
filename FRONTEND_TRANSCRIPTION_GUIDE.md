# Frontend Transcription Implementation Guide

This guide explains what the frontend needs to implement for the transcription feature.

## Overview

The transcription feature automatically transcribes meeting recordings and formats them as conversations between participants. The frontend needs to:

1. Display transcription status
2. Show transcript content in an editable viewer
3. Allow editing of transcripts
4. Export transcripts in different formats

## API Endpoints

All endpoints require authentication (Bearer token).

### Base URL
```
/api/v1/meetings/{meetingId}/transcription
```

### 1. Start Transcription

**Endpoint:** `POST /api/v1/meetings/:meetingId/transcription/start`

**Description:** Manually start transcription (usually automatic after recording upload)

**Request:**
```javascript
POST /api/v1/meetings/{meetingId}/transcription/start
Headers: {
  Authorization: 'Bearer {token}',
  Content-Type: 'application/json'
}
Body: {
  language: 'en' // Optional, defaults to 'en'
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "meetingId": "meeting_abc123",
    "transcription": {
      "status": "processing",
      "startedAt": "2024-01-15T10:30:00Z"
    },
    "message": "Transcription started. It will be processed in the background."
  }
}
```

**Frontend Implementation:**
```javascript
const startTranscription = async (meetingId, language = 'en') => {
  try {
    const response = await fetch(
      `/api/v1/meetings/${meetingId}/transcription/start`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language }),
      }
    );
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to start transcription:', error);
    throw error;
  }
};
```

---

### 2. Get Transcription Status

**Endpoint:** `GET /api/v1/meetings/:meetingId/transcription/status`

**Description:** Check the current transcription status

**Request:**
```javascript
GET /api/v1/meetings/{meetingId}/transcription/status
Headers: {
  Authorization: 'Bearer {token}'
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "meetingId": "meeting_abc123",
    "transcription": {
      "status": "processing", // idle, processing, completed, failed
      "startedAt": "2024-01-15T10:30:00Z",
      "completedAt": null,
      "error": null,
      "speakers": 2
    }
  }
}
```

**Frontend Implementation:**
```javascript
const getTranscriptionStatus = async (meetingId) => {
  try {
    const response = await fetch(
      `/api/v1/meetings/${meetingId}/transcription/status`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    const data = await response.json();
    return data.data.transcription;
  } catch (error) {
    console.error('Failed to get transcription status:', error);
    throw error;
  }
};
```

---

### 3. Get Transcript Content

**Endpoint:** `GET /api/v1/meetings/:meetingId/transcription`

**Description:** Get the formatted transcript content

**Request:**
```javascript
GET /api/v1/meetings/{meetingId}/transcription
Headers: {
  Authorization: 'Bearer {token}'
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "meetingId": "meeting_abc123",
    "transcript": "================================================================================\nMEETING TRANSCRIPT\n================================================================================\n\nMeeting ID: meeting_abc123\nTitle: Project Planning Discussion\nDate: 1/15/2024, 10:30:00 AM\nDuration: 15 minutes 30 seconds\nParticipants: 2\n\n================================================================================\n\nParticipant 1: Good morning, everyone. Let's start the meeting.\n\nParticipant 2: Morning. I'm ready to begin.\n\nParticipant 1: Great. So, let's discuss the project timeline first.\n\n...",
    "rawTranscript": { /* Raw data with timestamps */ },
    "speakers": ["spk_0", "spk_1"],
    "participantMapping": {
      "spk_0": "Participant 1",
      "spk_1": "Participant 2"
    },
    "fileUrl": "https://bucket.s3.amazonaws.com/transcripts/..."
  }
}
```

**Frontend Implementation:**
```javascript
const getTranscript = async (meetingId) => {
  try {
    const response = await fetch(
      `/api/v1/meetings/${meetingId}/transcription`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to get transcript:', error);
    throw error;
  }
};
```

---

### 4. Update Transcript (Edit)

**Endpoint:** `PATCH /api/v1/meetings/:meetingId/transcription`

**Description:** Edit/update the transcript content

**Request:**
```javascript
PATCH /api/v1/meetings/{meetingId}/transcription
Headers: {
  Authorization: 'Bearer {token}',
  Content-Type: 'application/json'
}
Body: {
  transcript: "Updated transcript text..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "meetingId": "meeting_abc123",
    "message": "Transcript updated successfully",
    "transcript": "Updated transcript text..."
  }
}
```

**Frontend Implementation:**
```javascript
const updateTranscript = async (meetingId, transcript) => {
  try {
    const response = await fetch(
      `/api/v1/meetings/${meetingId}/transcription`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      }
    );
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to update transcript:', error);
    throw error;
  }
};
```

---

### 5. Download Transcript

**Endpoint:** `GET /api/v1/meetings/:meetingId/transcription/download?format=txt`

**Description:** Get presigned download URL for transcript

**Request:**
```javascript
GET /api/v1/meetings/{meetingId}/transcription/download?format=txt
Headers: {
  Authorization: 'Bearer {token}'
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "meetingId": "meeting_abc123",
    "downloadUrl": "https://s3.amazonaws.com/...?presigned-params",
    "expiresIn": 3600,
    "format": "txt",
    "fileSize": 12345
  }
}
```

**Frontend Implementation:**
```javascript
const downloadTranscript = async (meetingId, format = 'txt') => {
  try {
    const response = await fetch(
      `/api/v1/meetings/${meetingId}/transcription/download?format=${format}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    const data = await response.json();
    
    // Open download URL in new window or trigger download
    window.open(data.data.downloadUrl, '_blank');
    
    // Or trigger download programmatically
    // const link = document.createElement('a');
    // link.href = data.data.downloadUrl;
    // link.download = `transcript_${meetingId}.${format}`;
    // link.click();
    
    return data;
  } catch (error) {
    console.error('Failed to download transcript:', error);
    throw error;
  }
};
```

---

## UI Components Needed

### 1. Transcription Status Badge/Indicator

Display the current transcription status:

```jsx
// React Example
const TranscriptionStatus = ({ status, error }) => {
  const statusConfig = {
    idle: { label: 'Not Started', color: 'gray' },
    processing: { label: 'Processing...', color: 'blue' },
    completed: { label: 'Completed', color: 'green' },
    failed: { label: 'Failed', color: 'red' },
  };
  
  const config = statusConfig[status] || statusConfig.idle;
  
  return (
    <div className={`status-badge status-${config.color}`}>
      <span>{config.label}</span>
      {status === 'processing' && <Spinner />}
      {status === 'failed' && error && (
        <span className="error-message">{error}</span>
      )}
    </div>
  );
};
```

### 2. Transcript Viewer Component

Display and edit the transcript:

```jsx
// React Example
const TranscriptViewer = ({ meetingId, transcript, isEditable, onSave }) => {
  const [editedTranscript, setEditedTranscript] = useState(transcript);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateTranscript(meetingId, editedTranscript);
      setIsEditing(false);
      onSave && onSave(editedTranscript);
    } catch (error) {
      alert('Failed to save transcript');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="transcript-viewer">
      <div className="transcript-header">
        <h3>Meeting Transcript</h3>
        {isEditable && (
          <div className="actions">
            {isEditing ? (
              <>
                <button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => {
                  setEditedTranscript(transcript);
                  setIsEditing(false);
                }}>
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)}>
                Edit
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="transcript-content">
        {isEditing ? (
          <textarea
            value={editedTranscript}
            onChange={(e) => setEditedTranscript(e.target.value)}
            className="transcript-editor"
            rows={20}
          />
        ) : (
          <pre className="transcript-text">{transcript}</pre>
        )}
      </div>
    </div>
  );
};
```

### 3. Export Buttons

```jsx
// React Example
const TranscriptExport = ({ meetingId }) => {
  const handleExport = async (format) => {
    try {
      await downloadTranscript(meetingId, format);
    } catch (error) {
      alert(`Failed to export as ${format.toUpperCase()}`);
    }
  };
  
  return (
    <div className="export-buttons">
      <button onClick={() => handleExport('txt')}>
        Export as TXT
      </button>
      <button onClick={() => handleExport('docx')} disabled>
        Export as DOCX (Coming Soon)
      </button>
      <button onClick={() => handleExport('pdf')} disabled>
        Export as PDF (Coming Soon)
      </button>
    </div>
  );
};
```

### 4. Complete Transcript Page/Modal

```jsx
// React Example - Complete Component
const TranscriptPage = ({ meetingId }) => {
  const [status, setStatus] = useState(null);
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Poll for status updates
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const statusData = await getTranscriptionStatus(meetingId);
        setStatus(statusData);
        
        // If completed, fetch transcript
        if (statusData.status === 'completed') {
          const transcriptData = await getTranscript(meetingId);
          setTranscript(transcriptData);
        }
        
        // If processing, poll again after 5 seconds
        if (statusData.status === 'processing') {
          setTimeout(pollStatus, 5000);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    pollStatus();
  }, [meetingId]);
  
  if (loading) {
    return <div>Loading transcription status...</div>;
  }
  
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  return (
    <div className="transcript-page">
      <div className="transcript-header">
        <h2>Meeting Transcript</h2>
        <TranscriptionStatus 
          status={status?.status} 
          error={status?.error} 
        />
      </div>
      
      {status?.status === 'completed' && transcript && (
        <>
          <TranscriptViewer
            meetingId={meetingId}
            transcript={transcript.transcript}
            isEditable={true}
            onSave={(updated) => setTranscript({ ...transcript, transcript: updated })}
          />
          <TranscriptExport meetingId={meetingId} />
        </>
      )}
      
      {status?.status === 'processing' && (
        <div className="processing-message">
          <Spinner />
          <p>Transcription is being processed. This may take a few minutes...</p>
        </div>
      )}
      
      {status?.status === 'failed' && (
        <div className="error-message">
          <p>Transcription failed: {status.error}</p>
          <button onClick={() => startTranscription(meetingId)}>
            Retry Transcription
          </button>
        </div>
      )}
      
      {status?.status === 'idle' && (
        <div className="idle-message">
          <p>Transcription has not been started yet.</p>
          <button onClick={() => startTranscription(meetingId)}>
            Start Transcription
          </button>
        </div>
      )}
    </div>
  );
};
```

---

## Integration Flow

### Automatic Transcription Flow

1. **Recording Upload** → Backend automatically starts transcription
2. **Frontend Polls Status** → Check transcription status every 5-10 seconds
3. **Status Changes to "completed"** → Fetch and display transcript
4. **User Can Edit** → Save changes via PATCH endpoint
5. **User Can Export** → Download transcript file

### Manual Transcription Flow

1. **User Clicks "Start Transcription"** → Call POST `/transcription/start`
2. **Show Processing Status** → Poll status endpoint
3. **Display Transcript** → When status is "completed"
4. **Allow Editing & Export** → Same as automatic flow

---

## Styling Recommendations

### Transcript Display

```css
.transcript-viewer {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.transcript-text {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #333;
}

.transcript-editor {
  width: 100%;
  min-height: 400px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
}

.status-gray { background: #f0f0f0; color: #666; }
.status-blue { background: #e3f2fd; color: #1976d2; }
.status-green { background: #e8f5e9; color: #388e3c; }
.status-red { background: #ffebee; color: #d32f2f; }
```

---

## Error Handling

Handle these error scenarios:

1. **Transcription Failed**
   - Show error message
   - Provide "Retry" button
   - Log error for debugging

2. **Network Errors**
   - Retry with exponential backoff
   - Show user-friendly error message

3. **Permission Errors (403)**
   - Show message: "Only meeting creator can perform this action"
   - Hide edit/export buttons for non-creators

4. **Not Found (404)**
   - Show message: "Meeting or transcript not found"

---

## Example: Complete Integration

```javascript
// transcriptService.js
class TranscriptService {
  constructor(apiBaseUrl, token) {
    this.apiBaseUrl = apiBaseUrl;
    this.token = token;
  }
  
  async startTranscription(meetingId, language = 'en') {
    const response = await fetch(
      `${this.apiBaseUrl}/meetings/${meetingId}/transcription/start`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to start transcription: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async getStatus(meetingId) {
    const response = await fetch(
      `${this.apiBaseUrl}/meetings/${meetingId}/transcription/status`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async getTranscript(meetingId) {
    const response = await fetch(
      `${this.apiBaseUrl}/meetings/${meetingId}/transcription`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get transcript: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async updateTranscript(meetingId, transcript) {
    const response = await fetch(
      `${this.apiBaseUrl}/meetings/${meetingId}/transcription`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to update transcript: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async downloadTranscript(meetingId, format = 'txt') {
    const response = await fetch(
      `${this.apiBaseUrl}/meetings/${meetingId}/transcription/download?format=${format}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get download URL: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data.downloadUrl;
  }
}

export default TranscriptService;
```

---

## Summary

**What Frontend Needs to Implement:**

1. ✅ **API Integration** - Call transcription endpoints
2. ✅ **Status Polling** - Check transcription status periodically
3. ✅ **Transcript Display** - Show formatted transcript text
4. ✅ **Editable Viewer** - Allow users to edit transcript
5. ✅ **Export Functionality** - Download transcript files
6. ✅ **Error Handling** - Handle all error scenarios
7. ✅ **UI Components** - Status badges, viewer, export buttons

**Key Points:**
- Transcription starts automatically after recording upload
- Poll status every 5-10 seconds while processing
- Transcript format: "Participant 1: ...", "Participant 2: ..."
- Only meeting creator can edit/export
- Currently only TXT export is available (DOCX/PDF coming soon)

