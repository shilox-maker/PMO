'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema || 'dbo';
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';
    const riesgosTarget = isSqlite ? 'Riesgos' : { tableName: 'Riesgos', schema };
    const incidenciasTarget = isSqlite ? 'Incidencias' : { tableName: 'Incidencias', schema };
    const tareasModel = isSqlite ? 'Tareas' : { tableName: 'Tareas', schema };

    try {
      const riesgosInfo = await queryInterface.describeTable(riesgosTarget);
      if (riesgosInfo && !riesgosInfo.id_tarea) {
        await queryInterface.addColumn(
          riesgosTarget,
          'id_tarea',
          {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
              model: tareasModel,
              key: 'id_tarea'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          }
        );
      }
    } catch (e) {
      console.warn('Advertencia comprobando columna id_tarea en Riesgos:', e.message);
    }

    try {
      const incidenciasInfo = await queryInterface.describeTable(incidenciasTarget);
      if (incidenciasInfo && !incidenciasInfo.id_tarea) {
        await queryInterface.addColumn(
          incidenciasTarget,
          'id_tarea',
          {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
              model: tareasModel,
              key: 'id_tarea'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          }
        );
      }
    } catch (e) {
      console.warn('Advertencia comprobando columna id_tarea en Incidencias:', e.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema || 'dbo';
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';

    try {
      await queryInterface.removeColumn(
        isSqlite ? 'Riesgos' : { tableName: 'Riesgos', schema },
        'id_tarea'
      );
    } catch (e) {}

    try {
      await queryInterface.removeColumn(
        isSqlite ? 'Incidencias' : { tableName: 'Incidencias', schema },
        'id_tarea'
      );
    } catch (e) {}
  }
};
