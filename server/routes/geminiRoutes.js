// geminiRoutes untuk endpoint AI recommendation menggunakan Google Gemini API
// Routes ini menghubungkan HTTP request dengan method di GeminiController

const express = require('express');
const router = express.Router();

// Import controller
const GeminiController = require('../controllers/geminiController');

// Import middleware
const authentication = require('../middleware/authentication');

// POST /gemini/recommend - Mendapatkan rekomendasi tempat wisata dari AI
// Access: Private (perlu login)
// Body: { prompt: "string" } - prompt untuk AI
router.post('/recommend', authentication, GeminiController.getRecommendation);

// Export router
module.exports = router;