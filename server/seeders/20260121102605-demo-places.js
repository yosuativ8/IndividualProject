'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Seed data destinasi wisata di Indonesia
    await queryInterface.bulkInsert('Places', [
      {
        name: 'Pantai Kuta',
        description: 'Pantai terkenal di Bali dengan pasir putih dan sunset yang indah. Cocok untuk surfing dan bersantai.',
        location: 'Kuta, Bali',
        latitude: -8.7184,
        longitude: 115.1686,
        imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
        category: 'Pantai',
        rating: 4.5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Candi Borobudur',
        description: 'Candi Buddha terbesar di dunia yang merupakan situs warisan dunia UNESCO.',
        location: 'Magelang, Jawa Tengah',
        latitude: -7.6079,
        longitude: 110.2038,
        imageUrl: 'https://images.unsplash.com/photo-1586339277870-99906474b50d?w=800',
        category: 'Candi',
        rating: 4.8,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Gunung Bromo',
        description: 'Gunung berapi aktif dengan pemandangan sunrise yang spektakuler dan lautan pasir.',
        location: 'Probolinggo, Jawa Timur',
        latitude: -7.9425,
        longitude: 112.9531,
        imageUrl: 'https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=800',
        category: 'Gunung',
        rating: 4.7,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Tanah Lot',
        description: 'Pura di atas batu karang dengan pemandangan sunset yang memukau.',
        location: 'Tabanan, Bali',
        latitude: -8.6211,
        longitude: 115.0869,
        imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800',
        category: 'Candi',
        rating: 4.6,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Raja Ampat',
        description: 'Surga diving dengan keanekaragaman hayati laut terkaya di dunia.',
        location: 'Papua Barat',
        latitude: -0.2554,
        longitude: 130.5173,
        imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800',
        category: 'Pantai',
        rating: 5.0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Kawah Ijen',
        description: 'Kawah vulkanik dengan blue fire phenomenon yang langka dan pemandangan danau asam berwarna tosca.',
        location: 'Banyuwangi, Jawa Timur',
        latitude: -8.0583,
        longitude: 114.2425,
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        category: 'Gunung',
        rating: 4.7,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Taman Mini Indonesia Indah',
        description: 'Taman rekreasi yang menampilkan miniatur budaya dan arsitektur dari seluruh provinsi Indonesia.',
        location: 'Jakarta Timur',
        latitude: -6.3025,
        longitude: 106.8953,
        imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
        category: 'Taman',
        rating: 4.2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Nusa Penida',
        description: 'Pulau dengan pemandangan tebing dramatis, pantai berpasir putih, dan spot snorkeling yang menakjubkan.',
        location: 'Klungkung, Bali',
        latitude: -8.7274,
        longitude: 115.5447,
        imageUrl: 'https://images.unsplash.com/photo-1558005530-a7958896e03f?w=800',
        category: 'Pantai',
        rating: 4.8,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Museum Nasional Indonesia',
        description: 'Museum terbesar di Asia Tenggara yang menyimpan koleksi prasejarah, arkeologi, etnografi, dan seni.',
        location: 'Jakarta Pusat',
        latitude: -6.1753,
        longitude: 106.8249,
        imageUrl: 'https://images.unsplash.com/photo-1566127444979-b3d2b64d6976?w=800',
        category: 'Museum',
        rating: 4.3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Labuan Bajo',
        description: 'Kota pelabuhan sebagai gerbang menuju Taman Nasional Komodo dengan pantai-pantai eksotis.',
        location: 'Flores, Nusa Tenggara Timur',
        latitude: -8.4969,
        longitude: 119.8878,
        imageUrl: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=800',
        category: 'Pantai',
        rating: 4.6,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Places', null, {});
  }
};
