import mongoose from 'mongoose';
import toJSON from './plugins/toJSON.plugin.js';
import paginate from './plugins/paginate.plugin.js';

const qualificationSchema = new mongoose.Schema(
  {
    degree: { type: String, required: true, trim: true },
    institute: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    startYear: { type: Number },
    endYear: { type: Number },
    description: { type: String, trim: true },
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    description: { type: String, trim: true },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
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

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], default: 'Beginner' },
    category: { type: String, trim: true }, // e.g., 'Technical', 'Soft Skills', 'Languages'
  },
  { _id: false }
);

const socialLinkSchema = new mongoose.Schema(
  {
    platform: { type: String, required: true, trim: true }, // e.g., 'LinkedIn', 'GitHub', 'Twitter'
    url: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const salarySlipSchema = new mongoose.Schema(
  {
    month: { type: String, trim: true }, // e.g., 'January', 'Feb', '03'
    year: { type: Number, min: 1900, max: 2100 },
    documentUrl: { type: String, trim: true },
    key: { type: String, trim: true }, // S3 file key
    originalName: { type: String, trim: true }, // Original filename
    size: { type: Number }, // File size in bytes
    mimeType: { type: String, trim: true }, // File MIME type
  },
  { _id: false }
);

const candidateSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Personal Info
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phoneNumber: { type: String, required: true, trim: true },
    shortBio: { type: String, trim: true },
    sevisId: { type: String, trim: true },
    ead: { type: String, trim: true },
    degree: { type: String, trim: true },
    supervisorName: { type: String, trim: true },
    supervisorContact: { type: String, trim: true },

    // Dynamic sections
    qualifications: { type: [qualificationSchema], default: [] },
    experiences: { type: [experienceSchema], default: [] },
    documents: { type: [documentSchema], default: [] },
    skills: { type: [skillSchema], default: [] },
    socialLinks: { type: [socialLinkSchema], default: [] },
    salarySlips: { type: [salarySlipSchema], default: [] },

    // Profile completion tracking
    isProfileCompleted: { type: Number, default: 0, min: 0, max: 100 },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

candidateSchema.plugin(toJSON);
candidateSchema.plugin(paginate);

const Candidate = mongoose.model('Candidate', candidateSchema);

export default Candidate;


