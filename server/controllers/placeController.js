// placeController untuk mengelola data destinasi wisata publik (READ ONLY)
// Controller ini hanya untuk mendapatkan data places, tidak ada create/update/delete
// Create/Update/Delete places dilakukan oleh admin atau seeding data

// Import models yang dibutuhkan
const { Place, sequelize } = require('../models');
const { Op } = require('sequelize'); // Operator untuk query Sequelize

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

            // Cari place berdasarkan id
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
            const places = await Place.findAll({
                attributes: {
                    include: [
                        // Hitung distance menggunakan Haversine formula
                        [
                            sequelize.literal(`
                                6371 * acos(
                                    cos(radians(${latitude})) 
                                    * cos(radians(latitude)) 
                                    * cos(radians(longitude) - radians(${longitude})) 
                                    + sin(radians(${latitude})) 
                                    * sin(radians(latitude))
                                )
                            `),
                            'distance'
                        ]
                    ]
                },
                having: sequelize.literal(`
                    6371 * acos(
                        cos(radians(${latitude})) 
                        * cos(radians(latitude)) 
                        * cos(radians(longitude) - radians(${longitude})) 
                        + sin(radians(${latitude})) 
                        * sin(radians(latitude))
                    ) <= ${radiusKm}
                `),
                order: [[sequelize.literal('distance'), 'ASC']] // Urutkan dari yang terdekat
            });

            // Kembalikan response
            res.status(200).json({
                searchLocation: { latitude, longitude },
                radius: `${radiusKm}km`,
                totalFound: places.length,
                places
            });
        } catch (error) {
            next(error);
        }
    }
};