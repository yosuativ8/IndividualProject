/**
 * Gemini AI Routes
 * 
 * Routes untuk semua endpoint AI features menggunakan Google Gemini API.
 * Google Gemini adalah Large Language Model untuk generate content, chat, dan recommendations.
 * 
 * Features:
 * - Trip Planner AI (generate itinerary)
 * - Tourism Chatbot (conversational AI)
 * - Personalized Recommendations (ML-based)
 * - Content Generation (deskripsi destinasi)
 * 
 * Base Path: /gemini
 * API: Google Generative AI (Gemini Flash Lite)
 * Model: gemini-flash-lite-latest
 */

const express = require('express');
const router = express.Router();

// Import controller
const GeminiController = require('../controllers/geminiController');

// Import middleware
const authentication = require('../middleware/authentication');

// ========== PRIVATE ROUTES (Authentication Required) ==========

/**
 * POST /gemini/trip-planner
 * AI generate trip itinerary berdasarkan destination, duration, dan budget
 * AI akan analyze user wishlist untuk personalized itinerary
 * 
 * @access Private (butuh login untuk analyze wishlist)
 * @middleware authentication
 * @body {string} destination - Tujuan wisata (required)
 * @body {number} days - Durasi trip dalam hari (default: 3)
 * @body {string} budget - Budget level (flexible/low/medium/high)
 * @body {Array<string>} preferences - User preferences (optional)
 * @controller GeminiController.generateTripItinerary
 * @returns {Object} Detailed itinerary dengan day-by-day activities, budget, tips
 * @example
 * POST /gemini/trip-planner
 * Body: {
 *   "destination": "Bali",
 *   "days": 5,
 *   "budget": "medium",
 *   "preferences": ["beach", "culture", "photography"]
 * }
 */
router.post('/trip-planner', authentication, GeminiController.generateTripItinerary);

/**
 * POST /gemini/chat
 * Conversational AI Tourism Assistant
 * User bisa tanya tentang destinasi, tips, rekomendasi, dll
 * AI akan search database dan generate response dengan gambar
 * 
 * @access Private (butuh login untuk personalized response)
 * @middleware authentication
 * @body {string} message - User's question/message (required)
 * @body {Array<Object>} conversationHistory - Previous messages (optional)
 * @controller GeminiController.chatbot
 * @returns {Object} AI response, places data, map center coordinates
 * @example
 * POST /gemini/chat
 * Body: {
 *   "message": "Rekomendasi pantai di Bali",
 *   "conversationHistory": []
 * }
 */
router.post('/chat', authentication, GeminiController.chatbot);

/**
 * POST /gemini/recommendations
 * Personalized destination recommendations
 * AI analyze user wishlist pattern dan recommend places yang sesuai
 * 
 * @access Private (butuh login untuk analyze wishlist)
 * @middleware authentication
 * @controller GeminiController.getPersonalizedRecommendations
 * @returns {Object} Analysis dan array of recommended places
 * @example
 * POST /gemini/recommendations
 * Headers: { Authorization: "Bearer <token>" }
 */
router.post('/recommendations', authentication, GeminiController.getPersonalizedRecommendations);

// ========== PUBLIC ROUTES (No Authentication) ==========

/**
 * POST /gemini/generate-description
 * AI generate deskripsi menarik untuk destinasi wisata
 * Helper endpoint untuk content generation
 * 
 * @access Public
 * @body {string} placeName - Nama destinasi (required)
 * @body {string} location - Lokasi destinasi (required)
 * @body {string} category - Kategori destinasi (optional)
 * @controller GeminiController.generatePlaceDescription
 * @returns {string} AI-generated description (150-200 words)
 * @example
 * POST /gemini/generate-description
 * Body: {
 *   "placeName": "Candi Borobudur",
 *   "location": "Magelang, Central Java",
 *   "category": "Candi"
 * }
 */
router.post('/generate-description', GeminiController.generatePlaceDescription);

module.exports = router;
