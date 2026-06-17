'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('Proyecto_KeyUsers');
    
    if (!tableInfo.rol) {
      await queryInterface.addColumn('Proyecto_KeyUsers', 'rol', {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Usuario funcional'
      });
    }

    if (!tableInfo.raci) {
      await queryInterface.addColumn('Proyecto_KeyUsers', 'raci', {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'I'
      });
    }

    // Update existing rows
    await queryInterface.sequelize.query(
      `UPDATE "Proyecto_KeyUsers" SET "rol" = 'Usuario funcional' WHERE "rol" IS NULL`
    );
    await queryInterface.sequelize.query(
      `UPDATE "Proyecto_KeyUsers" SET "raci" = 'I' WHERE "raci" IS NULL`
    );
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('Proyecto_KeyUsers', 'rol');
    } catch (e) {
      console.log('Error removing rol column:', e.message);
    }
    try {
      await queryInterface.removeColumn('Proyecto_KeyUsers', 'raci');
    } catch (e) {
      console.log('Error removing raci column:', e.message);
    }
  }
};
