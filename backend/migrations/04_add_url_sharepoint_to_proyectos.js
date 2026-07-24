'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const schema = queryInterface.sequelize.options.define.schema || 'dbo';
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';

    try {
      const proyectosInfo = await queryInterface.describeTable('Proyectos');
      if (proyectosInfo && !proyectosInfo.url_sharepoint) {
        await queryInterface.addColumn(
          isSqlite ? 'Proyectos' : { tableName: 'Proyectos', schema },
          'url_sharepoint',
          {
            type: DataTypes.TEXT,
            allowNull: true
          }
        );
      }
    } catch (e) {
      console.warn('Advertencia comprobando columna url_sharepoint en Proyectos:', e.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const schema = queryInterface.sequelize.options.define.schema || 'dbo';
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';

    try {
      await queryInterface.removeColumn(
        isSqlite ? 'Proyectos' : { tableName: 'Proyectos', schema },
        'url_sharepoint'
      );
    } catch (e) {}
  }
};
