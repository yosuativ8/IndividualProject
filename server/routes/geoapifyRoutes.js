/**
 * Geoapify API Routes
 * 
 * Routes untuk integrasi dengan Geoapify Places API.
 * Geoapify menyediakan data tempat wisata global dengan:
 * - Place search (text & coordinates)
 * - Place details (contact, hours, facilities)
 * - Nearby attractions
 * - Geocoding (address → coordinates)
 * - Autocomplete untuk search box
 * 
 * Base Path: /geoapify
 * External API: https://api.geoapify.com
 * Free Tier: 3000 requests/day
 * API Key: GEOAPIFY_API_KEY dari .env
 */

const express = require('express');
const router = express.Router();

// Import controller
const GeoapifyController = require('../controllers/geoapifyController');

// ========== PUBLIC ROUTES (No Authentication Required) ==========
// Semua endpoint Geoapify bersifat public untuk explore destinations

/**
 * GET /geoapify/search
 * Search places berdasarkan text query atau coordinates
 * Bisa digunakan untuk search by name atau search by location
 * 
 * @access Public
 * @query {string} query - Search text (optional jika ada lat/lon)
 * @query {number} lat - Latitude (optional jika ada query)
 * @query {number} lon - Longitude (optional jika ada query)
 * @query {number} radius - Radius dalam meter (default: 50000)
 * @query {string} categories - Category filter (default: tourism)
 * @controller GeoapifyController.searchPlaces
 * @example GET /geoapify/search?query=bali&categories=tourism.attraction
 * @example GET /geoapify/search?lat=-8.4095&lon=115.1889&radius=10000
 */
router.get('/search', GeoapifyController.searchPlaces);

/**
 * GET /geoapify/details/:placeId
 * Get detail lengkap dari satu place (contact, hours, facilities, wiki)
 * 
 * @access Public
 * @param {string} placeId - Geoapify place_id (long string)
 * @controller GeoapifyController.getPlaceDetails
 * @example GET /geoapify/details/51a73b46c26f88c0404059ed3ea89e794740f00101f90173e91e0000000000c00208
 */
router.get('/details/:placeId', GeoapifyController.getPlaceDetails);

/**
 * GET /geoapify/nearby
 * Cari attractions nearby berdasarkan koordinat user
 * Useful untuk "Explore nearby" feature
 * 
 * @access Public
 * @query {number} lat - Latitude (required)
 * @query {number} lon - Longitude (required)
 * @query {number} radius - Radius dalam meter (default: 10000)
 * @query {string} type - Type filter: attraction/museum/beach/mountain
 * @controller GeoapifyController.getNearbyAttractions
 * @example GET /geoapify/nearby?lat=-8.7184&lon=115.1686&radius=5000&type=beach
 */
router.get('/nearby', GeoapifyController.getNearbyAttractions);

/**
 * GET /geoapify/geocode
 * Convert address/place name ke coordinates (latitude, longitude)
 * Berguna untuk: User ketik "Bali" → get coords → search nearby
 * 
 * @access Public
 * @query {string} address - Nama tempat atau alamat lengkap (required)
 * @controller GeoapifyController.geocodeAddress
 * @returns {Array<Object>} Results dengan formatted address dan coordinates
 * @example GET /geoapify/geocode?address=Bali, Indonesia
 */
router.get('/geocode', GeoapifyController.geocodeAddress);

/**
 * GET /geoapify/autocomplete
 * Autocomplete suggestions untuk search box
 * Real-time suggestions saat user mengetik
 * 
 * @access Public
 * @query {string} text - Search text (min 2 characters)
 * @controller GeoapifyController.autocomplete
 * @returns {Array<Object>} Suggestion list dengan name dan coordinates
 * @example GET /geoapify/autocomplete?text=bal
 * Response: ["Bali", "Balikpapan", "Bali Beach", ...]
 */
router.get('/autocomplete', GeoapifyController.autocomplete);

module.exports = router;
module.exports = router;
