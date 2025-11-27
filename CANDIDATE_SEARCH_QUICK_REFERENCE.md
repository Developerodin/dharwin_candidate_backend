# Candidate Search API - Quick Reference

## Endpoint
```
GET /v1/candidates
```

## Quick Examples

### Basic Search
```javascript
// By name
GET /v1/candidates?fullName=John

// By email
GET /v1/candidates?email=john@example.com
```

### Skills Filtering
```javascript
// Single skill
GET /v1/candidates?skills=JavaScript

// Multiple skills (any match)
GET /v1/candidates?skills=JavaScript,React

// Multiple skills (all must match)
GET /v1/candidates?skills=JavaScript,React&skillMatchMode=all

// Skill with level
GET /v1/candidates?skills=Python&skillLevel=Expert
```

### Experience Filtering
```javascript
// By experience level
GET /v1/candidates?experienceLevel=Mid Level

// By years range
GET /v1/candidates?minYearsOfExperience=3&maxYearsOfExperience=7
```

### Location Filtering
```javascript
// General location
GET /v1/candidates?location=New York

// Specific fields
GET /v1/candidates?city=San Francisco&state=California
```

### Combined Filters
```javascript
// Senior Python developers in SF
GET /v1/candidates?skills=Python&experienceLevel=Senior Level&city=San Francisco

// With pagination
GET /v1/candidates?skills=React&page=1&limit=20&sortBy=createdAt:desc
```

## All Parameters

| Parameter | Type | Values/Format |
|-----------|------|---------------|
| `skills` | string/array | Comma-separated or array |
| `skillLevel` | string | `Beginner`, `Intermediate`, `Advanced`, `Expert` |
| `skillMatchMode` | string | `all`, `any` (default: `any`) |
| `experienceLevel` | string | `Entry Level`, `Mid Level`, `Senior Level`, `Executive` |
| `minYearsOfExperience` | number | Minimum years |
| `maxYearsOfExperience` | number | Maximum years |
| `location` | string | City, state, or country |
| `city` | string | City name |
| `state` | string | State name |
| `country` | string | Country name |
| `degree` | string | Degree name |
| `visaType` | string | Visa type |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 10) |
| `sortBy` | string | `field:asc` or `field:desc` |

## Response Structure
```json
{
  "results": [...],
  "page": 1,
  "limit": 10,
  "totalPages": 5,
  "totalResults": 47
}
```

## JavaScript Fetch Example
```javascript
const params = new URLSearchParams({
  skills: 'JavaScript,React',
  experienceLevel: 'Mid Level',
  city: 'San Francisco',
  page: '1',
  limit: '20'
});

const response = await fetch(`/v1/candidates?${params}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
```

## React Hook (Minimal)
```javascript
const [filters, setFilters] = useState({});
const [candidates, setCandidates] = useState([]);

useEffect(() => {
  const params = new URLSearchParams(filters);
  fetch(`/v1/candidates?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => setCandidates(data.results));
}, [filters]);
```

