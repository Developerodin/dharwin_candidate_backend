import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../src/app.js';
import setupTestDB from '../utils/setupTestDB.js';
import { userOne, insertUsers } from '../fixtures/user.fixture.js';
import { generateAuthTokens } from '../../src/services/token.service.js';

setupTestDB();

describe('Meeting routes', () => {
  let userOneAccessToken;

  beforeEach(async () => {
    await insertUsers([userOne]);
    const userOneTokens = await generateAuthTokens(userOne);
    userOneAccessToken = userOneTokens.access.token;
  });

  describe('POST /api/v1/meetings', () => {
    test('should return 201 and create meeting when request data is ok', async () => {
      const meetingData = {
        title: 'Test Meeting',
        description: 'This is a test meeting',
        duration: 60,
        maxParticipants: 10,
      };

      const res = await request(app)
        .post('/api/v1/meetings')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(meetingData)
        .expect(httpStatus.CREATED);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('meetingId');
      expect(res.body.data).toHaveProperty('title', 'Test Meeting');
      expect(res.body.data).toHaveProperty('meetingUrl');
      expect(res.body.data).toHaveProperty('joinToken');
      expect(res.body.data).toHaveProperty('channelName');
      expect(res.body.data).toHaveProperty('status', 'scheduled');
    });

    test('should return 400 error if title is missing', async () => {
      const meetingData = {
        description: 'This is a test meeting',
        duration: 60,
      };

      await request(app)
        .post('/api/v1/meetings')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(meetingData)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 401 error if access token is missing', async () => {
      const meetingData = {
        title: 'Test Meeting',
        description: 'This is a test meeting',
      };

      await request(app)
        .post('/api/v1/meetings')
        .send(meetingData)
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /api/v1/meetings/:meetingId/join', () => {
    let meetingId, joinToken;

    beforeEach(async () => {
      // Create a meeting first
      const meetingData = {
        title: 'Test Meeting for Join',
        description: 'This is a test meeting for joining',
        duration: 60,
        maxParticipants: 10,
      };

      const createRes = await request(app)
        .post('/api/v1/meetings')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(meetingData)
        .expect(httpStatus.CREATED);

      meetingId = createRes.body.data.meetingId;
      joinToken = createRes.body.data.joinToken;
    });

    test('should return 200 and join meeting when valid data is provided', async () => {
      const joinData = {
        joinToken,
        name: 'John Doe',
        email: 'john.doe@example.com',
      };

      const res = await request(app)
        .post(`/api/v1/meetings/${meetingId}/join`)
        .send(joinData)
        .expect(httpStatus.OK);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('meeting');
      expect(res.body.data).toHaveProperty('participant');
      expect(res.body.data).toHaveProperty('agoraToken');
      expect(res.body.data.participant).toHaveProperty('name', 'John Doe');
      expect(res.body.data.participant).toHaveProperty('email', 'john.doe@example.com');
    });

    test('should return 400 error if joinToken is missing', async () => {
      const joinData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
      };

      await request(app)
        .post(`/api/v1/meetings/${meetingId}/join`)
        .send(joinData)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if name is missing', async () => {
      const joinData = {
        joinToken,
        email: 'john.doe@example.com',
      };

      await request(app)
        .post(`/api/v1/meetings/${meetingId}/join`)
        .send(joinData)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if email is missing', async () => {
      const joinData = {
        joinToken,
        name: 'John Doe',
      };

      await request(app)
        .post(`/api/v1/meetings/${meetingId}/join`)
        .send(joinData)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 error if meeting not found', async () => {
      const joinData = {
        joinToken: 'invalid_token',
        name: 'John Doe',
        email: 'john.doe@example.com',
      };

      await request(app)
        .post('/api/v1/meetings/invalid_meeting_id/join')
        .send(joinData)
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('GET /api/v1/meetings/:meetingId/info', () => {
    let meetingId, joinToken;

    beforeEach(async () => {
      // Create a meeting first
      const meetingData = {
        title: 'Test Meeting for Info',
        description: 'This is a test meeting for info',
        duration: 60,
        maxParticipants: 10,
      };

      const createRes = await request(app)
        .post('/api/v1/meetings')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(meetingData)
        .expect(httpStatus.CREATED);

      meetingId = createRes.body.data.meetingId;
      joinToken = createRes.body.data.joinToken;
    });

    test('should return 200 and get meeting info when valid token is provided', async () => {
      const res = await request(app)
        .get(`/api/v1/meetings/${meetingId}/info`)
        .query({ token: joinToken })
        .expect(httpStatus.OK);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('meetingId', meetingId);
      expect(res.body.data).toHaveProperty('title', 'Test Meeting for Info');
      expect(res.body.data).toHaveProperty('status', 'scheduled');
      expect(res.body.data).toHaveProperty('canJoin', true);
    });

    test('should return 400 error if token is missing', async () => {
      await request(app)
        .get(`/api/v1/meetings/${meetingId}/info`)
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 404 error if meeting not found', async () => {
      await request(app)
        .get('/api/v1/meetings/invalid_meeting_id/info')
        .query({ token: 'invalid_token' })
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('GET /api/v1/meetings', () => {
    beforeEach(async () => {
      // Create a few meetings
      const meetings = [
        {
          title: 'Meeting 1',
          description: 'First meeting',
          duration: 60,
        },
        {
          title: 'Meeting 2',
          description: 'Second meeting',
          duration: 90,
        },
      ];

      for (const meetingData of meetings) {
        await request(app)
          .post('/api/v1/meetings')
          .set('Authorization', `Bearer ${userOneAccessToken}`)
          .send(meetingData)
          .expect(httpStatus.CREATED);
      }
    });

    test('should return 200 and get user meetings', async () => {
      const res = await request(app)
        .get('/api/v1/meetings')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('meetings');
      expect(res.body.data).toHaveProperty('pagination');
      expect(res.body.data.meetings).toHaveLength(2);
    });

    test('should return 401 error if access token is missing', async () => {
      await request(app)
        .get('/api/v1/meetings')
        .expect(httpStatus.UNAUTHORIZED);
    });
  });
});
