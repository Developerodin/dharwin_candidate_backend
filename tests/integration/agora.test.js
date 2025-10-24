import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../src/app.js';
import setupTestDB from '../utils/setupTestDB.js';
import { userOne, userTwo, insertUsers } from '../fixtures/user.fixture.js';
import { generateAuthTokens } from '../../src/services/token.service.js';

setupTestDB();

describe('Agora token routes', () => {
  let userOneAccessToken;
  let userTwoAccessToken;

  beforeEach(async () => {
    await insertUsers([userOne, userTwo]);
    const userOneTokens = await generateAuthTokens(userOne);
    const userTwoTokens = await generateAuthTokens(userTwo);
    userOneAccessToken = userOneTokens.access.token;
    userTwoAccessToken = userTwoTokens.access.token;
  });

  describe('POST /api/v1/agora/token', () => {
    test('should return 200 and generate token when request data is ok', async () => {
      const res = await request(app)
        .post('/api/v1/agora/token')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({
          channelName: 'test-channel',
          uid: 12345,
          role: 1,
          expirationTimeInSeconds: 3600,
        })
        .expect(httpStatus.OK);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('channelName', 'test-channel');
      expect(res.body.data).toHaveProperty('uid', 12345);
      expect(res.body.data).toHaveProperty('role', 1);
      expect(res.body.data).toHaveProperty('expirationTime');
      expect(res.body.data).toHaveProperty('appId');
    });

    test('should return 200 and generate token with account', async () => {
      const res = await request(app)
        .post('/api/v1/agora/token')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({
          channelName: 'test-channel',
          account: 'user123',
          role: 2,
          expirationTimeInSeconds: 1800,
        })
        .expect(httpStatus.OK);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('channelName', 'test-channel');
      expect(res.body.data).toHaveProperty('account', 'user123');
      expect(res.body.data).toHaveProperty('role', 2);
      expect(res.body.data).toHaveProperty('expirationTime');
      expect(res.body.data).toHaveProperty('appId');
    });

    test('should return 400 error if channelName is missing', async () => {
      await request(app)
        .post('/api/v1/agora/token')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({
          uid: 12345,
          role: 1,
        })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if both uid and account are missing', async () => {
      await request(app)
        .post('/api/v1/agora/token')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({
          channelName: 'test-channel',
          role: 1,
        })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if both uid and account are provided', async () => {
      await request(app)
        .post('/api/v1/agora/token')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({
          channelName: 'test-channel',
          uid: 12345,
          account: 'user123',
          role: 1,
        })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 401 error if access token is missing', async () => {
      await request(app)
        .post('/api/v1/agora/token')
        .send({
          channelName: 'test-channel',
          uid: 12345,
          role: 1,
        })
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('POST /api/v1/agora/tokens', () => {
    test('should return 200 and generate multiple tokens', async () => {
      const res = await request(app)
        .post('/api/v1/agora/tokens')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({
          users: [
            {
              channelName: 'test-channel-1',
              uid: 12345,
              role: 1,
            },
            {
              channelName: 'test-channel-2',
              uid: 12346,
              role: 2,
            },
          ],
          expirationTimeInSeconds: 3600,
        })
        .expect(httpStatus.OK);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('tokens');
      expect(res.body.data).toHaveProperty('count', 2);
      expect(res.body.data.tokens).toHaveLength(2);
      expect(res.body.data.tokens[0]).toHaveProperty('token');
      expect(res.body.data.tokens[0]).toHaveProperty('channelName', 'test-channel-1');
      expect(res.body.data.tokens[1]).toHaveProperty('token');
      expect(res.body.data.tokens[1]).toHaveProperty('channelName', 'test-channel-2');
    });

    test('should return 400 error if users array is empty', async () => {
      await request(app)
        .post('/api/v1/agora/tokens')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({
          users: [],
          expirationTimeInSeconds: 3600,
        })
        .expect(httpStatus.BAD_REQUEST);
    });

    test('should return 400 error if users array has more than 50 items', async () => {
      const users = Array.from({ length: 51 }, (_, i) => ({
        channelName: `test-channel-${i}`,
        uid: i + 1,
        role: 1,
      }));

      await request(app)
        .post('/api/v1/agora/tokens')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send({
          users,
          expirationTimeInSeconds: 3600,
        })
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('GET /api/v1/agora/config', () => {
    test('should return 200 and get Agora configuration', async () => {
      const res = await request(app)
        .get('/api/v1/agora/config')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('appId');
    });

    test('should return 401 error if access token is missing', async () => {
      await request(app)
        .get('/api/v1/agora/config')
        .expect(httpStatus.UNAUTHORIZED);
    });
  });
});
