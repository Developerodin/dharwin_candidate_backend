import mongoose from 'mongoose';
import toJSON from './plugins/toJSON.plugin.js';
import paginate from './plugins/paginate.plugin.js';

const leaveRequestSchema = mongoose.Schema(
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
    dates: {
      type: [Date],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'At least one date is required',
      },
    },
    leaveType: {
      type: String,
      enum: ['casual', 'sick', 'unpaid'],
      required: true,
      index: true,
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
leaveRequestSchema.index({ candidate: 1, status: 1 });
leaveRequestSchema.index({ candidate: 1, createdAt: -1 });
leaveRequestSchema.index({ status: 1, createdAt: -1 });
leaveRequestSchema.index({ candidateEmail: 1, status: 1 });

// add plugin that converts mongoose to json
leaveRequestSchema.plugin(toJSON);
leaveRequestSchema.plugin(paginate);

/**
 * @typedef LeaveRequest
 */
const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);

export default LeaveRequest;
