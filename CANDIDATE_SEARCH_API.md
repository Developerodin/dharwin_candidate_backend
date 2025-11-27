# Candidate List API - Advanced Search & Filtering Documentation

## Overview
The Candidate List API now supports advanced search and filtering options to match candidates with job requirements. This allows you to filter candidates by skills, experience level, location, education, visa status, and more.

## Base Endpoint
```
GET /v1/candidates
```

## Authentication
All requests require authentication. Include the authentication token in the request headers:
```
Authorization: Bearer <your-token>
```

---

## Query Parameters

### Basic Filters (Existing)
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `owner` | string (ObjectId) | Filter by candidate owner ID | `?owner=507f1f77bcf86cd799439011` |
| `fullName` | string | Search by full name (case-insensitive, partial match) | `?fullName=John` |
| `email` | string | Search by email (case-insensitive, partial match) | `?email=john@example.com` |
| `page` | number | Page number for pagination (default: 1) | `?page=2` |
| `limit` | number | Number of results per page (default: 10) | `?limit=20` |
| `sortBy` | string | Sort field and order (format: `field:asc` or `field:desc`) | `?sortBy=createdAt:desc` |

### Advanced Filters (New)

#### Skills Filtering
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `skills` | string or array | Filter by skill names. Can be a single skill or comma-separated string, or array | `?skills=JavaScript` or `?skills=JavaScript,React,Node.js` |
| `skillLevel` | string | Filter by skill proficiency level | `?skillLevel=Advanced` |
| `skillMatchMode` | string | Match mode: `'all'` (all skills must match) or `'any'` (at least one skill matches). Default: `'any'` | `?skillMatchMode=all` |

**Skill Level Values:**
- `Beginner`
- `Intermediate`
- `Advanced`
- `Expert`

#### Experience Filtering
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `experienceLevel` | string | Filter by experience level (automatically calculates years from work experience) | `?experienceLevel=Mid Level` |
| `minYearsOfExperience` | number | Minimum years of experience | `?minYearsOfExperience=3` |
| `maxYearsOfExperience` | number | Maximum years of experience | `?maxYearsOfExperience=7` |

**Experience Level Values:**
- `Entry Level` (0-2 years)
- `Mid Level` (2-5 years)
- `Senior Level` (5-10 years)
- `Executive` (10+ years)

#### Location Filtering
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `location` | string | Search in city, state, or country (case-insensitive, partial match) | `?location=New York` |
| `city` | string | Filter by city (case-insensitive, partial match) | `?city=San Francisco` |
| `state` | string | Filter by state (case-insensitive, partial match) | `?state=California` |
| `country` | string | Filter by country (case-insensitive, partial match) | `?country=United States` |

#### Education & Visa Filtering
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `degree` | string | Filter by degree (searches in both top-level degree and qualifications, case-insensitive) | `?degree=Computer Science` |
| `visaType` | string | Filter by visa type (searches in both visaType and customVisaType, case-insensitive) | `?visaType=H1B` |

---

## Request Examples

### Example 1: Search by Skills (Any Match)
```javascript
// Find candidates with JavaScript OR React skills
GET /v1/candidates?skills=JavaScript,React&skillMatchMode=any

// Using fetch
const response = await fetch('/v1/candidates?skills=JavaScript,React&skillMatchMode=any', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Example 2: Search by Skills (All Must Match)
```javascript
// Find candidates with BOTH JavaScript AND React skills
GET /v1/candidates?skills=JavaScript,React&skillMatchMode=all

