# Server-Side Meeting Recording Plan

## Overview
This document outlines the plan for implementing server-side meeting recording using **RTMP + FFmpeg** approach (without Agora Cloud Recording). The recording will be handled by:
1. Starting an Agora RTMP stream from the meeting channel
2. Using FFmpeg to record the RTMP stream
3. Uploading the recorded file to S3

**Why RTMP + FFmpeg?** See `RECORDING_COMPARISON.md` for detailed comparison. In short: easier deployment, pure Node.js, more flexible, and Agora natively supports RTMP streaming.

## Architecture

### Components

1. **Recording Service** (`src/services/recording.service.js`)
   - Manages recording lifecycle (start/stop)
   - Coordinates with meeting service
   - Handles recording metadata

2. **Recording Worker** (`src/workers/recording.worker.js`)
   - Starts Agora RTMP stream from meeting channel
   - Uses FFmpeg to record the RTMP stream
   - Handles actual recording process
   - Uploads recordings to S3

3. **Meeting Model Updates**
   - Add recording fields to track recording state
   - Store recording file metadata

4. **API Endpoints**
   - Start recording
   - Stop recording
   - Get recording status
   - Download/stream recording

## Implementation Details

### 1. Meeting Model Updates

Add the following fields to `meeting.model.js`:

```javascript
// Recording configuration
recording: {
  enabled: { type: Boolean, default: false },
  autoStart: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['idle', 'starting', 'recording', 'stopping', 'completed', 'failed'], 
    default: 'idle' 
  },
  startedAt: { type: Date },
  stoppedAt: { type: Date },
  duration: { type: Number }, // Duration in seconds
  fileUrl: { type: String }, // S3 URL or path
  fileKey: { type: String }, // S3 key
  fileSize: { type: Number }, // File size in bytes
  format: { type: String, enum: ['mp4', 'webm', 'm3u8'], default: 'mp4' },
  resolution: { type: String, default: '1280x720' },
  fps: { type: Number, default: 30 },
  bitrate: { type: Number, default: 2000 }, // kbps
  error: { type: String }, // Error message if recording failed
  recordingId: { type: String }, // Unique recording session ID
}
```

### 2. Recording Service

**Responsibilities:**
- Validate recording permissions (only host/creator can start/stop)
- Generate recording tokens
- Coordinate with recording worker
- Update meeting model with recording status
- Handle recording lifecycle events

**Key Functions:**
- `startRecording(meetingId, userId, options)` - Start recording
- `stopRecording(meetingId, userId)` - Stop recording
- `getRecordingStatus(meetingId)` - Get current recording status
- `getRecordingUrl(meetingId)` - Get recording file URL

### 3. Recording Worker

**Technology Stack:**
- Agora RTMP Streaming API (REST API)
- FFmpeg via `fluent-ffmpeg` npm package
- Node Media Server or nginx-rtmp (for RTMP server)
- Child process for FFmpeg isolation

**Process Flow:**
1. Receive recording start request
2. Generate Agora RTMP stream URL (local RTMP server or direct FFmpeg)
3. Start Agora RTMP stream using REST API (`startRtmpStreamWithoutTranscoding`)
4. Start FFmpeg process to record from RTMP stream
5. Monitor recording process
6. On stop: Stop Agora RTMP stream, finalize FFmpeg recording
7. Upload recording file to S3
8. Update meeting model with file location

**Recording Configuration:**
- Audio: Enabled (all participants)
- Video: Enabled (all participants)
- Format: MP4 (H.264 + AAC)
- Resolution: 1280x720 (configurable)
- FPS: 30 (configurable)
- Bitrate: 2000 kbps (configurable)

### 4. API Endpoints

**POST** `/api/v1/meetings/:meetingId/recording/start`
- Start recording for a meeting
- Requires: Meeting creator or host
- Body: `{ format?: 'mp4' | 'webm', resolution?: string, fps?: number }`
- Response: Recording status

**POST** `/api/v1/meetings/:meetingId/recording/stop`
- Stop recording for a meeting
- Requires: Meeting creator or host
- Response: Recording status with file URL

**GET** `/api/v1/meetings/:meetingId/recording/status`
- Get current recording status
- Response: Recording metadata

**GET** `/api/v1/meetings/:meetingId/recording/download`
- Get presigned URL for recording download
- Requires: Meeting creator or host
- Response: Presigned S3 URL

### 5. Dependencies

**New Packages Required:**
```json
{
  "fluent-ffmpeg": "^2.1.2", // FFmpeg wrapper for Node.js
  "node-media-server": "^2.4.9", // RTMP server (optional, can use nginx-rtmp)
  "axios": "^1.6.0", // For Agora REST API calls
  "fs-extra": "^11.0.0" // For file operations
}
```

