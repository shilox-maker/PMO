'use strict';
const { DataTypes, QueryTypes } = require('sequelize');

/**
 * Migration: 25_ensure_uuidv7_all_tables.js
 * - Asegura que la columna uuid_v7 exista en todas las tablas de la base de datos
 *   para garantizar compatibilidad total con los modelos Sequelize en PRE y PRO.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';
    const isMssql = queryInterface.sequelize.options.dialect === 'mssql' || process.env.DB_DIALECT === 'mssql';
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema || 'dbo';

    if (isMssql) {
      try {
        await queryInterface.sequelize.query(`
          DECLARE @tblName NVARCHAR(128);
          DECLARE @alterSql NVARCHAR(MAX);
          DECLARE curAllTables CURSOR FOR 
              SELECT t.name 
              FROM sys.tables t 
              INNER JOIN sys.schemas s ON t.schema_id = s.schema_id 
              WHERE s.name = '${schema}';

          OPEN curAllTables;
          FETCH NEXT FROM curAllTables INTO @tblName;
          WHILE @@FETCH_STATUS = 0
          BEGIN
              IF NOT EXISTS (
                  SELECT 1 FROM sys.columns c 
                  INNER JOIN sys.tables t ON c.object_id = t.object_id 
                  INNER JOIN sys.schemas s ON t.schema_id = s.schema_id 
                  WHERE s.name = '${schema}' AND t.name = @tblName AND c.name = 'uuid_v7'
              )
              BEGIN
                  SET @alterSql = 'ALTER TABLE [' + '${schema}' + '].[' + @tblName + '] ADD [uuid_v7] UNIQUEIDENTIFIER NULL';
                  EXEC(@alterSql);
              END;
              FETCH NEXT FROM curAllTables INTO @tblName;
          END;
          CLOSE curAllTables;
          DEALLOCATE curAllTables;
        `);
        console.log('✅ [Migration 25] Columna uuid_v7 verificada y asegurada en todas las tablas MSSQL');
      } catch (e) {
        console.warn('[Migration 25] Aviso al verificar columnas uuid_v7 en MSSQL:', e.message);
      }
    } else if (isSqlite) {
      try {
        const tables = await queryInterface.sequelize.query(
          `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`,
          { type: QueryTypes.SELECT }
        );

        for (const t of tables) {
          const columns = await queryInterface.sequelize.query(
            `PRAGMA table_info("${t.name}")`,
            { type: QueryTypes.SELECT }
          );
          const hasUuid = columns.some(c => c.name === 'uuid_v7');
          if (!hasUuid) {
            await queryInterface.addColumn(t.name, 'uuid_v7', {
              type: DataTypes.UUID,
              allowNull: true
            }).catch(() => {});
          }
        }
        console.log('✅ [Migration 25] Columna uuid_v7 verificada y asegurada en tablas SQLite');
      } catch (e) {
        console.warn('[Migration 25] Aviso en SQLite:', e.message);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // No-op
  }
};
