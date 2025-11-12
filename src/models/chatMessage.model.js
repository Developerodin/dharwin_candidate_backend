import mongoose from 'mongoose';
import toJSON from './plugins/toJSON.plugin.js';
import paginate from './plugins/paginate.plugin.js';

const chatMessageSchema = new mongoose.Schema(
  {
    meetingId: {
      type: String,
      required: true,
      index: true,
      ref: 'Meeting',
    },
    senderEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    messageType: {
      type: String,
      enum: ['text', 'system', 'file'],
      default: 'text',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    editedAt: {
      type: Date,
    },
    deletedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient chat history queries
chatMessageSchema.index({ meetingId: 1, timestamp: -1 });
chatMessageSchema.index({ meetingId: 1, isDeleted: 1 });

// Method to mark message as edited
chatMessageSchema.methods.markAsEdited = function () {
  this.editedAt = new Date();
  return this.save();
};

// Method to soft delete message
chatMessageSchema.methods.softDelete = function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

chatMessageSchema.plugin(toJSON);
chatMessageSchema.plugin(paginate);

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;

