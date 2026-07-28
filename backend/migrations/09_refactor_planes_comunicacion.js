'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';
    const isMssql = queryInterface.sequelize.options.dialect === 'mssql' || process.env.DB_DIALECT === 'mssql';
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema;

    if (isMssql && !schema) {
      throw new Error('[FATAL] La variable de entorno DB_SCHEMA es obligatoria para conexiones MSSQL / Azure SQL.');
    }

    const originalCreateTable = queryInterface.createTable.bind(queryInterface);

    const createTable = async (tableName, attributes, options) => {
      if (isSqlite) {
        return originalCreateTable(tableName, attributes, options);
      }
      const targetTable = { tableName, schema };
      const qualifiedAttributes = { ...attributes };
      for (const key in qualifiedAttributes) {
        const attribute = qualifiedAttributes[key];
        if (attribute && attribute.references && typeof attribute.references.model === 'string') {
          attribute.references.model = {
            tableName: attribute.references.model,
            schema
          };
        }
      }
      return originalCreateTable(targetTable, qualifiedAttributes, options);
    };

    // 1. Crear Planes_Comunicacion
    let planesExists = false;
    try {
      const info = await queryInterface.describeTable('Planes_Comunicacion');
      if (info && Object.keys(info).length > 0) planesExists = true;
    } catch (e) {
      planesExists = false;
    }

    if (!planesExists) {
      await createTable('Planes_Comunicacion', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        id_proyecto: {
          type: DataTypes.STRING(50),
          allowNull: false,
          references: { model: 'Proyectos', key: 'id_proyecto' },
          onDelete: 'CASCADE'
        },
        titulo: {
          type: DataTypes.STRING,
          allowNull: false
        },
        finalidad: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        periodicidad: {
          type: DataTypes.STRING(20),
          allowNull: false,
          defaultValue: 'SEMANAL'
        },
        intervalo: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1
        },
        dia_semana: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        dia_mes: {
          type: DataTypes.INTEGER,
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

    // 2. Crear Plan_Comunicacion_Contacto
    let pivotExists = false;
    try {
      const info = await queryInterface.describeTable('Plan_Comunicacion_Contacto');
      if (info && Object.keys(info).length > 0) pivotExists = true;
    } catch (e) {
      pivotExists = false;
    }

    if (!pivotExists) {
      await createTable('Plan_Comunicacion_Contacto', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        id_plan_comunicacion: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'Planes_Comunicacion', key: 'id' },
          onDelete: 'CASCADE'
        },
        id_contacto: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'Contactos_Proveedor', key: 'id_contacto' },
          onDelete: 'CASCADE'
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

    // 3. Crear Plan_Comunicacion_Log
    let logExists = false;
    try {
      const info = await queryInterface.describeTable('Plan_Comunicacion_Log');
      if (info && Object.keys(info).length > 0) logExists = true;
    } catch (e) {
      logExists = false;
    }

    if (!logExists) {
      await createTable('Plan_Comunicacion_Log', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
        },
        id_plan_comunicacion: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'Planes_Comunicacion', key: 'id' },
          onDelete: 'SET NULL'
        },
        id_proyecto: {
          type: DataTypes.STRING(50),
          allowNull: false,
          references: { model: 'Proyectos', key: 'id_proyecto' },
          onDelete: 'CASCADE'
        },
        id_usuario: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'Usuarios', key: 'id_usuario' },
          onDelete: 'SET NULL'
        },
        fecha_envio: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        destinatarios: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        observaciones: {
          type: DataTypes.TEXT,
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

    // Migración de datos legacy
    try {
      const proyectos = await queryInterface.sequelize.query(
        `SELECT id_proyecto, com_semanal_activo, com_semanal_finalidad, com_mensual_activo, com_mensual_finalidad, com_steerco_activo, com_steerco_finalidad FROM ${isSqlite ? 'Proyectos' : `[${schema}].[Proyectos]`}`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      for (const p of proyectos) {
        const plansToInsert = [
          {
            titulo: 'Comité de Seguimiento Semanal (Operativo)',
            finalidad: p.com_semanal_finalidad || 'Seguimiento operativo semanal',
            periodicidad: 'SEMANAL',
            intervalo: 1,
            dia_semana: 5,
            activo: p.com_semanal_activo !== false && p.com_semanal_activo !== 0,
            legacyTable: 'Proyecto_ComSemanal_Contacto'
          },
          {
            titulo: 'Comité de Seguimiento Mensual (Táctico)',
            finalidad: p.com_mensual_finalidad || 'Seguimiento táctico mensual',
            periodicidad: 'MENSUAL',
            intervalo: 1,
            dia_mes: 28,
            activo: p.com_mensual_activo !== false && p.com_mensual_activo !== 0,
            legacyTable: 'Proyecto_ComMensual_Contacto'
          },
          {
            titulo: 'Comité de Dirección / SteerCo (Estratégico)',
            finalidad: p.com_steerco_finalidad || 'Gobernanza y decisiones estratégicas',
            periodicidad: 'MENSUAL',
            intervalo: 1,
            dia_mes: 15,
            activo: p.com_steerco_activo !== false && p.com_steerco_activo !== 0,
            legacyTable: 'Proyecto_ComSteerCo_Contacto'
          }
        ];

        for (const plan of plansToInsert) {
          const [existing] = await queryInterface.sequelize.query(
            `SELECT id FROM ${isSqlite ? 'Planes_Comunicacion' : `[${schema}].[Planes_Comunicacion]`} WHERE id_proyecto = '${p.id_proyecto}' AND titulo = '${plan.titulo.replace(/'/g, "''")}'`,
            { type: Sequelize.QueryTypes.SELECT }
          );

          let planId = existing ? existing.id : null;
          if (!planId) {
            const now = new Date().toISOString();
            await queryInterface.sequelize.query(
              `INSERT INTO ${isSqlite ? 'Planes_Comunicacion' : `[${schema}].[Planes_Comunicacion]`} (id_proyecto, titulo, finalidad, periodicidad, intervalo, dia_semana, dia_mes, activo, createdAt, updatedAt) VALUES ('${p.id_proyecto}', '${plan.titulo.replace(/'/g, "''")}', '${(plan.finalidad || '').replace(/'/g, "''")}', '${plan.periodicidad}', ${plan.intervalo}, ${plan.dia_semana || 'NULL'}, ${plan.dia_mes || 'NULL'}, ${plan.activo ? 1 : 0}, '${now}', '${now}')`
            );
            const [newPlan] = await queryInterface.sequelize.query(
              `SELECT id FROM ${isSqlite ? 'Planes_Comunicacion' : `[${schema}].[Planes_Comunicacion]`} WHERE id_proyecto = '${p.id_proyecto}' AND titulo = '${plan.titulo.replace(/'/g, "''")}'`,
              { type: Sequelize.QueryTypes.SELECT }
            );
            planId = newPlan ? newPlan.id : null;
          }

          if (planId) {
            try {
              const legacyContacts = await queryInterface.sequelize.query(
                `SELECT id_contacto FROM ${isSqlite ? plan.legacyTable : `[${schema}].[${plan.legacyTable}]`} WHERE id_proyecto = '${p.id_proyecto}'`,
                { type: Sequelize.QueryTypes.SELECT }
              );
              for (const lc of legacyContacts) {
                const [relExist] = await queryInterface.sequelize.query(
                  `SELECT id FROM ${isSqlite ? 'Plan_Comunicacion_Contacto' : `[${schema}].[Plan_Comunicacion_Contacto]`} WHERE id_plan_comunicacion = ${planId} AND id_contacto = ${lc.id_contacto}`,
                  { type: Sequelize.QueryTypes.SELECT }
                );
                if (!relExist) {
                  const now = new Date().toISOString();
                  await queryInterface.sequelize.query(
                    `INSERT INTO ${isSqlite ? 'Plan_Comunicacion_Contacto' : `[${schema}].[Plan_Comunicacion_Contacto]`} (id_plan_comunicacion, id_contacto, createdAt, updatedAt) VALUES (${planId}, ${lc.id_contacto}, '${now}', '${now}')`
                  );
                }
              }
            } catch (err) {
              // Legacy pivot table check error swallow
            }
          }
        }
      }
    } catch (e) {
      console.warn('Advertencia migrando datos legacy de comités:', e.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    const isSqlite = queryInterface.sequelize.options.dialect === 'sqlite';
    const schema = process.env.DB_SCHEMA || queryInterface.sequelize.options.define?.schema;
    const dropTable = async (tbl) => {
      const target = isSqlite ? tbl : { tableName: tbl, schema };
      await queryInterface.dropTable(target);
    };

    await dropTable('Plan_Comunicacion_Log');
    await dropTable('Plan_Comunicacion_Contacto');
    await dropTable('Planes_Comunicacion');
  }
};
