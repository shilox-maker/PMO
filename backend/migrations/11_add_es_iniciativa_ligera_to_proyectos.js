'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema || 'dbo';
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';
    const target = isSqlite ? 'Proyectos' : { tableName: 'Proyectos', schema };

    try {
      const proyectosInfo = await queryInterface.describeTable(target);
      if (proyectosInfo && !proyectosInfo.es_iniciativa_ligera) {
        await queryInterface.addColumn(
          target,
          'es_iniciativa_ligera',
          {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
          }
        );
      }
    } catch (e) {
      console.warn('Advertencia comprobando columna es_iniciativa_ligera en Proyectos:', e.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema || 'dbo';
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';

    try {
      await queryInterface.removeColumn(
        isSqlite ? 'Proyectos' : { tableName: 'Proyectos', schema },
        'es_iniciativa_ligera'
      );
    } catch (e) {}
  }
};
