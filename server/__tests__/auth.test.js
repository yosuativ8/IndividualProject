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
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).not.toHaveProperty('password');
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
      expect(response.body.message).toContain('already registered');
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
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
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

    it('should login existing Google user successfully', async () => {
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
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'googleuser@gmail.com');
    });

    it('should return 401 if user not registered', async () => {
      // Mock Google token verification for non-existent user
      OAuth2Client.prototype.verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'google-user-id-456',
          email: 'nonexistent@gmail.com',
          name: 'Non Existent User'
        })
      });

      const response = await request(app)
        .post('/auth/google-login')
        .send({
          id_token: 'mock-google-token'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('not found');
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

  describe('POST /auth/google-register', () => {
    const { OAuth2Client } = require('google-auth-library');
    
    beforeEach(() => {
      OAuth2Client.prototype.verifyIdToken = jest.fn();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should register with Google successfully', async () => {
      OAuth2Client.prototype.verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'google-user-id-456',
          email: 'newgoogleuser@gmail.com',
          name: 'New Google User'
        })
      });

      const response = await request(app)
        .post('/auth/google-register')
        .send({
          id_token: 'mock-google-token'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'newgoogleuser@gmail.com');
      expect(response.body).toHaveProperty('message', 'Registration successful!');
    });

    it('should return 400 if email already registered', async () => {
      // Create existing user
      await User.create({
        email: 'existinguser@gmail.com',
        password: 'password123'
      });

      OAuth2Client.prototype.verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'google-user-id-789',
          email: 'existinguser@gmail.com',
          name: 'Existing User'
        })
      });

      const response = await request(app)
        .post('/auth/google-register')
        .send({
          id_token: 'mock-google-token'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already registered');
    });

    it('should return error if Google token verification fails', async () => {
      OAuth2Client.prototype.verifyIdToken.mockRejectedValue(
        new Error('Invalid token')
      );

      const response = await request(app)
        .post('/auth/google-register')
        .send({
          id_token: 'invalid-token'
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /auth/google-signin', () => {
    const { OAuth2Client } = require('google-auth-library');
    
    beforeEach(() => {
      OAuth2Client.prototype.verifyIdToken = jest.fn();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should sign in with Google successfully (new user)', async () => {
      OAuth2Client.prototype.verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'google-user-id-999',
          email: 'signinuser@gmail.com',
          name: 'Sign In User'
        })
      });

      const response = await request(app)
        .post('/auth/google-sign-in')
        .send({
          id_token: 'mock-google-token'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('isNewUser', true);
    });

    it('should sign in with Google successfully (existing user)', async () => {
      // Create existing user first
      await User.create({
        email: 'existingsignin@gmail.com',
        password: 'google-oauth-no-password'
      });

      OAuth2Client.prototype.verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          sub: 'google-user-id-888',
          email: 'existingsignin@gmail.com',
          name: 'Existing Sign In User'
        })
      });

      const response = await request(app)
        .post('/auth/google-sign-in')
        .send({
          id_token: 'mock-google-token'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('isNewUser', false);
    });

    it('should return error if Google token verification fails', async () => {
      OAuth2Client.prototype.verifyIdToken.mockRejectedValue(
        new Error('Invalid token')
      );

      const response = await request(app)
        .post('/auth/google-sign-in')
        .send({
          id_token: 'invalid-token'
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty('message');
    });
  });
});
