'use strict';
const { DataTypes, QueryTypes } = require('sequelize');

/**
 * Migration: 22_add_macro_etapa_to_estados_proyecto.js
 * - Añade la columna macro_etapa a Estados_Proyecto.
 * - Restringe los valores a: INICIATIVA, PLANIFICACION, EJECUCION, PAUSA, CIERRE.
 * - Realiza el mapeo inicial de los 13 estados estándar a sus respectivas macro-etapas.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const dialect = queryInterface.sequelize.options.dialect;
    const isSqlite = dialect === 'sqlite';
    const isMssql = dialect === 'mssql' || process.env.DB_DIALECT === 'mssql';
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema;
    const targetTable = isSqlite ? 'Estados_Proyecto' : { tableName: 'Estados_Proyecto', schema: schema || 'dbo' };
    const fullTableName = isSqlite ? 'Estados_Proyecto' : `[${schema || 'dbo'}].[Estados_Proyecto]`;

    const columnExists = async (tableName, columnName) => {
      if (isSqlite) {
        const res = await queryInterface.sequelize.query(`PRAGMA table_info("${tableName}")`, { type: QueryTypes.SELECT });
        return res && res.some(c => c.name === columnName);
      }
      const res = await queryInterface.sequelize.query(
        `SELECT 1 FROM sys.columns c INNER JOIN sys.tables t ON c.object_id = t.object_id INNER JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = :schema AND t.name = :tableName AND c.name = :columnName`,
        { replacements: { schema: schema || 'dbo', tableName, columnName }, type: QueryTypes.SELECT }
      );
      return res && res.length > 0;
    };

    // 1. Comprobar si la columna macro_etapa ya existe
    const hasMacro = await columnExists('Estados_Proyecto', 'macro_etapa');
    if (!hasMacro) {
      await queryInterface.addColumn(targetTable, 'macro_etapa', {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'EJECUCION'
      });
    }

    // 2. En MSSQL, configurar el CHECK constraint
    if (isMssql) {
      try {
        const checkConstraints = await queryInterface.sequelize.query(
          `SELECT cc.name AS constraint_name
           FROM sys.check_constraints cc
           INNER JOIN sys.tables t ON cc.parent_object_id = t.object_id
           INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
           INNER JOIN sys.columns c ON cc.parent_object_id = c.object_id AND cc.parent_column_id = c.column_id
           WHERE s.name = :schema AND t.name = 'Estados_Proyecto' AND c.name = 'macro_etapa'`,
          { replacements: { schema: schema || 'dbo' }, type: QueryTypes.SELECT }
        );

        for (const chk of checkConstraints) {
          await queryInterface.sequelize.query(
            `ALTER TABLE ${fullTableName} DROP CONSTRAINT [${chk.constraint_name}]`
          );
        }

        await queryInterface.sequelize.query(
          `ALTER TABLE ${fullTableName} ADD CONSTRAINT CK_Estados_Proyecto_macro_etapa 
           CHECK ([macro_etapa] IN ('INICIATIVA', 'PLANIFICACION', 'EJECUCION', 'PAUSA', 'CIERRE'))`
        );
      } catch (e) {
        console.warn('[Migration 22] Aviso al configurar CHECK constraint en Estados_Proyecto:', e.message);
      }
    }

    // 3. Mapeo / Backfill de los estados estándar existentes
    const mappings = [
      { macro: 'INICIATIVA', names: ['Petición', 'Peticion', 'Estudio de viabilidad', 'Buscar propuestas'], codes: ['PETICION', 'ESTUDIO_DE_VIABILIDAD', 'BUSCAR_PROPUESTAS'] },
      { macro: 'PLANIFICACION', names: ['Tener aprobación', 'Tener aprobacion', 'Planificar', 'Kickoff'], codes: ['TENER_APROBACION', 'PLANIFICAR', 'KICKOFF'] },
      { macro: 'EJECUCION', names: ['Ejecución', 'Ejecucion', 'Go Live', 'Estabilización', 'Estabilizacion'], codes: ['EJECUCION', 'GO_LIVE', 'ESTABILIZACION'] },
      { macro: 'PAUSA', names: ['Pausado', 'Detenido'], codes: ['PAUSADO', 'DETENIDO'] },
      { macro: 'CIERRE', names: ['Cierre', 'Descartado', 'Cancelado'], codes: ['CIERRE', 'DESCARTADO', 'CANCELADO'] }
    ];

    for (const m of mappings) {
      const namesList = m.names.map(n => `'${n}'`).join(',');
      const codesList = m.codes.map(c => `'${c}'`).join(',');
      await queryInterface.sequelize.query(
        `UPDATE ${fullTableName} 
         SET macro_etapa = '${m.macro}' 
         WHERE nombre_estado IN (${namesList}) OR code IN (${codesList})`
      );
    }

    // 4. Si hay estados con proyecto_cerrado = true que quedaron en otra macro_etapa, asegurar 'CIERRE'
    await queryInterface.sequelize.query(
      `UPDATE ${fullTableName} 
       SET macro_etapa = 'CIERRE' 
       WHERE proyecto_cerrado = ${isSqlite ? '1' : '1'} AND macro_etapa NOT IN ('CIERRE', 'PAUSA') AND nombre_estado IN ('Cierre', 'Descartado', 'Cancelado')`
    );
  },

  down: async (queryInterface, Sequelize) => {
    const dialect = queryInterface.sequelize.options.dialect;
    const isSqlite = dialect === 'sqlite';
    const isMssql = dialect === 'mssql' || process.env.DB_DIALECT === 'mssql';
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema;
    const targetTable = isSqlite ? 'Estados_Proyecto' : { tableName: 'Estados_Proyecto', schema: schema || 'dbo' };
    const fullTableName = isSqlite ? 'Estados_Proyecto' : `[${schema || 'dbo'}].[Estados_Proyecto]`;

    if (isMssql) {
      try {
        await queryInterface.sequelize.query(
          `ALTER TABLE ${fullTableName} DROP CONSTRAINT IF EXISTS CK_Estados_Proyecto_macro_etapa`
        );
      } catch (e) {
        console.warn('[Migration 22 Down] Aviso:', e.message);
      }
    }

    try {
      await queryInterface.removeColumn(targetTable, 'macro_etapa');
    } catch (e) {
      console.warn('[Migration 22 Down] Aviso al eliminar columna macro_etapa:', e.message);
    }
  }
};
