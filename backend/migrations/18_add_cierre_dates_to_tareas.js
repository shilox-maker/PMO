'use strict';
const { DataTypes } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const tableInfo = await queryInterface.describeTable('Tareas');
      if (!tableInfo.fecha_original_cierre) {
        await queryInterface.addColumn('Tareas', 'fecha_original_cierre', {
          type: DataTypes.DATEONLY,
          allowNull: true
        });
      }
      if (!tableInfo.fecha_actual_cierre) {
        await queryInterface.addColumn('Tareas', 'fecha_actual_cierre', {
          type: DataTypes.DATEONLY,
          allowNull: true
        });
      }
      if (!tableInfo.fecha_real_cierre) {
        await queryInterface.addColumn('Tareas', 'fecha_real_cierre', {
          type: DataTypes.DATEONLY,
          allowNull: true
        });
      }
    } catch (err) {
      console.error('Migration failed for Tareas dates:', err.message);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      const tableInfo = await queryInterface.describeTable('Tareas');
      if (tableInfo.fecha_original_cierre) {
        await queryInterface.removeColumn('Tareas', 'fecha_original_cierre');
      }
      if (tableInfo.fecha_actual_cierre) {
        await queryInterface.removeColumn('Tareas', 'fecha_actual_cierre');
      }
      if (tableInfo.fecha_real_cierre) {
        await queryInterface.removeColumn('Tareas', 'fecha_real_cierre');
      }
    } catch (err) {
      console.error('Rollback migration failed for Tareas dates:', err.message);
    }
  }
};
