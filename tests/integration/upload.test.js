import request from 'supertest';
import httpStatus from 'http-status';
import { setupTestDB } from '../utils/setupTestDB.js';
import app from '../../src/app.js';
import { userOne, userTwo, admin, insertUsers } from '../fixtures/user.fixture.js';
import { candidateOne, candidateTwo, insertCandidates } from '../fixtures/candidate.fixture.js';
import { generateAuthTokens } from '../../src/services/token.service.js';

setupTestDB();

describe('Upload routes', () => {
  let newUser;
  let newCandidate;
  let userAccessToken;
  let adminAccessToken;

  beforeEach(async () => {
    await insertUsers([userOne, userTwo, admin]);
    await insertCandidates([candidateOne, candidateTwo]);
    
    newUser = await insertUsers([userOne])[0];
    newCandidate = await insertCandidates([candidateOne])[0];
    
    userAccessToken = await generateAuthTokens(newUser);
    adminAccessToken = await generateAuthTokens(admin);
  });

  describe('POST /v1/upload/presigned-url', () => {
    test('should return 401 error if access token is missing', async () => {
      await request(app)
        .post('/v1/upload/presigned-url')
        .send({
          fileName: 'test.pdf',
          contentType: 'application/pdf',
        })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 400 error if fileName is missing', async () => {
      await request(app)
        .post('/v1/upload/presigned-url')
        .set('Authorization', `Bearer ${userAccessToken.access.token}`)
        .send({
          contentType: 'application/pdf',
        })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if contentType is missing', async () => {
      await request(app)
        .post('/v1/upload/presigned-url')
        .set('Authorization', `Bearer ${userAccessToken.access.token}`)
        .send({
          fileName: 'test.pdf',
        })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 200 and generate presigned URL if request is valid', async () => {
      const res = await request(app)
        .post('/v1/upload/presigned-url')
        .set('Authorization', `Bearer ${userAccessToken.access.token}`)
        .send({
          fileName: 'test.pdf',
          contentType: 'application/pdf',
          candidateId: newCandidate._id.toString(),
        })
        .expect(httpStatus.OK);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('presignedUrl');
      expect(res.body.data).toHaveProperty('fileKey');
      expect(res.body.data).toHaveProperty('expiresIn');
    });
  });

  describe('POST /v1/upload/confirm', () => {
    test('should return 401 error if access token is missing', async () => {
      await request(app)
        .post('/v1/upload/confirm')
        .send({
          fileKey: 'documents/user123/test.pdf',
          label: 'Test Document',
          candidateId: newCandidate._id.toString(),
        })
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 400 error if fileKey is missing', async () => {
      await request(app)
        .post('/v1/upload/confirm')
        .set('Authorization', `Bearer ${userAccessToken.access.token}`)
        .send({
          label: 'Test Document',
          candidateId: newCandidate._id.toString(),
        })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if label is missing', async () => {
      await request(app)
        .post('/v1/upload/confirm')
        .set('Authorization', `Bearer ${userAccessToken.access.token}`)
        .send({
          fileKey: 'documents/user123/test.pdf',
          candidateId: newCandidate._id.toString(),
        })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if candidateId is missing', async () => {
      await request(app)
        .post('/v1/upload/confirm')
        .set('Authorization', `Bearer ${userAccessToken.access.token}`)
        .send({
          fileKey: 'documents/user123/test.pdf',
          label: 'Test Document',
        })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 error if candidate not found', async () => {
      const fakeCandidateId = '507f1f77bcf86cd799439011';
      await request(app)
        .post('/v1/upload/confirm')
        .set('Authorization', `Bearer ${userAccessToken.access.token}`)
        .send({
          fileKey: 'documents/user123/test.pdf',
          label: 'Test Document',
          candidateId: fakeCandidateId,
        })
        .expect(httpStatus.NOT_FOUND);
    });
  });
});