**System Requirements:**
- FFmpeg installed on server (via package manager or binary)
- RTMP server (Node Media Server or nginx-rtmp) - can run locally or use direct FFmpeg pipe

### 6. Environment Variables

Add to `.env`:
```bash
# Recording Configuration
RECORDING_STORAGE_PATH=/tmp/recordings  # Local storage before S3 upload
RECORDING_MAX_DURATION=7200  # Max recording duration in seconds (2 hours)
RECORDING_DEFAULT_FORMAT=mp4
RECORDING_DEFAULT_RESOLUTION=1280x720
RECORDING_DEFAULT_FPS=30
RECORDING_DEFAULT_BITRATE=2000
RTMP_SERVER_URL=rtmp://localhost:1935/live  # Local RTMP server URL
AGORA_REST_API_BASE_URL=https://api.agora.io  # Agora REST API base URL
```

### 7. Recording Worker Process

**Option A: Child Process (Recommended)**
- Spawn FFmpeg as child process for each recording
- Communicate via process events
- Pros: Isolation, easier to manage, standard Node.js approach
- Cons: Minimal overhead

**Option B: Worker Threads**
- Use Node.js worker threads for FFmpeg
- Pros: Lower overhead
- Cons: FFmpeg works better as separate process

**Option C: Docker Container**
- Run FFmpeg in separate Docker container
- Pros: Complete isolation
- Cons: Infrastructure complexity (not necessary for FFmpeg)

**Recommended: Option A (Child Process)** - FFmpeg is designed to run as separate process

### 8. File Storage Flow

1. Recording starts → Local file created in `/tmp/recordings`
2. Recording in progress → File grows locally
3. Recording stops → File finalized
4. Upload to S3 → Async upload process
5. Update meeting model → Store S3 key and URL
6. Cleanup → Delete local file after successful upload

### 9. Error Handling

**Scenarios to Handle:**
- Recording worker crashes → Detect and mark as failed
- Network issues during upload → Retry mechanism
- Disk space full → Alert and stop recording
- Meeting ends while recording → Auto-stop recording
- Recording timeout → Auto-stop after max duration

### 10. Security Considerations

- Only meeting creator/host can start/stop recording
- Recording tokens should have limited expiration
- S3 presigned URLs should expire after reasonable time
- Recordings should be stored in private S3 bucket
- Access control for recording downloads

### 11. Performance Considerations

- Limit concurrent recordings per server
- Monitor disk space for local storage
- Use async uploads to S3
- Consider recording quality vs file size trade-offs
- Implement recording queue if needed

### 12. Monitoring & Logging

- Log all recording start/stop events
- Track recording duration and file sizes
- Monitor recording worker health
- Alert on recording failures
- Track storage usage

## Implementation Phases

### Phase 1: Foundation
1. Update meeting model with recording fields
2. Create recording service skeleton
3. Add API endpoints (basic structure)
4. Set up environment variables

### Phase 2: Recording Worker
1. Set up Agora RTMP streaming API integration
2. Set up FFmpeg recording process
3. Implement RTMP server (or direct FFmpeg pipe)
4. Implement recording start/stop logic
5. Handle local file storage
6. Implement error handling

### Phase 3: S3 Integration
1. Implement S3 upload after recording
2. Generate presigned URLs
3. Cleanup local files
4. Update meeting model with file metadata

### Phase 4: API Integration
1. Connect API endpoints to recording service
2. Add authorization checks
3. Implement status endpoints
4. Add download endpoints

### Phase 5: Testing & Optimization
1. Test recording with multiple participants
2. Test error scenarios
3. Optimize file sizes and quality
4. Performance testing

## Alternative Approaches

### Option 1: Agora Cloud Recording (Not Used)
- Pros: Managed service, no infrastructure
- Cons: Additional cost, less control

### Option 2: Client-Side Recording
- Pros: No server resources
- Cons: Unreliable, quality issues, privacy concerns

### Option 3: Hybrid Approach
- Use Agora Cloud Recording for critical meetings
- Use server-side for others
- Pros: Flexibility
- Cons: Complexity

## Next Steps

1. Review and approve this plan
2. Set up development environment with Agora Recording SDK
3. Begin Phase 1 implementation
4. Test with single participant
5. Scale to multiple participants
6. Deploy and monitor

## Questions to Resolve

1. **RTMP Server**: Use Node Media Server, nginx-rtmp, or direct FFmpeg pipe?
2. **FFmpeg Installation**: How to install FFmpeg on deployment server?
3. **Storage**: S3 bucket configured and accessible?
4. **Permissions**: Who can start/stop recordings? (Host only? All participants?)
5. **Retention**: How long should recordings be stored?
6. **Quality**: Default recording quality settings?
7. **Concurrent Recordings**: Maximum concurrent recordings per server?
8. **Agora REST API**: Do we have Agora REST API credentials for RTMP streaming?

