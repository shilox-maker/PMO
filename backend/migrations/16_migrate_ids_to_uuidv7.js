'use strict';
const { DataTypes, QueryTypes } = require('sequelize');
const { v7: uuidv7 } = require('uuid');

/**
 * Migration: 16_migrate_ids_to_uuidv7.js
 * Transforma claves primarias y foráneas de entidades de negocio a UUIDv7.
 * Conserva como INTEGER/Code las tablas de catálogo maestras (Estados_Proyecto, Roles, Sedes, Tipos_Capex, Tipos_Factura).
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema || 'dbo';

    const tableExists = async (tableName) => {
      if (isSqlite) {
        const res = await queryInterface.sequelize.query(
          `SELECT name FROM sqlite_master WHERE type='table' AND name = :tableName`,
          { replacements: { tableName }, type: QueryTypes.SELECT }
        );
        return res && res.length > 0;
      }
      const res = await queryInterface.sequelize.query(
        `SELECT 1 FROM sys.tables t INNER JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE s.name = :schema AND t.name = :tableName`,
        { replacements: { schema, tableName }, type: QueryTypes.SELECT }
      );
      return res && res.length > 0;
    };

    const resolveExistingTable = async (candidateNames) => {
      for (const name of candidateNames) {
        if (await tableExists(name)) return name;
      }
      return candidateNames[0];
    };

    // Lista de tablas de entidad a migrar (Padres e Hijas) con resolución dinámica
    const rawEntities = [
      { candidateNames: ['Portfolios'], pk: 'id', fks: [] },
      { candidateNames: ['Proyectos'], pk: 'id_proyecto', fks: [{ col: 'portfolio_id', targetCandidates: ['Portfolios'], targetPk: 'id' }] },
      { candidateNames: ['Tareas'], pk: 'id_tarea', fks: [{ col: 'id_proyecto', targetCandidates: ['Proyectos'], targetPk: 'id_proyecto' }] },
      { candidateNames: ['Riesgos'], pk: 'id_riesgo', fks: [
          { col: 'id_proyecto', targetCandidates: ['Proyectos'], targetPk: 'id_proyecto' },
          { col: 'id_tarea', targetCandidates: ['Tareas'], targetPk: 'id_tarea' }
        ]
      },
      { candidateNames: ['Facturas'], pk: 'id_interno_factura', fks: [{ col: 'id_proyecto', targetCandidates: ['Proyectos'], targetPk: 'id_proyecto' }] },
      { candidateNames: ['Comentarios_Proyecto', 'Comentarios_Proyectos'], pk: 'id_comentario', fks: [{ col: 'id_proyecto', targetCandidates: ['Proyectos'], targetPk: 'id_proyecto' }] },
      { candidateNames: ['Lecciones_Aprendidas', 'Lecciones_Aprendida'], pk: 'id_leccion', fks: [{ col: 'id_proyecto', targetCandidates: ['Proyectos'], targetPk: 'id_proyecto' }] },
      { candidateNames: ['Cambios_Alcance', 'Cambios_Alcances'], pk: 'id_cambio', fks: [{ col: 'id_proyecto', targetCandidates: ['Proyectos'], targetPk: 'id_proyecto' }] }
    ];

    const entities = [];
    for (const raw of rawEntities) {
      const resolvedName = await resolveExistingTable(raw.candidateNames);
      const exists = await tableExists(resolvedName);
      if (!exists) continue;

      const resolvedFks = [];
      for (const fk of raw.fks) {
        const resolvedTarget = await resolveExistingTable(fk.targetCandidates);
        resolvedFks.push({
          col: fk.col,
          target: resolvedTarget,
          targetPk: fk.targetPk
        });
      }

      entities.push({
        name: resolvedName,
        pk: raw.pk,
        fks: resolvedFks
      });
    }

    const getTableTarget = (tableName) => isSqlite ? `"${tableName}"` : `[${schema}].[${tableName}]`;

    // Paso 1: Añadir columna temporal uuid_v7 en cada tabla
    for (const entity of entities) {
      const tableTarget = isSqlite ? entity.name : { tableName: entity.name, schema };
      const tableInfo = await queryInterface.describeTable(tableTarget).catch(() => ({}));

      if (!tableInfo.uuid_v7) {
        await queryInterface.addColumn(tableTarget, 'uuid_v7', {
          type: DataTypes.UUID,
          allowNull: true
        });
      }

      // Backfill UUIDv7 secuencial
      const rows = await queryInterface.sequelize.query(
        `SELECT * FROM ${getTableTarget(entity.name)}`,
        { type: QueryTypes.SELECT }
      );

      for (const row of rows) {
        const pkValue = row[entity.pk];
        if (pkValue && !row.uuid_v7) {
          const generatedUuid = uuidv7();
          await queryInterface.sequelize.query(
            `UPDATE ${getTableTarget(entity.name)} SET uuid_v7 = :uuidVal WHERE ${entity.pk} = :pkVal`,
            {
              replacements: { uuidVal: generatedUuid, pkVal: pkValue },
              type: QueryTypes.UPDATE
            }
          );
        }
      }
    }

    // Paso 2: Añadir y mapear FKs temporales en tablas hijas
    for (const entity of entities) {
      for (const fk of entity.fks) {
        const tableTarget = isSqlite ? entity.name : { tableName: entity.name, schema };
        const tempFkCol = `temp_uuid_${fk.col}`;
        const tableInfo = await queryInterface.describeTable(tableTarget).catch(() => ({}));

        if (!tableInfo[tempFkCol]) {
          await queryInterface.addColumn(tableTarget, tempFkCol, {
            type: DataTypes.UUID,
            allowNull: true
          });
        }

        // Mapear el FK entero antiguo con el nuevo UUIDv7 del padre
        await queryInterface.sequelize.query(
          `UPDATE ${getTableTarget(entity.name)} 
           SET ${tempFkCol} = (
             SELECT uuid_v7 FROM ${getTableTarget(fk.target)} 
             WHERE ${getTableTarget(fk.target)}.${fk.targetPk} = ${getTableTarget(entity.name)}.${fk.col}
           )
           WHERE ${fk.col} IS NOT NULL`,
          { type: QueryTypes.UPDATE }
        );
      }
    }

    console.log('✅ Migración de datos UUIDv7 completada temporalmente. Las columnas pivote están preparadas.');
  },

  down: async (queryInterface, Sequelize) => {
    const entities = [
      'Portfolios', 'Proyectos', 'Tareas', 'Riesgos',
      'Facturas', 'Comentarios_Proyectos', 'Lecciones_Aprendidas', 'Cambios_Alcances'
    ];
    for (const name of entities) {
      try {
        await queryInterface.removeColumn(name, 'uuid_v7');
      } catch (e) {
        // Ignorar si no existe
      }
    }
  }
};
