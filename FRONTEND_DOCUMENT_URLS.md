# Frontend Changes for Document URLs

## Overview

Document URLs have been updated to use API endpoints that never expire. The API endpoints generate fresh presigned URLs on-demand, ensuring documents are always accessible.

## What Changed

**Before:**
- Document URLs were direct S3 presigned URLs that expired after 7 days
- Example: `https://s3.amazonaws.com/bucket/file.pdf?X-Amz-Signature=...`

**After:**
- Document URLs are now API endpoints that generate fresh URLs on-demand
- Example: `https://crm-apis.dharwinbusinesssolutions.com/v1/candidates/documents/{candidateId}/{documentIndex}/download`

## Frontend Changes Required

### Option 1: Direct Links with Token in URL (Recommended for Simple Cases)

**For `<a>` tags and direct downloads:**

```javascript
// Append token to URL for direct browser access
const documentUrl = `${document.url}?token=${userToken}`;

<a href={documentUrl} target="_blank" download>
  Download Document
</a>
```

**For images:**

```javascript
// Append token to URL for direct browser access
const imageUrl = `${document.url}?token=${userToken}`;

<img src={imageUrl} alt={document.label} />
```

**For PDFs/iframes:**

```javascript
// Append token to URL for direct browser access
const pdfUrl = `${document.url}?token=${userToken}`;

<iframe src={pdfUrl} />
```

**Note:** The API endpoint supports authentication via:
1. **Authorization header** (Bearer token) - for programmatic API calls
2. **Query parameter** (`?token=...`) - for direct browser access (links, images, etc.)

When constructing URLs for direct browser access (like clicking a link), append `?token=${userToken}` to the API endpoint URL.

### Option 2: Programmatic Access (Recommended for Better Control)

**For programmatic access with authentication:**

```javascript
// Fetch the actual presigned URL first
const getDocumentUrl = async (candidateId, documentIndex) => {
  const response = await fetch(
    `/v1/candidates/documents/${candidateId}/${documentIndex}/download`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json' // Request JSON response
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to get document URL');
  }
  
  const data = await response.json();
  return data.data.url; // Returns the fresh presigned URL
};

// Then use the URL
const presignedUrl = await getDocumentUrl(candidateId, documentIndex);
window.open(presignedUrl, '_blank');
```

**For React components:**

```jsx
const DocumentLink = ({ candidateId, documentIndex, document }) => {
  const [url, setUrl] = useState(document.url);
  const token = useAuth(); // Your auth hook

  const handleClick = async (e) => {
    e.preventDefault();
    
    // Fetch fresh URL
    const response = await fetch(
      `/v1/candidates/documents/${candidateId}/${documentIndex}/download`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      window.open(data.data.url, '_blank');
    }
  };

  return (
    <a href={url} onClick={handleClick}>
      {document.label}
    </a>
  );
};
```

### Option 3: Axios/Fetch Wrapper

Create a utility function:

```javascript
// utils/documentUtils.js
export const getDocumentDownloadUrl = async (candidateId, documentIndex, token) => {
  const response = await axios.get(
    `/v1/candidates/documents/${candidateId}/${documentIndex}/download`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    }
  );
  
  return response.data.data.url;
};

// Usage
const url = await getDocumentDownloadUrl(candidateId, 0, token);
window.open(url, '_blank');
```

## API Endpoint Details

**Endpoint:** `GET /v1/candidates/documents/:candidateId/:documentIndex/download`

**Authentication:** Required (Bearer token)

**Response Types:**

1. **JSON Response** (when `Accept: application/json` header is sent):
```json
{
  "success": true,
  "data": {
    "url": "https://s3.amazonaws.com/bucket/file.pdf?X-Amz-Signature=...",
    "fileName": "document.pdf",
    "mimeType": "application/pdf",
    "size": 1024000
  }
}
```

2. **Redirect Response** (default, for direct browser access):
- HTTP 302 redirect to the presigned S3 URL

## Migration Guide

### Step 1: Update Document URL Usage

**Before:**
```javascript
// Direct use of URL from API response
<img src={candidate.documents[0].url} />
```

**After (Option A - Simple):**
```javascript
// Still works if authentication is handled via cookies/session
<img src={candidate.documents[0].url} />
```

**After (Option B - Recommended):**
```javascript
// Fetch fresh URL when needed
const [imageUrl, setImageUrl] = useState(null);

useEffect(() => {
  const fetchUrl = async () => {
    const response = await fetch(
      `/v1/candidates/documents/${candidateId}/0/download`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );
    const data = await response.json();
    setImageUrl(data.data.url);
  };
  fetchUrl();
}, [candidateId]);
```

### Step 2: Handle Authentication

Ensure all document URL requests include authentication:

```javascript
// Add to your API client/axios instance
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

### Step 3: Update Error Handling

```javascript
try {
  const url = await getDocumentDownloadUrl(candidateId, index, token);
  window.open(url, '_blank');
} catch (error) {
  if (error.response?.status === 403) {
    // Handle permission denied
  } else if (error.response?.status === 404) {
    // Handle document not found
  }
}
```

## Benefits

1. **No Expiration Issues**: Documents are always accessible
2. **Fresh URLs**: Each access generates a new URL
3. **Security**: Authentication is checked on each access
4. **Flexibility**: Supports both direct links and programmatic access

## Testing

1. **Test Direct Links:**
   - Click a document link in the UI
   - Should redirect and download/open the document

2. **Test Programmatic Access:**
   - Use fetch/axios to get document URL
   - Verify JSON response contains valid presigned URL
   - Open the URL in a new tab/window

3. **Test Authentication:**
   - Try accessing without token → Should return 401
   - Try accessing with invalid token → Should return 401
   - Try accessing with valid token → Should work

## Questions?

If you encounter any issues:
1. Check that authentication headers are being sent
2. Verify the API endpoint URL format is correct
3. Ensure the Accept header is set to `application/json` for JSON responses
4. Check browser console for CORS or authentication errors
