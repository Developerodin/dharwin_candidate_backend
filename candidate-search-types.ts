/**
 * TypeScript interfaces for Candidate Search API
 * Copy these into your frontend project for type safety
 */

// Query Parameters
export interface CandidateSearchFilters {
  // Basic filters
  owner?: string;
  fullName?: string;
  email?: string;
  
  // Skills filtering
  skills?: string | string[];
  skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  skillMatchMode?: 'all' | 'any';
  
  // Experience filtering
  experienceLevel?: 'Entry Level' | 'Mid Level' | 'Senior Level' | 'Executive';
  minYearsOfExperience?: number;
  maxYearsOfExperience?: number;
  
  // Location filtering
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  
  // Education & Visa
  degree?: string;
  visaType?: string;
  
  // Pagination
  page?: number;
  limit?: number;
  sortBy?: string;
}

// API Response
export interface CandidateSearchResponse {
  results: Candidate[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}

// Candidate Model
export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  profilePicture?: {
    url?: string;
    key?: string;
    originalName?: string;
    size?: number;
    mimeType?: string;
  };
  shortBio?: string;
  sevisId?: string;
  ead?: string;
  visaType?: string;
  customVisaType?: string;
  countryCode?: string;
  degree?: string;
  supervisorName?: string;
  supervisorContact?: string;
  supervisorCountryCode?: string;
  salaryRange?: string;
  address?: {
    streetAddress?: string;
    streetAddress2?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  qualifications: Qualification[];
  experiences: Experience[];
  documents: Document[];
  skills: Skill[];
  socialLinks: SocialLink[];
  salarySlips: SalarySlip[];
  isProfileCompleted: number;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Qualification {
  degree: string;
  institute: string;
  location?: string;
  startYear?: number;
  endYear?: number;
  description?: string;
}

export interface Experience {
  company: string;
  role: string;
  startDate?: string;
  endDate?: string;
  currentlyWorking: boolean;
  description?: string;
}

export interface Skill {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  category?: string;
}

export interface Document {
  label?: string;
  url?: string;
  key?: string;
  originalName?: string;
  size?: number;
  mimeType?: string;
  status: number;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface SalarySlip {
  month?: string;
  year?: number;
  documentUrl?: string;
  key?: string;
  originalName?: string;
  size?: number;
  mimeType?: string;
}

// API Error Response
export interface ApiError {
  code: number;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

// Helper function to build query string
export function buildCandidateSearchQuery(filters: CandidateSearchFilters): string {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    
    if (key === 'skills' && Array.isArray(value)) {
      // Handle skills array
      value.forEach(skill => {
        params.append('skills', skill);
      });
    } else if (typeof value === 'object') {
      params.append(key, JSON.stringify(value));
    } else {
      params.append(key, String(value));
    }
  });
  
  return params.toString();
}

// Example usage:
// const query = buildCandidateSearchQuery({
//   skills: ['JavaScript', 'React'],
//   experienceLevel: 'Mid Level',
//   city: 'San Francisco',
//   page: 1,
//   limit: 20
// });
// const url = `/v1/candidates?${query}`;

