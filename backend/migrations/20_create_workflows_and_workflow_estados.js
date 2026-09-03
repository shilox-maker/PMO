'use strict';
const { DataTypes, Op } = require('sequelize');

/**
 * Migration: 20_create_workflows_and_workflow_estados.js
 * - Crea las tablas Workflows y Workflow_Estados.
 * - Añade la columna id_workflow en Proyectos.
 * - Inserta el 'Flujo Estándar' global con todos los estados actuales.
 * - Asigna el id_workflow del 'Flujo Estándar' a todos los proyectos existentes.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema || 'dbo';

    const getTarget = (tableName) => isSqlite ? tableName : { tableName, schema };

    // 1. Crear tabla Workflows si no existe
    const workflowsTarget = getTarget('Workflows');
    const hasWorkflows = await queryInterface.showAllTables().then(tables =>
      tables.includes('Workflows') || tables.includes('workflows')
    );

    if (!hasWorkflows) {
      await queryInterface.createTable(workflowsTarget, {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        nombre: {
          type: DataTypes.STRING(100),
          allowNull: false
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
        is_default: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        id_ambito: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: isSqlite ? 'Ambitos' : { tableName: 'Ambitos', schema },
            key: 'id_ambito'
          },
          onDelete: 'SET NULL'
        },
        code: {
          type: DataTypes.STRING(50),
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
    }

    // 2. Crear tabla Workflow_Estados si no existe
    const workflowEstadosTarget = getTarget('Workflow_Estados');
    const hasWorkflowEstados = await queryInterface.showAllTables().then(tables =>
      tables.includes('Workflow_Estados') || tables.includes('workflow_estados')
    );

    if (!hasWorkflowEstados) {
      await queryInterface.createTable(workflowEstadosTarget, {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        id_workflow: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: isSqlite ? 'Workflows' : { tableName: 'Workflows', schema },
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        id_estado: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: isSqlite ? 'Estados_Proyecto' : { tableName: 'Estados_Proyecto', schema },
            key: 'id_estado'
          },
          onDelete: 'CASCADE'
        },
        orden: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0
        }
      });
    }

    // 3. Añadir columna id_workflow a Proyectos si no existe
    const proyectosTarget = getTarget('Proyectos');
    try {
      const proyectosInfo = await queryInterface.describeTable(proyectosTarget);
      if (proyectosInfo && !proyectosInfo.id_workflow) {
        await queryInterface.addColumn(
          proyectosTarget,
          'id_workflow',
          {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
              model: isSqlite ? 'Workflows' : { tableName: 'Workflows', schema },
              key: 'id'
            },
            onDelete: 'SET NULL'
          }
        );
      }
    } catch (e) {
      console.warn('Advertencia comprobando columna id_workflow en Proyectos:', e.message);
    }

    // 4. Inicializar 'Flujo Estándar' y poblar Workflow_Estados con los estados existentes
    try {
      const [existingWorkflows] = await queryInterface.sequelize.query(
        `SELECT id, nombre FROM ${isSqlite ? '"Workflows"' : `[${schema}].[Workflows]`} WHERE nombre = 'Flujo Estándar' OR is_default = 1 LIMIT 1`
      ).catch(async () => {
        // En SQL Server TOP 1
        return await queryInterface.sequelize.query(
          `SELECT TOP 1 id, nombre FROM [${schema}].[Workflows] WHERE nombre = 'Flujo Estándar' OR is_default = 1`
        );
      });

      let defaultWorkflowId = existingWorkflows && existingWorkflows.length > 0 ? existingWorkflows[0].id : null;

      if (!defaultWorkflowId) {
        const now = new Date();
        await queryInterface.bulkInsert(
          workflowsTarget,
          [{
            nombre: 'Flujo Estándar',
            descripcion: 'Flujo de trabajo predeterminado de la organización con el ciclo de vida completo del portfolio.',
            activo: true,
            is_default: true,
            id_ambito: null,
            code: 'STANDARD',
            createdAt: now,
            updatedAt: now
          }]
        );

        const [createdWf] = await queryInterface.sequelize.query(
          `SELECT id FROM ${isSqlite ? '"Workflows"' : `[${schema}].[Workflows]`} WHERE nombre = 'Flujo Estándar'`
        );
        if (createdWf && createdWf.length > 0) {
          defaultWorkflowId = createdWf[0].id;
        }
      }

      if (defaultWorkflowId) {
        // Obtener todos los estados actuales
        const [states] = await queryInterface.sequelize.query(
          `SELECT id_estado, orden FROM ${isSqlite ? '"Estados_Proyecto"' : `[${schema}].[Estados_Proyecto]`} ORDER BY orden ASC`
        );

        if (states && states.length > 0) {
          // Comprobar si ya existen relaciones en Workflow_Estados para este flujo
          const [existingLinks] = await queryInterface.sequelize.query(
            `SELECT id FROM ${isSqlite ? '"Workflow_Estados"' : `[${schema}].[Workflow_Estados]`} WHERE id_workflow = ${defaultWorkflowId}`
          );

          if (!existingLinks || existingLinks.length === 0) {
            const linksToInsert = states.map((st, idx) => ({
              id_workflow: defaultWorkflowId,
              id_estado: st.id_estado,
              orden: st.orden !== undefined && st.orden !== null ? st.orden : (idx + 1)
            }));
            await queryInterface.bulkInsert(workflowEstadosTarget, linksToInsert);
          }
        }

        // Asignar defaultWorkflowId a todos los proyectos existentes con id_workflow NULL
        await queryInterface.sequelize.query(
          `UPDATE ${isSqlite ? '"Proyectos"' : `[${schema}].[Proyectos]`} SET id_workflow = ${defaultWorkflowId} WHERE id_workflow IS NULL`
        );
      }
    } catch (e) {
      console.warn('Advertencia sembrando datos de Flujo Estándar en migración 20:', e.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema || 'dbo';
    const getTarget = (tableName) => isSqlite ? tableName : { tableName, schema };

    try {
      await queryInterface.removeColumn(getTarget('Proyectos'), 'id_workflow');
    } catch (e) {}

    try {
      await queryInterface.dropTable(getTarget('Workflow_Estados'));
    } catch (e) {}

    try {
      await queryInterface.dropTable(getTarget('Workflows'));
    } catch (e) {}
  }
};
