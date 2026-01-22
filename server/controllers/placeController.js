// placeController untuk mengelola data destinasi wisata publik (READ ONLY)
// Controller ini hanya untuk mendapatkan data places, tidak ada create/update/delete
// Create/Update/Delete places dilakukan oleh admin atau seeding data

// Import models yang dibutuhkan
const { Place, sequelize } = require('../models');
const { Op } = require('sequelize'); // Operator untuk query Sequelize
const axios = require('axios');

// Function to fetch real image from Unsplash
async function fetchPlaceImage(placeName, category) {
    try {
        // Build very specific search query
        let searchQuery = placeName;
        const lowerName = placeName.toLowerCase();
        
        // Specific destinations get exact queries
        if (lowerName.includes('raja ampat')) {
            searchQuery = 'Raja Ampat Papua Indonesia coral reef island';
        } else if (lowerName.includes('borobudur')) {
            searchQuery = 'Borobudur temple Indonesia Magelang';
        } else if (lowerName.includes('bromo')) {
            searchQuery = 'Mount Bromo volcano Indonesia sunrise';
        } else if (lowerName.includes('nusa penida')) {
            searchQuery = 'Nusa Penida Bali cliff beach Indonesia';
        } else if (lowerName.includes('kawah ijen')) {
            searchQuery = 'Kawah Ijen blue fire volcano Indonesia';
        } else if (lowerName.includes('komodo')) {
            searchQuery = 'Komodo island Indonesia dragon';
        } else if (lowerName.includes('labuan bajo')) {
            searchQuery = 'Labuan Bajo Indonesia pink beach';
        } else if (lowerName.includes('toba')) {
            searchQuery = 'Lake Toba Sumatra Indonesia';
        } else if (lowerName.includes('bali') || lowerName.includes('kuta') || lowerName.includes('tanah lot')) {
            searchQuery = placeName + ' Bali Indonesia';
        } else {
            // Generic search with category context
            if (!lowerName.includes('indonesia')) {
                searchQuery += ' Indonesia';
            }
            
            // Add category-specific keywords
            if (category === 'Pantai') {
                searchQuery += ' beach ocean';
            } else if (category === 'Gunung') {
                searchQuery += ' mountain volcano';
            } else if (category === 'Candi') {
                searchQuery += ' temple ancient';
            } else if (category === 'Natural') {
                searchQuery += ' nature';
            }
        }
        
        console.log('Fetching Unsplash image for:', searchQuery);
        
        const unsplashResponse = await axios.get('https://api.unsplash.com/search/photos', {
            params: {
                query: searchQuery,
                per_page: 1,
                orientation: 'landscape'
            },
            headers: {
                'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
            }
        });
        
        if (unsplashResponse.data.results && unsplashResponse.data.results.length > 0) {
            const imageUrl = unsplashResponse.data.results[0].urls.regular;
            console.log('✅ Unsplash image found for', placeName, ':', imageUrl);
            return imageUrl;
        }
        
        console.log('⚠️ No Unsplash results for:', searchQuery);
    } catch (error) {
        console.log('❌ Unsplash API error for', placeName, ':', error.response?.data || error.message);
    }
    return null;
}

