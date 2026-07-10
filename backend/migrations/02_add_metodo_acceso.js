'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('Usuarios');
    if (!tableInfo.metodo_acceso) {
      await queryInterface.addColumn('Usuarios', 'metodo_acceso', {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'PASSWORD'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('Usuarios');
    if (tableInfo.metodo_acceso) {
      await queryInterface.removeColumn('Usuarios', 'metodo_acceso');
    }
  }
};
