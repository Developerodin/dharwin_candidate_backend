import mongoose from 'mongoose';
import toJSON from './plugins/toJSON.plugin.js';
import paginate from './plugins/paginate.plugin.js';

const attendanceEntrySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      index: true,
    },
    punchIn: {
      type: Date,
      required: true,
    },
    punchOut: {
      type: Date,
      default: null,
    },
    timezone: {
      type: String,
      trim: true,
      default: 'UTC',
    },
  },
  { _id: false }
);

const backdatedAttendanceRequestSchema = mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
      index: true,
    },
    candidateEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    attendanceEntries: {
      type: [attendanceEntrySchema],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'At least one attendance entry is required',
      },
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    adminComment: {
      type: String,
      trim: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
backdatedAttendanceRequestSchema.index({ candidate: 1, status: 1 });
backdatedAttendanceRequestSchema.index({ candidate: 1, createdAt: -1 });
backdatedAttendanceRequestSchema.index({ status: 1, createdAt: -1 });
backdatedAttendanceRequestSchema.index({ candidateEmail: 1, status: 1 });

// add plugin that converts mongoose to json
backdatedAttendanceRequestSchema.plugin(toJSON);
backdatedAttendanceRequestSchema.plugin(paginate);

/**
 * @typedef BackdatedAttendanceRequest
 */
const BackdatedAttendanceRequest = mongoose.model('BackdatedAttendanceRequest', backdatedAttendanceRequestSchema);

export default BackdatedAttendanceRequest;
