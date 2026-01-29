import mongoose from 'mongoose';
import toJSON from './plugins/toJSON.plugin.js';
import paginate from './plugins/paginate.plugin.js';

const candidateGroupSchema = new mongoose.Schema(
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
    candidates: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Candidate',
        },
      ],
      default: [],
      index: true,
    },
    /** Default holidays for this group; auto-assigned when a candidate is added to the group */
    holidays: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Holiday',
        },
      ],
      default: [],
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index for efficient queries
candidateGroupSchema.index({ name: 1, isActive: 1 });
candidateGroupSchema.index({ createdBy: 1, isActive: 1 });

// add plugin that converts mongoose to json
candidateGroupSchema.plugin(toJSON);
candidateGroupSchema.plugin(paginate);

/**
 * @typedef CandidateGroup
 */
const CandidateGroup = mongoose.model('CandidateGroup', candidateGroupSchema);

export default CandidateGroup;
