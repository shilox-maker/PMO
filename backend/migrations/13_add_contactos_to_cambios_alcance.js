'use strict';
const { DataTypes } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('Cambios_Alcance');
    
    if (!tableInfo.id_solicitante_contacto) {
      await queryInterface.addColumn('Cambios_Alcance', 'id_solicitante_contacto', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Contactos_Proveedor',
          key: 'id_contacto'
        }
      });
    }

    if (!tableInfo.id_aprobador_contacto) {
      await queryInterface.addColumn('Cambios_Alcance', 'id_aprobador_contacto', {
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
    const tableInfo = await queryInterface.describeTable('Cambios_Alcance');
    
    if (tableInfo.id_solicitante_contacto) {
      await queryInterface.removeColumn('Cambios_Alcance', 'id_solicitante_contacto');
    }

    if (tableInfo.id_aprobador_contacto) {
      await queryInterface.removeColumn('Cambios_Alcance', 'id_aprobador_contacto');
    }
  }
};
