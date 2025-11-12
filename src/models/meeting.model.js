import mongoose from 'mongoose';
import toJSON from './plugins/toJSON.plugin.js';
import paginate from './plugins/paginate.plugin.js';

const participantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    joinedAt: { type: Date },
    leftAt: { type: Date },
    role: { type: String, enum: ['host', 'participant'], default: 'participant' },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const meetingSchema = new mongoose.Schema(
  {
    // Meeting identification
    meetingId: { type: String, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    
    // Meeting creator
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Meeting timing
    scheduledAt: { type: Date },
    duration: { type: Number, default: 60 }, // Duration in minutes
    isRecurring: { type: Boolean, default: false },
    
    // Meeting settings
    maxParticipants: { type: Number, default: 50 },
    allowGuestJoin: { type: Boolean, default: true },
    requireApproval: { type: Boolean, default: false },
    
    // Agora configuration
    channelName: { type: String, unique: true },
    appId: { type: String },
    
    // Meeting status
    status: { 
      type: String, 
      enum: ['scheduled', 'active', 'ended', 'cancelled'], 
      default: 'scheduled' 
    },
    
    // Participants
    participants: { type: [participantSchema], default: [] },
    hostParticipants: { type: [participantSchema], default: [] },
    
    // Meeting metadata
    meetingUrl: { type: String, unique: true },
    joinToken: { type: String, unique: true },
    
    // Meeting statistics
    totalJoined: { type: Number, default: 0 },
    currentParticipants: { type: Number, default: 0 },
    
    // Meeting timing tracking
    startedAt: { type: Date },
    expiresAt: { type: Date },
    endedAt: { type: Date },
    endedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // Meeting notes/outcomes
    notes: { type: String, trim: true },
    outcome: { 
      type: String, 
      enum: ['successful', 'unsuccessful', 'rescheduled', 'cancelled']
    },
    
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
      outputPath: { type: String }, // Local file path before S3 upload
      format: { type: String, enum: ['mp4', 'webm', 'm3u8'], default: 'mp4' },
      resolution: { type: String, default: '1280x720' },
      fps: { type: Number, default: 30 },
      bitrate: { type: Number, default: 2000 }, // kbps
      error: { type: String }, // Error message if recording failed
      recordingId: { type: String }, // Unique recording session ID
      rtmpStreamId: { type: String }, // Agora RTMP stream ID
      rtmpUrl: { type: String }, // RTMP stream URL
    },
    
    // Transcription configuration
    transcription: {
      enabled: { type: Boolean, default: false },
      autoTranscribe: { type: Boolean, default: true }, // Auto-transcribe after recording upload
      status: { 
        type: String, 
        enum: ['idle', 'processing', 'completed', 'failed'], 
        default: 'idle' 
      },
      startedAt: { type: Date },
      completedAt: { type: Date },
      jobId: { type: String }, // Transcription service job ID
      fileUrl: { type: String }, // S3 URL for transcript file
      fileKey: { type: String }, // S3 key for transcript file
      fileSize: { type: Number }, // File size in bytes
      language: { type: String, default: 'en' }, // Language code
      error: { type: String }, // Error message if transcription failed
      rawTranscript: { type: mongoose.Schema.Types.Mixed }, // Raw transcript data with timestamps
      formattedTranscript: { type: String }, // Formatted transcript text
      speakers: { type: [String], default: [] }, // List of speaker labels (e.g., ['spk_0', 'spk_1'])
      participantMapping: { type: Map, of: String }, // Map speaker labels to participant names/emails
      lastEditedAt: { type: Date }, // Last time transcript was edited
      lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // User who last edited
    },
  },
  { timestamps: true }
);

// Indexes for better performance
meetingSchema.index({ meetingId: 1 });
meetingSchema.index({ channelName: 1 });
meetingSchema.index({ joinToken: 1 });
meetingSchema.index({ createdBy: 1 });
meetingSchema.index({ status: 1 });
meetingSchema.index({ scheduledAt: 1 });
meetingSchema.index({ expiresAt: 1 });
meetingSchema.index({ 'recording.recordingId': 1 });
meetingSchema.index({ 'recording.status': 1 });
meetingSchema.index({ 'transcription.jobId': 1 });
meetingSchema.index({ 'transcription.status': 1 });