module.exports = class PlaceController {
    // Method untuk mendapatkan semua tempat wisata
    // Endpoint: GET /places
    // Access: Public (tidak perlu login)
    // Query params: ?category=Pantai&search=Bali
    static async getAllPlaces(req, res, next) {
        try {
            const { category, search } = req.query;
            
            // Build filter conditions
            const whereConditions = {};
            
            // Filter by category jika ada
            if (category) {
                whereConditions.category = category;
            }
            
            // Search by name atau location jika ada
            if (search) {
                whereConditions[Op.or] = [
                    { name: { [Op.iLike]: `%${search}%` } }, // Case-insensitive search
                    { location: { [Op.iLike]: `%${search}%` } }
                ];
            }

            // Mengambil semua data places dari database dengan filter
            const places = await Place.findAll({
                where: whereConditions,
                order: [['rating', 'DESC'], ['createdAt', 'DESC']] // Urutkan dari rating tertinggi
            });

            // Kembalikan response dengan status 200 dan data places
            res.status(200).json(places);
        } catch (error) {
            // Jika terjadi error, lempar ke errorHandler middleware
            next(error);
        }
    }

    // Method untuk mendapatkan detail satu tempat wisata berdasarkan ID
    // Endpoint: GET /places/:id
    // Access: Public (tidak perlu login)
    static async getPlaceById(req, res, next) {
        try {
            const { id } = req.params; // Ambil id dari URL parameter

            // Check if this is a Geoapify place_id (very long string)
            if (id.length > 50) {
                // This is likely a Geoapify place_id, redirect to geoapify endpoint
                const axios = require('axios');
                const GEOAPIFY_BASE_URL = 'https://api.geoapify.com/v2';
                const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY;
                
                try {
                    const response = await axios.get(`${GEOAPIFY_BASE_URL}/place-details`, {
                        params: {
                            id: id,
                            apiKey: GEOAPIFY_API_KEY
                        }
                    });
                    
                    const feature = response.data.features[0];
                    if (!feature) {
                        throw { name: 'NotFound', message: 'Place not found' };
                    }
                    
                    const props = feature.properties;
                    const categories = props.categories || [];
                    
                    // Determine category
                    let categoryDisplay = 'Tourism';
                    if (categories.includes('tourism.attraction')) categoryDisplay = 'Attraction';
                    else if (categories.includes('tourism.sights')) categoryDisplay = 'Sights';
                    else if (categories.includes('tourism.museum')) categoryDisplay = 'Museum';
                    else if (categories.includes('beach')) categoryDisplay = 'Pantai';
                    else if (categories.includes('natural')) categoryDisplay = 'Natural';
                    
                    // Build description for better image search
                    const addressParts = props.formatted?.split(',') || [];
                    const location = addressParts.length > 1 ? addressParts.slice(-2).join(',').trim() : props.formatted;
                    const tempDescription = props.name ? 
                        `${props.name} adalah tempat wisata menarik di ${location}. Kategori: ${categoryDisplay}.` :
                        `Destinasi wisata di ${location}`;
                    
                    // Fetch image with description for better accuracy
                    const realImage = await fetchPlaceImage(props.name, categoryDisplay, tempDescription);
                    let defaultImage = realImage || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80';
                    if (!realImage) {
                        if (categoryDisplay === 'Pantai') {
                            defaultImage = 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80';
                        } else if (categoryDisplay === 'Museum') {
                            defaultImage = 'https://images.unsplash.com/photo-1565552645632-d725f8bfc19d?w=800&q=80';
                        } else if (categoryDisplay === 'Natural') {
                            defaultImage = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80';
                        } else if (categoryDisplay === 'Sights' || categoryDisplay === 'Attraction') {
                            defaultImage = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80';
                        }
                    }
                    
                    // Format as database-like response
                    const placeData = {
                        id: props.place_id,
                        name: props.name || 'Tempat Wisata',
                        description: props.name ? 
                            `${props.name} adalah tempat wisata menarik di ${location}. Kategori: ${categoryDisplay}.\n\nAlamat lengkap: ${props.formatted}\n\nTempat ini menawarkan pengalaman wisata yang unik dan menarik untuk dikunjungi.` :
                            `Destinasi wisata di ${location}`,
                        location: location,
                        latitude: props.lat,
                        longitude: props.lon,
                        imageUrl: defaultImage,
                        category: categoryDisplay,
                        rating: 4.0
                    };
                    
                    return res.status(200).json(placeData);
                } catch (geoError) {
                    console.error('Geoapify error:', geoError.message);
                    throw { name: 'NotFound', message: 'Place not found' };
                }
            }

            // Normal database place lookup
            const place = await Place.findByPk(id);

            // Jika place tidak ditemukan, lempar error NotFound
            if (!place) {
                throw { name: 'NotFound', message: 'Place not found' };
            }

            // Kembalikan response dengan status 200 dan data place
            res.status(200).json(place);
        } catch (error) {
            // Jika terjadi error, lempar ke errorHandler middleware
            next(error);
        }
    }

    // Method untuk mencari places berdasarkan lokasi (koordinat) dalam radius tertentu
    // Endpoint: GET /places/nearby?lat=-6.2088&lng=106.8456&radius=10
    // Access: Public (tidak perlu login)
    // Query params: lat (latitude), lng (longitude), radius (dalam km, default 10km)
    static async getPlacesByLocation(req, res, next) {
        try {
            const { lat, lng, radius = 10 } = req.query; // Default radius 10km

            // Validasi input
            if (!lat || !lng) {
                throw { name: 'BadRequest', message: 'Latitude and longitude are required' };
            }

            // Convert to numbers
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lng);
            const radiusKm = parseFloat(radius);

            // Validasi range
            if (latitude < -90 || latitude > 90) {
                throw { name: 'BadRequest', message: 'Invalid latitude' };
            }
            if (longitude < -180 || longitude > 180) {
                throw { name: 'BadRequest', message: 'Invalid longitude' };
            }

            // Haversine formula untuk mencari places dalam radius tertentu
            // Formula: distance = acos(sin(lat1) * sin(lat2) + cos(lat1) * cos(lat2) * cos(lon2 - lon1)) * R
            // R = radius bumi (6371 km)
            const places = await sequelize.query(`
                SELECT *, 
                    6371 * acos(
                        cos(radians(${latitude})) 
                        * cos(radians(latitude)) 
                        * cos(radians(longitude) - radians(${longitude})) 
                        + sin(radians(${latitude})) 
                        * sin(radians(latitude))
                    ) AS distance 
                FROM "Places" 
                WHERE 6371 * acos(
                    cos(radians(${latitude})) 
                    * cos(radians(latitude)) 
                    * cos(radians(longitude) - radians(${longitude})) 
                    + sin(radians(${latitude})) 
                    * sin(radians(latitude))
                ) <= ${radiusKm}
                ORDER BY distance ASC
            `, { type: sequelize.QueryTypes.SELECT });

            // Kembalikan response
            res.status(200).json(places);
        } catch (error) {
            next(error);
        }
    }
};