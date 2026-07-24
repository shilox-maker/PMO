'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const schema = queryInterface.sequelize.options.define.schema || 'dbo';
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';

    try {
      const sedesInfo = await queryInterface.describeTable('Sedes');
      if (sedesInfo && !sedesInfo.orden) {
        await queryInterface.addColumn(
          isSqlite ? 'Sedes' : { tableName: 'Sedes', schema },
          'orden',
          {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
          }
        );
      }
    } catch (e) {
      console.warn('Advertencia comprobando columna orden en Sedes:', e.message);
    }

    try {
      const tiposInfo = await queryInterface.describeTable('Tipos_Factura');
      if (tiposInfo && !tiposInfo.orden) {
        await queryInterface.addColumn(
          isSqlite ? 'Tipos_Factura' : { tableName: 'Tipos_Factura', schema },
          'orden',
          {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
          }
        );
      }
    } catch (e) {
      console.warn('Advertencia comprobando columna orden en Tipos_Factura:', e.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const schema = queryInterface.sequelize.options.define.schema || 'dbo';
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';

    try {
      await queryInterface.removeColumn(
        isSqlite ? 'Sedes' : { tableName: 'Sedes', schema },
        'orden'
      );
    } catch (e) {}

    try {
      await queryInterface.removeColumn(
        isSqlite ? 'Tipos_Factura' : { tableName: 'Tipos_Factura', schema },
        'orden'
      );
    } catch (e) {}
  }
};
