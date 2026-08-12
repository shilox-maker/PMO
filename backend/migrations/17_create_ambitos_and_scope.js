'use strict';
const { DataTypes } = require('sequelize');

/**
 * Migration: 17_create_ambitos_and_scope.js
 * Crea las tablas Ambitos y Usuario_Ambitos.
 * Añade columna id_ambito en Proyectos y Portfolios.
 * Inserta el ámbito predeterminado "IT Corporate" (code: IT_CORP) y migra los datos existentes.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema || 'dbo';

    const getTarget = (tableName) => isSqlite ? tableName : { tableName, schema };
    const getTargetQuery = (tableName) => isSqlite ? `"${tableName}"` : `[${schema}].[${tableName}]`;

    // 1. Crear tabla Ambitos
    const ambitosTarget = getTarget('Ambitos');
    const hasAmbitos = await queryInterface.showAllTables().then(tables =>
      tables.includes('Ambitos') || tables.includes('ambitos')
    );

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

    // 2. Crear tabla Usuario_Ambitos
    const userAmbitosTarget = getTarget('Usuario_Ambitos');
    const hasUserAmbitos = await queryInterface.showAllTables().then(tables =>
      tables.includes('Usuario_Ambitos') || tables.includes('usuario_ambitos')
    );

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

    // 3. Añadir columna id_ambito a Proyectos
    const proyectosTarget = getTarget('Proyectos');
    const proyectosInfo = await queryInterface.describeTable(proyectosTarget);
    if (!proyectosInfo.id_ambito) {
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

    // 4. Añadir columna id_ambito a Portfolios
    const portfoliosTarget = getTarget('Portfolios');
    const portfoliosInfo = await queryInterface.describeTable(portfoliosTarget);
    if (!portfoliosInfo.id_ambito) {
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
      `SELECT * FROM ${getTargetQuery('Ambitos')} WHERE code = 'IT_CORP'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    let defaultAmbitoId = 1;
    if (existingAmbitos.length === 0) {
      await queryInterface.sequelize.query(
        `INSERT INTO ${getTargetQuery('Ambitos')} (nombre, code, descripcion, activo, createdAt, updatedAt)
         VALUES ('IT Corporate', 'IT_CORP', 'Ámbito corporativo predeterminado de Tecnologías de la Información', 1, ${isSqlite ? "datetime('now')" : "GETDATE()"}, ${isSqlite ? "datetime('now')" : "GETDATE()"})`
      );
      const inserted = await queryInterface.sequelize.query(
        `SELECT id_ambito FROM ${getTargetQuery('Ambitos')} WHERE code = 'IT_CORP'`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      if (inserted.length > 0) {
        defaultAmbitoId = inserted[0].id_ambito;
      }
    } else {
      defaultAmbitoId = existingAmbitos[0].id_ambito;
    }

    // 6. Asignar id_ambito = defaultAmbitoId a todos los Proyectos y Portfolios existentes
    await queryInterface.sequelize.query(
      `UPDATE ${getTargetQuery('Proyectos')} SET id_ambito = :defaultAmbitoId WHERE id_ambito IS NULL`,
      { replacements: { defaultAmbitoId }, type: queryInterface.sequelize.QueryTypes.UPDATE }
    );

    await queryInterface.sequelize.query(
      `UPDATE ${getTargetQuery('Portfolios')} SET id_ambito = :defaultAmbitoId WHERE id_ambito IS NULL`,
      { replacements: { defaultAmbitoId }, type: queryInterface.sequelize.QueryTypes.UPDATE }
    );

    // 7. Asociar todos los usuarios existentes al ámbito defaultAmbitoId en Usuario_Ambitos
    const usuarios = await queryInterface.sequelize.query(
      `SELECT id_usuario FROM ${getTargetQuery('Usuarios')}`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    for (const u of usuarios) {
      const existingUserAmbito = await queryInterface.sequelize.query(
        `SELECT * FROM ${getTargetQuery('Usuario_Ambitos')} WHERE id_usuario = :id_usuario AND id_ambito = :defaultAmbitoId`,
        { replacements: { id_usuario: u.id_usuario, defaultAmbitoId }, type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (existingUserAmbito.length === 0) {
        await queryInterface.sequelize.query(
          `INSERT INTO ${getTargetQuery('Usuario_Ambitos')} (id_usuario, id_ambito, rol_ambito, createdAt, updatedAt)
           VALUES (:id_usuario, :defaultAmbitoId, 'MEMBER', ${isSqlite ? "datetime('now')" : "GETDATE()"}, ${isSqlite ? "datetime('now')" : "GETDATE()"})`,
          { replacements: { id_usuario: u.id_usuario, defaultAmbitoId }, type: queryInterface.sequelize.QueryTypes.INSERT }
        );
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema || 'dbo';
    const getTarget = (tableName) => isSqlite ? tableName : { tableName, schema };

    await queryInterface.removeColumn(getTarget('Proyectos'), 'id_ambito');
    await queryInterface.removeColumn(getTarget('Portfolios'), 'id_ambito');
    await queryInterface.dropTable(getTarget('Usuario_Ambitos'));
    await queryInterface.dropTable(getTarget('Ambitos'));
  }
};
