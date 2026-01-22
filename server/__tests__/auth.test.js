// Test untuk authController (register, login, google sign-in)

const request = require('supertest');
const app = require('../app');
const { User } = require('../models');
const { signToken } = require('../helpers/jwt');

describe('Auth Controller', () => {
  // Cleanup database sebelum setiap test
  beforeEach(async () => {
    await User.destroy({ where: {}, truncate: true, cascade: true });
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', 'test@example.com');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 400 if email is missing', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 if email already exists', async () => {
      // Create user first
      await User.create({
        email: 'test@example.com',
        password: 'password123'
      });

      // Try to register with same email
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'newpassword'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 if email format is invalid', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 if password is too short', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      await User.create({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');
      expect(typeof response.body.access_token).toBe('string');
    });

    it('should return 400 if email is missing', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 if email does not exist', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 if password is incorrect', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /auth/google-login', () => {
    // Mock OAuth2Client
    const { OAuth2Client } = require('google-auth-library');
    
    beforeEach(() => {
      // Mock verifyIdToken
      OAuth2Client.prototype.verifyIdToken = jest.fn();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should login/register with Google successfully', async () => {
      // Mock Google token verification
      OAuth2Client.prototype.verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'google-user-id-123',
          email: 'googleuser@gmail.com',
          name: 'Google User'
        })
      });

      const response = await request(app)
        .post('/auth/google-login')
        .send({
          id_token: 'mock-google-token'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'googleuser@gmail.com');
      expect(response.body).toHaveProperty('isNewUser', true);
    });

    it('should login existing Google user', async () => {
      // Create existing Google user
      await User.create({
        email: 'googleuser@gmail.com',
        password: 'google-oauth-no-password'
      });

      // Mock Google token verification
      OAuth2Client.prototype.verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'google-user-id-123',
          email: 'googleuser@gmail.com',
          name: 'Google User'
        })
      });

      const response = await request(app)
        .post('/auth/google-login')
        .send({
          id_token: 'mock-google-token'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('isNewUser', false);
    });

    it('should return 400 if Google token is missing', async () => {
      const response = await request(app)
        .post('/auth/google-login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return error if Google token verification fails', async () => {
      // Mock verification failure
      OAuth2Client.prototype.verifyIdToken.mockRejectedValue(
        new Error('Invalid token')
      );

      const response = await request(app)
        .post('/auth/google-login')
        .send({
          id_token: 'invalid-token'
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty('message');
    });
  });
});
