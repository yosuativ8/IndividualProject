/**
 * Place Routes
 * 
 * Routes untuk semua endpoint yang berhubungan dengan destinasi wisata (Places).
 * Semua routes di file ini bersifat PUBLIC (tidak perlu authentication).
 * 
 * Features:
 * - Browse all destinations dengan filter
 * - Search destinations by keyword
 * - Get destination details
 * - Find nearby destinations (location-based)
 * 
 * Base Path: /places
 * Data: READ-ONLY (tidak ada create/update/delete dari API)
 */

const express = require('express');
const router = express.Router();

// Import controller
const PlaceController = require('../controllers/placeController');

// ========== PUBLIC ROUTES (No Authentication Required) ==========

/**
 * GET /places
 * Get all places dengan optional filtering
 * @access Public
 * @query {string} category - Filter by category (Pantai/Gunung/Candi/dll)
 * @query {string} search - Search keyword (name atau location)
 * @controller PlaceController.getAllPlaces
 * @example GET /places?category=Pantai&search=bali
 */
router.get('/', PlaceController.getAllPlaces);

/**
 * GET /places/search
 * Search places by name, location, description, or category
 * 
 * ⚠️ IMPORTANT: Route ini HARUS di atas /:id
 * Karena 'search' bisa dikira sebagai :id jika route order salah
 * 
 * @access Public
 * @query {string} q - Search query (required)
 * @controller PlaceController.searchPlaces
 * @example GET /places/search?q=bali
 */
router.get('/search', PlaceController.searchPlaces);

/**
 * GET /places/nearby
 * Cari places dalam radius tertentu dari koordinat
 * Menggunakan Haversine formula untuk calculate distance
 * 
 * ⚠️ IMPORTANT: Route ini HARUS di atas /:id
 * Karena 'nearby' bisa dikira sebagai :id jika route order salah
 * 
 * @access Public
 * @query {number} lat - Latitude (required)
 * @query {number} lng - Longitude (required)
 * @query {number} radius - Radius dalam km (default: 10)
 * @controller PlaceController.getPlacesByLocation
 * @example GET /places/nearby?lat=-6.2088&lng=106.8456&radius=10
 */
router.get('/nearby', PlaceController.getPlacesByLocation);

/**
 * GET /places/:id
 * Get detail satu place berdasarkan ID
 * Support both database ID (integer) dan Geoapify place_id (string)
 * 
 * @access Public
 * @param {number|string} id - Place ID (database) atau Geoapify place_id
 * @controller PlaceController.getPlaceById
 * @example GET /places/5
 * @example GET /places/51a73b46c26f88c0404059ed3ea89e794740f00101f90173e91e0000000000c00208
 */
router.get('/:id', PlaceController.getPlaceById);

module.exports = router;