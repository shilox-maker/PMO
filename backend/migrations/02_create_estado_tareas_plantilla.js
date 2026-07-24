'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';
    const isMssql = queryInterface.sequelize.options.dialect === 'mssql' || process.env.DB_DIALECT === 'mssql';
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema;

    if (isMssql && !schema) {
      throw new Error('[FATAL] La variable de entorno DB_SCHEMA es obligatoria para conexiones MSSQL / Azure SQL.');
    }

    const originalCreateTable = queryInterface.createTable.bind(queryInterface);

    const createTable = async (tableName, attributes, options) => {
      if (isSqlite) {
        return originalCreateTable(tableName, attributes, options);
      }
      const targetTable = { tableName, schema };
      const qualifiedAttributes = { ...attributes };
      for (const key in qualifiedAttributes) {
        const attribute = qualifiedAttributes[key];
        if (attribute && attribute.references && typeof attribute.references.model === 'string') {
          attribute.references.model = {
            tableName: attribute.references.model,
            schema
          };
        }
      }
      return originalCreateTable(targetTable, qualifiedAttributes, options);
    };

    let exists = false;
    try {
      const tableInfo = await queryInterface.describeTable('Estado_Tareas_Plantilla');
      if (tableInfo && Object.keys(tableInfo).length > 0) {
        exists = true;
      }
    } catch (e) {
      exists = false;
    }

    if (!exists) {
      await createTable('Estado_Tareas_Plantilla', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        id_estado: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'Estados_Proyecto', key: 'id_estado' },
          onDelete: 'CASCADE'
        },
        nombre_tarea: {
          type: DataTypes.STRING,
          allowNull: false
        },
        descripcion: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        es_hito: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        orden: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Estado_Tareas_Plantilla');
  }
};
