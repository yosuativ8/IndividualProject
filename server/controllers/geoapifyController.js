// geoapifyController untuk integrasi dengan Geoapify Places API
// Geoapify menyediakan data tempat wisata, foto, rating, dan detail lokasi
// Free tier: 3000 requests/day

const axios = require('axios');

// Base URL untuk Geoapify API
const GEOAPIFY_BASE_URL = 'https://api.geoapify.com/v2';
const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;

// Function to get image URL - uses Unsplash Source for better reliability
function getImageForPlace(placeName, category) {
    // Unsplash Source API - provides random images by keyword
    // Format: https://source.unsplash.com/500x300/?keyword1,keyword2
    
    const lowerName = placeName.toLowerCase();
    let keywords = [];
    
    // Specific destinations mapping
    if (lowerName.includes('borobudur')) {
        keywords = ['borobudur', 'temple', 'indonesia'];
    } else if (lowerName.includes('bromo')) {
        keywords = ['bromo', 'volcano', 'indonesia'];
    } else if (lowerName.includes('bali') || lowerName.includes('kuta') || lowerName.includes('seminyak')) {
        keywords = ['bali', 'beach', 'indonesia'];
    } else if (lowerName.includes('raja ampat')) {
        keywords = ['raja-ampat', 'papua', 'coral'];
    } else if (lowerName.includes('komodo')) {
        keywords = ['komodo', 'island', 'indonesia'];
    } else if (lowerName.includes('prambanan')) {
        keywords = ['prambanan', 'temple', 'java'];
    } else if (lowerName.includes('toba')) {
        keywords = ['lake-toba', 'sumatra', 'indonesia'];
    } else if (lowerName.includes('tanah lot')) {
        keywords = ['tanah-lot', 'bali', 'temple'];
    } else if (lowerName.includes('ijen')) {
        keywords = ['kawah-ijen', 'volcano', 'blue-fire'];
    } else if (lowerName.includes('nusa penida')) {
        keywords = ['nusa-penida', 'cliff', 'bali'];
    } else {
        // Generic category-based keywords
        if (category === 'Pantai' || category === 'beach') {
            keywords = ['beach', 'tropical', 'indonesia'];
        } else if (category === 'Gunung' || category === 'mountain') {
            keywords = ['mountain', 'volcano', 'nature'];
        } else if (category === 'Museum') {
            keywords = ['museum', 'architecture', 'culture'];
        } else if (category === 'Attraction' || category === 'Sights') {
            keywords = ['attraction', 'tourism', 'indonesia'];
        } else if (category === 'Natural' || category === 'nature') {
            keywords = ['nature', 'landscape', 'indonesia'];
        } else {
            keywords = ['tourism', 'travel', 'indonesia'];
        }
    }
    
    // Use Unsplash Source API
    return `https://source.unsplash.com/500x300/?${keywords.join(',')}`;
}

