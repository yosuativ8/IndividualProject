// Test untuk middleware (authentication, errorHandler)

// Set JWT_SECRET before importing middleware
process.env.JWT_SECRET = 'test-jwt-secret-for-middleware-test';

const authentication = require('../middleware/authentication');
const errorHandler = require('../middleware/errorHandler');
const { User } = require('../models');
const { signToken } = require('../helpers/jwt');
const jwt = require('jsonwebtoken');

describe('Middleware Tests', () => {
  describe('Authentication Middleware', () => {
    let req, res, next;

    beforeEach(async () => {
      // Clear users
      await User.destroy({ where: {}, truncate: true, cascade: true });

      // Setup mock objects
      req = {
        headers: {}
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should authenticate valid token and set req.user', async () => {
      // Create user
      const user = await User.create({
        email: 'test@example.com',
        password: 'password123'
      });

      const token = signToken({ id: user.id, email: user.email });
      req.headers.authorization = `Bearer ${token}`;

      await authentication(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(user.id);
      expect(req.user.email).toBe(user.email);
    });

    it('should return 401 if no authorization header', async () => {
      await authentication(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Unauthorized',
          message: 'Token not provided'
        })
      );
    });

    it('should return 401 if authorization header is malformed', async () => {
      req.headers.authorization = 'InvalidFormat';

      await authentication(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Unauthorized'
        })
      );
    });

    it('should return 401 if token is invalid', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      await authentication(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.stringMatching(/JsonWebTokenError|Unauthorized/)
        })
      );
    });

    it('should return 401 if token is expired', async () => {
      const expiredToken = jwt.sign(
        { id: 1, email: 'test@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Already expired
      );

      req.headers.authorization = `Bearer ${expiredToken}`;

      await authentication(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'TokenExpiredError'
        })
      );
    });

    it('should return 401 if user does not exist', async () => {
      // Create token for non-existent user
      const token = signToken({ id: 99999, email: 'ghost@example.com' });
      req.headers.authorization = `Bearer ${token}`;

      await authentication(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Unauthorized',
          message: 'User not found'
        })
      );
    });

    it('should handle missing Bearer prefix', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'password123'
      });

      const token = signToken({ id: user.id, email: user.email });
      req.headers.authorization = token; // No Bearer prefix

      await authentication(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Unauthorized'
        })
      );
    });
  });

  describe('Error Handler Middleware', () => {
    let req, res, next;

    beforeEach(() => {
      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should handle SequelizeValidationError (400)', () => {
      const error = {
        name: 'SequelizeValidationError',
        errors: [
          { message: 'Email is required' },
          { message: 'Password must be at least 5 characters' }
        ]
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String)
        })
      );
    });

    it('should handle SequelizeUniqueConstraintError (400)', () => {
      const error = {
        name: 'SequelizeUniqueConstraintError',
        errors: [{ message: 'Email already exists' }]
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String)
        })
      );
    });

    it('should handle JsonWebTokenError (401)', () => {
      const error = {
        name: 'JsonWebTokenError',
        message: 'Invalid token'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('token')
        })
      );
    });

    it('should handle TokenExpiredError (401)', () => {
      const error = {
        name: 'TokenExpiredError',
        message: 'Token expired'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle Unauthorized error (401)', () => {
      const error = {
        name: 'Unauthorized',
        message: 'Invalid credentials'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid credentials'
        })
      );
    });

    it('should handle Forbidden error (403)', () => {
      const error = {
        name: 'Forbidden',
        message: 'You are not authorized to access this resource'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('not authorized')
        })
      );
    });

    it('should handle NotFound error (404)', () => {
      const error = {
        name: 'NotFound',
        message: 'Place not found'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Place not found'
        })
      );
    });

    it('should handle BadRequest error (400)', () => {
      const error = {
        name: 'BadRequest',
        message: 'Missing required field'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Missing required field'
        })
      );
    });

    it('should handle ExternalAPIError (502)', () => {
      const error = {
        name: 'ExternalAPIError',
        message: 'Geoapify API request failed'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('API')
        })
      );
    });

    it('should handle generic errors as 500', () => {
      const error = new Error('Something went wrong');

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Internal Server Error'
        })
      );
    });

    it('should handle errors without name property', () => {
      const error = {
        message: 'Random error'
      };

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Internal Server Error'
        })
      );
    });
  });
});
