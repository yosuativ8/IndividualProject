'use strict';
const {
  Model
} = require('sequelize');
const bcrypt = require('bcrypt'); //import bcrypt untuk hash password
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // User memiliki many-to-many relationship dengan Place melalui UserDestinations
      // Many users can save many places (wishlist/bucket list)
      User.belongsToMany(models.Place, { 
        through: models.UserDestination, 
        foreignKey: 'userId',
        as: 'savedPlaces' 
      });
    }
  }
  User.init({
    email: {
      type: DataTypes.STRING,
      allowNull: false, // email wajib diisi (primary identifier untuk semua user)
      unique: true, // email harus unik
      validate: {
        notEmpty: { msg: 'Email tidak boleh kosong' },
        isEmail: { msg: 'Format email tidak valid' } // validasi format email
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true, // password boleh kosong untuk user yang login via Google Sign-In
      validate: {
        len: { args: [6, 100], msg: 'Password minimal 6 karakter' } // validasi minimal 6 karakter jika diisi
      }
    }
  }, {
    sequelize,
    modelName: 'User',
    hooks: {
      //hook beforeCreate akan dijalankan sebelum data User disimpan ke database
      beforeCreate: async (user) => {
        //hash password sebelum disimpan ke database jika password ada (tidak pakai Google OAuth)
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10); //hash dengan salt rounds 10
        }
      }
    }
  });
  return User;
};