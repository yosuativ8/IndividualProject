// geminiController untuk mengelola AI features menggunakan Google Gemini API
// Features: Trip Planner AI, Chatbot Tourism, Personalized Recommendations

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { UserDestination, Place } = require('../models');

module.exports = class GeminiController {
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
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            // Parse JSON response (clean markdown code blocks if any)
            text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const itinerary = JSON.parse(text);

            // Response
            res.status(200).json({
                message: 'Trip itinerary generated successfully',
                itinerary
            });
        } catch (error) {
            // Handle JSON parse error
            if (error instanceof SyntaxError) {
                return next({
                    name: 'ExternalAPIError',
                    message: 'Failed to parse AI response. Please try again.'
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
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const { Op } = require('sequelize');
            const userId = req.user.id;
            const { message, conversationHistory = [] } = req.body;

            // Validasi
            if (!message) {
                throw { name: 'BadRequest', message: 'Message is required' };
            }

            console.log('Processing message:', message);

            // Search for relevant places in database based on message
            const searchKeywords = message.toLowerCase().match(/\b\w{4,}\b/g) || [];
            let relevantPlaces = [];
            
            if (searchKeywords.length > 0) {
                relevantPlaces = await Place.findAll({
                    where: {
                        [Op.or]: searchKeywords.map(keyword => ({
                            [Op.or]: [
                                { name: { [Op.iLike]: `%${keyword}%` } },
                                { location: { [Op.iLike]: `%${keyword}%` } },
                                { description: { [Op.iLike]: `%${keyword}%` } },
                                { category: { [Op.iLike]: `%${keyword}%` } }
                            ]
                        }))
                    },
                    limit: 5,
                    attributes: ['id', 'name', 'description', 'location', 'category', 'rating', 'imageUrl']
                });
            }

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
                : '';

            // Build conversation history for context
            const historyText = conversationHistory.length > 0
                ? '\n\nPrevious conversation:\n' + conversationHistory.slice(-3).map(h => `${h.role}: ${h.text}`).join('\n')
                : '';

            // Build system prompt
            const systemPrompt = `
Saya adalah Tourism Assistant AI yang membantu travelers merencanakan perjalanan wisata di Indonesia.
Saya ramah, informatif, dan selalu memberikan jawaban yang praktis dan berguna.

Kemampuan saya:
- Memberikan rekomendasi destinasi wisata
- Menjawab pertanyaan tentang tempat wisata (akses, harga, waktu terbaik berkunjung)
- Tips traveling (budget, transportasi, akomodasi, makanan)
- Informasi budaya dan keamanan
- Rekomendasi itinerary

User context:${userContext}${placesContext}${historyText}

User question: ${message}

Jawab dengan:
1. Singkat dan jelas (2-4 paragraf)
2. Berikan informasi praktis (harga, waktu, akses)
3. Jika menemukan tempat wisata dari database, sebutkan dengan detail
4. Jika ada, referensikan tempat yang user sudah save
5. Gunakan bahasa Indonesia yang ramah dan engaging
6. Format dengan paragraph breaks untuk readability
`;

            // Request ke Gemini AI
            console.log('=== Requesting Gemini AI ===');
            console.log('Model: gemini-1.5-flash');
            console.log('API Key configured:', !!process.env.GEMINI_API_KEY);
            
            let reply;
            try {
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const result = await model.generateContent(systemPrompt);
                const aiResponse = await result.response;
                reply = aiResponse.text();
                console.log('✅ Gemini AI response received successfully');
                console.log('Response length:', reply.length);
            } catch (geminiError) {
                console.error('Gemini API error:', geminiError.message);
                console.error('Error details:', geminiError.response?.data || geminiError);
                
                // Fallback response jika Gemini tidak tersedia
                if (relevantPlaces.length > 0) {
                    // Jika ada places yang relevan dari database
                    reply = `Saya menemukan ${relevantPlaces.length} tempat wisata yang sesuai dengan pencarian Anda!\n\n`;
                    relevantPlaces.forEach((place, idx) => {
                        reply += `${idx + 1}. ${place.name} (${place.location})\n`;
                        reply += `   Kategori: ${place.category} | Rating: ${place.rating}/5\n`;
                        reply += `   ${place.description?.substring(0, 100)}...\n\n`;
                    });
                    reply += 'Klik pada card di bawah untuk melihat detail lengkap!';
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
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
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

            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
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
