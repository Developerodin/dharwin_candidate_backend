import request from 'supertest';
import faker from 'faker';
import httpStatus from 'http-status';
import app from '../../src/app.js';
import setupTestDB from '../utils/setupTestDB.js';

import { admin, insertUsers } from '../fixtures/user.fixture';
import { adminAccessToken } from '../fixtures/token.fixture';
import Candidate from '../../src/models/candidate.model.js';

setupTestDB();

describe('Document Preview functionality', () => {
  describe('GET /v1/candidates/public/candidate/:candidateId with documents', () => {
    let candidate;

    beforeEach(async () => {
      await insertUsers([admin]);

      // Create a candidate with various document types
      candidate = await Candidate.create({
        owner: admin._id,
        adminId: admin._id,
        fullName: faker.name.findName(),
        email: faker.internet.email().toLowerCase(),
        phoneNumber: '9876543210',
        documents: [
          {
            label: 'Resume',
            url: 'https://example.com/resume.pdf',
            originalName: 'resume.pdf',
            size: 1024000,
            mimeType: 'application/pdf'
          },
          {
            label: 'Cover Letter',
            url: 'https://example.com/cover-letter.docx',
            originalName: 'cover-letter.docx',
            size: 512000,
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          },
          {
            label: 'Profile Photo',
            url: 'https://example.com/photo.jpg',
            originalName: 'photo.jpg',
            size: 2048000,
            mimeType: 'image/jpeg'
          },
          {
            label: 'Certificate',
            url: 'https://example.com/certificate.txt',
            originalName: 'certificate.txt',
            size: 1024,
            mimeType: 'text/plain'
          }
        ]
      });
    });

    test('should return HTML with document thumbnails and preview buttons', async () => {
      // Create mock data for withDoc=true
      const mockData = Buffer.from(JSON.stringify({
        candidateId: candidate._id.toString(),
        withDoc: true,
        sharedBy: 'Test User',
        sharedAt: new Date().toISOString()
      })).toString('base64');

      const res = await request(app)
        .get(`/v1/candidates/public/candidate/${candidate._id}`)
        .query({
          token: 'mock-token',
          data: mockData
        })
        .expect(httpStatus.OK);

      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain('📄 Documents');
      expect(res.text).toContain('resume.pdf');
      expect(res.text).toContain('cover-letter.docx');
      expect(res.text).toContain('photo.jpg');
      expect(res.text).toContain('certificate.txt');
      
      // Check for preview links (should have 4 preview buttons for 4 documents)
      const previewMatches = res.text.match(/Preview/g);
      expect(previewMatches).toHaveLength(4);
      
      // Check for document actions
      expect(res.text).toContain('document-actions');
      
      // Check for proper preview attributes
      expect(res.text).toContain('target="_blank"');
      expect(res.text).toContain('rel="noopener noreferrer"');
      
      // Check that each document has its own preview button
      expect(res.text).toContain('resume.pdf');
      expect(res.text).toContain('cover-letter.docx');
      expect(res.text).toContain('photo.jpg');
      expect(res.text).toContain('certificate.txt');
      
      // Verify no thumbnail elements are present
      expect(res.text).not.toContain('document-thumbnail');
      expect(res.text).not.toContain('document-thumbnail-container');
      expect(res.text).not.toContain('document-thumbnail-img');
    });

    test('should show appropriate file type icons', async () => {
      const mockData = Buffer.from(JSON.stringify({
        candidateId: candidate._id.toString(),
        withDoc: true,
        sharedBy: 'Test User',
        sharedAt: new Date().toISOString()
      })).toString('base64');

      const res = await request(app)
        .get(`/v1/candidates/public/candidate/${candidate._id}`)
        .query({
          token: 'mock-token',
          data: mockData
        })
        .expect(httpStatus.OK);

      // Check for PDF icon
      expect(res.text).toContain('📕');
      // Check for Word document icon
      expect(res.text).toContain('📘');
      // Check for image icon
      expect(res.text).toContain('🖼️');
      // Check for text file icon
      expect(res.text).toContain('📝');
    });

    test('should not show documents when withDoc=false', async () => {
      const mockData = Buffer.from(JSON.stringify({
        candidateId: candidate._id.toString(),
        withDoc: false,
        sharedBy: 'Test User',
        sharedAt: new Date().toISOString()
      })).toString('base64');

      const res = await request(app)
        .get(`/v1/candidates/public/candidate/${candidate._id}`)
        .query({
          token: 'mock-token',
          data: mockData
        })
        .expect(httpStatus.OK);

      expect(res.text).not.toContain('📄 Documents');
      expect(res.text).not.toContain('resume.pdf');
      expect(res.text).not.toContain('Preview');
    });

    test('should display image thumbnails correctly', async () => {
      const mockData = Buffer.from(JSON.stringify({
        candidateId: candidate._id.toString(),
        withDoc: true,
        sharedBy: 'Test User',
        sharedAt: new Date().toISOString()
      })).toString('base64');

      const res = await request(app)
        .get(`/v1/candidates/public/candidate/${candidate._id}`)
        .query({
          token: 'mock-token',
          data: mockData
        })
        .expect(httpStatus.OK);

      // Check that document names are displayed
      expect(res.text).toContain('photo.jpg');
      
      // Verify no thumbnail elements are present
      expect(res.text).not.toContain('document-thumbnail');
      expect(res.text).not.toContain('document-thumbnail-container');
      expect(res.text).not.toContain('document-thumbnail-img');
    });
  });
});
