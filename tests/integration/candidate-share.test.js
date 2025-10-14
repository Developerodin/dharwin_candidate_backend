import request from 'supertest';
import faker from 'faker';
import httpStatus from 'http-status';
import app from '../../src/app.js';
import setupTestDB from '../utils/setupTestDB.js';

import { userOne, userTwo, admin, insertUsers } from '../fixtures/user.fixture';
import { userOneAccessToken, adminAccessToken } from '../fixtures/token.fixture';
import Candidate from '../../src/models/candidate.model.js';

setupTestDB();

describe('Candidate Share routes', () => {
  describe('POST /v1/candidates/share/:candidateId', () => {
    let candidate;
    let candidateOwner;

    beforeEach(async () => {
      // Create a candidate owner user
      candidateOwner = {
        name: faker.name.findName(),
        email: faker.internet.email().toLowerCase(),
        password: 'password1',
        role: 'user',
      };

      await insertUsers([admin, candidateOwner]);

      // Create a candidate
      candidate = await Candidate.create({
        owner: candidateOwner._id,
        adminId: admin._id,
        fullName: faker.name.findName(),
        email: faker.internet.email().toLowerCase(),
        phoneNumber: '9876543210',
        shortBio: 'Test candidate bio',
        qualifications: [{
          degree: 'Bachelor of Technology',
          institute: 'Test University',
          startYear: 2018,
          endYear: 2022
        }],
        experiences: [{
          company: 'Test Company',
          role: 'Software Developer',
          startDate: new Date('2022-01-01'),
          endDate: new Date('2023-12-31'),
          description: 'Worked on web development'
        }],
        documents: [{
          label: 'Resume',
          url: 'https://example.com/resume.pdf',
          originalName: 'resume.pdf',
          size: 1024000,
          mimeType: 'application/pdf'
        }]
      });
    });

    test('should return 200 and successfully share candidate profile without documents', async () => {
      const shareData = {
        email: faker.internet.email().toLowerCase(),
        withDoc: false
      };

      const res = await request(app)
        .post(`/v1/candidates/share/${candidate._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(shareData)
        .expect(httpStatus.OK);

      expect(res.body).toEqual({
        success: true,
        message: 'Candidate profile shared successfully',
        data: {
          candidateId: candidate._id.toString(),
          candidateName: candidate.fullName,
          recipientEmail: shareData.email,
          withDoc: false,
          publicUrl: expect.stringContaining('/v1/candidates/public/candidate/'),
          sharedBy: admin.name,
          sharedAt: expect.any(String)
        }
      });
    });

    test('should return 200 and successfully share candidate profile with documents', async () => {
      const shareData = {
        email: faker.internet.email().toLowerCase(),
        withDoc: true
      };

      const res = await request(app)
        .post(`/v1/candidates/share/${candidate._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(shareData)
        .expect(httpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.withDoc).toBe(true);
      expect(res.body.data.publicUrl).toContain('/v1/candidates/public/candidate/');
    });

    test('should return 200 when candidate shares their own profile', async () => {
      const shareData = {
        email: faker.internet.email().toLowerCase(),
        withDoc: false
      };

      const res = await request(app)
        .post(`/v1/candidates/share/${candidate._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(shareData)
        .expect(httpStatus.OK);

      expect(res.body.success).toBe(true);
      expect(res.body.data.sharedBy).toBe(userOne.name);
    });

    test('should return 403 when user tries to share someone else profile', async () => {
      const shareData = {
        email: faker.internet.email().toLowerCase(),
        withDoc: false
      };

      await request(app)
        .post(`/v1/candidates/share/${candidate._id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(shareData)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 400 when email is invalid', async () => {
      const shareData = {
        email: 'invalid-email',
        withDoc: false
      };

      await request(app)
        .post(`/v1/candidates/share/${candidate._id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(shareData)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 when candidate does not exist', async () => {
      const shareData = {
        email: faker.internet.email().toLowerCase(),
        withDoc: false
      };

      const fakeCandidateId = '507f1f77bcf86cd799439011'; // Valid ObjectId format

      await request(app)
        .post(`/v1/candidates/share/${fakeCandidateId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(shareData)
        .expect(httpStatus.NOT_FOUND);
    });

    test('should return 401 when user is not authenticated', async () => {
      const shareData = {
        email: faker.internet.email().toLowerCase(),
        withDoc: false
      };

      await request(app)
        .post(`/v1/candidates/share/${candidate._id}`)
        .send(shareData)
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /v1/candidates/public/:candidateId', () => {
    let candidate;

    beforeEach(async () => {
      await insertUsers([admin]);

      candidate = await Candidate.create({
        owner: admin._id,
        adminId: admin._id,
        fullName: faker.name.findName(),
        email: faker.internet.email().toLowerCase(),
        phoneNumber: '9876543210',
        shortBio: 'Test candidate bio',
        qualifications: [{
          degree: 'Bachelor of Technology',
          institute: 'Test University',
          startYear: 2018,
          endYear: 2022
        }],
        experiences: [{
          company: 'Test Company',
          role: 'Software Developer',
          startDate: new Date('2022-01-01'),
          endDate: new Date('2023-12-31'),
          description: 'Worked on web development'
        }]
      });
    });

    test('should return 200 and display public candidate profile HTML', async () => {
      // Create a mock token and data
      const mockData = Buffer.from(JSON.stringify({
        candidateId: candidate._id.toString(),
        withDoc: false,
        sharedBy: 'Test User',
        sharedAt: new Date().toISOString()
      })).toString('base64');

      const res = await request(app)
        .get(`/v1/candidates/public/${candidate._id}`)
        .query({
          token: 'mock-token',
          data: mockData
        })
        .expect(httpStatus.OK);

      expect(res.headers['content-type']).toContain('text/html');
      expect(res.text).toContain(candidate.fullName);
      expect(res.text).toContain(candidate.email);
      expect(res.text).toContain('Dharwin');
    });

    test('should return 400 when token or data is missing', async () => {
      await request(app)
        .get(`/v1/candidates/public/${candidate._id}`)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 when data is invalid', async () => {
      await request(app)
        .get(`/v1/candidates/public/${candidate._id}`)
        .query({
          token: 'mock-token',
          data: 'invalid-data'
        })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 when candidate does not exist', async () => {
      const mockData = Buffer.from(JSON.stringify({
        candidateId: '507f1f77bcf86cd799439011',
        withDoc: false,
        sharedBy: 'Test User',
        sharedAt: new Date().toISOString()
      })).toString('base64');

      await request(app)
        .get('/v1/candidates/public/507f1f77bcf86cd799439011')
        .query({
          token: 'mock-token',
          data: mockData
        })
        .expect(httpStatus.NOT_FOUND);
    });
  });
});