// Virtual for meeting duration in seconds
meetingSchema.virtual('durationInSeconds').get(function() {
  return this.duration * 60;
});

// Method to check if meeting is active
meetingSchema.methods.isActive = function() {
  return this.status === 'active';
};

// Method to check if meeting can be joined
meetingSchema.methods.canJoin = function() {
  const now = new Date();
  if (this.expiresAt && this.expiresAt <= now) {
    return false;
  }
  return (
    this.status === 'scheduled' || 
    this.status === 'active'
  ) && (
    !this.scheduledAt || 
    this.scheduledAt <= now
  );
};

// Method to check if meeting has expired
meetingSchema.methods.isExpired = function() {
  const now = new Date();
  return this.expiresAt && this.expiresAt <= now && this.status !== 'ended' && this.status !== 'cancelled';
};

// Method to calculate and set expiry time based on duration
meetingSchema.methods.calculateExpiryTime = function() {
  const baseTime = this.startedAt || this.scheduledAt || new Date();
  const durationMs = this.duration * 60 * 1000;
  this.expiresAt = new Date(baseTime.getTime() + durationMs);
  return this.expiresAt;
};

// Method to automatically end meeting if expired
meetingSchema.methods.autoEndIfExpired = function() {
  if (this.isExpired() && this.status === 'active') {
    this.status = 'ended';
    this.endedAt = new Date();
    this.participants.forEach(participant => {
      if (participant.isActive) {
        participant.isActive = false;
        participant.leftAt = new Date();
      }
    });
    this.currentParticipants = 0;
    return true;
  }
  return false;
};

// Method to add participant
meetingSchema.methods.addParticipant = function(name, email, role = 'participant') {
  const existingParticipant = this.participants.find(p => p.email === email);
  
  if (existingParticipant) {
    // Update existing participant
    existingParticipant.name = name;
    existingParticipant.joinedAt = new Date();
    existingParticipant.isActive = true;
    existingParticipant.role = role;
  } else {
    // Add new participant
    this.participants.push({
      name,
      email,
      joinedAt: new Date(),
      role,
      isActive: true
    });
  }
  
  this.currentParticipants = this.participants.filter(p => p.isActive).length;
  this.totalJoined = this.participants.length;
  
  return this.participants[this.participants.length - 1];
};

// Method to remove participant
meetingSchema.methods.removeParticipant = function(email) {
  const participant = this.participants.find(p => p.email === email);
  if (participant) {
    participant.isActive = false;
    participant.leftAt = new Date();
    this.currentParticipants = this.participants.filter(p => p.isActive).length;
  }
  return participant;
};

// Pre-save middleware to generate unique meeting ID and tokens
meetingSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Generate unique meeting ID
    const crypto = await import('crypto');
    this.meetingId = `meeting_${crypto.randomBytes(8).toString('hex')}`;
    
    // Generate unique join token
    this.joinToken = crypto.randomBytes(16).toString('hex');
    
    // Generate meeting URL
    // const baseUrl = process.env.FRONTEND_URL || 'https://main.d17v4yz0vw03r0.amplifyapp.com';
    const baseUrl = 'http://localhost:3001';
    this.meetingUrl = `${baseUrl}/meeting/${this.meetingId}?token=${this.joinToken}`;
    
    // Generate unique channel name
    this.channelName = `meeting_${this.meetingId}_${Date.now()}`;
    
    // Set Agora App ID from environment
    this.appId = process.env.AGORA_APP_ID;
    
    // Pre-calculate expiry if scheduled
    if (this.scheduledAt && this.duration) {
      this.calculateExpiryTime();
    }
  }
  next();
});

meetingSchema.plugin(toJSON);
meetingSchema.plugin(paginate);

const Meeting = mongoose.model('Meeting', meetingSchema);

export default Meeting;
