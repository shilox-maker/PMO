'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const schema = queryInterface.sequelize.options.define.schema || 'dbo';
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';

    try {
      const riesgosInfo = await queryInterface.describeTable('Riesgos');
      if (riesgosInfo && !riesgosInfo.id_tarea) {
        await queryInterface.addColumn(
          isSqlite ? 'Riesgos' : { tableName: 'Riesgos', schema },
          'id_tarea',
          {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
              model: 'Tareas',
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
      const incidenciasInfo = await queryInterface.describeTable('Incidencias');
      if (incidenciasInfo && !incidenciasInfo.id_tarea) {
        await queryInterface.addColumn(
          isSqlite ? 'Incidencias' : { tableName: 'Incidencias', schema },
          'id_tarea',
          {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
              model: 'Tareas',
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
    const schema = queryInterface.sequelize.options.define.schema || 'dbo';
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
