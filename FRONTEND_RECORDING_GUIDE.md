# Frontend Recording Implementation Guide

## Overview

The backend supports **both audio and video recording**. The frontend controls what gets recorded.

**Important**: This guide shows how to record the **entire browser screen/tab** (screen capture), not just the local camera stream. This captures everything visible on the meeting page - all participants, UI elements, chat, etc.

## What Can Be Recorded

### ✅ Audio + Video (Default)
- Records both audio and video streams
- Output: Video file (MP4, WebM, etc.)
- Recommended for most use cases

### ✅ Audio Only
- Records only audio streams
- Output: Audio file (MP3, M4A, etc.)
- Useful for voice-only meetings

### ✅ Video Only
- Records only video streams (no audio)
- Output: Video file (MP4, WebM, etc.)
- Rare use case

## Frontend Changes Required

### 1. Install Agora SDK

```bash
npm install agora-rtc-sdk-ng
# or
yarn add agora-rtc-sdk-ng
```

### 2. Start Recording Flow

#### Step 1: Call Backend API to Start Recording

```javascript
// Start recording on backend
const startRecording = async (meetingId, token) => {
  const response = await fetch(`/api/v1/meetings/${meetingId}/recording/start`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      format: 'mp4',           // Video format
      resolution: '1280x720',   // Video resolution
      fps: 30,                  // Frames per second
      bitrate: 2000,           // Bitrate in kbps
    }),
  });

  const { data } = await response.json();
  return data;
};
```

#### Step 2: Capture Screen and Start Recording

```javascript
// Start recording using Screen Capture API
const startClientRecording = async () => {
  try {
    // Request screen capture (browser tab/window/screen)
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: 'browser', // 'browser', 'window', or 'monitor'
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 },
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Get audio track from microphone (optional - for system audio + mic)
    let audioTrack = null;
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioTrack = micStream.getAudioTracks()[0];
    } catch (err) {
      console.warn('Microphone access denied, recording screen audio only');
    }

    // Combine screen video with microphone audio
    const combinedStream = new MediaStream();
    
    // Add screen video track
    screenStream.getVideoTracks().forEach(track => {
      combinedStream.addTrack(track);
    });

    // Add screen audio track (if available)
    screenStream.getAudioTracks().forEach(track => {
      combinedStream.addTrack(track);
    });

    // Add microphone audio track (if available)
    if (audioTrack) {
      combinedStream.addTrack(audioTrack);
    }

    // Create MediaRecorder
    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: 'video/webm;codecs=vp9', // Better quality
      videoBitsPerSecond: 5000000, // 5 Mbps for high quality
    });

    const chunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      // Stop all tracks
      screenStream.getTracks().forEach(track => track.stop());
      if (audioTrack) {
        audioTrack.stop();
      }

      // Create blob from chunks
      const blob = new Blob(chunks, { type: 'video/webm' });
      
      // Upload to backend
      await uploadRecording(meetingId, blob, token);
    };

    // Handle screen share stop (user clicks stop sharing)
    screenStream.getVideoTracks()[0].addEventListener('ended', () => {
      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
    });

    mediaRecorder.start(1000); // Collect data every 1 second
    
    return { mediaRecorder, screenStream, audioTrack };
  } catch (error) {
    console.error('Error starting screen recording:', error);
    throw error;
  }
};

// Start recording
const { mediaRecorder } = await startClientRecording();
```

### 3. Stop Recording Flow

#### Step 1: Stop Client Recording

```javascript
// Stop MediaRecorder
if (mediaRecorder && mediaRecorder.state !== 'inactive') {
  mediaRecorder.stop();
}

// Stop all tracks (they will be stopped automatically when MediaRecorder stops)
// But we can also stop them manually:
screenStream.getTracks().forEach(track => track.stop());
if (audioTrack) {
  audioTrack.stop();
}
```

#### Step 2: Call Backend API to Stop Recording

```javascript
const stopRecording = async (meetingId, token) => {
  const response = await fetch(`/api/v1/meetings/${meetingId}/recording/stop`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const { data } = await response.json();
  return data;
};

await stopRecording(meetingId, token);
```

### 4. Upload Recording File

```javascript
const uploadRecording = async (meetingId, recordingBlob, token) => {
  // Convert blob to file
  const file = new File([recordingBlob], 'recording.webm', {
    type: 'video/webm',
  });

  // Create FormData
  const formData = new FormData();
  formData.append('file', file);

  // Upload to backend
  const response = await fetch(`/api/v1/meetings/${meetingId}/recording/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Don't set Content-Type - browser will set it with boundary
    },
    body: formData,
  });

  const { data } = await response.json();
  return data;
};
```

## Recording Options

### Option 1: Record Entire Browser Tab (Recommended)
Records everything visible on the current browser tab - all participants, UI, chat, etc.

```javascript
const screenStream = await navigator.mediaDevices.getDisplayMedia({
  video: {
    displaySurface: 'browser', // Records the browser tab
  },
  audio: true, // Includes system audio from the tab
});
```

### Option 2: Record Entire Screen
Records the entire monitor/screen.

```javascript
const screenStream = await navigator.mediaDevices.getDisplayMedia({
  video: {
    displaySurface: 'monitor', // Records entire screen
  },
  audio: true,
});
```

### Option 3: Record Specific Window
Records a specific application window.

```javascript
const screenStream = await navigator.mediaDevices.getDisplayMedia({
  video: {
    displaySurface: 'window', // Records specific window
  },
  audio: true,
});
```

### Option 4: Audio-Only Recording
If you want to record **audio only**:

```javascript
// Get microphone audio
const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

