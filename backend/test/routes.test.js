// backend/test/routes.test.js
const request = require('supertest');
const app = require('../server');

describe('API Routes', () => {
  // Test auth routes
  describe('Auth Routes', () => {
    test('should have /api/auth/register route', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({});
      
      expect(response.status).not.toBe(404);
    });

    test('should have /api/auth/login route', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});
      
      expect(response.status).not.toBe(404);
    });

    test('should have /api/auth/me route', async () => {
      const response = await request(app)
        .get('/api/auth/me');
      
      expect(response.status).not.toBe(404);
    });
  });

  // Test other routes
  describe('Equipment Routes', () => {
    test('should have /api/equipment route', async () => {
      const response = await request(app)
        .get('/api/equipment');
      
      expect(response.status).not.toBe(404);
    });
  });

  describe('Task Routes', () => {
    test('should have /api/tasks route', async () => {
      const response = await request(app)
        .get('/api/tasks');
      
      expect(response.status).not.toBe(404);
    });
  });

  describe('Maintenance Routes', () => {
    test('should have /api/maintenance route', async () => {
      const response = await request(app)
        .get('/api/maintenance');
      
      expect(response.status).not.toBe(404);
    });
  });

  describe('User Routes', () => {
    test('should have /api/users route', async () => {
      const response = await request(app)
        .get('/api/users');
      
      expect(response.status).not.toBe(404);
    });
  });
});