// Using fetch
const response = await fetch('/v1/candidates?skills=JavaScript,React&skillMatchMode=all', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Example 3: Filter by Experience Level
```javascript
// Find mid-level candidates (2-5 years experience)
GET /v1/candidates?experienceLevel=Mid Level

// Using fetch
const response = await fetch('/v1/candidates?experienceLevel=Mid Level', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Example 4: Filter by Years of Experience Range
```javascript
// Find candidates with 3-7 years of experience
GET /v1/candidates?minYearsOfExperience=3&maxYearsOfExperience=7

// Using fetch
const response = await fetch('/v1/candidates?minYearsOfExperience=3&maxYearsOfExperience=7', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Example 5: Complex Multi-Filter Search
```javascript
// Find senior-level Python developers in San Francisco
GET /v1/candidates?skills=Python&experienceLevel=Senior Level&city=San Francisco

// Using fetch
const response = await fetch('/v1/candidates?skills=Python&experienceLevel=Senior Level&city=San Francisco', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Example 6: Job Matching - Complete Example
```javascript
// Match candidates for a job posting:
// - Required skills: JavaScript, React, Node.js (all must match)
// - Experience: Mid to Senior Level
// - Location: New York or remote
// - Degree: Computer Science preferred

const params = new URLSearchParams({
  skills: 'JavaScript,React,Node.js',
  skillMatchMode: 'all',
  minYearsOfExperience: 3,
  maxYearsOfExperience: 10,
  location: 'New York',
  degree: 'Computer Science'
});

const response = await fetch(`/v1/candidates?${params.toString()}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Example 7: Filter by Skill Level
```javascript
// Find candidates with Advanced or Expert level in any skill
GET /v1/candidates?skillLevel=Advanced

// Or combine with skill name
GET /v1/candidates?skills=Python&skillLevel=Expert
```

### Example 8: Location-Based Search
```javascript
// Search by general location (searches city, state, and country)
GET /v1/candidates?location=California

// Or be more specific
GET /v1/candidates?city=San Francisco&state=California&country=United States
```

### Example 9: Visa Type Filtering
```javascript
// Find candidates with H1B visa
GET /v1/candidates?visaType=H1B

// Using fetch
const response = await fetch('/v1/candidates?visaType=H1B', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Example 10: Combined Filters with Pagination
```javascript
// Search with multiple filters and pagination
const params = new URLSearchParams({
  skills: 'JavaScript',
  experienceLevel: 'Mid Level',
  city: 'New York',
  page: '1',
  limit: '20',
  sortBy: 'createdAt:desc'
});

const response = await fetch(`/v1/candidates?${params.toString()}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## Response Format

### Success Response (200 OK)
```json
{
  "results": [
    {
      "id": "507f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "email": "john.doe@example.com",
      "phoneNumber": "9876543210",
      "shortBio": "Experienced software developer",
      "degree": "Computer Science",
      "visaType": "H1B",
      "address": {
        "city": "San Francisco",
        "state": "California",
        "country": "United States"
      },
      "skills": [
        {
          "name": "JavaScript",
          "level": "Advanced",
          "category": "Technical"
        },
        {
          "name": "React",
          "level": "Expert",
          "category": "Technical"
        }
      ],
      "experiences": [
        {
          "company": "Tech Corp",
          "role": "Senior Developer",
          "startDate": "2020-01-15T00:00:00.000Z",
          "endDate": null,
          "currentlyWorking": true,
          "description": "Leading development team"
        }
      ],
      "qualifications": [
        {
          "degree": "Bachelor of Science",
          "institute": "University of California",
          "location": "Berkeley",
          "startYear": 2015,
          "endYear": 2019
        }
      ],
      "isProfileCompleted": 85,
      "isCompleted": false,
      "createdAt": "2023-01-15T10:30:00.000Z",
      "updatedAt": "2023-06-20T14:45:00.000Z"
    }
  ],
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "totalResults": 47
}
```

### Response Fields
- `results`: Array of candidate objects matching the filters
- `page`: Current page number
- `limit`: Number of results per page
- `totalPages`: Total number of pages
- `totalResults`: Total number of candidates matching the filters

---

## Frontend Implementation Examples

### React Hook Example
```javascript
import { useState, useEffect } from 'react';

const useCandidateSearch = (filters = {}) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 0,
    totalResults: 0
  });

  useEffect(() => {
    const fetchCandidates = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build query parameters
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
          ...filters
        });

        // Handle array parameters (skills)
        if (filters.skills && Array.isArray(filters.skills)) {
          params.delete('skills');
          filters.skills.forEach(skill => {
            params.append('skills', skill);
          });
        }

        const response = await fetch(`/v1/candidates?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch candidates');
        }

        const data = await response.json();
        setCandidates(data.results);
        setPagination({
          page: data.page,
          limit: data.limit,
          totalPages: data.totalPages,
          totalResults: data.totalResults
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [filters, pagination.page, pagination.limit]);

  return { candidates, loading, error, pagination, setPagination };
};

// Usage
const CandidateSearch = () => {
  const [filters, setFilters] = useState({
    skills: ['JavaScript', 'React'],
    skillMatchMode: 'all',
    experienceLevel: 'Mid Level',
    city: 'San Francisco'
  });

  const { candidates, loading, error, pagination, setPagination } = useCandidateSearch(filters);

  return (
    <div>
      {/* Filter UI */}
      <input
        type="text"
        placeholder="Skills (comma-separated)"
        onChange={(e) => setFilters({
          ...filters,
          skills: e.target.value.split(',').map(s => s.trim())
        })}
      />
      
      <select
        value={filters.experienceLevel || ''}
        onChange={(e) => setFilters({ ...filters, experienceLevel: e.target.value })}
      >
        <option value="">All Levels</option>
        <option value="Entry Level">Entry Level</option>
        <option value="Mid Level">Mid Level</option>
        <option value="Senior Level">Senior Level</option>
        <option value="Executive">Executive</option>
      </select>

      {/* Results */}
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {candidates.map(candidate => (
        <div key={candidate.id}>
          <h3>{candidate.fullName}</h3>
          <p>{candidate.email}</p>
          {/* More candidate details */}
        </div>
      ))}

      {/* Pagination */}
      <button
        disabled={pagination.page === 1}
        onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
      >
        Previous
      </button>
      <span>Page {pagination.page} of {pagination.totalPages}</span>
      <button
        disabled={pagination.page === pagination.totalPages}
        onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
      >
        Next
      </button>
    </div>
  );
};
```

### Vue.js Composition API Example
```javascript
import { ref, computed, watch } from 'vue';

export function useCandidateSearch() {
  const candidates = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const filters = ref({});
  const pagination = ref({
    page: 1,
    limit: 10,
    totalPages: 0,
    totalResults: 0
  });

  const fetchCandidates = async () => {
    loading.value = true;
    error.value = null;

    try {
      const params = new URLSearchParams({
        page: pagination.value.page.toString(),
        limit: pagination.value.limit.toString(),
        ...filters.value
      });

      if (filters.value.skills && Array.isArray(filters.value.skills)) {
        params.delete('skills');
        filters.value.skills.forEach(skill => {
          params.append('skills', skill);
        });
      }

      const response = await fetch(`/v1/candidates?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch candidates');
      }

      const data = await response.json();
      candidates.value = data.results;
      pagination.value = {
        page: data.page,
        limit: data.limit,
        totalPages: data.totalPages,
        totalResults: data.totalResults
      };
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  watch([filters, () => pagination.value.page], fetchCandidates, { immediate: true });

  return {
    candidates,
    loading,
    error,
    filters,
    pagination,
    fetchCandidates
  };
}
```

### Job Matching Component Example
```javascript
// Match candidates to a specific job posting
const JobCandidateMatcher = ({ job }) => {
  const [filters, setFilters] = useState({
    skills: job.skillTags || [],
    skillMatchMode: 'all', // Require all job skills
    experienceLevel: job.experienceLevel,
    location: job.location,
    minYearsOfExperience: job.minYears || undefined,
    maxYearsOfExperience: job.maxYears || undefined
  });

  const { candidates, loading } = useCandidateSearch(filters);

  return (
    <div>
      <h2>Matching Candidates for: {job.title}</h2>
      <p>Found {candidates.length} matching candidates</p>
      
      {candidates.map(candidate => (
        <CandidateCard key={candidate.id} candidate={candidate} />
      ))}
    </div>
  );
};
```

---

## Error Handling

### Validation Errors (400 Bad Request)
```json
{
  "code": 400,
  "message": "Validation error",
  "errors": [
    {
      "field": "experienceLevel",
      "message": "experienceLevel must be one of: Entry Level, Mid Level, Senior Level, Executive"
    }
  ]
}
```

### Authentication Errors (401 Unauthorized)
```json
{
  "code": 401,
  "message": "Please authenticate"
}
```

### Forbidden Errors (403 Forbidden)
```json
{
  "code": 403,
  "message": "Forbidden"
}
```

---

## Best Practices

1. **URL Encoding**: Always URL-encode special characters in query parameters
   ```javascript
   const skill = encodeURIComponent('C++');
   ```

2. **Array Parameters**: For skills array, you can either:
   - Pass as comma-separated string: `?skills=JavaScript,React`
   - Pass multiple times: `?skills=JavaScript&skills=React`

3. **Pagination**: Always implement pagination for large result sets
   ```javascript
   const limit = 20; // Reasonable default
   ```

4. **Debouncing**: Debounce search inputs to avoid excessive API calls
   ```javascript
   import { debounce } from 'lodash';
   const debouncedSearch = debounce((value) => {
     setFilters({ ...filters, fullName: value });
   }, 300);
   ```

5. **Error Handling**: Always handle errors gracefully
   ```javascript
   try {
     const response = await fetchCandidates();
   } catch (error) {
     // Show user-friendly error message
     showNotification('Failed to load candidates. Please try again.');
   }
   ```

6. **Loading States**: Show loading indicators during API calls
   ```javascript
   {loading && <Spinner />}
   ```

7. **Empty States**: Handle empty results
   ```javascript
   {!loading && candidates.length === 0 && (
     <EmptyState message="No candidates found matching your criteria" />
   )}
   ```

---

## Filter Combinations

### Common Use Cases

1. **Find Senior JavaScript Developers in San Francisco**
   ```
   ?skills=JavaScript&experienceLevel=Senior Level&city=San Francisco
   ```

2. **Find Entry-Level Candidates with Python Skills**
   ```
   ?skills=Python&experienceLevel=Entry Level
   ```

3. **Find Candidates with Multiple Required Skills**
   ```
   ?skills=React,Node.js,TypeScript&skillMatchMode=all
   ```

4. **Find Remote Candidates (by location flexibility)**
   ```
   ?location=Remote
   ```

5. **Find H1B Visa Holders with 5+ Years Experience**
   ```
   ?visaType=H1B&minYearsOfExperience=5
   ```

---

## Notes

- All text searches are **case-insensitive** and support **partial matching**
- Skills matching uses regex, so special characters should be handled carefully
- Experience level automatically calculates from the `experiences` array
- Non-admin users can only see their own candidates (owner filter is automatically applied)
- The API supports combining multiple filters for precise candidate matching

---

## Support

For questions or issues, please contact the backend team or refer to the API documentation.

