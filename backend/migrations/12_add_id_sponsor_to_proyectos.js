'use strict';
const { DataTypes } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('Proyectos');
    if (!tableInfo.id_sponsor) {
      await queryInterface.addColumn('Proyectos', 'id_sponsor', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Contactos_Proveedor',
          key: 'id_contacto'
        }
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('Proyectos');
    if (tableInfo.id_sponsor) {
      await queryInterface.removeColumn('Proyectos', 'id_sponsor');
    }
  }
};
