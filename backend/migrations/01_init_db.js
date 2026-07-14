'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const schema = queryInterface.sequelize.options.define.schema || 'dbo';

    // Guardar referencias originales
    const originalCreateTable = queryInterface.createTable.bind(queryInterface);
    const originalAddIndex = queryInterface.addIndex.bind(queryInterface);

    // Envolver createTable para inyectar esquema en atributos y referencias
    queryInterface.createTable = async (tableName, attributes, options) => {
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

    // Envolver addIndex para inyectar esquema
    queryInterface.addIndex = async (tableName, columns, options) => {
      return originalAddIndex({ tableName, schema }, columns, options);
    };

    // Helper para agregar índices de forma segura
    const addIndexSafe = async (tableName, columns, options) => {
      try {
        await queryInterface.addIndex(tableName, columns, options);
      } catch (error) {
        console.warn(`⚠️ Advertencia al crear índice en ${tableName} sobre ${columns.join(',')}: ${error.message}`);
      }
    };

    // 1. Sedes
    await queryInterface.createTable('Sedes', {
      id_sede: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      nombre_sede: { type: DataTypes.STRING, allowNull: false, unique: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // 2. Proveedores
    await queryInterface.createTable('Proveedores', {
      id_proveedor: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      nombre_razon_social: { type: DataTypes.STRING, allowNull: false, unique: true },
      telefono_general: { type: DataTypes.STRING, allowNull: true },
      email_general: { type: DataTypes.STRING, allowNull: true },
      es_grupo_dacsa: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // 3. Contactos_Proveedors (pluralización de ContactosProveedor)
    await queryInterface.createTable('Contactos_Proveedors', {
      id_contacto: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      id_proveedor: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Proveedores', key: 'id_proveedor' },
        onDelete: 'CASCADE'
      },
      nombre: { type: DataTypes.STRING, allowNull: false },
      apellidos: { type: DataTypes.STRING, allowNull: false },
      puesto: { type: DataTypes.STRING, allowNull: false },
      telefono: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await addIndexSafe('Contactos_Proveedors', ['id_proveedor'], { name: 'idx_contactos_prov_id_proveedor' });

    // 4. Usuarios
    await queryInterface.createTable('Usuarios', {
      id_usuario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      nombre: { type: DataTypes.STRING, allowNull: false },
      apellidos: { type: DataTypes.STRING, allowNull: false },
      correo: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: false },
      password_salt: { type: DataTypes.STRING, allowNull: true },
      perfil: { type: DataTypes.ENUM('ADMINISTRADOR', 'PM', 'DIRECTOR'), allowNull: false, defaultValue: 'PM' },
      activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // 5. Estados_Proyecto
    await queryInterface.createTable('Estados_Proyecto', {
      id_estado: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      nombre_estado: { type: DataTypes.STRING, allowNull: false, unique: true },
      pasos: { type: DataTypes.TEXT, allowNull: true },
      icono: { type: DataTypes.STRING, allowNull: true },
      orden: { type: DataTypes.INTEGER, allowNull: false },
      proyecto_cerrado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
    });

    // 6. Portfolios
    await queryInterface.createTable('Portfolios', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      nombre: { type: DataTypes.STRING, allowNull: false, unique: true },
      descripcion: { type: DataTypes.TEXT, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // 7. Tags
    await queryInterface.createTable('Tags', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      nombre: { type: DataTypes.STRING, allowNull: false, unique: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // 8. Proyectos
    await queryInterface.createTable('Proyectos', {
      id_proyecto: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
      nombre_proyecto: { type: DataTypes.STRING, allowNull: false },
      descripcion: { type: DataTypes.TEXT, allowNull: false },
      id_pm: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Usuarios', key: 'id_usuario' }
      },
      id_proveedor: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Proveedores', key: 'id_proveedor' }
      },
      id_sede: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Sedes', key: 'id_sede' }
      },
      id_sponsor: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Contactos_Proveedors', key: 'id_contacto' }
      },
      id_estado: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Estados_Proyecto', key: 'id_estado' }
      },
      portfolio_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Portfolios', key: 'id' }
      },
      indicador_rag: { type: DataTypes.ENUM('VERDE', 'AMARILLO', 'ROJO'), allowNull: false, defaultValue: 'VERDE' },
      fecha_inicio: { type: DataTypes.DATEONLY, allowNull: false },
      fecha_fin_inicial: { type: DataTypes.DATEONLY, allowNull: true },
      es_capex: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      codigo_capex: { type: DataTypes.STRING, allowNull: true },
      es_estrategico: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      budget_inicial: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
      com_semanal_activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      com_semanal_finalidad: { type: DataTypes.TEXT, allowNull: true },
      com_mensual_activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      com_mensual_finalidad: { type: DataTypes.TEXT, allowNull: true },
      com_steerco_activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      com_steerco_finalidad: { type: DataTypes.TEXT, allowNull: true },
      alcance_por_que: { type: DataTypes.TEXT, allowNull: true },
      alcance_objetivo: { type: DataTypes.TEXT, allowNull: true },
      alcance_resultados: { type: DataTypes.TEXT, allowNull: true },
      alcance_limitaciones: { type: DataTypes.TEXT, allowNull: true },
      alcance_integraciones: { type: DataTypes.TEXT, allowNull: true },
      alcance_desarrollo: { type: DataTypes.TEXT, allowNull: true },
      cierre_aceptacion: { type: DataTypes.TEXT, allowNull: true },
      cierre_exito: { type: DataTypes.TEXT, allowNull: true },
      fecha_peticion: { type: DataTypes.DATEONLY, allowNull: true },
      fecha_alcance_definido: { type: DataTypes.DATEONLY, allowNull: true },
      fecha_aprobacion: { type: DataTypes.DATEONLY, allowNull: true },
      fecha_planificacion: { type: DataTypes.DATEONLY, allowNull: true },
      fecha_kickoff: { type: DataTypes.DATEONLY, allowNull: true },
      fecha_go_live: { type: DataTypes.DATEONLY, allowNull: true },
      fecha_cierre: { type: DataTypes.DATEONLY, allowNull: true },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Usuarios', key: 'id_usuario' }
      },
      modifiedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Usuarios', key: 'id_usuario' }
      },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await addIndexSafe('Proyectos', ['id_pm'], { name: 'idx_proyectos_id_pm' });
    await addIndexSafe('Proyectos', ['id_proveedor'], { name: 'idx_proyectos_id_proveedor' });
    await addIndexSafe('Proyectos', ['id_sede'], { name: 'idx_proyectos_id_sede' });
    await addIndexSafe('Proyectos', ['id_sponsor'], { name: 'idx_proyectos_id_sponsor' });
    await addIndexSafe('Proyectos', ['id_estado'], { name: 'idx_proyectos_id_estado' });
    await addIndexSafe('Proyectos', ['portfolio_id'], { name: 'idx_proyectos_portfolio_id' });

    // 9. Incidencias
    await queryInterface.createTable('Incidencias', {
      id_incidencia: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
      id_proyecto: {
        type: DataTypes.STRING,
        allowNull: false,
        references: { model: 'Proyectos', key: 'id_proyecto' },
        onDelete: 'CASCADE'
      },
      titulo: { type: DataTypes.STRING, allowNull: false },
      descripcion: { type: DataTypes.TEXT, allowNull: false },
      tipo_incidencias: {
        type: DataTypes.ENUM('TECNICA', 'RETRASO_PLAZOS', 'PROVEEDOR_DESAPARECIDO', 'PRESUPUESTARIA'),
        allowNull: false
      },
      criticidad: {
        type: DataTypes.ENUM('BLOQUEANTE', 'ALTA', 'MEDIA', 'BAJA'),
        allowNull: false
      },
      estado: {
        type: DataTypes.ENUM('ABIERTA', 'EN_PROCESO', 'RESUELTA', 'CANCELADA'),
        allowNull: false,
        defaultValue: 'ABIERTA'
      },
      fecha_apertura: { type: DataTypes.DATEONLY, allowNull: false },
      fecha_cierre: { type: DataTypes.DATEONLY, allowNull: true },
      solucion_aplicada: { type: DataTypes.TEXT, allowNull: true },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Usuarios', key: 'id_usuario' }
      },
      modifiedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Usuarios', key: 'id_usuario' }
      },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await addIndexSafe('Incidencias', ['id_proyecto'], { name: 'idx_incidencias_id_proyecto' });

    // 10. Riesgos
    await queryInterface.createTable('Riesgos', {
      id_riesgo: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
      id_proyecto: {
        type: DataTypes.STRING,
        allowNull: false,
        references: { model: 'Proyectos', key: 'id_proyecto' },
        onDelete: 'CASCADE'
      },
      titulo_riesgo: { type: DataTypes.STRING, allowNull: false },
      descripcion: { type: DataTypes.TEXT, allowNull: true },
      probabilidad: { type: DataTypes.ENUM('ALTA', 'MEDIA', 'BAJA'), allowNull: false },
      impacto: { type: DataTypes.ENUM('ALTA', 'MEDIA', 'BAJA'), allowNull: false },
      plan_mitigacion: { type: DataTypes.TEXT, allowNull: false },
      estado_riesgo: { type: DataTypes.ENUM('ACTIVO', 'CERRADO'), allowNull: false, defaultValue: 'ACTIVO' },
      fecha_proxima_revision: { type: DataTypes.DATEONLY, allowNull: false },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Usuarios', key: 'id_usuario' }
      },
      modifiedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Usuarios', key: 'id_usuario' }
      },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await addIndexSafe('Riesgos', ['id_proyecto'], { name: 'idx_riesgos_id_proyecto' });

    // 11. Lecciones_Aprendidas
    await queryInterface.createTable('Lecciones_Aprendidas', {
      id_leccion: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
      tipo_leccion: {
        type: DataTypes.ENUM('BUENA_PRACTICA', 'ERROR_A_EVITAR'),
        allowNull: false,
        defaultValue: 'BUENA_PRACTICA'
      },
      id_proyecto: {
        type: DataTypes.STRING,
        allowNull: true,
        references: { model: 'Proyectos', key: 'id_proyecto' },
        onDelete: 'SET NULL'
      },
      id_proveedor: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Proveedores', key: 'id_proveedor' },
        onDelete: 'SET NULL'
      },
      titulo: { type: DataTypes.STRING, allowNull: false },
      contexto: { type: DataTypes.TEXT, allowNull: true },
      recomendacion_futura: { type: DataTypes.TEXT, allowNull: true },
      fecha_registro: { type: DataTypes.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await addIndexSafe('Lecciones_Aprendidas', ['id_proyecto'], { name: 'idx_lecciones_id_proyecto' });
    await addIndexSafe('Lecciones_Aprendidas', ['id_proveedor'], { name: 'idx_lecciones_id_proveedor' });

    // 12. Facturas
    await queryInterface.createTable('Facturas', {
      id_interno_factura: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
      id_proyecto: {
        type: DataTypes.STRING,
        allowNull: false,
        references: { model: 'Proyectos', key: 'id_proyecto' },
        onDelete: 'CASCADE'
      },
      id_proveedor: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Proveedores', key: 'id_proveedor' }
      },
      numero_factura: { type: DataTypes.STRING, allowNull: true },
      concepto: { type: DataTypes.TEXT, allowNull: false },
      fecha_factura: { type: DataTypes.DATEONLY, allowNull: false },
      importe: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
      estado: { type: DataTypes.ENUM('PENDIENTE_DE_RECIBIR', 'RECIBIDA'), allowNull: false },
      PO: { type: DataTypes.STRING, allowNull: true },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Usuarios', key: 'id_usuario' }
      },
      modifiedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Usuarios', key: 'id_usuario' }
      },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await addIndexSafe('Facturas', ['id_proyecto'], { name: 'idx_facturas_id_proyecto' });
    await addIndexSafe('Facturas', ['id_proveedor'], { name: 'idx_facturas_id_proveedor' });

    // 13. Cambios_Alcances
    await queryInterface.createTable('Cambios_Alcances', {
      id_cambio: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
      id_proyecto: {
        type: DataTypes.STRING,
        allowNull: false,
        references: { model: 'Proyectos', key: 'id_proyecto' },
        onDelete: 'CASCADE'
      },
      fecha_solicitud: { type: DataTypes.DATEONLY, allowNull: false },
      fecha_resolucion: { type: DataTypes.DATEONLY, allowNull: true },
      id_solicitante_contacto: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Contactos_Proveedors', key: 'id_contacto' }
      },
      id_aprobador_contacto: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Contactos_Proveedors', key: 'id_contacto' }
      },
      estado_cambio: {
        type: DataTypes.ENUM('SOLICITADO', 'APROBADO', 'RECHAZADO'),
        allowNull: false,
        defaultValue: 'SOLICITADO'
      },
      descripcion_motivo: { type: DataTypes.TEXT, allowNull: false },
      impacta_importe: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      importe_impacto: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0.00 },
      impacta_tiempo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      dias_impacto: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Usuarios', key: 'id_usuario' }
      },
      modifiedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Usuarios', key: 'id_usuario' }
      },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await addIndexSafe('Cambios_Alcances', ['id_proyecto'], { name: 'idx_cambios_id_proyecto' });
    await addIndexSafe('Cambios_Alcances', ['id_solicitante_contacto'], { name: 'idx_cambios_id_solicitante' });
    await addIndexSafe('Cambios_Alcances', ['id_aprobador_contacto'], { name: 'idx_cambios_id_aprobador' });

    // 14. Tareas
    await queryInterface.createTable('Tareas', {
      id_tarea: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      id_proyecto: {
        type: DataTypes.STRING,
        allowNull: false,
        references: { model: 'Proyectos', key: 'id_proyecto' },
        onDelete: 'CASCADE'
      },
      titulo_tarea: { type: DataTypes.STRING, allowNull: false },
      descripcion: { type: DataTypes.TEXT, allowNull: true },
      es_hito: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      estado: { type: DataTypes.ENUM('PENDIENTE', 'COMPLETADA'), allowNull: false, defaultValue: 'PENDIENTE' },
      fecha_limite: { type: DataTypes.DATEONLY, allowNull: false },
      fecha_original_cierre: { type: DataTypes.DATEONLY, allowNull: true },
      fecha_actual_cierre: { type: DataTypes.DATEONLY, allowNull: true },
      fecha_real_cierre: { type: DataTypes.DATEONLY, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await addIndexSafe('Tareas', ['id_proyecto'], { name: 'idx_tareas_id_proyecto' });

    // 15. Comentarios_Proyectos
    await queryInterface.createTable('Comentarios_Proyectos', {
      id_comentario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      id_proyecto: {
        type: DataTypes.STRING,
        allowNull: false,
        references: { model: 'Proyectos', key: 'id_proyecto' },
        onDelete: 'CASCADE'
      },
      id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Usuarios', key: 'id_usuario' }
      },
      texto_comentario: { type: DataTypes.TEXT, allowNull: false },
      es_importante: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      para_direccion: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      fecha_registro: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      editado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      id_usuario_modificacion: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Usuarios', key: 'id_usuario' }
      },
      fecha_modificacion: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await addIndexSafe('Comentarios_Proyectos', ['id_proyecto'], { name: 'idx_comentarios_id_proyecto' });
    await addIndexSafe('Comentarios_Proyectos', ['id_usuario'], { name: 'idx_comentarios_id_usuario' });
    await addIndexSafe('Comentarios_Proyectos', ['id_usuario_modificacion'], { name: 'idx_comentarios_id_usuario_mod' });

    // ==========================================
    // TABLAS DE UNIÓN (MANY TO MANY)
    // ==========================================

    // 16. Proyecto_Contactos
    await queryInterface.createTable('Proyecto_Contactos', {
      id_proyecto: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        references: { model: 'Proyectos', key: 'id_proyecto' },
        onDelete: 'CASCADE'
      },
      id_contacto: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'Contactos_Proveedors', key: 'id_contacto' },
        onDelete: 'CASCADE'
      },
      rol: { type: DataTypes.STRING, allowNull: true, defaultValue: 'Usuario funcional' },
      raci: { type: DataTypes.STRING, allowNull: true, defaultValue: 'I' }
    });
    await addIndexSafe('Proyecto_Contactos', ['id_contacto'], { name: 'idx_proyecto_contactos_contacto' });

    // 17. Proyecto_ComSemanal_Contacto
    await queryInterface.createTable('Proyecto_ComSemanal_Contacto', {
      id_proyecto: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        references: { model: 'Proyectos', key: 'id_proyecto' },
        onDelete: 'CASCADE'
      },
      id_contacto: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'Contactos_Proveedors', key: 'id_contacto' },
        onDelete: 'CASCADE'
      }
    });
    await addIndexSafe('Proyecto_ComSemanal_Contacto', ['id_contacto'], { name: 'idx_proj_comsem_contacto' });

    // 18. Proyecto_ComMensual_Contacto
    await queryInterface.createTable('Proyecto_ComMensual_Contacto', {
      id_proyecto: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        references: { model: 'Proyectos', key: 'id_proyecto' },
        onDelete: 'CASCADE'
      },
      id_contacto: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'Contactos_Proveedors', key: 'id_contacto' },
        onDelete: 'CASCADE'
      }
    });
    await addIndexSafe('Proyecto_ComMensual_Contacto', ['id_contacto'], { name: 'idx_proj_commens_contacto' });

    // 19. Proyecto_SteerCo_Contacto
    await queryInterface.createTable('Proyecto_SteerCo_Contacto', {
      id_proyecto: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        references: { model: 'Proyectos', key: 'id_proyecto' },
        onDelete: 'CASCADE'
      },
      id_contacto: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'Contactos_Proveedors', key: 'id_contacto' },
        onDelete: 'CASCADE'
      }
    });
    await addIndexSafe('Proyecto_SteerCo_Contacto', ['id_contacto'], { name: 'idx_proj_steerco_contacto' });

    // 20. Proyecto_Tags
    await queryInterface.createTable('Proyecto_Tags', {
      proyecto_id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        references: { model: 'Proyectos', key: 'id_proyecto' },
        onDelete: 'CASCADE'
      },
      tag_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'Tags', key: 'id' },
        onDelete: 'CASCADE'
      },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });
    await addIndexSafe('Proyecto_Tags', ['tag_id'], { name: 'idx_proyecto_tags_tag' });
  },

  down: async (queryInterface, Sequelize) => {
    const schema = queryInterface.sequelize.options.define.schema || 'dbo';
    const originalDropTable = queryInterface.dropTable.bind(queryInterface);

    // Envolver dropTable para inyectar esquema
    queryInterface.dropTable = async (tableName, options) => {
      return originalDropTable({ tableName, schema }, options);
    };

    // Eliminar todas las tablas en orden inverso de claves foráneas
    await queryInterface.dropTable('Proyecto_Tags');
    await queryInterface.dropTable('Proyecto_SteerCo_Contacto');
    await queryInterface.dropTable('Proyecto_ComMensual_Contacto');
    await queryInterface.dropTable('Proyecto_ComSemanal_Contacto');
    await queryInterface.dropTable('Proyecto_Contactos');
    await queryInterface.dropTable('Comentarios_Proyectos');
    await queryInterface.dropTable('Tareas');
    await queryInterface.dropTable('Cambios_Alcances');
    await queryInterface.dropTable('Facturas');
    await queryInterface.dropTable('Lecciones_Aprendidas');
    await queryInterface.dropTable('Riesgos');
    await queryInterface.dropTable('Incidencias');
    await queryInterface.dropTable('Proyectos');
    await queryInterface.dropTable('Tags');
    await queryInterface.dropTable('Portfolios');
    await queryInterface.dropTable('Estados_Proyecto');
    await queryInterface.dropTable('Usuarios');
    await queryInterface.dropTable('Contactos_Proveedors');
    await queryInterface.dropTable('Proveedores');
    await queryInterface.dropTable('Sedes');
  }
};
