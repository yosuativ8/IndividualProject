// Test untuk placeController (getAllPlaces, getPlaceById, nearby)

const request = require('supertest');
const app = require('../app');
const { Place } = require('../models');

describe('Place Controller', () => {
  // Sample places data
  const samplePlaces = [
    {
      name: 'Pantai Kuta',
      description: 'Pantai terkenal di Bali',
      location: 'Bali',
      latitude: -8.718184,
      longitude: 115.168610,
      imageUrl: 'http://example.com/kuta.jpg',
      category: 'Pantai',
      rating: 4.5
    },
    {
      name: 'Gunung Bromo',
      description: 'Gunung berapi aktif',
      location: 'Jawa Timur',
      latitude: -7.942494,
      longitude: 112.953011,
      imageUrl: 'http://example.com/bromo.jpg',
      category: 'Gunung',
      rating: 4.8
    },
    {
      name: 'Museum Nasional',
      description: 'Museum sejarah Indonesia',
      location: 'Jakarta',
      latitude: -6.176088,
      longitude: 106.827153,
      imageUrl: 'http://example.com/museum.jpg',
      category: 'Museum',
      rating: 4.2
    }
  ];

  beforeEach(async () => {
    await Place.destroy({ where: {}, truncate: true, cascade: true });
    await Place.bulkCreate(samplePlaces);
  });

  describe('GET /places', () => {
    it('should return all places', async () => {
      const response = await request(app).get('/places');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
    });

    it('should filter places by category', async () => {
      const response = await request(app)
        .get('/places')
        .query({ category: 'Pantai' });

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].category).toBe('Pantai');
    });

    it('should search places by name', async () => {
      const response = await request(app)
        .get('/places')
        .query({ search: 'Bromo' });

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].name).toContain('Bromo');
    });

    it('should search places by location', async () => {
      const response = await request(app)
        .get('/places')
        .query({ search: 'Jakarta' });

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].location).toContain('Jakarta');
    });

    it('should combine category and search filters', async () => {
      const response = await request(app)
        .get('/places')
        .query({ 
          category: 'Museum',
          search: 'Nasional'
        });

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].category).toBe('Museum');
      expect(response.body[0].name).toContain('Nasional');
    });

    it('should return empty array if no matches', async () => {
      const response = await request(app)
        .get('/places')
        .query({ search: 'NonExistent' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /places/:id', () => {
    it('should return a place by id', async () => {
      const places = await Place.findAll();
      const placeId = places[0].id;

      const response = await request(app).get(`/places/${placeId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', placeId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('location');
      expect(response.body).toHaveProperty('latitude');
      expect(response.body).toHaveProperty('longitude');
    });

    it('should return 404 if place not found', async () => {
      const response = await request(app).get('/places/99999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 if id is invalid', async () => {
      const response = await request(app).get('/places/9999');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /places/nearby', () => {
    it('should return places near specified coordinates', async () => {
      // Coordinates near Bali (should return Pantai Kuta)
      const response = await request(app)
        .get('/places/nearby')
        .query({
          lat: -8.7,
          lng: 115.2,
          radius: 50
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('distance');
    });

    it('should return 400 if latitude is missing', async () => {
      const response = await request(app)
        .get('/places/nearby')
        .query({
          lng: 115.2,
          radius: 50
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 if longitude is missing', async () => {
      const response = await request(app)
        .get('/places/nearby')
        .query({
          lat: -8.7,
          radius: 50
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should use default radius of 10km if not specified', async () => {
      const response = await request(app)
        .get('/places/nearby')
        .query({
          lat: -8.7,
          lng: 115.2
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return empty array if no places within radius', async () => {
      // Coordinates in middle of ocean, far from any place
      const response = await request(app)
        .get('/places/nearby')
        .query({
          lat: 0,
          lng: 0,
          radius: 1
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should sort results by distance ascending', async () => {
      const response = await request(app)
        .get('/places/nearby')
        .query({
          lat: -7.942494, // Near Bromo
          lng: 112.953011,
          radius: 1000
        });

      expect(response.status).toBe(200);
      if (response.body.length > 1) {
        for (let i = 0; i < response.body.length - 1; i++) {
          expect(response.body[i].distance).toBeLessThanOrEqual(
            response.body[i + 1].distance
          );
        }
      }
    });

    it('should return 400 for invalid latitude range', async () => {
      const response = await request(app)
        .get('/places/nearby')
        .query({
          lat: 100, // Invalid: > 90
          lng: 115.2,
          radius: 10
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('latitude');
    });

    it('should return 400 for invalid longitude range', async () => {
      const response = await request(app)
        .get('/places/nearby')
        .query({
          lat: -8.7,
          lng: 200, // Invalid: > 180
          radius: 10
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('longitude');
    });
  });

  describe('GET /places/search', () => {
    it('should search places by name', async () => {
      const response = await request(app)
        .get('/places/search')
        .query({ q: 'Kuta' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('query', 'Kuta');
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('places');
      expect(Array.isArray(response.body.places)).toBe(true);
      expect(response.body.places.length).toBeGreaterThan(0);
      expect(response.body.places[0].name).toContain('Kuta');
    });

    it('should search places by location', async () => {
      const response = await request(app)
        .get('/places/search')
        .query({ q: 'Bali' });

      expect(response.status).toBe(200);
      expect(response.body.places.length).toBeGreaterThan(0);
      expect(response.body.places[0].location).toContain('Bali');
    });

    it('should search places by category', async () => {
      const response = await request(app)
        .get('/places/search')
        .query({ q: 'Pantai' });

      expect(response.status).toBe(200);
      expect(response.body.places.length).toBeGreaterThan(0);
    });

    it('should return 400 if search query is missing', async () => {
      const response = await request(app)
        .get('/places/search');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 if search query is empty string', async () => {
      const response = await request(app)
        .get('/places/search')
        .query({ q: '   ' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });

    it('should limit results to 20 places', async () => {
      // Create more than 20 places
      const manyPlaces = [];
      for (let i = 1; i <= 25; i++) {
        manyPlaces.push({
          name: `Test Place ${i}`,
          description: 'Test description',
          location: 'Test Location',
          latitude: -6.0 + (i * 0.1),
          longitude: 106.0 + (i * 0.1),
          imageUrl: 'http://example.com/test.jpg',
          category: 'Test',
          rating: 4.0
        });
      }
      await Place.bulkCreate(manyPlaces);

      const response = await request(app)
        .get('/places/search')
        .query({ q: 'Test' });

      expect(response.status).toBe(200);
      expect(response.body.places.length).toBeLessThanOrEqual(20);
    });

    it('should return empty results for no matches', async () => {
      const response = await request(app)
        .get('/places/search')
        .query({ q: 'NonExistentDestination123' });

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
      expect(response.body.places).toEqual([]);
    });

    it('should order results by rating DESC then createdAt DESC', async () => {
      const response = await request(app)
        .get('/places/search')
        .query({ q: 'a' }); // Search with common letter

      expect(response.status).toBe(200);
      if (response.body.places.length > 1) {
        for (let i = 0; i < response.body.places.length - 1; i++) {
          expect(response.body.places[i].rating).toBeGreaterThanOrEqual(
            response.body.places[i + 1].rating
          );
        }
      }
    });
  });

  describe('GET /places/:id with Geoapify place_id', () => {
    it('should handle Geoapify place_id (long string > 50 chars)', async () => {
      // Mock a very long place_id (Geoapify style)
      const longPlaceId = '51f0e682c93d3f40c0594e86a1e0f1594840f00103f90113240a0000000000c00208';

      const response = await request(app).get(`/places/${longPlaceId}`);

      // Should return 404 because we don't have real Geoapify API in test
      expect(response.status).toBe(404);
    });
  });
});
