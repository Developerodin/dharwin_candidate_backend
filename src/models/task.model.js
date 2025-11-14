import mongoose from 'mongoose';
import toJSON from './plugins/toJSON.plugin.js';
import paginate from './plugins/paginate.plugin.js';

const subTaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    isCompleted: { type: Boolean, default: false },
    completedAt: { type: Date },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const attachmentSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true },
    url: { type: String, trim: true },
    key: { type: String, trim: true }, // S3 file key
    originalName: { type: String, trim: true }, // Original filename
    size: { type: Number }, // File size in bytes
    mimeType: { type: String, trim: true }, // File MIME type
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    // Basic Information
    taskId: { type: String, unique: true, trim: true }, // Auto-generated: SPK-{number}
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true }, // Rich text/HTML
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['New', 'Todo', 'On Going', 'In Review', 'Completed'],
      default: 'New',
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
      index: true,
    },

    // Dates
    assignedDate: { type: Date, default: Date.now },
    dueDate: { type: Date, index: true },

    // Assignment
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],

    // Progress Tracking
    progress: { type: Number, min: 0, max: 100, default: 0 },
    efforts: {
      hours: { type: Number, default: 0, min: 0 },
      minutes: { type: Number, default: 0, min: 0, max: 59 },
      seconds: { type: Number, default: 0, min: 0, max: 59 },
    },

    // Metadata
    tags: [{ type: String, trim: true }],
    taskKey: { type: String, trim: true, default: 'SPK' }, // For task ID generation (e.g., 'SPK')

    // Sub-tasks
    subTasks: { type: [subTaskSchema], default: [] },

    // Attachments
    attachments: { type: [attachmentSchema], default: [] },

    // Ownership
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Indexes
taskSchema.index({ project: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ taskId: 1 }, { unique: true });

// Virtual for calculating progress from sub-tasks
taskSchema.virtual('calculatedProgress').get(function () {
  if (!this.subTasks || this.subTasks.length === 0) {
    return this.progress; // Return manual progress if no sub-tasks
  }
  const completedCount = this.subTasks.filter((st) => st.isCompleted).length;
  return Math.round((completedCount / this.subTasks.length) * 100);
});

// Method to calculate and update progress from sub-tasks
taskSchema.methods.updateProgressFromSubTasks = function () {
  if (this.subTasks && this.subTasks.length > 0) {
    const completedCount = this.subTasks.filter((st) => st.isCompleted).length;
    this.progress = Math.round((completedCount / this.subTasks.length) * 100);
  }
};

// Pre-save middleware to set assignedDate if not provided
taskSchema.pre('save', function (next) {
  if (this.isNew && !this.assignedDate) {
    this.assignedDate = new Date();
  }
  next();
});

taskSchema.plugin(toJSON);
taskSchema.plugin(paginate);

const Task = mongoose.model('Task', taskSchema);

export default Task;

