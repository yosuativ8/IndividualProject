// geminiController untuk mengelola AI features menggunakan Google Gemini API
// Features: Trip Planner AI, Chatbot Tourism, Personalized Recommendations

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { UserDestination, Place } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');

module.exports = class GeminiController {
    // Helper method untuk parsing kategori dari pertanyaan
    static parseCategoryFromQuery(message) {
        const lowerMessage = message.toLowerCase();
        const categoryMap = {
            'pantai': 'beach',
            'beach': 'beach',
            'gunung': 'mountain',
            'mountain': 'mountain',
            'museum': 'museum',
            'candi': 'attraction',
            'temple': 'attraction',
            'taman': 'attraction',
            'park': 'attraction',
            'danau': 'natural',
            'lake': 'natural',
            'air terjun': 'natural',
            'waterfall': 'natural'
        };

        for (const [keyword, category] of Object.entries(categoryMap)) {
            if (lowerMessage.includes(keyword)) {
                return category;
            }
        }
        return 'attraction'; // default
    }

    // Helper method untuk extract lokasi dari pertanyaan
    static extractLocationFromQuery(message) {
        // Pattern: "X di Y" atau "Y"
        const diPattern = /(.+?)\s+di\s+(.+)/i;
        const match = message.match(diPattern);
        
        if (match) {
            // Ada pattern "X di Y"
            return {
                category: match[1].trim(),
                location: match[2].trim()
            };
        }
        
        // Tidak ada pattern, anggap seluruh message adalah lokasi
        return {
            category: null,
            location: message.trim()
        };
    }

    // Helper method untuk mendapatkan gambar menggunakan Google Custom Search API
    static async getImageForPlace(placeName, category) {
        const lowerName = placeName.toLowerCase();
        let searchQuery = '';
        
        // Priority 1: Use actual place name if it's specific enough
        if (placeName && placeName.length > 3 && placeName !== 'Tempat Wisata') {
            // Remove generic words
            const cleanName = placeName.replace(/tempat wisata|destinasi|wisata/gi, '').trim();
            
            // Check if it's a specific place name
            if (cleanName.length > 3) {
                searchQuery = `${cleanName} tourist destination`;
            }
        }
        
        // Priority 2: Use specific destination keywords if match
        if (!searchQuery) {
            // Just use the place name as is for better worldwide results
            if (placeName.length > 5) {
                searchQuery = `${placeName} landmark tourist attraction`;
            }
        }
        
        // Priority 3: Use category-based keywords as last resort
        if (!searchQuery) {
            if (category === 'Beach' || category === 'Pantai') {
                searchQuery = 'beach tourism destination';
            } else if (category === 'Mountain' || category === 'Gunung') {
                searchQuery = 'mountain tourism destination';
            } else if (category === 'Museum') {
                searchQuery = 'museum tourist attraction';
            } else if (category === 'Attraction' || category === 'Temple') {
                searchQuery = 'famous landmark tourist attraction';
            } else if (category === 'Nature' || category === 'Park') {
                searchQuery = 'nature park tourism';
            } else {
                searchQuery = 'tourist destination landmark';
            }
        }
        
        // Use Google Custom Search API for accurate image results
        try {
            const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
                params: {
                    key: process.env.GOOGLE_API_KEY,
                    cx: process.env.GOOGLE_CSE_ID,
                    q: searchQuery,
                    searchType: 'image',
                    num: 1,
                    imgSize: 'large',
                    imgType: 'photo',
                    safe: 'active'
                }
            });
            
            if (response.data && response.data.items && response.data.items.length > 0) {
                const imageUrl = response.data.items[0].link;
                console.log(`Found image for "${searchQuery}": ${imageUrl}`);
                return imageUrl;
            }
            
            // Fallback to Unsplash Source if no results
            console.log(`No Google Image results for "${searchQuery}", using Unsplash fallback`);
            return `https://source.unsplash.com/800x600/?${searchQuery.replace(/\s/g, ',')}`;
        } catch (error) {
            console.error('Google Custom Search API error:', error.response?.status || error.message);
            
            // Fallback to Unsplash Source if API fails (403, quota exceeded, etc)
            console.log(`Using Unsplash fallback for "${searchQuery}"`);
            return `https://source.unsplash.com/800x600/?${searchQuery.replace(/\s/g, ',')}`;
        }
    }

    // Method untuk AI Trip Planner - Generate itinerary based on wishlist dan preferences
    // Endpoint: POST /gemini/trip-planner
    // Access: Private (perlu login)
    // Body: { destination, days, budget, preferences }
    static async generateTripItinerary(req, res, next) {
        try {
            // Initialize Gemini AI inside method so mock works
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const userId = req.user.id;
            const { destination, days = 3, budget, preferences = [] } = req.body;

            // Validasi
            if (!destination) {
                throw { name: 'BadRequest', message: 'Destination is required' };
            }

            // Ambil wishlist user untuk destinasi tersebut
            const userWishlist = await UserDestination.findAll({
                where: { userId },
                include: [
                    {
                        model: Place,
                        as: 'place',
                        attributes: ['name', 'description', 'location', 'category', 'rating']
                    }
                ]
            });

            // Build context untuk AI
            const wishlistPlaces = userWishlist.map(w => ({
                name: w.place.name,
                location: w.place.location,
                category: w.place.category,
                notes: w.notes
            }));

            // Build prompt yang detail untuk Gemini
            const prompt = `
Saya adalah seorang travel planner expert. Saya akan membuat itinerary perjalanan yang detail dan praktis.

Destination: ${destination}
Duration: ${days} hari
Budget: ${budget || 'flexible'}
User Preferences: ${preferences.length > 0 ? preferences.join(', ') : 'general tourism'}

${wishlistPlaces.length > 0 ? `
User's Wishlist (prioritaskan tempat-tempat ini):
${wishlistPlaces.map(p => `- ${p.name} (${p.location}) - Category: ${p.category}`).join('\n')}
${wishlistPlaces.some(p => p.notes) ? '\nUser Notes:\n' + wishlistPlaces.filter(p => p.notes).map(p => `- ${p.name}: ${p.notes}`).join('\n') : ''}
` : 'User belum memiliki wishlist, berikan rekomendasi tempat wisata populer.'}

Buatkan itinerary detail dengan format JSON sebagai berikut:
{
  "tripTitle": "string",
  "destination": "string",
  "duration": number,
  "estimatedBudget": {
    "min": number,
    "max": number,
    "currency": "IDR"
  },
  "itinerary": [
    {
      "day": number,
      "date": "optional",
      "title": "string",
      "activities": [
        {
          "time": "HH:MM",
          "activity": "string",
          "location": "string",
          "duration": "string",
          "estimatedCost": number,
          "tips": "string",
          "category": "string"
        }
      ],
      "meals": [
        {
          "type": "breakfast/lunch/dinner",
          "recommendation": "string",
          "estimatedCost": number
        }
      ],
      "accommodation": {
        "suggestion": "string",
        "estimatedCost": number
      }
    }
  ],
  "transportation": {
    "suggestions": ["string"],
    "estimatedCost": number
  },
  "packingList": ["string"],
  "importantTips": ["string"],
  "emergencyContacts": ["string"]
}

Pastikan:
1. Itinerary realistis dan dapat dijalankan
2. Waktu perjalanan antar lokasi sudah diperhitungkan
3. Budget estimation akurat untuk Indonesia
4. Prioritaskan wishlist user jika ada
5. Berikan tips lokal yang berguna
6. Response HARUS dalam format JSON yang valid
`;

            // Request ke Gemini AI
            const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            // Parse JSON response (clean markdown code blocks if any)
            text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim(); // menghapus ```json jika ada
            const itinerary = JSON.parse(text);

            // Response
            res.status(200).json({
                message: 'Trip itinerary generated successfully', // untuk logging frontend
                itinerary
            });
        } catch (error) {
            // Handle JSON parse error
            if (error instanceof SyntaxError) {
                return next({ 
                    name: 'ExternalAPIError', // custom error untuk Gemini
                    message: 'Failed to parse AI response. Please try again.' // untuk user
                });
            }
            next(error);
        }
    }

    // Method untuk Chatbot Tourism - Conversational AI assistant
    // Endpoint: POST /gemini/chat
    // Access: Private (perlu login)
    // Body: { message, conversationHistory }
    static async chatbot(req, res, next) {
        try {
            console.log('Chatbot request received:', { userId: req.user?.id, message: req.body?.message });
            
            // Initialize Gemini AI inside method so mock works
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // Gemini API Key from .env
            const { Op } = require('sequelize'); // Import Op di dalam method
            const userId = req.user.id; // Pastikan userId diambil dari req.user
            const { message, conversationHistory = [] } = req.body; // Pesan dari user dan history percakapan

            // Validasi
            if (!message) {
                throw { name: 'BadRequest', message: 'Message is required' };
            }

            console.log('Processing message:', message);

            // Search for relevant places in database based on message
            const searchKeywords = message.toLowerCase().match(/\b\w{4,}\b/g) || [];
            let relevantPlaces = [];
            let mapCenter = null;
            
            if (searchKeywords.length > 0) {
                relevantPlaces = await Place.findAll({ // Mencari places yang relevan dengan keywords
                    where: {
                        [Op.or]: searchKeywords.map(keyword => ({ // gunakan array untuk multiple OR conditions
                            [Op.or]: [ // cari di beberapa field
                                { name: { [Op.iLike]: `%${keyword}%` } },
                                { location: { [Op.iLike]: `%${keyword}%` } },
                                { description: { [Op.iLike]: `%${keyword}%` } },
                                { category: { [Op.iLike]: `%${keyword}%` } }
                            ]
                        }))
                    },
                    limit: 5,
                    attributes: ['id', 'name', 'description', 'location', 'category', 'rating', 'imageUrl', 'latitude', 'longitude'] // fields to return
                });
                
                // Set map center jika ada hasil dari DB
                if (relevantPlaces.length > 0 && relevantPlaces[0].latitude && relevantPlaces[0].longitude) {
                    mapCenter = {
                        lat: relevantPlaces[0].latitude,
                        lon: relevantPlaces[0].longitude,
                        zoom: 10
                    };
                }
            }
            
            console.log('Database results:', relevantPlaces.length);

            // Ambil context user (wishlist untuk personalized response)
            const userWishlist = await UserDestination.findAll({
                where: { userId },
                include: [
                    {
                        model: Place,
                        as: 'place',
                        attributes: ['name', 'location', 'category']
                    }
                ],
                limit: 10
            });

            // Build context with database results
            const userContext = userWishlist.length > 0 
                ? `\nUser's saved places: ${userWishlist.map(w => w.place.name).join(', ')}`
                : '';

            const placesContext = relevantPlaces.length > 0
                ? `\n\nRelevant places from database:\n${relevantPlaces.map(p => 
                    `- ${p.name} (${p.location})\n  Category: ${p.category}\n  Rating: ${p.rating}/5\n  Description: ${p.description?.substring(0, 150)}...`
                ).join('\n\n')}`
                : '\n\nNo relevant places in database. Generate new recommendations based on user query.';

            // Build conversation history for context
            const historyText = conversationHistory.length > 0
                ? '\n\nPrevious conversation:\n' + conversationHistory.slice(-3).map(h => `${h.role}: ${h.text}`).join('\n')
                : '';

            // Build system prompt untuk JSON response
            const systemPrompt = `
Saya adalah Tourism Assistant AI yang membantu travelers merencanakan perjalanan wisata di seluruh dunia.

User context:${userContext}${placesContext}${historyText}

User question: ${message}

Response HARUS dalam format JSON dengan struktur:
{
  "reply": "string - Jawaban singkat 2-3 kalimat dengan format: salam pembuka + jumlah destinasi + call to action",
  "places": [
    {
      "name": "string - Nama destinasi lengkap",
      "location": "string - Kota, Negara (contoh: Tokyo, Japan atau Bali, Indonesia)",
      "category": "string - Beach/Mountain/Temple/Museum/Park/Nature/Attraction",
      "description": "string - Deskripsi singkat 1-2 kalimat tentang keunikan tempat",
      "latitude": number,
      "longitude": number,
      "rating": number (4.0-5.0)
    }
  ]
}

ATURAN PENTING:
1. "reply" maksimal 3 kalimat (contoh: "Berikut 5 destinasi wisata di Tokyo yang wajib dikunjungi! Lihat detail lengkap di card list di bawah 🗺️")
2. "places" array berisi 5-10 destinasi wisata ASLI sesuai query user dengan KOORDINAT YANG BENAR
3. Setiap place HARUS punya koordinat latitude/longitude yang AKURAT untuk lokasi tersebut
4. Nama destinasi harus SPESIFIK (contoh: "Tokyo Tower", "Eiffel Tower", "Candi Borobudur")
5. Lokasi format: "Kota, Negara" (contoh: "Paris, France" atau "Bali, Indonesia")
6. Category: Beach, Mountain, Temple, Museum, Park, Nature, atau Attraction
7. JANGAN include deskripsi panjang dalam reply, taruh di places.description
8. Response HARUS valid JSON, jangan tambahkan markdown atau penjelasan lain
9. Sesuaikan destinasi dengan query user - jika tanya Jepang beri destinasi Jepang, jika tanya Bali beri destinasi Bali

Contoh response yang BENAR untuk "destinasi di medan":
{
  "reply": "Berikut 5 destinasi wisata menarik di Medan! Scroll ke bawah untuk melihat foto, rating, dan detailnya 🗺️",
  "places": [
    {
      "name": "Istana Maimun",
      "location": "Medan, Sumatera Utara",
      "category": "Candi",
      "description": "Istana kerajaan Kesultanan Deli dengan arsitektur Melayu-Islam yang megah.",
      "latitude": 3.5752,
      "longitude": 98.6837,
      "rating": 4.5
    },
    {
      "name": "Masjid Raya Medan",
      "location": "Medan, Sumatera Utara", 
      "category": "Candi",
      "description": "Masjid berarsitektur Timur Tengah dengan kubah hijau yang ikonik.",
      "latitude": 3.5760,
      "longitude": 98.6849,
      "rating": 4.6
    }
  ]
}
`;

            // Request ke Gemini AI untuk SEMUA query (baik DB ada hasil atau tidak)
            console.log('=== Requesting Gemini AI ===');
            console.log('Model: gemini-flash-lite-latest');
            console.log('API Key configured:', !!process.env.GEMINI_API_KEY);
            console.log('DB results:', relevantPlaces.length);
            
            let reply;
            const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
            
            try {
                const result = await model.generateContent(systemPrompt);
                const aiResponse = await result.response;
                let rawText = aiResponse.text();
                console.log('✅ Gemini AI response received');
                
                // Clean markdown code blocks jika ada
                rawText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                
                // Parse JSON response dari Gemini
                const geminiData = JSON.parse(rawText);
                reply = geminiData.reply;
                
                console.log('Parsed Gemini data:', { 
                    replyLength: reply.length, 
                    placesCount: geminiData.places?.length 
                });
                
                // Jika Gemini memberikan places, fetch gambar untuk setiap destinasi
                if (geminiData.places && geminiData.places.length > 0) {
                    console.log(`🖼️ Fetching images for ${geminiData.places.length} places from Google Custom Search...`);
                    
                    // Parallel fetch images untuk semua places
                    const placesWithImages = await Promise.all(
                        geminiData.places.map(async (place) => {
                            // Cari place di database berdasarkan name
                            const dbPlace = await Place.findOne({
                                where: {
                                    name: {
                                        [Op.iLike]: `%${place.name}%`
                                    }
                                }
                            });
                            
                            // Jika ditemukan di database, gunakan data database (termasuk ID dan imageUrl dari seed)
                            if (dbPlace) {
                                console.log(`✓ Found in DB: ${dbPlace.name} (ID: ${dbPlace.id})`);
                                return {
                                    id: dbPlace.id,  // Gunakan ID integer dari database
                                    name: dbPlace.name,
                                    description: dbPlace.description,
                                    location: dbPlace.location,
                                    latitude: dbPlace.latitude,
                                    longitude: dbPlace.longitude,
                                    imageUrl: dbPlace.imageUrl,  // Gunakan imageUrl dari seed yang sudah akurat
                                    category: dbPlace.category,
                                    rating: dbPlace.rating
                                };
                            }
                            
                            // Jika tidak ditemukan di database, fetch image dari Google (fallback)
                            console.log(`⚠ Not in DB, fetching image for: ${place.name}`);
                            const imageUrl = await GeminiController.getImageForPlace(place.name, place.category);
                            
                            return {
                                id: null,  // No ID karena tidak ada di database
                                name: place.name,
                                description: place.description || `Destinasi wisata menarik di ${place.location}`,
                                location: place.location,
                                latitude: place.latitude,
                                longitude: place.longitude,
                                imageUrl: imageUrl,
                                category: place.category,
                                rating: place.rating || 4.5
                            };
                        })
                    );
                    
                    // Override relevantPlaces dengan hasil dari Gemini + gambar
                    relevantPlaces = placesWithImages;
                    
                    // Append destination names to reply
                    if (placesWithImages.length > 0) {
                        const destinationNames = placesWithImages.map((p, idx) => `${idx + 1}. ${p.name}`).join('\n');
                        reply += `\n\n📍 Destinasi yang ditemukan:\n${destinationNames}`;
                    }
                    
                    // Set map center ke destinasi pertama
                    if (placesWithImages[0].latitude && placesWithImages[0].longitude) {
                        mapCenter = {
                            lat: placesWithImages[0].latitude,
                            lon: placesWithImages[0].longitude,
                            zoom: 11
                        };
                    }
                    
                    console.log(`✅ Successfully processed ${placesWithImages.length} places with images`);
                    console.log('First place:', placesWithImages[0].name, placesWithImages[0].location);
                } else if (relevantPlaces.length > 0) {
                    // Jika Gemini tidak return places, tapi DB punya data, pakai DB data
                    console.log('Using database results');
                    
                    // Append destination names from DB to reply
                    const destinationNames = relevantPlaces.map((p, idx) => `${idx + 1}. ${p.name}`).join('\n');
                    if (!reply.includes('📍 Destinasi')) {
                        reply += `\n\n📍 Destinasi yang ditemukan:\n${destinationNames}`;
                    }
                }
                
            } catch (geminiError) {
                console.error('❌ Gemini API error:', geminiError.message);
                console.error('Error stack:', geminiError.stack);
                
                // Fallback response jika Gemini tidak tersedia
                if (relevantPlaces.length > 0) {
                    // Jika ada places yang relevan dari database
                    const locationName = message.toLowerCase().includes('di') ? message.split('di')[1]?.trim() : 'area ini';
                    reply = `Berikut rekomendasi destinasi di ${locationName}:\n\n`;
                    relevantPlaces.forEach((place) => {
                        reply += `• ${place.name}\n`;
                    });
                    reply += `\nLihat detail lengkap, foto, dan rating di card list di bawah! 🗺️`;
                } else {
                    // Smart fallback for greetings and casual messages
                    const lowerMessage = message.toLowerCase().trim();
                    const greetings = ['hi', 'halo', 'hello', 'hai', 'hei', 'hey'];
                    const isGreeting = greetings.some(g => lowerMessage === g || lowerMessage.startsWith(g + ' '));
                    
                    if (isGreeting) {
                        reply = `Halo! 👋 Selamat datang di NextTrip!\n\n`;
                        reply += `Saya adalah Tourism Assistant yang siap membantu Anda merencanakan perjalanan wisata di Indonesia.\n\n`;
                        reply += `Anda bisa bertanya tentang:\n`;
                        reply += `• Rekomendasi destinasi wisata\n`;
                        reply += `• Informasi tempat wisata tertentu\n`;
                        reply += `• Tips perjalanan (budget, transportasi, akomodasi)\n`;
                        reply += `• Kuliner dan budaya lokal\n\n`;
                        reply += `Contoh pertanyaan:\n`;
                        reply += `"Rekomendasi wisata pantai di Bali"\n`;
                        reply += `"Tempat wisata di Jogja untuk keluarga"\n`;
                        reply += `"Gunung yang bagus untuk pendaki pemula"\n\n`;
                        reply += `Silakan tanya apa saja! 😊`;
                    } else {
                        reply = `Maaf, saat ini AI assistant sedang dalam proses koneksi ke server.\n\n`;
                        reply += `Namun Anda tetap bisa:\n`;
                        reply += `• Menjelajahi destinasi wisata di halaman utama\n`;
                        reply += `• Mencari berdasarkan nama kota atau kategori\n`;
                        reply += `• Coba cari: "pantai", "gunung", "candi", atau nama kota seperti "bali", "jogja"\n\n`;
                        reply += `Atau coba tanya lagi dengan pertanyaan yang lebih spesifik tentang destinasi wisata! 🗺️`;
                    }
                }
            }

            // Response with places data for frontend to display
            res.status(200).json({
                response: reply,
                places: relevantPlaces.length > 0 ? relevantPlaces : null,
                mapCenter: mapCenter, // Koordinat untuk center map
                conversationId: conversationHistory.length + 1
            });
        } catch (error) {
            console.error('Chatbot error:', error);
            console.error('Error details:', error.message, error.stack);
            
            // Check if it's a Gemini API error
            if (error.message?.includes('API key') || error.message?.includes('quota')) {
                return res.status(500).json({ 
                    message: 'AI service error. Please check API key or quota.',
                    error: error.message 
                });
            }
            
            next(error);
        }
    }

    // Method untuk Personalized Recommendations based on user behavior
    // Endpoint: POST /gemini/recommendations
    // Access: Private (perlu login)
    static async getPersonalizedRecommendations(req, res, next) {
        try {
            // Initialize Gemini AI inside method so mock works
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const userId = req.user.id;

            // Ambil semua wishlist user untuk analyze pattern
            const userWishlist = await UserDestination.findAll({
                where: { userId },
                include: [
                    {
                        model: Place,
                        as: 'place',
                        attributes: ['name', 'description', 'location', 'category', 'rating']
                    }
                ]
            });

            // Jika user belum punya wishlist
            if (userWishlist.length === 0) {
                return res.status(200).json({
                    message: 'No wishlist data yet. Start exploring and save some places!',
                    recommendations: []
                });
            }

            // Analyze user preferences
            const categories = userWishlist.map(w => w.place.category);
            const categoryCount = categories.reduce((acc, cat) => {
                acc[cat] = (acc[cat] || 0) + 1;
                return acc;
            }, {});
            const topCategories = Object.entries(categoryCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([cat]) => cat);

            const savedPlaces = userWishlist.map(w => ({
                name: w.place.name,
                location: w.place.location,
                category: w.place.category,
                rating: w.place.rating
            }));

            // Build prompt untuk AI
            const prompt = `
Saya adalah AI recommendation expert untuk destinasi wisata.

User telah menyimpan ${userWishlist.length} destinasi wisata:
${savedPlaces.map(p => `- ${p.name} (${p.location}) - Category: ${p.category}, Rating: ${p.rating}`).join('\n')}

User preferences analysis:
- Top categories: ${topCategories.join(', ')}
- Average rating preference: ${(savedPlaces.reduce((sum, p) => sum + (p.rating || 0), 0) / savedPlaces.length).toFixed(1)}

Berdasarkan data di atas, berikan 8 rekomendasi destinasi wisata baru di Indonesia yang:
1. Sesuai dengan kategori favorit user
2. Belum ada dalam wishlist user
3. Memiliki karakteristik serupa dengan tempat yang sudah disave
4. Tersebar di berbagai lokasi (tidak hanya satu daerah)

Format response dalam JSON:
{
  "analysis": {
    "userPreference": "string description",
    "recommendationReason": "string"
  },
  "recommendations": [
    {
      "name": "string",
      "location": "string",
      "category": "string",
      "description": "string (singkat 2-3 kalimat)",
      "whyRecommended": "string (jelaskan kenapa cocok untuk user)",
      "estimatedBudget": "string",
      "bestTime": "string"
    }
  ]
}
`;

            // Request ke Gemini AI
            const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            // Parse JSON
            text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const recommendations = JSON.parse(text);

            // Response
            res.status(200).json(recommendations);
        } catch (error) {
            if (error instanceof SyntaxError) {
                return next({
                    name: 'ExternalAPIError',
                    message: 'Failed to parse AI response. Please try again.'
                });
            }
            next(error);
        }
    }

    // Method untuk generate deskripsi destinasi (content generation)
    // Endpoint: POST /gemini/generate-description
    // Access: Public
    // Body: { placeName, location, category }
    static async generatePlaceDescription(req, res, next) {
        try {
            // Initialize Gemini AI inside method so mock works
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const { placeName, location, category } = req.body;

            if (!placeName || !location) {
                throw { name: 'BadRequest', message: 'Place name and location are required' };
            }

            const prompt = `
Buatkan deskripsi menarik dan informatif untuk destinasi wisata berikut:

Nama: ${placeName}
Lokasi: ${location}
Kategori: ${category || 'destinasi wisata'}

Deskripsi harus:
- 3-4 paragraf (150-200 kata)
- Menjelaskan keunikan tempat
- Menyebutkan aktivitas yang bisa dilakukan
- Tips waktu terbaik berkunjung
- Aksesibilitas dan fasilitas
- Ditulis dalam bahasa Indonesia yang menarik

Format plain text, tidak perlu markdown atau bullet points.
`;

            const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const description = response.text();

            res.status(200).json({
                placeName,
                location,
                category,
                description
            });
        } catch (error) {
            next(error);
        }
    }
};
