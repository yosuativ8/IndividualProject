// Test untuk geminiController dengan Google AI mock

// Mock Google Generative AI FIRST (before requiring app)
jest.mock('@google/generative-ai');

const request = require('supertest');
const app = require('../app');
const { User, Place, UserDestination } = require('../models');
const { signToken } = require('../helpers/jwt');
const { GoogleGenerativeAI } = require('@google/generative-ai');

describe('Gemini Controller', () => {
  let user, token, place1, place2;
  let mockGenerateContent;

  beforeEach(async () => {
    // Clear data
    await UserDestination.destroy({ where: {}, truncate: true, cascade: true });
    await Place.destroy({ where: {}, truncate: true, cascade: true });
    await User.destroy({ where: {}, truncate: true, cascade: true });

    // Create test user
    user = await User.create({
      email: 'test@example.com',
      password: 'password123'
    });

    token = signToken({ id: user.id, email: user.email });

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

    // Mock Gemini AI
    mockGenerateContent = jest.fn();
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: () => ({
        generateContent: mockGenerateContent
      })
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /gemini/trip-planner', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/gemini/trip-planner')
        .send({ destination: 'Bali', days: 3 });

      expect(response.status).toBe(401);
    });

    it('should return 400 if destination is missing', async () => {
      const response = await request(app)
        .post('/gemini/trip-planner')
        .set('Authorization', `Bearer ${token}`)
        .send({ days: 3 });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });

    it('should generate trip itinerary from user wishlist', async () => {
      // Add places to wishlist
      await UserDestination.create({
        userId: user.id,
        placeId: place1.id,
        notes: 'Beach day'
      });

      await UserDestination.create({
        userId: user.id,
        placeId: place2.id,
        notes: 'Sunrise tour'
      });

      // Mock Gemini response with JSON in code block
      const mockItinerary = {
        tripTitle: '3 Days in Bali',
        destination: 'Bali',
        duration: 3,
        itinerary: [
          {
            day: 1,
            title: 'Beach Day',
            activities: [
              {
                time: '08:00',
                activity: 'Visit Pantai Kuta',
                location: 'Pantai Kuta',
                duration: '3 hours'
              }
            ]
          }
        ]
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => `\`\`\`json\n${JSON.stringify(mockItinerary)}\n\`\`\``
        }
      });

      const response = await request(app)
        .post('/gemini/trip-planner')
        .set('Authorization', `Bearer ${token}`)
        .send({
          destination: 'Bali',
          days: 3,
          preferences: ['beach', 'adventure']
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tripTitle');
      expect(response.body).toHaveProperty('itinerary');
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('should handle invalid JSON from Gemini', async () => {
      await UserDestination.create({
        userId: user.id,
        placeId: place1.id
      });

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'Invalid JSON response'
        }
      });

      const response = await request(app)
        .post('/gemini/trip-planner')
        .set('Authorization', `Bearer ${token}`)
        .send({
          destination: 'Bali',
          days: 3
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /gemini/chat', () => {
    it('should respond to user message', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'Bali is a beautiful island in Indonesia known for its beaches and culture.'
        }
      });

      const response = await request(app)
        .post('/gemini/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({
          message: 'Tell me about Bali'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('reply');
      expect(response.body).toHaveProperty('message', 'Chat response generated');
      expect(typeof response.body.reply).toBe('string');
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('should return 400 if message is missing', async () => {
      const response = await request(app)
        .post('/gemini/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });

    it('should handle conversation history', async () => {
      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'The best time is during dry season, April to October.'
        }
      });

      const response = await request(app)
        .post('/gemini/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({
          message: 'What is the best time to visit?',
          history: [
            { role: 'user', content: 'Tell me about Bali' },
            { role: 'assistant', content: 'Bali is a beautiful island...' }
          ]
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('reply');
      expect(response.body).toHaveProperty('conversationId');
    });

    it('should handle Gemini API errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      const response = await request(app)
        .post('/gemini/chat')
        .set('Authorization', `Bearer ${token}`)
        .send({
          message: 'Hello'
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /gemini/recommendations', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).post('/gemini/recommendations');

      expect(response.status).toBe(401);
    });

    it('should generate personalized recommendations', async () => {
      // Add places to wishlist
      await UserDestination.create({
        userId: user.id,
        placeId: place1.id
      });

      const mockRecommendations = {
        recommendations: [
          {
            placeName: 'Tanah Lot',
            reason: 'Based on your interest in beaches',
            category: 'Pantai',
            estimatedRating: 4.7
          }
        ],
        analysis: {
          preferredCategories: ['Pantai'],
          travelStyle: 'Beach lover'
        }
      };

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => `\`\`\`json\n${JSON.stringify(mockRecommendations)}\n\`\`\``
        }
      });

      const response = await request(app)
        .post('/gemini/recommendations')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('recommendations');
      expect(Array.isArray(response.body.recommendations)).toBe(true);
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('should handle JSON parsing errors', async () => {
      await UserDestination.create({
        userId: user.id,
        placeId: place1.id
      });

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => 'Not a valid JSON'
        }
      });

      const response = await request(app)
        .post('/gemini/recommendations')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /gemini/generate-description', () => {
    it('should generate place description', async () => {
      const mockDescription = 'Bali adalah pulau yang indah dengan pantai-pantai eksotis dan budaya yang kaya.';

      mockGenerateContent.mockResolvedValue({
        response: {
          text: () => mockDescription
        }
      });

      const response = await request(app)
        .post('/gemini/generate-description')
        .send({
          placeName: 'Bali',
          location: 'Indonesia',
          category: 'Island'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('description');
      expect(response.body.description).toBe(mockDescription);
      expect(response.body).toHaveProperty('placeName', 'Bali');
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('should return 400 if placeName is missing', async () => {
      const response = await request(app)
        .post('/gemini/generate-description')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });

    it('should handle Gemini errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Generation failed'));

      const response = await request(app)
        .post('/gemini/generate-description')
        .send({
          placeName: 'Test Place',
          location: 'Test Location'
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
