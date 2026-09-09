'use strict';
const { DataTypes } = require('sequelize');

/**
 * Migration: 24_make_telefono_nullable.js
 * - Hace que la columna telefono en Contactos_Proveedor sea opcional (allowNull: true).
 * - Asegura que telefono_general en Proveedores sea opcional (allowNull: true).
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const dialect = queryInterface.sequelize.options.dialect;
    const isMssql = dialect === 'mssql' || process.env.DB_DIALECT === 'mssql';
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema || 'dbo';

    if (isMssql) {
      try {
        await queryInterface.sequelize.query(`
          IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Contactos_Proveedor' AND schema_id = SCHEMA_ID('${schema}'))
          BEGIN
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Contactos_Proveedor]') AND name = 'telefono' AND is_nullable = 0)
            BEGIN
              ALTER TABLE [${schema}].[Contactos_Proveedor] ALTER COLUMN [telefono] NVARCHAR(255) NULL;
            END;
          END;

          IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Contactos_Proveedors' AND schema_id = SCHEMA_ID('${schema}'))
          BEGIN
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Contactos_Proveedors]') AND name = 'telefono' AND is_nullable = 0)
            BEGIN
              ALTER TABLE [${schema}].[Contactos_Proveedors] ALTER COLUMN [telefono] NVARCHAR(255) NULL;
            END;
          END;

          IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Proveedores' AND schema_id = SCHEMA_ID('${schema}'))
          BEGIN
            IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[${schema}].[Proveedores]') AND name = 'telefono_general' AND is_nullable = 0)
            BEGIN
              ALTER TABLE [${schema}].[Proveedores] ALTER COLUMN [telefono_general] NVARCHAR(255) NULL;
            END;
          END;
        `);
      } catch (e) {
        console.warn('[Migration 24] Aviso al alterar columnas en MSSQL:', e.message);
      }
    } else {
      try {
        await queryInterface.changeColumn('Contactos_Proveedor', 'telefono', {
          type: DataTypes.STRING,
          allowNull: true
        });
      } catch (e) {
        console.warn('[Migration 24] Aviso al cambiar columna telefono en SQLite:', e.message);
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // No-op rollback
  }
};
