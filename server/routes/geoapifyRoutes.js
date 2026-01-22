// geoapifyRoutes untuk mengatur endpoint-endpoint Geoapify Places API
// Routes ini menghubungkan HTTP request dengan method di GeoapifyController

const express = require('express');
const router = express.Router();

// Import controller
const GeoapifyController = require('../controllers/geoapifyController');

// Semua endpoint Geoapify tidak perlu authentication (data publik)

// GET /geoapify/search - Search places berdasarkan query dan/atau lokasi
// Query params: 
//   - query: search text (optional jika ada lat/lon)
//   - lat: latitude (optional jika ada query)
//   - lon: longitude (optional jika ada query)
//   - radius: radius dalam meter (default 50000 = 50km)
//   - categories: tourism, tourism.attraction, tourism.museum, beach, natural.mountain
// Example: /geoapify/search?query=bali&categories=tourism
// Example: /geoapify/search?lat=-8.4095&lon=115.1889&radius=10000
router.get('/search', GeoapifyController.searchPlaces);

// GET /geoapify/details/:placeId - Detail lengkap dari satu place
// Example: /geoapify/details/51a73b46c26f88c0404059ed3ea89e794740f00101f90173e91e0000000000c00208
router.get('/details/:placeId', GeoapifyController.getPlaceDetails);

// GET /geoapify/nearby - Cari attractions nearby berdasarkan koordinat
// Query params:
//   - lat: latitude (required)
//   - lon: longitude (required)
//   - radius: radius dalam meter (default 10000 = 10km)
//   - type: attraction, museum, beach, mountain (default: attraction)
// Example: /geoapify/nearby?lat=-8.7184&lon=115.1686&radius=5000&type=beach
router.get('/nearby', GeoapifyController.getNearbyAttractions);

// GET /geoapify/geocode - Convert address/place name ke coordinates
// Query params:
//   - address: nama tempat atau alamat (required)
// Example: /geoapify/geocode?address=Bali, Indonesia
// Berguna untuk: User ketik "Bali" → get coordinates → search nearby attractions
router.get('/geocode', GeoapifyController.geocodeAddress);

// GET /geoapify/autocomplete - Autocomplete suggestions untuk search box
// Query params:
//   - text: search text (min 2 characters)
// Example: /geoapify/autocomplete?text=bal
// Response: suggestions (Bali, Balikpapan, Bali Beach, dll)
router.get('/autocomplete', GeoapifyController.autocomplete);

// Export router
module.exports = router;
