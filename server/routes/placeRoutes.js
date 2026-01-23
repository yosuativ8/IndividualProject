// placeRoutes untuk mengatur endpoint-endpoint terkait Places (tempat wisata)
// Routes ini hanya READ-ONLY karena Places adalah data publik

const express = require('express'); // Import express untuk membuat router
const router = express.Router(); // Membuat instance router

// Import controller
const PlaceController = require('../controllers/placeController');

// Public Routes - Semua endpoint places tidak perlu login (data publik)

// GET /places - Mendapatkan semua tempat wisata
// Query params: ?category=Pantai&search=Bali
router.get('/', PlaceController.getAllPlaces);

// GET /places/search - Search places by name or location
// Query params: ?q=bali
// Endpoint ini harus di atas /:id karena 'search' bisa dikira sebagai id
router.get('/search', PlaceController.searchPlaces);

// GET /places/nearby - Mencari places berdasarkan koordinat dalam radius tertentu
// Query params: ?lat=-6.2088&lng=106.8456&radius=10
// Endpoint ini harus di atas /:id karena 'nearby' bisa dikira sebagai id
router.get('/nearby', PlaceController.getPlacesByLocation);

// GET /places/:id - Mendapatkan detail satu tempat wisata berdasarkan ID
router.get('/:id', PlaceController.getPlaceById);

// Export router untuk digunakan di app.js
module.exports = router;