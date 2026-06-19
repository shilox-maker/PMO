'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('Comentarios_Proyecto');
    if (!tableInfo['para_direccion']) {
      await queryInterface.addColumn('Comentarios_Proyecto', 'para_direccion', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Comentarios_Proyecto', 'para_direccion');
  }
};
