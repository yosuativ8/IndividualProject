'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserDestination extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // UserDestination belongs to User
      UserDestination.belongsTo(models.User, { 
        foreignKey: 'userId', 
        as: 'user' 
      });
      
      // UserDestination belongs to Place
      UserDestination.belongsTo(models.Place, { 
        foreignKey: 'placeId', 
        as: 'place' 
      });
    }
  }
  UserDestination.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false, // userId wajib (relasi ke User)
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE' // Jika user dihapus, hapus juga wishlist-nya
    },
    placeId: {
      type: DataTypes.INTEGER,
      allowNull: false, // placeId wajib (relasi ke Place)
      references: {
        model: 'Places',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE' // Jika place dihapus, hapus juga dari wishlist
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true // Notes optional (user bisa kasih catatan pribadi)
    },
    visitDate: {
      type: DataTypes.DATE,
      allowNull: true // Tanggal kunjungan optional (user bisa set kapan mau kesana)
    }
  }, {
    sequelize,
    modelName: 'UserDestination',
    // Composite unique constraint: user tidak bisa save place yang sama 2x
    indexes: [
      {
        unique: true,
        fields: ['userId', 'placeId']
      }
    ]
  });
  return UserDestination;
};