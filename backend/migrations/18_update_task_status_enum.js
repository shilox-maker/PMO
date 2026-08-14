'use strict';
const { DataTypes, QueryTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const dialect = queryInterface.sequelize.options.dialect;
    const isSqlite = dialect === 'sqlite';
    const isMssql = dialect === 'mssql' || process.env.DB_DIALECT === 'mssql';
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema;

    if (isMssql && !schema) {
      throw new Error('[FATAL] La variable DB_SCHEMA no está configurada en las variables de entorno para conexiones MSSQL/Azure SQL.');
    }

    const tableObj = (tableName) => isSqlite ? tableName : { tableName, schema };
    const fullTableName = isSqlite ? 'Tareas' : `[${schema}].[Tareas]`;

    if (isMssql) {
      // 1. En MSSQL, consultar y eliminar cualquier CHECK constraint asociado a la columna 'estado' en Tareas
      try {
        const checkConstraints = await queryInterface.sequelize.query(
          `SELECT cc.name AS constraint_name
           FROM sys.check_constraints cc
           INNER JOIN sys.tables t ON cc.parent_object_id = t.object_id
           INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
           INNER JOIN sys.columns c ON cc.parent_object_id = c.object_id AND cc.parent_column_id = c.column_id
           WHERE s.name = :schema AND t.name = 'Tareas' AND c.name = 'estado'`,
          { replacements: { schema }, type: QueryTypes.SELECT }
        );

        for (const chk of checkConstraints) {
          await queryInterface.sequelize.query(
            `ALTER TABLE ${fullTableName} DROP CONSTRAINT [${chk.constraint_name}]`
          );
        }
      } catch (e) {
        console.warn('[Migration 18] Error al eliminar CHECK constraints de estado:', e.message);
      }

      // 2. Eliminar cualquier DEFAULT constraint asociado a la columna 'estado'
      try {
        const defaultConstraints = await queryInterface.sequelize.query(
          `SELECT df.name AS constraint_name
           FROM sys.default_constraints df
           INNER JOIN sys.tables t ON df.parent_object_id = t.object_id
           INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
           INNER JOIN sys.columns c ON df.parent_object_id = c.object_id AND df.parent_column_id = c.column_id
           WHERE s.name = :schema AND t.name = 'Tareas' AND c.name = 'estado'`,
          { replacements: { schema }, type: QueryTypes.SELECT }
        );

        for (const df of defaultConstraints) {
          await queryInterface.sequelize.query(
            `ALTER TABLE ${fullTableName} DROP CONSTRAINT [${df.constraint_name}]`
          );
        }
      } catch (e) {
        console.warn('[Migration 18] Error al eliminar DEFAULT constraints de estado:', e.message);
      }

      // 3. Modificar la columna a NVARCHAR(50) NOT NULL
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE ${fullTableName} ALTER COLUMN [estado] NVARCHAR(50) NOT NULL`
        );
      } catch (e) {
        console.warn('[Migration 18] Error al alterar tipo de columna estado:', e.message);
      }

      // 4. Actualizar los registros con 'PENDIENTE' a 'SIN INICIAR'
      try {
        await queryInterface.sequelize.query(
          `UPDATE ${fullTableName} SET estado = 'SIN INICIAR' WHERE UPPER(estado) = 'PENDIENTE'`
        );
      } catch (e) {
        console.warn('[Migration 18] Error al ejecutar UPDATE de estado:', e.message);
      }

      // 5. Añadir nuevo DEFAULT constraint
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE ${fullTableName} ADD CONSTRAINT DF_Tareas_estado DEFAULT 'SIN INICIAR' FOR [estado]`
        );
      } catch (e) {
        console.warn('[Migration 18] Error al agregar DEFAULT DF_Tareas_estado:', e.message);
      }

      // 6. Añadir nuevo CHECK constraint con los 3 estados permitidos
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE ${fullTableName} ADD CONSTRAINT CK_Tareas_estado CHECK (estado IN ('SIN INICIAR', 'EN CURSO', 'COMPLETADA'))`
        );
      } catch (e) {
        console.warn('[Migration 18] Error al agregar CHECK constraint CK_Tareas_estado:', e.message);
      }
    } else if (isSqlite) {
      // 1. Migrar registros existentes con estado PENDIENTE a SIN INICIAR
      try {
        await queryInterface.sequelize.query(
          `UPDATE Tareas SET estado = 'SIN INICIAR' WHERE UPPER(estado) = 'PENDIENTE'`
        );
      } catch (e) {
        console.warn('[Migration 18] No se pudo ejecutar UPDATE directo de estado:', e.message);
      }
    } else {
      // Dialectos genéricos (PostgreSQL, MySQL, etc.)
      try {
        await queryInterface.sequelize.query(
          `UPDATE ${tableObj('Tareas')} SET estado = 'SIN INICIAR' WHERE UPPER(estado) = 'PENDIENTE'`
        );
      } catch (e) {}

      try {
        await queryInterface.changeColumn(tableObj('Tareas'), 'estado', {
          type: DataTypes.STRING(50),
          allowNull: false,
          defaultValue: 'SIN INICIAR'
        }, { schema });
      } catch (err) {
        console.warn('[Migration 18] changeColumn error:', err.message);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const dialect = queryInterface.sequelize.options.dialect;
    const isSqlite = dialect === 'sqlite';
    const isMssql = dialect === 'mssql' || process.env.DB_DIALECT === 'mssql';
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema;
    const fullTableName = isSqlite ? 'Tareas' : `[${schema}].[Tareas]`;

    if (isMssql) {
      try {
        await queryInterface.sequelize.query(`ALTER TABLE ${fullTableName} DROP CONSTRAINT IF EXISTS CK_Tareas_estado`);
      } catch (e) {}

      try {
        await queryInterface.sequelize.query(`ALTER TABLE ${fullTableName} DROP CONSTRAINT IF EXISTS DF_Tareas_estado`);
      } catch (e) {}

      try {
        await queryInterface.sequelize.query(
          `UPDATE ${fullTableName} SET estado = 'PENDIENTE' WHERE UPPER(estado) = 'SIN INICIAR'`
        );
      } catch (e) {}

      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE ${fullTableName} ADD CONSTRAINT DF_Tareas_estado DEFAULT 'PENDIENTE' FOR [estado]`
        );
      } catch (e) {}

      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE ${fullTableName} ADD CONSTRAINT CK_Tareas_estado CHECK (estado IN ('PENDIENTE', 'COMPLETADA'))`
        );
      } catch (e) {}
    } else {
      try {
        await queryInterface.sequelize.query(
          `UPDATE ${isSqlite ? 'Tareas' : `"${schema}"."Tareas"`} SET estado = 'PENDIENTE' WHERE UPPER(estado) = 'SIN INICIAR'`
        );
      } catch (e) {}
    }
  }
};

