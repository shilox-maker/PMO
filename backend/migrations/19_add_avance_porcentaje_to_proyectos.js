'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema || 'dbo';
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';
    const target = isSqlite ? 'Proyectos' : { tableName: 'Proyectos', schema };

    try {
      const proyectosInfo = await queryInterface.describeTable(target);
      if (proyectosInfo && !proyectosInfo.avance_porcentaje) {
        await queryInterface.addColumn(
          target,
          'avance_porcentaje',
          {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
          }
        );
      }
    } catch (e) {
      console.warn('Advertencia comprobando columna avance_porcentaje en Proyectos:', e.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema || 'dbo';
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';

    try {
      await queryInterface.removeColumn(
        isSqlite ? 'Proyectos' : { tableName: 'Proyectos', schema },
        'avance_porcentaje'
      );
    } catch (e) {}
  }
};
