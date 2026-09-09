'use strict';
const { DataTypes, QueryTypes } = require('sequelize');

/**
 * Migration: 17_create_ambitos_and_scope.js
 * Crea las tablas Ambitos y Usuario_Ambitos.
 * Añade columna id_ambito en Proyectos y Portfolios.
 * Inserta el ámbito predeterminado "IT Corporate" (code: IT_CORP) y migra los datos existentes.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const dialect = queryInterface.sequelize.options.dialect;
    const isSqlite = dialect === 'sqlite';
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema || 'dbo';

    const getTarget = (tableName) => isSqlite ? tableName : { tableName, schema };
    const getTargetQuery = (tableName) => isSqlite ? `"${tableName}"` : `[${schema}].[${tableName}]`;

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

    // 1. Crear tabla Ambitos si no existe
    const ambitosTarget = getTarget('Ambitos');
    const hasAmbitos = await tableExists('Ambitos');

    if (!hasAmbitos) {
      await queryInterface.createTable(ambitosTarget, {
        id_ambito: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        nombre: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        code: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true
        },
        descripcion: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        activo: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true
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
    }

    // 2. Crear tabla Usuario_Ambitos si no existe
    const userAmbitosTarget = getTarget('Usuario_Ambitos');
    const hasUserAmbitos = await tableExists('Usuario_Ambitos');

    if (!hasUserAmbitos) {
      await queryInterface.createTable(userAmbitosTarget, {
        id_usuario_ambito: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        id_usuario: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: isSqlite ? 'Usuarios' : { tableName: 'Usuarios', schema },
            key: 'id_usuario'
          },
          onDelete: 'CASCADE'
        },
        id_ambito: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: isSqlite ? 'Ambitos' : { tableName: 'Ambitos', schema },
            key: 'id_ambito'
          },
          onDelete: 'CASCADE'
        },
        rol_ambito: {
          type: DataTypes.STRING(50),
          allowNull: false,
          defaultValue: 'MEMBER'
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
    }

    // 3. Añadir columna id_ambito a Proyectos si no existe
    const proyectosTarget = getTarget('Proyectos');
    const hasProyectosAmbito = await columnExists('Proyectos', 'id_ambito');
    if (!hasProyectosAmbito) {
      await queryInterface.addColumn(proyectosTarget, 'id_ambito', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: isSqlite ? 'Ambitos' : { tableName: 'Ambitos', schema },
          key: 'id_ambito'
        },
        onDelete: 'SET NULL'
      });
    }

    // 4. Añadir columna id_ambito a Portfolios si no existe
    const portfoliosTarget = getTarget('Portfolios');
    const hasPortfoliosAmbito = await columnExists('Portfolios', 'id_ambito');
    if (!hasPortfoliosAmbito) {
      await queryInterface.addColumn(portfoliosTarget, 'id_ambito', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: isSqlite ? 'Ambitos' : { tableName: 'Ambitos', schema },
          key: 'id_ambito'
        },
        onDelete: 'SET NULL'
      });
    }

    // 5. Insertar Ámbito inicial "IT Corporate" (id_ambito: 1, code: IT_CORP) si no existe
    const existingAmbitos = await queryInterface.sequelize.query(
      `SELECT id_ambito FROM ${getTargetQuery('Ambitos')} WHERE code = 'IT_CORP'`,
      { type: QueryTypes.SELECT }
    );

    let defaultAmbitoId = 1;
    if (!existingAmbitos || existingAmbitos.length === 0) {
      await queryInterface.sequelize.query(
        `INSERT INTO ${getTargetQuery('Ambitos')} (nombre, code, descripcion, activo, createdAt, updatedAt)
         VALUES ('IT Corporate', 'IT_CORP', 'Ámbito corporativo predeterminado de Tecnologías de la Información', 1, ${isSqlite ? "datetime('now')" : "GETDATE()"}, ${isSqlite ? "datetime('now')" : "GETDATE()"})`
      );
      const inserted = await queryInterface.sequelize.query(
        `SELECT id_ambito FROM ${getTargetQuery('Ambitos')} WHERE code = 'IT_CORP'`,
        { type: QueryTypes.SELECT }
      );
      if (inserted && inserted.length > 0) {
        defaultAmbitoId = inserted[0].id_ambito || 1;
      }
    } else {
      defaultAmbitoId = existingAmbitos[0].id_ambito || 1;
    }

    // 6. Asignar id_ambito = defaultAmbitoId a todos los Proyectos y Portfolios existentes
    await queryInterface.sequelize.query(
      `UPDATE ${getTargetQuery('Proyectos')} SET id_ambito = :defaultAmbitoId WHERE id_ambito IS NULL`,
      { replacements: { defaultAmbitoId }, type: QueryTypes.UPDATE }
    );

    await queryInterface.sequelize.query(
      `UPDATE ${getTargetQuery('Portfolios')} SET id_ambito = :defaultAmbitoId WHERE id_ambito IS NULL`,
      { replacements: { defaultAmbitoId }, type: QueryTypes.UPDATE }
    );

    // 7. Asociar todos los usuarios existentes al ámbito defaultAmbitoId en Usuario_Ambitos
    const usuarios = await queryInterface.sequelize.query(
      `SELECT id_usuario FROM ${getTargetQuery('Usuarios')}`,
      { type: QueryTypes.SELECT }
    );

    if (usuarios && usuarios.length > 0) {
      for (const u of usuarios) {
        const existingUserAmbito = await queryInterface.sequelize.query(
          `SELECT 1 FROM ${getTargetQuery('Usuario_Ambitos')} WHERE id_usuario = :id_usuario AND id_ambito = :defaultAmbitoId`,
          { replacements: { id_usuario: u.id_usuario, defaultAmbitoId }, type: QueryTypes.SELECT }
        );

        if (!existingUserAmbito || existingUserAmbito.length === 0) {
          await queryInterface.sequelize.query(
            `INSERT INTO ${getTargetQuery('Usuario_Ambitos')} (id_usuario, id_ambito, rol_ambito, createdAt, updatedAt)
             VALUES (:id_usuario, :defaultAmbitoId, 'MEMBER', ${isSqlite ? "datetime('now')" : "GETDATE()"}, ${isSqlite ? "datetime('now')" : "GETDATE()"})`,
            { replacements: { id_usuario: u.id_usuario, defaultAmbitoId }, type: QueryTypes.INSERT }
          );
        }
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema || 'dbo';
    const getTarget = (tableName) => isSqlite ? tableName : { tableName, schema };

    await queryInterface.removeColumn(getTarget('Proyectos'), 'id_ambito').catch(() => {});
    await queryInterface.removeColumn(getTarget('Portfolios'), 'id_ambito').catch(() => {});
    await queryInterface.dropTable(getTarget('Usuario_Ambitos')).catch(() => {});
    await queryInterface.dropTable(getTarget('Ambitos')).catch(() => {});
  }
};
