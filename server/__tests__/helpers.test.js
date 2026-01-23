// Test untuk helpers (bcrypt, jwt)

// Set JWT_SECRET before importing helpers
process.env.JWT_SECRET = 'test-jwt-secret-for-helpers-test';

const bcrypt = require('../helpers/bcrypt');
const jwt = require('../helpers/jwt');

describe('Helper Tests', () => {
  describe('Bcrypt Helper', () => {
    const plainPassword = 'mySecretPassword123';

    describe('hashPassword', () => {
      it('should hash a password', async () => {
        const hashed = await bcrypt.hashPassword(plainPassword);

        expect(hashed).toBeDefined();
        expect(typeof hashed).toBe('string');
        expect(hashed).not.toBe(plainPassword);
        expect(hashed.length).toBeGreaterThan(0);
      });

      it('should generate different hashes for same password', async () => {
        const hash1 = await bcrypt.hashPassword(plainPassword);
        const hash2 = await bcrypt.hashPassword(plainPassword);

        expect(hash1).not.toBe(hash2);
      });

      it('should create bcrypt hash format', async () => {
        const hashed = await bcrypt.hashPassword(plainPassword);

        // Bcrypt hashes start with $2a$, $2b$, or $2y$
        expect(hashed).toMatch(/^\$2[aby]\$/);
      });

      it('should handle empty string', async () => {
        const hashed = await bcrypt.hashPassword('');

        expect(hashed).toBeDefined();
        expect(typeof hashed).toBe('string');
      });

      it('should handle long passwords', async () => {
        const longPassword = 'a'.repeat(100);
        const hashed = await bcrypt.hashPassword(longPassword);

        expect(hashed).toBeDefined();
        expect(typeof hashed).toBe('string');
      });

      it('should handle special characters', async () => {
        const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        const hashed = await bcrypt.hashPassword(specialPassword);

        expect(hashed).toBeDefined();
        expect(typeof hashed).toBe('string');
      });
    });

    describe('comparePassword', () => {
      let hashedPassword;

      beforeEach(async () => {
        hashedPassword = await bcrypt.hashPassword(plainPassword);
      });

      it('should return true for correct password', async () => {
        const isMatch = await bcrypt.comparePassword(plainPassword, hashedPassword);

        expect(isMatch).toBe(true);
      });

      it('should return false for incorrect password', async () => {
        const isMatch = await bcrypt.comparePassword('wrongPassword', hashedPassword);

        expect(isMatch).toBe(false);
      });

      it('should be case sensitive', async () => {
        const upperCasePassword = plainPassword.toUpperCase();
        const isMatch = await bcrypt.comparePassword(upperCasePassword, hashedPassword);

        expect(isMatch).toBe(false);
      });

      it('should return false for empty string', async () => {
        const isMatch = await bcrypt.comparePassword('', hashedPassword);

        expect(isMatch).toBe(false);
      });

      it('should handle comparing with invalid hash', async () => {
        const isMatch = await bcrypt.comparePassword(plainPassword, 'not-a-valid-hash');

        expect(isMatch).toBe(false);
      });
    });
  });

  describe('JWT Helper', () => {
    const payload = {
      id: 1,
      email: 'test@example.com'
    };

    describe('signToken', () => {
      it('should create a JWT token', () => {
        const token = jwt.signToken(payload);

        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
        expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
      });

      it('should create different tokens for same payload at different times', async () => {
        const token1 = jwt.signToken(payload);
        // Wait 1 second to ensure different iat timestamp
        await new Promise(resolve => setTimeout(resolve, 1000));
        const token2 = jwt.signToken(payload);

        // Tokens should be different because of 'iat' (issued at) claim
        expect(token1).not.toBe(token2);
      });

      it('should include payload data', () => {
        const token = jwt.signToken(payload);
        const decoded = jwt.verifyToken(token);

        expect(decoded.id).toBe(payload.id);
        expect(decoded.email).toBe(payload.email);
      });

      it('should handle minimal payload', () => {
        const minimalPayload = { id: 1 };
        const token = jwt.signToken(minimalPayload);

        expect(token).toBeDefined();
        expect(typeof token).toBe('string');
      });

      it('should handle complex payload', () => {
        const complexPayload = {
          id: 1,
          email: 'test@example.com',
          role: 'admin',
          permissions: ['read', 'write']
        };
        const token = jwt.signToken(complexPayload);
        const decoded = jwt.verifyToken(token);

        expect(decoded.id).toBe(complexPayload.id);
        expect(decoded.email).toBe(complexPayload.email);
        expect(decoded.role).toBe(complexPayload.role);
        expect(decoded.permissions).toEqual(complexPayload.permissions);
      });
    });

    describe('verifyToken', () => {
      it('should verify and decode a valid token', () => {
        const token = jwt.signToken(payload);
        const decoded = jwt.verifyToken(token);

        expect(decoded).toBeDefined();
        expect(decoded.id).toBe(payload.id);
        expect(decoded.email).toBe(payload.email);
        expect(decoded).toHaveProperty('iat'); // issued at
      });

      it('should throw error for invalid token', () => {
        expect(() => {
          jwt.verifyToken('invalid-token');
        }).toThrow();
      });

      it('should throw error for malformed token', () => {
        expect(() => {
          jwt.verifyToken('not.a.token');
        }).toThrow();
      });

      it('should throw error for empty token', () => {
        expect(() => {
          jwt.verifyToken('');
        }).toThrow();
      });

      it('should throw error for token with wrong secret', () => {
        const jwtLib = require('jsonwebtoken');
        const tokenWithWrongSecret = jwtLib.sign(payload, 'wrong-secret');

        expect(() => {
          jwt.verifyToken(tokenWithWrongSecret);
        }).toThrow();
      });

      it('should throw error for expired token', () => {
        const jwtLib = require('jsonwebtoken');
        const expiredToken = jwtLib.sign(
          payload,
          process.env.JWT_SECRET,
          { expiresIn: '-1h' }
        );

        expect(() => {
          jwt.verifyToken(expiredToken);
        }).toThrow();
      });

      it('should verify token created by signToken', () => {
        const token = jwt.signToken(payload);
        const decoded = jwt.verifyToken(token);

        expect(decoded.id).toBe(payload.id);
        expect(decoded.email).toBe(payload.email);
      });
    });

    describe('Token lifecycle', () => {
      it('should create and verify token successfully', () => {
        const testPayload = {
          id: 123,
          email: 'lifecycle@test.com',
          name: 'Test User'
        };

        const token = jwt.signToken(testPayload);
        const decoded = jwt.verifyToken(token);

        expect(decoded.id).toBe(testPayload.id);
        expect(decoded.email).toBe(testPayload.email);
        expect(decoded.name).toBe(testPayload.name);
      });

      it('should include standard JWT claims', () => {
        const token = jwt.signToken(payload);
        const decoded = jwt.verifyToken(token);

        expect(decoded).toHaveProperty('iat'); // issued at timestamp
        expect(typeof decoded.iat).toBe('number');
      });
    });
  });
});
