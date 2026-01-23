// Test untuk geoapifyController dengan axios mock

const request = require('supertest');
const app = require('../app');
const axios = require('axios');

// Mock axios
jest.mock('axios');

describe('Geoapify Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /geoapify/search', () => {
    it('should search places with query param', async () => {
      const mockResponse = {
        data: {
          features: [
            {
              properties: {
                place_id: 'geo123',
                name: 'Bali Beach',
                formatted: 'Bali Beach, Bali, Indonesia',
                lat: -8.718184,
                lon: 115.168610,
                categories: ['tourism', 'beach']
              }
            }
          ]
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/geoapify/search')
        .query({ query: 'Bali Beach' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('places');
      expect(response.body.total).toBe(1);
      expect(response.body.places[0].name).toBe('Bali Beach');
    });

    it('should search places with coordinates', async () => {
      const mockResponse = {
        data: {
          features: [
            {
              properties: {
                place_id: 'rest123',
                name: 'Restaurant',
                formatted: 'Restaurant, Jakarta',
                lat: -6.2,
                lon: 106.8,
                categories: ['restaurant'],
                distance: 500
              }
            }
          ]
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/geoapify/search')
        .query({
          query: 'restaurant',
          lat: -6.2,
          lon: 106.8,
          radius: 5000
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('places');
      expect(response.body.searchParams.location).toEqual({ lat: '-6.2', lon: '106.8' });
    });

    it('should return 400 if query and coordinates are missing', async () => {
      const response = await request(app).get('/geoapify/search');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });

    it('should handle Geoapify API errors', async () => {
      axios.get.mockRejectedValue({
        response: {
          data: { message: 'API Error' }
        }
      });

      const response = await request(app)
        .get('/geoapify/search')
        .query({ query: 'test' });

      expect(response.status).toBe(502);
      expect(response.body.message).toContain('Geoapify API Error');
    });
  });

  describe('GET /geoapify/details/:placeId', () => {
    it('should get place details by placeId', async () => {
      const mockResponse = {
        data: {
          features: [
            {
              properties: {
                place_id: 'geo123',
                name: 'Place Name',
                formatted: 'Full Address',
                lat: -8.7,
                lon: 115.2,
                categories: ['tourism'],
                datasource: {},
                contact: { phone: '+62123', email: 'test@example.com' },
                website: 'http://example.com'
              }
            }
          ]
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const response = await request(app).get('/geoapify/details/geo123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'geo123');
      expect(response.body).toHaveProperty('name', 'Place Name');
      expect(response.body.contact).toHaveProperty('phone', '+62123');
    });

    it('should return 404 if place not found', async () => {
      axios.get.mockResolvedValue({
        data: {
          features: []
        }
      });

      const response = await request(app).get('/geoapify/details/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });

    it('should handle API errors', async () => {
      axios.get.mockRejectedValue({
        response: {
          data: { message: 'Not found' }
        }
      });

      const response = await request(app).get('/geoapify/details/geo123');

      expect(response.status).toBe(502);
    });
  });

  describe('GET /geoapify/nearby', () => {
    it('should get nearby attractions', async () => {
      const mockResponse = {
        data: {
          features: [
            {
              properties: {
                place_id: 'nearby1',
                name: 'Nearby Attraction',
                formatted: 'Nearby Attraction Address',
                lat: -8.7,
                lon: 115.2,
                categories: ['tourism'],
                distance: 500
              }
            }
          ]
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/geoapify/nearby')
        .query({
          lat: -8.718184,
          lon: 115.168610,
          radius: 5000
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('attractions');
      expect(response.body.attractions[0].name).toBe('Nearby Attraction');
      expect(response.body.attractions[0]).toHaveProperty('distanceKm');
    });

    it('should return 400 if latitude is missing', async () => {
      const response = await request(app)
        .get('/geoapify/nearby')
        .query({
          lon: 115.168610,
          radius: 5000
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });

    it('should return 400 if longitude is missing', async () => {
      const response = await request(app)
        .get('/geoapify/nearby')
        .query({
          lat: -8.718184,
          radius: 5000
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });

    it('should use default radius if not specified', async () => {
      axios.get.mockResolvedValue({ data: { features: [] } });

      const response = await request(app)
        .get('/geoapify/nearby')
        .query({
          lat: -8.718184,
          lon: 115.168610
        });

      expect(response.status).toBe(200);
      expect(response.body.radius).toBe('10000m');
    });

    it('should filter by type museum', async () => {
      axios.get.mockResolvedValue({ data: { features: [] } });

      const response = await request(app)
        .get('/geoapify/nearby')
        .query({
          lat: -8.718184,
          lon: 115.168610,
          type: 'museum'
        });

      expect(response.status).toBe(200);
      expect(response.body.type).toBe('museum');
    });
  });

  describe('GET /geoapify/geocode', () => {
    it('should geocode an address', async () => {
      const mockResponse = {
        data: {
          features: [
            {
              properties: {
                formatted: 'Jakarta, Indonesia',
                lat: -6.2,
                lon: 106.8,
                place_id: 'geo456',
                country: 'Indonesia',
                state: 'Jakarta',
                city: 'Jakarta'
              }
            }
          ]
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/geoapify/geocode')
        .query({ address: 'Jakarta, Indonesia' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('results');
      expect(response.body.results[0]).toHaveProperty('formatted', 'Jakarta, Indonesia');
      expect(response.body.results[0].location).toEqual({ lat: -6.2, lon: 106.8 });
    });

    it('should return 400 if address is missing', async () => {
      const response = await request(app).get('/geoapify/geocode');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });

    it('should handle geocoding errors', async () => {
      axios.get.mockRejectedValue({
        response: {
          data: { message: 'Geocoding failed' }
        }
      });

      const response = await request(app)
        .get('/geoapify/geocode')
        .query({ address: 'Invalid Address' });

      expect(response.status).toBe(502);
    });
  });

  describe('GET /geoapify/autocomplete', () => {
    it('should return autocomplete suggestions', async () => {
      const mockResponse = {
        data: {
          features: [
            {
              properties: {
                formatted: 'Bali, Indonesia',
                place_id: 'geo1',
                lat: -8.4,
                lon: 115.1
              }
            },
            {
              properties: {
                formatted: 'Bali Beach, Bali, Indonesia',
                place_id: 'geo2',
                lat: -8.7,
                lon: 115.2
              }
            }
          ]
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const response = await request(app)
        .get('/geoapify/autocomplete')
        .query({ text: 'Bali' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('suggestions');
      expect(response.body.suggestions.length).toBe(2);
      expect(response.body.suggestions[0].text).toBe('Bali, Indonesia');
    });

    it('should limit autocomplete results', async () => {
      axios.get.mockResolvedValue({ data: { features: [] } });

      const response = await request(app)
        .get('/geoapify/autocomplete')
        .query({
          text: 'Jakarta',
          limit: 5
        });

      expect(response.status).toBe(200);
      expect(response.body.suggestions).toEqual([]);
    });

    it('should return 400 if text is missing', async () => {
      const response = await request(app).get('/geoapify/autocomplete');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('2 characters');
    });

    it('should return 400 if text is too short', async () => {
      const response = await request(app)
        .get('/geoapify/autocomplete')
        .query({ text: 'a' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('at least 2 characters');
    });
  });
});
