import mongoose from 'mongoose';
import toJSON from './plugins/toJSON.plugin.js';
import paginate from './plugins/paginate.plugin.js';

const attendanceSchema = mongoose.Schema(
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
    date: {
      type: Date,
      required: true,
      index: true,
    },
    day: {
      type: String,
      enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      index: true,
      default: function () {
        if (this.date) {
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          return days[this.date.getDay()];
        }
        return undefined;
      },
    },
    punchIn: {
      type: Date,
      required: true,
      index: true,
    },
    punchOut: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number, // Duration in milliseconds
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    timezone: {
      type: String,
      trim: true,
      default: 'UTC',
      // Common timezones: 'America/New_York', 'America/Los_Angeles', 'Asia/Kolkata', 'UTC'
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Holiday', 'Leave'],
      default: 'Present',
      index: true,
    },
    leaveType: {
      type: String,
      enum: ['casual', 'sick'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
attendanceSchema.index({ candidate: 1, date: -1 });
attendanceSchema.index({ candidate: 1, punchIn: -1 });
attendanceSchema.index({ candidateEmail: 1, date: -1 });
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ day: 1, date: -1 });

// Pre-save hook to calculate duration and set day
attendanceSchema.pre('save', function (next) {
  // Set day name from date
  if (this.date) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    this.day = days[this.date.getDay()];
  }

  // Calculate duration if punch out exists
  if (this.punchOut && this.punchIn) {
    this.duration = this.punchOut.getTime() - this.punchIn.getTime();
  }

  next();
});

// Method to check if there's an active punch in (no punch out)
attendanceSchema.methods.isPunchedIn = function () {
  return this.punchOut === null || this.punchOut === undefined;
};

// add plugin that converts mongoose to json
attendanceSchema.plugin(toJSON);
attendanceSchema.plugin(paginate);

/**
 * @typedef Attendance
 */
const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;

