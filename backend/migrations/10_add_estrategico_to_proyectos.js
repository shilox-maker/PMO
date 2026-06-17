'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('Proyectos');
    if (!tableInfo['es_estrategico']) {
      await queryInterface.addColumn('Proyectos', 'es_estrategico', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Proyectos', 'es_estrategico');
  }
};
