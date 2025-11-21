import mongoose from 'mongoose';
import toJSON from './plugins/toJSON.plugin.js';
import paginate from './plugins/paginate.plugin.js';
import { roles } from '../config/roles.js';

const loginLogSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      enum: roles,
    },
    loginTime: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    logoutTime: {
      type: Date,
      default: null,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
loginLogSchema.index({ user: 1, loginTime: -1 });
loginLogSchema.index({ email: 1, loginTime: -1 });
loginLogSchema.index({ role: 1, loginTime: -1 });

// add plugin that converts mongoose to json
loginLogSchema.plugin(toJSON);
loginLogSchema.plugin(paginate);

/**
 * @typedef LoginLog
 */
const LoginLog = mongoose.model('LoginLog', loginLogSchema);

export default LoginLog;

