'use strict';
const { DataTypes } = require('sequelize');
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

    // Lista de tablas de entidad a migrar (Padres e Hijas)
    const entities = [
      { name: 'Portfolios', pk: 'id', fks: [] },
      { name: 'Proyectos', pk: 'id_proyecto', fks: [{ col: 'portfolio_id', target: 'Portfolios', targetPk: 'id' }] },
      { name: 'Tareas', pk: 'id_tarea', fks: [{ col: 'id_proyecto', target: 'Proyectos', targetPk: 'id_proyecto' }] },
      { name: 'Riesgos', pk: 'id_riesgo', fks: [
          { col: 'id_proyecto', target: 'Proyectos', targetPk: 'id_proyecto' },
          { col: 'id_tarea', target: 'Tareas', targetPk: 'id_tarea' }
        ]
      },
      { name: 'Facturas', pk: 'id_interno_factura', fks: [{ col: 'id_proyecto', target: 'Proyectos', targetPk: 'id_proyecto' }] },
      { name: 'Comentarios_Proyectos', pk: 'id_comentario', fks: [{ col: 'id_proyecto', target: 'Proyectos', targetPk: 'id_proyecto' }] },
      { name: 'Lecciones_Aprendidas', pk: 'id_leccion', fks: [{ col: 'id_proyecto', target: 'Proyectos', targetPk: 'id_proyecto' }] },
      { name: 'Cambios_Alcances', pk: 'id_cambio', fks: [{ col: 'id_proyecto', target: 'Proyectos', targetPk: 'id_proyecto' }] }
    ];

    const getTableTarget = (tableName) => isSqlite ? `"${tableName}"` : `[${schema}].[${tableName}]`;

    // Paso 1: Añadir columna temporal uuid_v7 en cada tabla
    for (const entity of entities) {
      const tableTarget = isSqlite ? entity.name : { tableName: entity.name, schema };
      const tableInfo = await queryInterface.describeTable(tableTarget);

      if (!tableInfo.uuid_v7) {
        await queryInterface.addColumn(tableTarget, 'uuid_v7', {
          type: DataTypes.UUID,
          allowNull: true
        });
      }

      // Backfill UUIDv7 secuencial
      const rows = await queryInterface.sequelize.query(
        `SELECT * FROM ${getTableTarget(entity.name)}`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      for (const row of rows) {
        const pkValue = row[entity.pk];
        if (pkValue && !row.uuid_v7) {
          const generatedUuid = uuidv7();
          await queryInterface.sequelize.query(
            `UPDATE ${getTableTarget(entity.name)} SET uuid_v7 = :uuidVal WHERE ${entity.pk} = :pkVal`,
            {
              replacements: { uuidVal: generatedUuid, pkVal: pkValue },
              type: queryInterface.sequelize.QueryTypes.UPDATE
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
        const tableInfo = await queryInterface.describeTable(tableTarget);

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
          { type: queryInterface.sequelize.QueryTypes.UPDATE }
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