// Create MediaRecorder with only audio
const mediaRecorder = new MediaRecorder(audioStream, {
  mimeType: 'audio/webm', // or 'audio/mp4', 'audio/mpeg'
});

// Upload as audio file
const file = new File([recordingBlob], 'recording.webm', {
  type: 'audio/webm',
});
```

## Important Notes

### Browser Permissions
- User must grant **screen sharing permission** when prompted
- User can stop sharing at any time (browser will show a stop button)
- Handle the `ended` event on video tracks to detect when user stops sharing

### Audio Sources
- **System Audio**: Captured when `audio: true` in `getDisplayMedia()` (browser/system audio)
- **Microphone Audio**: Captured separately using `getUserMedia({ audio: true })`
- **Combined**: You can combine both for complete audio recording

### Browser Compatibility
- **Chrome/Edge**: Full support for screen capture with audio
- **Firefox**: Supports screen capture, audio support varies
- **Safari**: Limited support, may require additional setup

### Quality Settings
```javascript
const screenStream = await navigator.mediaDevices.getDisplayMedia({
  video: {
    displaySurface: 'browser',
    width: { ideal: 1920, max: 3840 }, // 1080p or 4K
    height: { ideal: 1080, max: 2160 },
    frameRate: { ideal: 30, max: 60 }, // 30fps or 60fps
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: 48000, // High quality audio
  },
});
```

## Complete Example

```javascript
import AgoraRTC from 'agora-rtc-sdk-ng';

class MeetingRecorder {
  constructor(meetingId, token) {
    this.meetingId = meetingId;
    this.token = token;
    this.screenStream = null;
    this.micAudioTrack = null;
    this.mediaRecorder = null;
    this.recordingChunks = [];
  }

  async start() {
    // 1. Start recording on backend
    await this.startBackendRecording();

    // 2. Start screen recording
    await this.startClientRecording();
  }

  async startBackendRecording() {
    const response = await fetch(`/api/v1/meetings/${this.meetingId}/recording/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        format: 'mp4',
        resolution: '1280x720',
        fps: 30,
        bitrate: 2000,
      }),
    });

    const { data } = await response.json();
    return data;
  }

  async startClientRecording() {
    try {
      // Request screen capture (browser tab)
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser', // Records the browser tab
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Optionally add microphone audio
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.micAudioTrack = micStream.getAudioTracks()[0];
      } catch (err) {
        console.warn('Microphone access denied, recording screen audio only');
      }

      // Combine screen video with microphone audio
      const combinedStream = new MediaStream();
      
      // Add screen video track
      this.screenStream.getVideoTracks().forEach(track => {
        combinedStream.addTrack(track);
      });

      // Add screen audio track (if available)
      this.screenStream.getAudioTracks().forEach(track => {
        combinedStream.addTrack(track);
      });

      // Add microphone audio track (if available)
      if (this.micAudioTrack) {
        combinedStream.addTrack(this.micAudioTrack);
      }

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000, // 5 Mbps for high quality
      });

      this.recordingChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordingChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        // Stop all tracks
        this.screenStream.getTracks().forEach(track => track.stop());
        if (this.micAudioTrack) {
          this.micAudioTrack.stop();
        }

        const blob = new Blob(this.recordingChunks, { type: 'video/webm' });
        await this.uploadRecording(blob);
      };

      // Handle screen share stop (user clicks stop sharing)
      this.screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop();
        }
      });

      this.mediaRecorder.start(1000); // Collect data every 1 second
    } catch (error) {
      console.error('Error starting screen recording:', error);
      throw error;
    }
  }

  async stop() {
    // 1. Stop MediaRecorder
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    // 2. Stop all tracks (they will be stopped automatically, but we do it explicitly)
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
    }
    if (this.micAudioTrack) {
      this.micAudioTrack.stop();
    }

    // 3. Stop recording on backend
    await this.stopBackendRecording();
  }

  async stopBackendRecording() {
    const response = await fetch(`/api/v1/meetings/${this.meetingId}/recording/stop`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    const { data } = await response.json();
    return data;
  }

  async uploadRecording(blob) {
    const file = new File([blob], 'recording.webm', { type: 'video/webm' });
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`/api/v1/meetings/${this.meetingId}/recording/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    const { data } = await response.json();
    return data;
  }
}

// Usage
const recorder = new MeetingRecorder(meetingId, token);
await recorder.start();

// Later, when meeting ends
await recorder.stop();
```

## Backend Support

The backend accepts:
- ✅ **Video files**: MP4, WebM, MOV, AVI (with audio + video)
- ✅ **Audio files**: MP3, M4A, WAV, OGG (audio only)
- ✅ **Max file size**: 500MB

## File Format Support

### Video Formats (Audio + Video)
- `video/mp4` - MP4
- `video/webm` - WebM
- `video/quicktime` - MOV
- `video/x-msvideo` - AVI

### Audio Formats (Audio Only)
- `audio/mpeg` - MP3
- `audio/mp4` - M4A
- `audio/wav` - WAV
- `audio/ogg` - OGG
- `audio/webm` - WebM (audio)

## Summary

**The backend supports both audio and video recording.** The frontend controls what gets recorded:

- **Audio + Video**: Get both audio and video tracks → Record both → Upload video file
- **Audio Only**: Get only audio track → Record audio → Upload audio file
- **Video Only**: Get only video track → Record video → Upload video file

The backend will accept and store whatever file format you upload!

