# Document Upload Examples

This document provides practical examples of how to use the document upload functionality.

## Frontend Integration Examples

### 1. Direct Upload (Backend handles S3 upload)

```javascript
// Upload single file directly through backend
const uploadFileDirectly = async (file, label, candidateId, token) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('label', label);
  if (candidateId) formData.append('candidateId', candidateId);

  try {
    const response = await fetch('/v1/upload/single', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('File uploaded successfully:', result.data);
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};

// Usage
const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const result = await uploadFileDirectly(
      file, 
      'Resume', 
      '64a1b2c3d4e5f6789abcdef0', // candidateId
      'your-jwt-token'
    );
    console.log('Upload successful:', result);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### 2. Presigned URL Upload (Frontend uploads directly to S3)

```javascript
// Upload using presigned URL (recommended for large files)
const uploadFileWithPresignedUrl = async (file, label, candidateId, token) => {
  try {
    // Step 1: Get presigned URL from backend
    const presignedResponse = await fetch('/v1/upload/presigned-url', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        candidateId,
      }),
    });

    const presignedData = await presignedResponse.json();
    
    if (!presignedData.success) {
      throw new Error(presignedData.message);
    }

    // Step 2: Upload file directly to S3
    const uploadResponse = await fetch(presignedData.data.presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file to S3');
    }

    // Step 3: Confirm upload with backend
    const confirmResponse = await fetch('/v1/upload/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileKey: presignedData.data.fileKey,
        label,
        candidateId,
      }),
    });

    const confirmData = await confirmResponse.json();
    
    if (confirmData.success) {
      console.log('File uploaded and confirmed:', confirmData.data);
      return confirmData.data;
    } else {
      throw new Error(confirmData.message);
    }
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};

// Usage
const handlePresignedUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const result = await uploadFileWithPresignedUrl(
      file, 
      'Cover Letter', 
      '64a1b2c3d4e5f6789abcdef0', // candidateId
      'your-jwt-token'
    );
    console.log('Upload successful:', result);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### 3. Multiple File Upload

```javascript
// Upload multiple files at once
const uploadMultipleFiles = async (files, labels, candidateId, token) => {
  const formData = new FormData();
  
  // Add files
  files.forEach(file => {
    formData.append('files', file);
  });
  
  // Add labels as JSON string
  formData.append('labels', JSON.stringify(labels));
  
  if (candidateId) formData.append('candidateId', candidateId);

  try {
    const response = await fetch('/v1/upload/multiple', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Files uploaded successfully:', result.data);
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};

// Usage
const handleMultipleFileUpload = async (event) => {
  const files = Array.from(event.target.files);
  const labels = files.map((file, index) => `Document ${index + 1}`);

  try {
    const result = await uploadMultipleFiles(
      files, 
      labels, 
      '64a1b2c3d4e5f6789abcdef0', // candidateId
      'your-jwt-token'
    );
    console.log('Upload successful:', result);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

## React Component Example

```jsx
import React, { useState } from 'react';

const DocumentUpload = ({ candidateId, token, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress (you can implement real progress tracking)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await uploadFileWithPresignedUrl(
        file, 
        file.name.replace(/\.[^/.]+$/, ""), // Use filename without extension as label
        candidateId, 
        token
      );

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="document-upload">
      <input
        type="file"
        onChange={handleFileUpload}
        disabled={uploading}
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt,.csv"
      />
      
      {uploading && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p>Uploading... {uploadProgress}%</p>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
```

## cURL Examples

### 1. Get Presigned URL

```bash
curl -X POST http://localhost:3000/v1/upload/presigned-url \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "resume.pdf",
    "contentType": "application/pdf",
    "candidateId": "64a1b2c3d4e5f6789abcdef0"
  }'
```

### 2. Upload File Directly

```bash
curl -X POST http://localhost:3000/v1/upload/single \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/your/file.pdf" \
  -F "label=Resume" \
  -F "candidateId=64a1b2c3d4e5f6789abcdef0"
```

### 3. Confirm Upload

```bash
curl -X POST http://localhost:3000/v1/upload/confirm \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileKey": "documents/user123/1234567890-abc123.pdf",
    "label": "Resume",
    "candidateId": "64a1b2c3d4e5f6789abcdef0"
  }'
```

## Error Handling

```javascript
const handleUploadWithErrorHandling = async (file, label, candidateId, token) => {
  try {
    const result = await uploadFileWithPresignedUrl(file, label, candidateId, token);
    return result;
  } catch (error) {
    if (error.message.includes('File size too large')) {
      alert('File size must be less than 10MB');
    } else if (error.message.includes('File type not allowed')) {
      alert('File type not supported. Please upload PDF, images, or document files.');
    } else if (error.message.includes('Unauthorized')) {
      alert('Please log in again');
      // Redirect to login
    } else {
      alert('Upload failed: ' + error.message);
    }
    throw error;
  }
};
```

## File Validation

```javascript
const validateFile = (file) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];

  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error('File type not allowed');
  }

  if (file.size > maxSize) {
    throw new Error('File size too large');
  }

  return true;
};
```