module.exports = class GeoapifyController {
    // Method untuk search places berdasarkan query dan lokasi
    // Endpoint: GET /geoapify/search
    // Query params: ?query=bali&lat=-8.4095&lon=115.1889&radius=50000&categories=tourism
    // Access: Public (tidak perlu login)
    static async searchPlaces(req, res, next) {
        try {
            const { query, lat, lon, radius = 50000, categories = 'tourism' } = req.query;

            // Validasi input
            if (!query && !lat && !lon) {
                throw { name: 'BadRequest', message: 'Query or coordinates (lat, lon) are required' };
            }

            // Build params untuk Geoapify API
            const params = {
                apiKey: GEOAPIFY_API_KEY,
                categories: categories, // tourism, tourism.attraction, tourism.sights
                limit: 20 // Limit hasil
            };

            // Jika ada lat & lon, search by coordinates dengan radius
            if (lat && lon) {
                params.filter = `circle:${lon},${lat},${radius}`;
                params.bias = `proximity:${lon},${lat}`;
            }

            // Jika ada text query
            if (query) {
                params.text = query;
            }

            // Request ke Geoapify Places API
            const response = await axios.get(`${GEOAPIFY_BASE_URL}/places`, {
                params: params
            });

            // Extract hasil yang relevan
            const places = response.data.features.map(feature => ({
                id: feature.properties.place_id,
                name: feature.properties.name || feature.properties.formatted,
                address: feature.properties.formatted,
                location: {
                    lat: feature.properties.lat,
                    lon: feature.properties.lon
                },
                category: feature.properties.categories,
                distance: feature.properties.distance, // Jarak dalam meter (jika search by coordinates)
                datasource: feature.properties.datasource,
                place_id: feature.properties.place_id
            }));

            // Response
            res.status(200).json({
                total: places.length,
                searchParams: {
                    query,
                    location: lat && lon ? { lat, lon } : null,
                    radius: `${radius}m`
                },
                places
            });
        } catch (error) {
            // Handle error dari Geoapify API
            if (error.response) {
                return next({
                    name: 'ExternalAPIError',
                    message: `Geoapify API Error: ${error.response.data.message || error.message}`
                });
            }
            next(error);
        }
    }

    // Method untuk mendapatkan detail place berdasarkan place_id
    // Endpoint: GET /geoapify/details/:placeId
    // Access: Public
    static async getPlaceDetails(req, res, next) {
        try {
            const { placeId } = req.params;

            // Validasi
            if (!placeId) {
                throw { name: 'BadRequest', message: 'Place ID is required' };
            }

            // Request place details dari Geoapify
            // Menggunakan place lookup dengan place_id
            const response = await axios.get(`${GEOAPIFY_BASE_URL}/place-details`, {
                params: {
                    id: placeId,
                    apiKey: GEOAPIFY_API_KEY
                }
            });

            // Extract detail place
            const place = response.data.features[0];
            
            if (!place) {
                throw { name: 'NotFound', message: 'Place not found' };
            }

            const details = {
                id: place.properties.place_id,
                name: place.properties.name || place.properties.formatted,
                address: place.properties.formatted,
                location: {
                    lat: place.properties.lat,
                    lon: place.properties.lon
                },
                categories: place.properties.categories,
                datasource: place.properties.datasource,
                contact: {
                    phone: place.properties.contact?.phone,
                    email: place.properties.contact?.email,
                    website: place.properties.website
                },
                openingHours: place.properties.opening_hours,
                facilities: place.properties.facilities,
                wiki: place.properties.wiki_and_media
            };

            res.status(200).json(details);
        } catch (error) {
            if (error.response) {
                return next({
                    name: 'ExternalAPIError',
                    message: `Geoapify API Error: ${error.response.data.message || error.message}`
                });
            }
            next(error);
        }
    }

    // Method untuk search tourism attractions nearby
    // Endpoint: GET /geoapify/nearby
    // Query params: ?lat=-8.7184&lon=115.1686&radius=10000&type=attraction
    // Access: Public
    static async getNearbyAttractions(req, res, next) {
        try {
            const { lat, lon, radius = 10000, type = 'attraction' } = req.query;

            // Validasi
            if (!lat || !lon) {
                throw { name: 'BadRequest', message: 'Latitude and longitude are required' };
            }

            // Tentukan category berdasarkan type
            let categories = 'tourism';
            if (type === 'attraction') {
                categories = 'tourism.attraction,tourism.sights';
            } else if (type === 'museum') {
                categories = 'tourism.museum';
            } else if (type === 'beach') {
                categories = 'beach';
            } else if (type === 'mountain') {
                categories = 'natural.mountain';
            }

            // Request ke Geoapify
            const response = await axios.get(`${GEOAPIFY_BASE_URL}/places`, {
                params: {
                    categories: categories,
                    filter: `circle:${lon},${lat},${radius}`,
                    bias: `proximity:${lon},${lat}`,
                    limit: 30,
                    apiKey: GEOAPIFY_API_KEY
                }
            });

            // Extract dan sort by distance
            const seenNames = new Set(); // Track untuk deduplicate
            const attractions = response.data.features
                .filter(feature => {
                    const name = feature.properties.name;
                    if (!name || seenNames.has(name.toLowerCase())) {
                        return false; // Skip duplicate atau unnamed
                    }
                    seenNames.add(name.toLowerCase());
                    return true;
                })
                .slice(0, 20) // Limit to 20 unique places
                .map((feature) => {
                    const props = feature.properties;
                    const categories = props.categories || [];
                    
                    // Determine category display name
                    let categoryDisplay = 'Tourism';
                    if (categories.includes('tourism.attraction')) categoryDisplay = 'Attraction';
                    else if (categories.includes('tourism.sights')) categoryDisplay = 'Sights';
                    else if (categories.includes('tourism.museum')) categoryDisplay = 'Museum';
                    else if (categories.includes('beach')) categoryDisplay = 'Pantai';
                    else if (categories.includes('natural')) categoryDisplay = 'Natural';
                    else if (categories.includes('entertainment')) categoryDisplay = 'Entertainment';
                    
                    // Build description
                    const addressParts = props.formatted?.split(',') || [];
                    const location = addressParts.length > 1 ? addressParts.slice(-2).join(',').trim() : props.formatted;
                    const description = props.name ? 
                        `Tempat wisata menarik di ${location}. Kategori: ${categoryDisplay}. Jarak: ${(props.distance / 1000).toFixed(1)} km dari lokasi Anda.` :
                        `Destinasi wisata di ${location}`;
                    
                    // Get image based on place name and category
                    const imageUrl = getImageForPlace(props.name || 'tourism', categoryDisplay);
                    
                    return {
                        id: props.place_id,
                        name: props.name || 'Tempat Wisata',
                        description: description,
                        location: location,
                        latitude: props.lat,
                        longitude: props.lon,
                        imageUrl: imageUrl,
                        category: categoryDisplay,
                        rating: 4.0,
                        distance: props.distance,
                        distanceKm: (props.distance / 1000).toFixed(2)
                    };
                });
            
            const sortedAttractions = attractions.sort((a, b) => a.distance - b.distance);

            res.status(200).json({
                searchCenter: { lat, lon },
                radius: `${radius}m`,
                type: type,
                totalFound: sortedAttractions.length,
                attractions: sortedAttractions
            });
        } catch (error) {
            if (error.response) {
                return next({
                    name: 'ExternalAPIError',
                    message: `Geoapify API Error: ${error.response.data.message || error.message}`
                });
            }
            next(error);
        }
    }

    // Method untuk geocoding - convert address/place name to coordinates
    // Endpoint: GET /geoapify/geocode
    // Query params: ?address=Bali, Indonesia
    // Access: Public
    // Berguna untuk user yang ketik nama tempat dan kita perlu koordinatnya
    static async geocodeAddress(req, res, next) {
        try {
            const { address } = req.query;

            if (!address) {
                throw { name: 'BadRequest', message: 'Address is required' };
            }

            // Request geocoding
            const response = await axios.get('https://api.geoapify.com/v1/geocode/search', {
                params: {
                    text: address,
                    apiKey: GEOAPIFY_API_KEY,
                    limit: 5
                }
            });

            // Extract results
            const results = response.data.features.map(feature => ({
                formatted: feature.properties.formatted,
                location: {
                    lat: feature.properties.lat,
                    lon: feature.properties.lon
                },
                country: feature.properties.country,
                state: feature.properties.state,
                city: feature.properties.city,
                place_id: feature.properties.place_id
            }));

            res.status(200).json({
                query: address,
                totalResults: results.length,
                results
            });
        } catch (error) {
            if (error.response) {
                return next({
                    name: 'ExternalAPIError',
                    message: `Geoapify API Error: ${error.response.data.message || error.message}`
                });
            }
            next(error);
        }
    }

    // Method untuk autocomplete - suggestions saat user mengetik
    // Endpoint: GET /geoapify/autocomplete
    // Query params: ?text=bali
    // Access: Public
    // Untuk search box autocomplete di frontend
    static async autocomplete(req, res, next) {
        try {
            const { text } = req.query;

            if (!text || text.length < 2) {
                throw { name: 'BadRequest', message: 'Text must be at least 2 characters' };
            }

            // Request autocomplete
            const response = await axios.get('https://api.geoapify.com/v1/geocode/autocomplete', {
                params: {
                    text: text,
                    type: 'city,amenity', // Focus on cities and amenities (tourism places)
                    apiKey: GEOAPIFY_API_KEY,
                    limit: 10
                }
            });

            // Extract suggestions
            const suggestions = response.data.features.map(feature => ({
                text: feature.properties.formatted,
                name: feature.properties.name,
                location: {
                    lat: feature.properties.lat,
                    lon: feature.properties.lon
                },
                place_id: feature.properties.place_id,
                category: feature.properties.result_type
            }));

            res.status(200).json({
                query: text,
                suggestions
            });
        } catch (error) {
            if (error.response) {
                return next({
                    name: 'ExternalAPIError',
                    message: `Geoapify API Error: ${error.response.data.message || error.message}`
                });
            }
            next(error);
        }
    }
};
