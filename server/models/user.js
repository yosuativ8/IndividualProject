/**
 * User Model
 * 
 * Model Sequelize untuk table Users di database.
 * Table ini menyimpan data user yang register di aplikasi.
 * 
 * Authentication Methods:
 * - Email & Password (traditional)
 * - Google OAuth (passwordless)
 * 
 * Relationships:
 * - belongsToMany Place through UserDestination (wishlist/saved places)
 * 
 * Security Features:
 * - Password di-hash otomatis dengan bcrypt sebelum disimpan (beforeCreate hook)
 * - Email unique untuk prevent duplicate accounts
 * - Validasi email format dengan Sequelize validator
 */

'use strict';
const {
  Model
} = require('sequelize');
const bcrypt = require('bcrypt'); // Library untuk hash password

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Associate Method
     * 
     * Method untuk define relationships antara User dengan model lain.
     * Method ini dipanggil otomatis oleh models/index.js.
     * 
     * @param {Object} models - Semua models dalam aplikasi
     */
    static associate(models) {
      // Many-to-Many: User <-> Place melalui UserDestination
      // Satu user bisa save banyak places (wishlist)
      // Satu place bisa di-save oleh banyak users
      User.belongsToMany(models.Place, { 
        through: models.UserDestination, // Junction table
        foreignKey: 'userId', // FK di UserDestination
        as: 'savedPlaces' // Alias untuk eager loading
      });
    }
  }
  
  /**
   * User Schema Definition
   * 
   * Field definitions dengan validations untuk User model.
   */
  User.init({
    /**
     * Email Field
     * @type {string}
     * @required
     * @unique
     * @validation Format email harus valid
     * @example "user@example.com"
     */
    email: {
      type: DataTypes.STRING,
      allowNull: false, // Email wajib (primary identifier)
      unique: true, // Email harus unik (prevent duplicate)
      validate: {
        notEmpty: { msg: 'Email tidak boleh kosong' },
        isEmail: { msg: 'Format email tidak valid' } // Validasi format email
      }
    },
    /**
     * Password Field
     * @type {string}
     * @optional Password boleh kosong untuk Google OAuth users
     * @validation Minimal 6 karakter (jika diisi)
     * @security Di-hash dengan bcrypt sebelum disimpan (see beforeCreate hook)
     * @example "mypassword123" -> hashed: "$2b$10$..."
     */
    password: {
      type: DataTypes.STRING,
      allowNull: true, // Boleh kosong untuk Google OAuth
      validate: {
        len: { args: [6, 100], msg: 'Password minimal 6 karakter' }
      }
    }
  }, {
    sequelize,
    modelName: 'User',
    /**
     * Sequelize Hooks
     * 
     * Hooks adalah functions yang dijalankan otomatis pada lifecycle events.
     */
    hooks: {
      /**
       * Before Create Hook
       * 
       * Hook ini dijalankan SEBELUM User instance disimpan ke database.
       * Digunakan untuk hash password agar tidak tersimpan plain text.
       * 
       * @param {User} user - User instance yang akan di-create
       * 
       * Security Note:
       * Plain text password TIDAK PERNAH disimpan ke database.
       * Password selalu di-hash dengan bcrypt + salt (10 rounds).
       */
      beforeCreate: async (user) => {
        // Hash password HANYA jika password ada (tidak untuk Google OAuth)
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10); // Salt rounds: 10
        }
      }
    }
  });
  return User;
};