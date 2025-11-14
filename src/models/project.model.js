import mongoose from 'mongoose';
import toJSON from './plugins/toJSON.plugin.js';
import paginate from './plugins/paginate.plugin.js';

const attachmentSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true },
    url: { type: String, trim: true },
    key: { type: String, trim: true }, // S3 file key
    originalName: { type: String, trim: true }, // Original filename
    size: { type: Number }, // File size in bytes
    mimeType: { type: String, trim: true }, // File MIME type
  },
  { _id: false }
);

const goalSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    description: { type: String, trim: true },
  },
  { _id: false }
);

const objectiveSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    description: { type: String, trim: true },
  },
  { _id: false }
);

const deliverableSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    dueDate: { type: Date },
    status: { 
      type: String, 
      enum: ['Pending', 'In Progress', 'Completed', 'Delayed'],
      default: 'Pending'
    },
  },
  { _id: false }
);

const resourceSchema = new mongoose.Schema(
  {
    type: { 
      type: String, 
      enum: ['Budget', 'Equipment', 'Tool', 'Software', 'Service', 'Other'],
      required: true 
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    quantity: { type: Number },
    cost: { type: Number },
    unit: { type: String, trim: true }, // e.g., 'USD', 'hours', 'units'
  },
  { _id: false }
);

const stakeholderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, trim: true }, // e.g., 'Client', 'Sponsor', 'End User', 'Technical Lead'
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    organization: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    // Basic Information
    projectName: { type: String, required: true, trim: true },
    projectManager: { type: String, trim: true },
    clientStakeholder: { type: String, trim: true },
    projectDescription: { type: String, trim: true }, // Rich text/HTML content
    
    // Dates
    startDate: { type: Date },
    endDate: { type: Date },
    
    // Status and Priority
    status: { 
      type: String, 
      enum: ['Not Started', 'Inprogress', 'On Hold', 'Completed', 'Cancelled'],
      default: 'Inprogress'
    },
    priority: { 
      type: String, 
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'High'
    },
    
    // Assignments
    assignedTo: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }],
    
    // Tags
    tags: [{ type: String, trim: true }],
    
    // Attachments
    attachments: { type: [attachmentSchema], default: [] },
    
    // Project Briefs
    goals: [{ 
      type: mongoose.Schema.Types.Mixed // Can be string or goalSchema object
    }],
    objectives: [{ 
      type: mongoose.Schema.Types.Mixed // Can be string or objectiveSchema object
    }],
    deliverables: { type: [deliverableSchema], default: [] },
    
    // Project Scope
    techStack: [{ type: String, trim: true }], // Technologies/frameworks
    resources: { type: [resourceSchema], default: [] },
    stakeholders: { type: [stakeholderSchema], default: [] },
    
    // Ownership
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true
    },
  },
  { timestamps: true }
);

projectSchema.plugin(toJSON);
projectSchema.plugin(paginate);

const Project = mongoose.model('Project', projectSchema);

export default Project;

