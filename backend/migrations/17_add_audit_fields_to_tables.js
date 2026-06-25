'use strict';
const { DataTypes } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = ['Proyectos', 'Facturas', 'Riesgos', 'Incidencias', 'Cambios_Alcance'];
    for (const table of tables) {
      try {
        const tableInfo = await queryInterface.describeTable(table);
        if (!tableInfo.createdBy) {
          await queryInterface.addColumn(table, 'createdBy', {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
              model: 'Usuarios',
              key: 'id_usuario'
            }
          });
        }
        if (!tableInfo.modifiedBy) {
          await queryInterface.addColumn(table, 'modifiedBy', {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
              model: 'Usuarios',
              key: 'id_usuario'
            }
          });
        }
      } catch (err) {
        console.error(`Migration failed for table ${table}:`, err.message);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const tables = ['Proyectos', 'Facturas', 'Riesgos', 'Incidencias', 'Cambios_Alcance'];
    for (const table of tables) {
      try {
        const tableInfo = await queryInterface.describeTable(table);
        if (tableInfo.createdBy) {
          await queryInterface.removeColumn(table, 'createdBy');
        }
        if (tableInfo.modifiedBy) {
          await queryInterface.removeColumn(table, 'modifiedBy');
        }
      } catch (err) {
        console.error(`Rollback migration failed for table ${table}:`, err.message);
      }
    }
  }
};
