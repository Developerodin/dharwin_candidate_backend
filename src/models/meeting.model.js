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
    
    // Meeting end tracking
    endedAt: { type: Date },
    endedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // Meeting notes/outcomes
    notes: { type: String, trim: true },
    outcome: { 
      type: String, 
      enum: ['successful', 'unsuccessful', 'rescheduled', 'cancelled']
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
  return (
    this.status === 'scheduled' || 
    this.status === 'active'
  ) && (
    !this.scheduledAt || 
    this.scheduledAt <= now
  );
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
    const baseUrl = process.env.FRONTEND_URL || 'https://main.d17v4yz0vw03r0.amplifyapp.com';
    // const baseUrl = 'http://localhost:3001';
    this.meetingUrl = `${baseUrl}/meeting/${this.meetingId}?token=${this.joinToken}`;
    
    // Generate unique channel name
    this.channelName = `meeting_${this.meetingId}_${Date.now()}`;
    
    // Set Agora App ID from environment
    this.appId = process.env.AGORA_APP_ID;
  }
  next();
});

meetingSchema.plugin(toJSON);
meetingSchema.plugin(paginate);

const Meeting = mongoose.model('Meeting', meetingSchema);

export default Meeting;
