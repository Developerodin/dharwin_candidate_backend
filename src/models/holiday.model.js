import mongoose from 'mongoose';
import toJSON from './plugins/toJSON.plugin.js';
import paginate from './plugins/paginate.plugin.js';

const holidaySchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
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
holidaySchema.index({ date: -1 });
holidaySchema.index({ title: 1, date: -1 });

// Pre-save hook to normalize date to start of day
holidaySchema.pre('save', function (next) {
  if (this.date) {
    const normalizedDate = new Date(this.date);
    normalizedDate.setHours(0, 0, 0, 0);
    this.date = normalizedDate;
  }
  next();
});

// add plugin that converts mongoose to json
holidaySchema.plugin(toJSON);
holidaySchema.plugin(paginate);

/**
 * @typedef Holiday
 */
const Holiday = mongoose.model('Holiday', holidaySchema);

export default Holiday;

