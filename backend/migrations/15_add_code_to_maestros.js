'use strict';
const { DataTypes } = require('sequelize');

function toSlugCode(str) {
  if (!str) return 'UNKNOWN';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema || 'dbo';
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';

    const tables = [
      { name: 'Estados_Proyecto', nameCol: 'nombre_estado', idCol: 'id_estado' },
      { name: 'Sedes', nameCol: 'nombre_sede', idCol: 'id_sede' },
      { name: 'Tipos_Factura', nameCol: 'nombre', idCol: 'id_tipo_factura' },
      { name: 'Tipos_Capex', nameCol: 'nombre', idCol: 'id' }
    ];

    for (const tableConfig of tables) {
      const target = isSqlite ? tableConfig.name : { tableName: tableConfig.name, schema };
      try {
        const tableInfo = await queryInterface.describeTable(target);
        if (tableInfo && !tableInfo.code) {
          await queryInterface.addColumn(
            target,
            'code',
            {
              type: DataTypes.STRING(50),
              allowNull: true
            }
          );
        }

        // Backfill existing rows (always run to ensure clean codes)
        const rows = await queryInterface.sequelize.query(
          `SELECT * FROM ${isSqlite ? `"${tableConfig.name}"` : `[${schema}].[${tableConfig.name}]`}`,
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        for (const row of rows) {
          const idVal = row[tableConfig.idCol];
          const rawName = row[tableConfig.nameCol];
          if (idVal && rawName) {
            const generatedCode = toSlugCode(rawName);
            await queryInterface.sequelize.query(
              `UPDATE ${isSqlite ? `"${tableConfig.name}"` : `[${schema}].[${tableConfig.name}]`} SET code = :code WHERE ${tableConfig.idCol} = :idVal`,
              {
                replacements: { code: generatedCode, idVal },
                type: queryInterface.sequelize.QueryTypes.UPDATE
              }
            );
          }
        }
      } catch (e) {
        console.warn(`Advertencia comprobando columna code en ${tableConfig.name}:`, e.message);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema || 'dbo';
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';

    const tableNames = ['Estados_Proyecto', 'Sedes', 'Tipos_Factura', 'Tipos_Capex'];

    for (const tableName of tableNames) {
      try {
        await queryInterface.removeColumn(
          isSqlite ? tableName : { tableName, schema },
          'code'
        );
      } catch (e) {}
    }
  }
};
