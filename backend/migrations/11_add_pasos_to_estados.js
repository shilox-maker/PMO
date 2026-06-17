'use strict';
const { DataTypes } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('Estados_Proyecto');
    if (!tableInfo.pasos) {
      await queryInterface.addColumn('Estados_Proyecto', 'pasos', {
        type: DataTypes.TEXT,
        allowNull: true
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('Estados_Proyecto');
    if (tableInfo.pasos) {
      await queryInterface.removeColumn('Estados_Proyecto', 'pasos');
    }
  }
};
