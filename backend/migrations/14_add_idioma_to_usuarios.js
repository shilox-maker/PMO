'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema || 'dbo';
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';
    const target = isSqlite ? 'Usuarios' : { tableName: 'Usuarios', schema };

    try {
      const usuariosInfo = await queryInterface.describeTable(target);
      if (usuariosInfo && !usuariosInfo.idioma) {
        await queryInterface.addColumn(
          target,
          'idioma',
          {
            type: DataTypes.STRING(5),
            allowNull: false,
            defaultValue: 'es'
          }
        );
      }
    } catch (e) {
      console.warn('Advertencia comprobando columna idioma en Usuarios:', e.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema || 'dbo';
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';

    try {
      await queryInterface.removeColumn(
        isSqlite ? 'Usuarios' : { tableName: 'Usuarios', schema },
        'idioma'
      );
    } catch (e) {}
  }
};
