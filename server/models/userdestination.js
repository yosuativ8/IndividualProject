/**
 * UserDestination Model (Junction Table)
 * 
 * Model Sequelize untuk table UserDestinations di database.
 * Ini adalah JUNCTION TABLE untuk many-to-many relationship antara User dan Place.
 * 
 * Purpose:
 * - Wishlist/Bucket List: User menyimpan places yang ingin dikunjungi
 * - Personal Notes: User bisa tambah catatan pribadi tentang place
 * - Visit Planning: User bisa set tanggal rencana kunjungan
 * 
 * Relationships:
 * - belongsTo User (one UserDestination belongs to one User)
 * - belongsTo Place (one UserDestination belongs to one Place)
 * 
 * Constraints:
 * - Composite unique: (userId, placeId) harus unique (user tidak bisa save place yang sama 2x)
 * - Cascade delete: Jika User/Place dihapus, UserDestination juga terhapus otomatis
 */

'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserDestination extends Model {
    /**
     * Associate Method
     * 
     * Method untuk define relationships.
     * UserDestination adalah junction table yang connect User dan Place.
     * 
     * @param {Object} models - Semua models dalam aplikasi
     */
    static associate(models) {
      // One-to-Many: UserDestination -> User
      // Setiap wishlist item belongs to one user
      UserDestination.belongsTo(models.User, { 
        foreignKey: 'userId', 
        as: 'user' // Alias untuk eager loading
      });
      
      // One-to-Many: UserDestination -> Place
      // Setiap wishlist item belongs to one place
      UserDestination.belongsTo(models.Place, { 
        foreignKey: 'placeId', 
        as: 'place' // Alias untuk eager loading
      });
    }
  }
  
  /**
   * UserDestination Schema Definition
   * 
   * Field definitions untuk junction table dengan additional metadata.
   */
  UserDestination.init({
    /**
     * ID Field
     * @type {integer}
     * @primaryKey
     * @autoIncrement
     */
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    /**
     * User ID Field (Foreign Key)
     * @type {integer}
     * @required
     * @references Users.id
     * @onDelete CASCADE - Jika user dihapus, wishlist-nya juga terhapus
     */
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    /**
     * Place ID Field (Foreign Key)
     * @type {integer}
     * @required
     * @references Places.id
     * @onDelete CASCADE - Jika place dihapus, entry di wishlist juga terhapus
     */
    placeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Places',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    /**
     * Notes Field
     * @type {text}
     * @optional
     * @description Catatan pribadi user tentang place
     * @example "Ingin kesini sama keluarga saat liburan", "Bawa kamera DSLR"
     */
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    /**
     * Visit Date Field
     * @type {date}
     * @optional
     * @description Tanggal rencana kunjungan user ke place
     * @usage Trip planning, reminder, calendar integration
     * @example "2025-07-15"
     */
    visitDate: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'UserDestination',
    /**
     * Database Indexes
     * 
     * Composite unique index untuk prevent duplicate entries.
     * User tidak boleh save place yang sama lebih dari 1x.
     */
    indexes: [
      {
        unique: true,
        fields: ['userId', 'placeId'], // Kombinasi userId + placeId harus unique
        name: 'unique_user_place' // Index name
      }
    ]
  });
  return UserDestination;
};