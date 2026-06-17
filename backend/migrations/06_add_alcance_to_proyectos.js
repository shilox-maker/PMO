'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('Proyectos');
    
    const columnsToAdd = {
      alcance_por_que: { type: DataTypes.TEXT, allowNull: true },
      alcance_objetivo: { type: DataTypes.TEXT, allowNull: true },
      alcance_resultados: { type: DataTypes.TEXT, allowNull: true },
      alcance_limitaciones: { type: DataTypes.TEXT, allowNull: true },
      alcance_integraciones: { type: DataTypes.TEXT, allowNull: true },
      alcance_desarrollo: { type: DataTypes.TEXT, allowNull: true },
      cierre_aceptacion: { type: DataTypes.TEXT, allowNull: true },
      cierre_exito: { type: DataTypes.TEXT, allowNull: true }
    };

    for (const [colName, colSpec] of Object.entries(columnsToAdd)) {
      if (!tableInfo[colName]) {
        try {
          await queryInterface.addColumn('Proyectos', colName, colSpec);
          console.log(`Added column ${colName} to Proyectos`);
        } catch (e) {
          console.error(`Error adding column ${colName}:`, e.message);
        }
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const columnsToRemove = [
      'alcance_por_que',
      'alcance_objetivo',
      'alcance_resultados',
      'alcance_limitaciones',
      'alcance_integraciones',
      'alcance_desarrollo',
      'cierre_aceptacion',
      'cierre_exito'
    ];

    for (const colName of columnsToRemove) {
      try {
        await queryInterface.removeColumn('Proyectos', colName);
        console.log(`Removed column ${colName} from Proyectos`);
      } catch (e) {
        console.error(`Error removing column ${colName}:`, e.message);
      }
    }
  }
};
