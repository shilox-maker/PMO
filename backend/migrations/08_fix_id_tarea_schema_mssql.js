'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';
    const isMssql = queryInterface.sequelize.options.dialect === 'mssql' || process.env.DB_DIALECT === 'mssql';
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema;

    if (isMssql && !schema) {
      throw new Error('[FATAL] La variable DB_SCHEMA no está configurada en las variables de entorno para conexiones MSSQL/Azure SQL.');
    }

    const tableObj = (tableName) => isSqlite ? tableName : { tableName, schema };

    const hasColumn = async (tableName, colName) => {
      try {
        const info = await queryInterface.describeTable(tableObj(tableName), { schema });
        return info && Boolean(info[colName]);
      } catch (e) {
        return false;
      }
    };

    // 1. Riesgos -> id_tarea
    const existeRiesgosIdTarea = await hasColumn('Riesgos', 'id_tarea');
    if (!existeRiesgosIdTarea) {
      try {
        await queryInterface.addColumn(
          tableObj('Riesgos'),
          'id_tarea',
          {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
              model: tableObj('Tareas'),
              key: 'id_tarea'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          { schema }
        );
      } catch (err) {
        if (!err.message?.includes('already exists') && !err.message?.includes('duplicate')) {
          await queryInterface.addColumn(
            tableObj('Riesgos'),
            'id_tarea',
            {
              type: DataTypes.INTEGER,
              allowNull: true
            },
            { schema }
          );
        }
      }
    }

    // 2. Incidencias -> id_tarea
    const existeIncidenciasIdTarea = await hasColumn('Incidencias', 'id_tarea');
    if (!existeIncidenciasIdTarea) {
      try {
        await queryInterface.addColumn(
          tableObj('Incidencias'),
          'id_tarea',
          {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
              model: tableObj('Tareas'),
              key: 'id_tarea'
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          },
          { schema }
        );
      } catch (err) {
        if (!err.message?.includes('already exists') && !err.message?.includes('duplicate')) {
          await queryInterface.addColumn(
            tableObj('Incidencias'),
            'id_tarea',
            {
              type: DataTypes.INTEGER,
              allowNull: true
            },
            { schema }
          );
        }
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';
    const isMssql = queryInterface.sequelize.options.dialect === 'mssql' || process.env.DB_DIALECT === 'mssql';
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema;

    if (isMssql && !schema) {
      throw new Error('[FATAL] La variable DB_SCHEMA no está configurada en las variables de entorno para conexiones MSSQL/Azure SQL.');
    }

    const tableObj = (tableName) => isSqlite ? tableName : { tableName, schema };

    try {
      await queryInterface.removeColumn(tableObj('Riesgos'), 'id_tarea', { schema });
    } catch (e) {}

    try {
      await queryInterface.removeColumn(tableObj('Incidencias'), 'id_tarea', { schema });
    } catch (e) {}
  }
};
