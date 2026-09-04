'use strict';
const { QueryTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const dialect = queryInterface.sequelize.options.dialect;
    const isSqlite = dialect === 'sqlite';
    const isMssql = dialect === 'mssql' || process.env.DB_DIALECT === 'mssql';
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema;

    if (isMssql && !schema) {
      throw new Error('[FATAL] La variable DB_SCHEMA no está configurada para conexiones MSSQL/Azure SQL.');
    }

    const fullTableName = isSqlite ? 'Usuarios' : `[${schema}].[Usuarios]`;

    if (isMssql) {
      // 1. Eliminar cualquier CHECK constraint existente sobre 'perfil'
      try {
        const checkConstraints = await queryInterface.sequelize.query(
          `SELECT cc.name AS constraint_name
           FROM sys.check_constraints cc
           INNER JOIN sys.tables t ON cc.parent_object_id = t.object_id
           INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
           INNER JOIN sys.columns c ON cc.parent_object_id = c.object_id AND cc.parent_column_id = c.column_id
           WHERE s.name = :schema AND t.name = 'Usuarios' AND c.name = 'perfil'`,
          { replacements: { schema }, type: QueryTypes.SELECT }
        );

        for (const chk of checkConstraints) {
          await queryInterface.sequelize.query(
            `ALTER TABLE ${fullTableName} DROP CONSTRAINT [${chk.constraint_name}]`
          );
        }
      } catch (e) {
        console.warn('[Migration 21] Aviso al eliminar CHECK constraints de perfil:', e.message);
      }

      // 2. Añadir nuevo CHECK constraint incluyendo 'SOLO_LECTURA'
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE ${fullTableName} ADD CONSTRAINT CK_Usuarios_perfil CHECK ([perfil] IN ('ADMINISTRADOR', 'PM', 'DIRECTOR', 'SOLO_LECTURA'))`
        );
      } catch (e) {
        console.warn('[Migration 21] Aviso al crear nuevo CHECK constraint para perfil:', e.message);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const dialect = queryInterface.sequelize.options.dialect;
    const isMssql = dialect === 'mssql' || process.env.DB_DIALECT === 'mssql';
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema;
    const fullTableName = dialect === 'sqlite' ? 'Usuarios' : `[${schema}].[Usuarios]`;

    if (isMssql) {
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE ${fullTableName} DROP CONSTRAINT IF EXISTS CK_Usuarios_perfil`
        );
        await queryInterface.sequelize.query(
          `ALTER TABLE ${fullTableName} ADD CONSTRAINT CK_Usuarios_perfil CHECK ([perfil] IN ('ADMINISTRADOR', 'PM', 'DIRECTOR'))`
        );
      } catch (e) {
        console.warn('[Migration 21 down] Aviso:', e.message);
      }
    }
  }
};
