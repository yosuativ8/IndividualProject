// Test untuk userDestinationController (wishlist CRUD)

const request = require('supertest');
const app = require('../app');
const { User, Place, UserDestination } = require('../models');
const { signToken } = require('../helpers/jwt');

describe('UserDestination Controller', () => {
  let user1, user2, place1, place2, token1, token2;

  beforeEach(async () => {
    // Clear all data
    await UserDestination.destroy({ where: {}, truncate: true, cascade: true });
    await Place.destroy({ where: {}, truncate: true, cascade: true });
    await User.destroy({ where: {}, truncate: true, cascade: true });

    // Create test users
    user1 = await User.create({
      email: 'user1@test.com',
      password: 'password123'
    });

    user2 = await User.create({
      email: 'user2@test.com',
      password: 'password123'
    });

    // Create JWT tokens
    token1 = signToken({ id: user1.id, email: user1.email });
    token2 = signToken({ id: user2.id, email: user2.email });

    // Create test places
    place1 = await Place.create({
      name: 'Pantai Kuta',
      description: 'Pantai terkenal di Bali',
      location: 'Bali',
      latitude: -8.718184,
      longitude: 115.168610,
      imageUrl: 'http://example.com/kuta.jpg',
      category: 'Pantai',
      rating: 4.5
    });

    place2 = await Place.create({
      name: 'Gunung Bromo',
      description: 'Gunung berapi aktif',
      location: 'Jawa Timur',
      latitude: -7.942494,
      longitude: 112.953011,
      imageUrl: 'http://example.com/bromo.jpg',
      category: 'Gunung',
      rating: 4.8
    });
  });

  describe('GET /wishlist', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/wishlist');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('should return empty array if user has no wishlist', async () => {
      const response = await request(app)
        .get('/wishlist')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return user wishlist with place details', async () => {
      // Add places to wishlist
      await UserDestination.create({
        userId: user1.id,
        placeId: place1.id,
        notes: 'Want to surf here',
        visitDate: '2025-06-15'
      });

      await UserDestination.create({
        userId: user1.id,
        placeId: place2.id,
        notes: 'Sunrise tour'
      });

      const response = await request(app)
        .get('/wishlist')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('place');
      expect(response.body[0].place).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('notes');
    });

    it('should only return current user wishlist', async () => {
      // User 1 wishlist
      await UserDestination.create({
        userId: user1.id,
        placeId: place1.id
      });

      // User 2 wishlist
      await UserDestination.create({
        userId: user2.id,
        placeId: place2.id
      });

      const response = await request(app)
        .get('/wishlist')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].placeId).toBe(place1.id);
    });
  });

  describe('POST /wishlist', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/wishlist')
        .send({ placeId: place1.id });

      expect(response.status).toBe(401);
    });

    it('should add place to wishlist successfully', async () => {
      const response = await request(app)
        .post('/wishlist')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          placeId: place1.id,
          notes: 'Must visit!',
          visitDate: '2025-12-25'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('userId', user1.id);
      expect(response.body).toHaveProperty('placeId', place1.id);
      expect(response.body).toHaveProperty('notes', 'Must visit!');
      expect(response.body).toHaveProperty('place');
    });

    it('should add place without notes or visitDate', async () => {
      const response = await request(app)
        .post('/wishlist')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          placeId: place1.id
        });

      expect(response.status).toBe(201);
      expect(response.body.notes).toBeNull();
      expect(response.body.visitDate).toBeNull();
    });

    it('should return 400 if placeId is missing', async () => {
      const response = await request(app)
        .post('/wishlist')
        .set('Authorization', `Bearer ${token1}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return 404 if place does not exist', async () => {
      const response = await request(app)
        .post('/wishlist')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          placeId: 99999
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 if place already in wishlist', async () => {
      // Add place first time
      await request(app)
        .post('/wishlist')
        .set('Authorization', `Bearer ${token1}`)
        .send({ placeId: place1.id });

      // Try to add again
      const response = await request(app)
        .post('/wishlist')
        .set('Authorization', `Bearer ${token1}`)
        .send({ placeId: place1.id });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already');
    });
  });

  describe('PUT /wishlist/:id', () => {
    let wishlistItem;

    beforeEach(async () => {
      wishlistItem = await UserDestination.create({
        userId: user1.id,
        placeId: place1.id,
        notes: 'Original note',
        visitDate: '2025-06-01'
      });
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put(`/wishlist/${wishlistItem.id}`)
        .send({ notes: 'Updated note' });

      expect(response.status).toBe(401);
    });

    it('should update wishlist item successfully', async () => {
      const response = await request(app)
        .put(`/wishlist/${wishlistItem.id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          notes: 'Updated note',
          visitDate: '2025-07-15'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('notes', 'Updated note');
      expect(response.body.data.visitDate).toContain('2025-07-15');
    });

    it('should update only notes', async () => {
      const response = await request(app)
        .put(`/wishlist/${wishlistItem.id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          notes: 'New note only'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.notes).toBe('New note only');
      expect(response.body.data.visitDate).toContain('2025-06-01');
    });

    it('should update only visitDate', async () => {
      const response = await request(app)
        .put(`/wishlist/${wishlistItem.id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          visitDate: '2025-08-20'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.visitDate).toContain('2025-08-20');
      expect(response.body.data.notes).toBe('Original note');
    });

    it('should return 404 if wishlist item not found', async () => {
      const response = await request(app)
        .put('/wishlist/99999')
        .set('Authorization', `Bearer ${token1}`)
        .send({ notes: 'Update' });

      expect(response.status).toBe(404);
    });

    it('should return 403 if user tries to update another user wishlist', async () => {
      const response = await request(app)
        .put(`/wishlist/${wishlistItem.id}`)
        .set('Authorization', `Bearer ${token2}`) // user2 tries to update user1's item
        .send({ notes: 'Hacked!' });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('not authorized');
    });
  });

  describe('DELETE /wishlist/:id', () => {
    let wishlistItem;

    beforeEach(async () => {
      wishlistItem = await UserDestination.create({
        userId: user1.id,
        placeId: place1.id,
        notes: 'To delete'
      });
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).delete(`/wishlist/${wishlistItem.id}`);

      expect(response.status).toBe(401);
    });

    it('should delete wishlist item successfully', async () => {
      const response = await request(app)
        .delete(`/wishlist/${wishlistItem.id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');

      // Verify deletion
      const deleted = await UserDestination.findByPk(wishlistItem.id);
      expect(deleted).toBeNull();
    });

    it('should return 404 if wishlist item not found', async () => {
      const response = await request(app)
        .delete('/wishlist/99999')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(404);
    });

    it('should return 403 if user tries to delete another user wishlist', async () => {
      const response = await request(app)
        .delete(`/wishlist/${wishlistItem.id}`)
        .set('Authorization', `Bearer ${token2}`); // user2 tries to delete user1's item

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('not authorized');

      // Verify item still exists
      const stillExists = await UserDestination.findByPk(wishlistItem.id);
      expect(stillExists).not.toBeNull();
    });
  });
});
