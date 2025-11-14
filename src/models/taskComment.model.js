import mongoose from 'mongoose';
import toJSON from './plugins/toJSON.plugin.js';
import paginate from './plugins/paginate.plugin.js';

const taskCommentSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['comment', 'reaction', 'status_change', 'assignment_change', 'document_share'],
      default: 'comment',
    },
    metadata: {
      // Flexible metadata based on type
      reactionType: { type: String }, // For reactions: 'like', 'thumbs_up', etc.
      oldStatus: { type: String }, // For status changes
      newStatus: { type: String }, // For status changes
      sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // For document shares
      attachmentId: { type: mongoose.Schema.Types.ObjectId }, // For document shares
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaskComment',
      default: null,
    }, // For nested replies
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes
taskCommentSchema.index({ task: 1, createdAt: -1 });
taskCommentSchema.index({ user: 1 });
taskCommentSchema.index({ parentComment: 1 });

taskCommentSchema.plugin(toJSON);
taskCommentSchema.plugin(paginate);

const TaskComment = mongoose.model('TaskComment', taskCommentSchema);

export default TaskComment;

