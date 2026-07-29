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
      const targetTable = isSqlite ? 'Encuestas_Calidad' : { tableName: 'Encuestas_Calidad', schema };
      const info = await queryInterface.describeTable(targetTable);
      if (info && Object.keys(info).length > 0) exists = true;
    } catch (e) {
      exists = false;
    }

    if (!exists) {
      await createTable('Encuestas_Calidad', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        id_proyecto: {
          type: DataTypes.STRING,
          allowNull: false,
          references: { model: 'Proyectos', key: 'id_proyecto' },
          onDelete: 'CASCADE'
        },
        concepto: {
          type: DataTypes.STRING,
          allowNull: false
        },
        puntuacion: {
          type: DataTypes.DECIMAL(3, 1),
          allowNull: false
        },
        escala_maxima: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 10
        },
        fecha_evaluacion: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        evaluador: {
          type: DataTypes.STRING,
          allowNull: true
        },
        observaciones: {
          type: DataTypes.TEXT,
          allowNull: true
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
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema;
    const target = isSqlite ? 'Encuestas_Calidad' : { tableName: 'Encuestas_Calidad', schema };
    await queryInterface.dropTable(target);
  }
};
