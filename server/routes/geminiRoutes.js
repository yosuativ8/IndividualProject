// geminiRoutes untuk endpoint AI features menggunakan Google Gemini API
// Routes ini menghubungkan HTTP request dengan method di GeminiController

const express = require('express');
const router = express.Router();

// Import controller
const GeminiController = require('../controllers/geminiController');

// Import middleware
const authentication = require('../middleware/authentication');

// POST /gemini/trip-planner - AI generate trip itinerary
// Access: Private (perlu login)
// Body: { destination, days, budget, preferences }
// AI akan analyze user wishlist dan generate itinerary yang detail
router.post('/trip-planner', authentication, GeminiController.generateTripItinerary);

// POST /gemini/chat - Chatbot Tourism Assistant
// Access: Private (perlu login)
// Body: { message, conversationHistory }
// Conversational AI untuk tanya jawab tentang destinasi wisata
router.post('/chat', authentication, GeminiController.chatbot);

// POST /gemini/recommendations - Personalized recommendations
// Access: Private (perlu login)
// AI analyze user behavior (wishlist) dan kasih rekomendasi destinasi baru yang cocok
router.post('/recommendations', authentication, GeminiController.getPersonalizedRecommendations);

// POST /gemini/generate-description - Generate place description
// Access: Public
// Body: { placeName, location, category }
// Helper untuk generate deskripsi destinasi (content generation)
router.post('/generate-description', GeminiController.generatePlaceDescription);

// Export router
module.exports = router;
