'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserDestinations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      placeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Places',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      visitDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    
    // Add composite unique constraint: user tidak bisa save place yang sama 2x
    await queryInterface.addConstraint('UserDestinations', {
      fields: ['userId', 'placeId'],
      type: 'unique',
      name: 'unique_user_place'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('UserDestinations');
  }
};