import mongoose from 'mongoose';
import toJSON from './plugins/toJSON.plugin.js';
import paginate from './plugins/paginate.plugin.js';

const shiftSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    timezone: {
      type: String,
      required: true,
      trim: true,
      index: true,
      // Common timezones: 'America/New_York', 'America/Los_Angeles', 'Asia/Kolkata', 'UTC', etc.
    },
    startTime: {
      type: String,
      required: true,
      trim: true,
      // Format: "HH:mm" in 24-hour format (e.g., "10:00", "09:30")
      validate: {
        validator: function (v) {
          // Validate HH:mm format (00:00 to 23:59)
          return /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Start time must be in HH:mm format (24-hour)',
      },
    },
    endTime: {
      type: String,
      required: true,
      trim: true,
      // Format: "HH:mm" in 24-hour format (e.g., "18:00", "17:30")
      validate: {
        validator: function (v) {
          // Validate HH:mm format (00:00 to 23:59)
          return /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'End time must be in HH:mm format (24-hour)',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
shiftSchema.index({ timezone: 1, isActive: 1 });
shiftSchema.index({ name: 1, timezone: 1 });

// Pre-save hook to validate that endTime is not the same as startTime
// Note: We allow overnight shifts (endTime < startTime means next day)
shiftSchema.pre('save', function (next) {
  if (this.startTime && this.endTime) {
    const [startHours, startMinutes] = this.startTime.split(':').map(Number);
    const [endHours, endMinutes] = this.endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    // Only reject if start and end times are exactly equal
    // Overnight shifts (endTime < startTime) are allowed
    if (endTotalMinutes === startTotalMinutes) {
      return next(new Error('End time cannot be the same as start time'));
    }
  }
  next();
});

// add plugin that converts mongoose to json
shiftSchema.plugin(toJSON);
shiftSchema.plugin(paginate);

/**
 * @typedef Shift
 */
const Shift = mongoose.model('Shift', shiftSchema);

export default Shift;

