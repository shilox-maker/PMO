'use strict';
const { DataTypes, QueryTypes } = require('sequelize');

/**
 * Migration: 23_create_direction_comments.js
 * - Crea la tabla Comentarios_Direccion independiente para el rol de Dirección.
 * - Migra los comentarios históricos que tuvieran para_direccion = true.
 * - Añade índices correspondientes.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const dialect = queryInterface.sequelize.options.dialect;
    const isSqlite = dialect === 'sqlite';
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

    const sourceTableName = (await tableExists('Comentarios_Proyecto')) ? 'Comentarios_Proyecto' : 'Comentarios_Proyectos';
    const sourceTable = isSqlite ? sourceTableName : `[${schema}].[${sourceTableName}]`;
    const targetTable = isSqlite ? 'Comentarios_Direccion' : { tableName: 'Comentarios_Direccion', schema };
    const fullTargetTable = isSqlite ? 'Comentarios_Direccion' : `[${schema}].[Comentarios_Direccion]`;

    // 1. Crear tabla si no existe
    const hasTable = await tableExists('Comentarios_Direccion');
    if (!hasTable) {
      await queryInterface.createTable(targetTable, {
        id_comentario: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        uuid_v7: {
          type: DataTypes.UUID,
          allowNull: true
        },
        id_proyecto: {
          type: DataTypes.STRING,
          allowNull: false,
          references: {
            model: isSqlite ? 'Proyectos' : { tableName: 'Proyectos', schema: schema || 'dbo' },
            key: 'id_proyecto'
          },
          onDelete: 'CASCADE'
        },
        id_usuario: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: isSqlite ? 'Usuarios' : { tableName: 'Usuarios', schema: schema || 'dbo' },
            key: 'id_usuario'
          }
        },
        texto_comentario: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        es_importante: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        fecha_registro: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        editado: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        id_usuario_modificacion: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: isSqlite ? 'Usuarios' : { tableName: 'Usuarios', schema: schema || 'dbo' },
            key: 'id_usuario'
          }
        },
        fecha_modificacion: {
          type: DataTypes.DATE,
          allowNull: true
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });

      // Índices
      await queryInterface.addIndex(targetTable, ['id_proyecto'], { name: 'idx_comentarios_dir_id_proyecto' }).catch(() => {});
      await queryInterface.addIndex(targetTable, ['id_usuario'], { name: 'idx_comentarios_dir_id_usuario' }).catch(() => {});
      await queryInterface.addIndex(targetTable, ['id_usuario_modificacion'], { name: 'idx_comentarios_dir_id_usuario_mod' }).catch(() => {});
    }

    // 2. Migrar comentarios históricos que tuvieran para_direccion = true
    try {
      await queryInterface.sequelize.query(`
        INSERT INTO ${fullTargetTable} (id_proyecto, id_usuario, texto_comentario, es_importante, fecha_registro, editado, id_usuario_modificacion, fecha_modificacion, createdAt, updatedAt)
        SELECT id_proyecto, id_usuario, texto_comentario, es_importante, fecha_registro, editado, id_usuario_modificacion, fecha_modificacion, createdAt, updatedAt
        FROM ${sourceTable}
        WHERE para_direccion = ${isSqlite ? '1' : '1'}
      `);

      // Eliminar de la tabla de comentarios ordinarios los que fueron migrados
      await queryInterface.sequelize.query(`
        DELETE FROM ${sourceTable}
        WHERE para_direccion = ${isSqlite ? '1' : '1'}
      `);
    } catch (e) {
      console.warn('[Migration 23] Aviso en la migración de datos hacia Comentarios_Direccion:', e.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const dialect = queryInterface.sequelize.options.dialect;
    const isSqlite = dialect === 'sqlite';
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema;
    const targetTable = isSqlite ? 'Comentarios_Direccion' : { tableName: 'Comentarios_Direccion', schema: schema || 'dbo' };

    await queryInterface.dropTable(targetTable).catch(() => {});
  }
};
