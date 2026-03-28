const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');

describe('API Endpoints', () => {
  beforeAll(async () => {
    // Connect to a test database
    const url = process.env.MONGO_URI || 'mongodb://localhost:27017/game_web_test';
    await mongoose.connect(url);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('GET / should return API running message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('Game_Web API is running...');
  });

  it('GET /api/shop/user/NonExistentUser should return 404', async () => {
    const res = await request(app).get('/api/shop/user/NonExistentUser');
    expect(res.statusCode).toEqual(404);
  });
});
