'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema || 'dbo';
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';
    const sedesTarget = isSqlite ? 'Sedes' : { tableName: 'Sedes', schema };
    const tiposTarget = isSqlite ? 'Tipos_Factura' : { tableName: 'Tipos_Factura', schema };

    try {
      const sedesInfo = await queryInterface.describeTable(sedesTarget);
      if (sedesInfo && !sedesInfo.orden) {
        await queryInterface.addColumn(
          sedesTarget,
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
      const tiposInfo = await queryInterface.describeTable(tiposTarget);
      if (tiposInfo && !tiposInfo.orden) {
        await queryInterface.addColumn(
          tiposTarget,
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
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema || 'dbo';
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
