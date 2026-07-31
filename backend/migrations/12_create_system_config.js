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
      return originalCreateTable(targetTable, attributes, options);
    };

    let exists = false;
    try {
      const tableInfo = await queryInterface.describeTable('System_Config');
      if (tableInfo && Object.keys(tableInfo).length > 0) exists = true;
    } catch (e) {
      exists = false;
    }

    if (!exists) {
      await createTable('System_Config', {
        clave: {
          type: DataTypes.STRING(100),
          primaryKey: true,
          allowNull: false
        },
        valor: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        descripcion: {
          type: DataTypes.STRING(255),
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

      const defaultData = [
        {
          clave: 'maintenance_mode',
          valor: 'false',
          descripcion: 'Modo mantenimiento activo (true/false)',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          clave: 'maintenance_message',
          valor: 'La aplicación se encuentra en mantenimiento programado. Por favor, vuelva a intentarlo más tarde.',
          descripcion: 'Mensaje informativo mostrado a los usuarios durante el mantenimiento',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      if (isSqlite) {
        await queryInterface.bulkInsert('System_Config', defaultData);
      } else {
        await queryInterface.bulkInsert({ tableName: 'System_Config', schema }, defaultData);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema;

    try {
      await queryInterface.dropTable(
        isSqlite ? 'System_Config' : { tableName: 'System_Config', schema }
      );
    } catch (e) {}
  }
};
