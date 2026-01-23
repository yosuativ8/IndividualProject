// Test untuk app.js (root endpoint dan health check)

const request = require('supertest');
const app = require('../app');

describe('App Root Endpoint', () => {
  describe('GET /', () => {
    it('should return health check information', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Tourism Places API Server');
      expect(response.body).toHaveProperty('status', 'running');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body).toHaveProperty('apiKeys');
    });

    it('should show available endpoints', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body.endpoints).toHaveProperty('auth');
      expect(response.body.endpoints).toHaveProperty('places');
      expect(response.body.endpoints).toHaveProperty('wishlist');
      expect(response.body.endpoints).toHaveProperty('geoapify');
      expect(response.body.endpoints).toHaveProperty('gemini');
    });

    it('should show API keys status', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body.apiKeys).toHaveProperty('jwt');
      expect(response.body.apiKeys).toHaveProperty('google');
      expect(response.body.apiKeys).toHaveProperty('geoapify');
      expect(response.body.apiKeys).toHaveProperty('gemini');
    });
  });

  describe('404 Not Found', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/non-existent-route');

      expect(response.status).toBe(404);
    });
  });
});
