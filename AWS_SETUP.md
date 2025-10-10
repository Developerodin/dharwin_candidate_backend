# AWS S3 Setup for Document Upload

This document explains how to set up AWS S3 for document upload functionality in the Dharwin Candidate Backend.

## Required Environment Variables

Add the following environment variables to your `.env` file:

```env
# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-s3-bucket-name
```

## AWS S3 Setup Steps

### 1. Create an S3 Bucket

1. Log in to your AWS Console
2. Navigate to S3 service
3. Click "Create bucket"
4. Choose a unique bucket name (e.g., `dharwin-candidate-documents`)
5. Select your preferred region
6. Configure bucket settings as needed
7. Create the bucket

### 2. Create IAM User and Access Keys

1. Navigate to IAM service in AWS Console
2. Click "Users" → "Create user"
3. Enter username (e.g., `dharwin-s3-uploader`)
4. Attach policies directly:
   - `AmazonS3FullAccess` (for development)
   - Or create a custom policy with minimal permissions (recommended for production)

#### Custom IAM Policy (Recommended for Production)

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name"
        }
    ]
}
```

### 3. Generate Access Keys

1. Select the created user
2. Go to "Security credentials" tab
3. Click "Create access key"
4. Choose "Application running outside AWS"
5. Copy the Access Key ID and Secret Access Key
6. Add them to your `.env` file

## API Endpoints

### 1. Upload Single File (Direct Upload)

**POST** `/v1/upload/single`

Upload a file directly to S3 through the backend.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Body:**
```
file: <file>
label: "Resume"
candidateId: "64a1b2c3d4e5f6789abcdef0" (optional)
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "key": "documents/user123/1234567890-abc123.pdf",
    "url": "https://s3.amazonaws.com/bucket/presigned-url",
    "originalName": "resume.pdf",
    "size": 1024000,
    "mimeType": "application/pdf"
  }
}
```

### 2. Upload Multiple Files (Direct Upload)

**POST** `/v1/upload/multiple`

Upload multiple files directly to S3 through the backend.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Body:**
```
files: <file1>, <file2>, <file3>
labels: ["Resume", "Cover Letter", "Transcript"] (JSON string)
candidateId: "64a1b2c3d4e5f6789abcdef0" (optional)
```

### 3. Get Presigned Upload URL

**POST** `/v1/upload/presigned-url`

Generate a presigned URL for direct upload from frontend to S3.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "fileName": "resume.pdf",
  "contentType": "application/pdf",
  "candidateId": "64a1b2c3d4e5f6789abcdef0"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Presigned URL generated successfully",
  "data": {
    "presignedUrl": "https://s3.amazonaws.com/bucket/presigned-upload-url",
    "fileKey": "documents/user123/1234567890-abc123.pdf",
    "expiresIn": 3600,
    "candidateId": "64a1b2c3d4e5f6789abcdef0"
  }
}
```

### 4. Confirm Upload

**POST** `/v1/upload/confirm`

Confirm file upload and add to candidate profile (used after presigned URL upload).

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "fileKey": "documents/user123/1234567890-abc123.pdf",
  "label": "Resume",
  "candidateId": "64a1b2c3d4e5f6789abcdef0"
}
```

## Frontend Integration Examples

### Direct Upload (Backend handles S3)

```javascript
const uploadFile = async (file, label, candidateId) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('label', label);
  if (candidateId) formData.append('candidateId', candidateId);

  const response = await fetch('/v1/upload/single', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  return response.json();
};
```

### Presigned URL Upload (Frontend uploads directly to S3)

```javascript
const uploadFileWithPresignedUrl = async (file, label, candidateId) => {
  // Step 1: Get presigned URL
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

  const { data } = await presignedResponse.json();

  // Step 2: Upload directly to S3
  const uploadResponse = await fetch(data.presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (uploadResponse.ok) {
    // Step 3: Confirm upload
    const confirmResponse = await fetch('/v1/upload/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileKey: data.fileKey,
        label,
        candidateId,
      }),
    });

    return confirmResponse.json();
  }
};
```

## File Types and Limits

### Supported File Types
- PDF documents
- Images (JPEG, PNG, GIF)
- Microsoft Word documents (.doc, .docx)
- Microsoft Excel files (.xls, .xlsx)
- Text files (.txt)
- CSV files

### File Limits
- Maximum file size: 10MB
- Maximum files per request: 5
- Presigned URL expiry: 1 hour

## Security Considerations

1. **IAM Permissions**: Use minimal required permissions for production
2. **CORS Configuration**: Configure S3 bucket CORS for frontend uploads
3. **File Validation**: Files are validated on both frontend and backend
4. **Access Control**: All upload endpoints require authentication
5. **URL Expiry**: Presigned URLs expire after 1 hour

## CORS Configuration for S3 Bucket

Add the following CORS configuration to your S3 bucket:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST"],
        "AllowedOrigins": ["https://your-frontend-domain.com"],
        "ExposeHeaders": ["ETag"]
    }
]
```
