'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('Proyectos');
    if (!tableInfo.budget_notas) {
      await queryInterface.addColumn('Proyectos', 'budget_notas', {
        type: DataTypes.TEXT,
        allowNull: true
      });
    }
    if (!tableInfo.id_sede_distribuir) {
      await queryInterface.addColumn('Proyectos', 'id_sede_distribuir', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Sedes',
          key: 'id_sede'
        }
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('Proyectos');
    if (tableInfo.budget_notas) {
      await queryInterface.removeColumn('Proyectos', 'budget_notas');
    }
    if (tableInfo.id_sede_distribuir) {
      await queryInterface.removeColumn('Proyectos', 'id_sede_distribuir');
    }
  }
};
