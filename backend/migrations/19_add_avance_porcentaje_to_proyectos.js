'use strict';
const { DataTypes, QueryTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const dialect = queryInterface.sequelize.options.dialect;
    const isSqlite = dialect === 'sqlite';
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema || 'dbo';
    const target = isSqlite ? 'Proyectos' : { tableName: 'Proyectos', schema };

    const columnExists = async (tableName, columnName) => {
      if (isSqlite) {
        const res = await queryInterface.sequelize.query(`PRAGMA table_info("${tableName}")`, { type: QueryTypes.SELECT });
        return res && res.some(c => c.name === columnName);
      }
      const res = await queryInterface.sequelize.query(
        `SELECT 1 FROM sys.columns c INNER JOIN sys.tables t ON c.object_id = t.object_id INNER JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = :schema AND t.name = :tableName AND c.name = :columnName`,
        { replacements: { schema, tableName, columnName }, type: QueryTypes.SELECT }
      );
      return res && res.length > 0;
    };

    const hasCol = await columnExists('Proyectos', 'avance_porcentaje');
    if (!hasCol) {
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
