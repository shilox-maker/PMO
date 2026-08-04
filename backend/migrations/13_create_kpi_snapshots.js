'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema;

    if (!isSqlite && !schema && process.env.DB_DIALECT === 'mssql') {
      throw new Error('[FATAL] La variable de entorno DB_SCHEMA es obligatoria para conexiones MSSQL / Azure SQL.');
    }

    const createTable = async (tableName, attributes, options) => {
      if (isSqlite) {
        return queryInterface.createTable(tableName, attributes, options);
      }
      return queryInterface.createTable({ tableName, schema }, attributes, options);
    };

    let exists = false;
    try {
      const tableInfo = await queryInterface.describeTable('Kpi_Snapshots');
      if (tableInfo && Object.keys(tableInfo).length > 0) exists = true;
    } catch (e) {
      exists = false;
    }

    if (!exists) {
      await createTable('Kpi_Snapshots', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        fecha: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        metric_key: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        metric_value: {
          type: DataTypes.FLOAT,
          allowNull: false
        },
        portfolio_id: {
          type: DataTypes.INTEGER,
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

      const addIndex = async (tableName, fields, options) => {
        if (isSqlite) {
          return queryInterface.addIndex(tableName, fields, options);
        }
        return queryInterface.addIndex({ tableName, schema }, fields, options);
      };

      await addIndex('Kpi_Snapshots', ['fecha', 'metric_key', 'portfolio_id'], {
        name: 'idx_kpi_snapshots_lookup'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema;

    try {
      await queryInterface.dropTable(
        isSqlite ? 'Kpi_Snapshots' : { tableName: 'Kpi_Snapshots', schema }
      );
    } catch (e) {}
  }
};
