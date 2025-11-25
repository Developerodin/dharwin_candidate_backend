import mongoose from 'mongoose';
import toJSON from './plugins/toJSON.plugin.js';
import paginate from './plugins/paginate.plugin.js';

const jobTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    
    // Template Content
    templateContent: { type: String, required: true, trim: true },
    
    // Default values that can be used when creating jobs from template
    defaultJobType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Freelance'],
    },
    defaultSkillTags: [{ type: String, trim: true }],
    defaultLocation: { type: String, trim: true },
    
    // Template Variables (placeholders that can be replaced)
    // e.g., {{organisationName}}, {{jobTitle}}, {{location}}
    variables: [{ 
      name: { type: String, trim: true },
      description: { type: String, trim: true },
      defaultValue: { type: String, trim: true },
    }],
    
    // Ownership
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    // Usage tracking
    usageCount: { type: Number, default: 0 },
    lastUsedAt: { type: Date },
  },
  { timestamps: true }
);

jobTemplateSchema.index({ name: 'text', description: 'text' });
jobTemplateSchema.index({ createdBy: 1 });
jobTemplateSchema.index({ createdAt: -1 });

jobTemplateSchema.plugin(toJSON);
jobTemplateSchema.plugin(paginate);

const JobTemplate = mongoose.model('JobTemplate', jobTemplateSchema);

export default JobTemplate;

