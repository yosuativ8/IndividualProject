/**
 * Place Model
 * 
 * Model Sequelize untuk table Places di database.
 * Table ini menyimpan data destinasi wisata yang tersedia di aplikasi.
 * 
 * Data Source:
 * - Seeding data (initial destinations dari Indonesia)
 * - Admin panel (untuk add/update/delete destinations)
 * - External API (Geoapify untuk dynamic destinations)
 * 
 * Relationships:
 * - belongsToMany User through UserDestination (users who saved this place)
 * 
 * Features:
 * - Location-based search (latitude, longitude)
 * - Category filtering (Pantai, Gunung, Candi, dll)
 * - Rating system (0-5)
 * - Image URL untuk display
 */

'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Place extends Model {
    /**
     * Associate Method
     * 
     * Method untuk define relationships antara Place dengan model lain.
     * 
     * @param {Object} models - Semua models dalam aplikasi
     */
    static associate(models) {
      // Many-to-Many: Place <-> User melalui UserDestination
      // Satu place bisa di-save oleh banyak users (popularity)
      // Satu user bisa save banyak places (wishlist)
      Place.belongsToMany(models.User, { 
        through: models.UserDestination, // Junction table
        foreignKey: 'placeId', // FK di UserDestination
        as: 'savedByUsers' // Alias untuk eager loading
      });
    }
  }
  
  /**
   * Place Schema Definition
   * 
   * Field definitions dengan validations untuk Place model.
   */
  Place.init({
    /**
     * Name Field
     * @type {string}
     * @required
     * @example "Candi Borobudur", "Pantai Kuta", "Gunung Bromo"
     */
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Nama tempat tidak boleh kosong' }
      }
    },
    /**
     * Description Field
     * @type {text}
     * @required
     * @description Deskripsi lengkap tentang destinasi, aktivitas, tips, dll
     * @example "Candi Buddha terbesar di dunia dengan arsitektur megah..."
     */
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Deskripsi tidak boleh kosong' }
      }
    },
    /**
     * Location Field
     * @type {string}
     * @required
     * @format "Kota, Provinsi" atau "Kota, Negara"
     * @example "Magelang, Central Java", "Denpasar, Bali"
     */
    location: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Lokasi tidak boleh kosong' }
      }
    },
    /**
     * Latitude Field
     * @type {float}
     * @required
     * @range -90 to 90
     * @usage Location-based search, map display, nearby attractions
     * @example -7.6079 (Borobudur)
     */
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: { args: [-90], msg: 'Latitude minimal -90' },
        max: { args: [90], msg: 'Latitude maksimal 90' }
      }
    },
    /**
     * Longitude Field
     * @type {float}
     * @required
     * @range -180 to 180
     * @usage Location-based search, map display, nearby attractions
     * @example 110.2038 (Borobudur)
     */
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: { args: [-180], msg: 'Longitude minimal -180' },
        max: { args: [180], msg: 'Longitude maksimal 180' }
      }
    },
    /**
     * Image URL Field
     * @type {string}
     * @optional
     * @validation Must be valid URL format
     * @source Unsplash API, seeded data, or admin upload
     * @example "https://images.unsplash.com/photo-..."
     */
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: { msg: 'Format URL gambar tidak valid' }
      }
    },
    /**
     * Category Field
     * @type {string}
     * @required
     * @enum ['Pantai', 'Gunung', 'Candi', 'Museum', 'Taman', 'Kuliner', 'Lainnya']
     * @usage Filtering destinations by type
     */
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Kategori tidak boleh kosong' },
        isIn: { 
          args: [['Pantai', 'Gunung', 'Candi', 'Museum', 'Taman', 'Kuliner', 'Lainnya']],
          msg: 'Kategori harus salah satu dari: Pantai, Gunung, Candi, Museum, Taman, Kuliner, Lainnya'
        }
      }
    },
    /**
     * Rating Field
     * @type {float}
     * @optional
     * @default 0
     * @range 0 to 5
     * @usage Sort destinations by popularity/quality
     * @example 4.8
     */
    rating: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: 'Rating minimal 0' },
        max: { args: [5], msg: 'Rating maksimal 5' }
      }
    }
  }, {
    sequelize,
    modelName: 'Place',
  });
  return Place;
};