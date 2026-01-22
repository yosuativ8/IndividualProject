'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Place extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Place memiliki many-to-many relationship dengan User melalui UserDestinations
      // Many users can save many places (wishlist)
      Place.belongsToMany(models.User, { 
        through: models.UserDestination, 
        foreignKey: 'placeId',
        as: 'savedByUsers' 
      });
    }
  }
  Place.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false, //nama tempat wajib diisi
      validate: {
        notEmpty: { msg: 'Nama tempat tidak boleh kosong' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false, //deskripsi wajib diisi
      validate: {
        notEmpty: { msg: 'Deskripsi tidak boleh kosong' }
      }
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false, // lokasi (nama kota/daerah) wajib diisi
      validate: {
        notEmpty: { msg: 'Lokasi tidak boleh kosong' }
      }
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: false, // latitude wajib untuk location-based search
      validate: {
        min: { args: [-90], msg: 'Latitude minimal -90' },
        max: { args: [90], msg: 'Latitude maksimal 90' }
      }
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: false, // longitude wajib untuk location-based search
      validate: {
        min: { args: [-180], msg: 'Longitude minimal -180' },
        max: { args: [180], msg: 'Longitude maksimal 180' }
      }
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true, //imageUrl boleh kosong (opsional)
      validate: {
        isUrl: { msg: 'Format URL gambar tidak valid' } //validasi format URL
      }
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false, //kategori wajib diisi
      validate: {
        notEmpty: { msg: 'Kategori tidak boleh kosong' },
        isIn: { 
          args: [['Pantai', 'Gunung', 'Candi', 'Museum', 'Taman', 'Kuliner', 'Lainnya']], //kategori yang diperbolehkan
          msg: 'Kategori harus salah satu dari: Pantai, Gunung, Candi, Museum, Taman, Kuliner, Lainnya'
        }
      }
    },
    rating: {
      type: DataTypes.FLOAT,
      allowNull: true, //rating boleh kosong (default 0)
      defaultValue: 0, //default value 0
      validate: {
        min: { args: [0], msg: 'Rating minimal 0' }, //validasi minimal 0
        max: { args: [5], msg: 'Rating maksimal 5' } //validasi maksimal 5
      }
    }
  }, {
    sequelize,
    modelName: 'Place',
  });
  return Place;
};