const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

// 1. Sedes Model
const Sedes = sequelize.define('Sedes', {
  id_sede: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_sede: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
});

// 2. Proveedores Model
const Proveedores = sequelize.define('Proveedores', {
  id_proveedor: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_razon_social: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  telefono_general: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email_general: {
    type: DataTypes.STRING,
    allowNull: true
  },
  es_grupo_dacsa: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
});

// 3. ContactosProveedor Model
const ContactosProveedor = sequelize.define('Contactos_Proveedor', {
  id_contacto: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_proveedor: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Proveedores,
      key: 'id_proveedor'
    },
    onDelete: 'CASCADE'
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  apellidos: {
    type: DataTypes.STRING,
    allowNull: false
  },
  puesto: {
    type: DataTypes.STRING,
    allowNull: false
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  indexes: [
    { name: 'idx_contactos_prov_id_proveedor', fields: ['id_proveedor'] }
  ]
});

// 4. Usuarios Model (Internal staff PMs - supports profile switcher & future Entra ID)
const Usuarios = sequelize.define('Usuarios', {
  id_usuario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  apellidos: {
    type: DataTypes.STRING,
    allowNull: false
  },
  correo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password_salt: {
    type: DataTypes.STRING,
    allowNull: true
  },
  perfil: {
    type: DataTypes.ENUM('ADMINISTRADOR', 'PM', 'DIRECTOR'),
    allowNull: false,
    defaultValue: 'PM'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  defaultScope: {
    attributes: { exclude: ['password', 'password_salt'] }
  },
  scopes: {
    withPassword: {
      attributes: {}
    }
  }
});

// 4.5 EstadosProyecto Model (Centraliza los estados del workflow del portfolio)
const EstadosProyecto = sequelize.define('Estados_Proyecto', {
  id_estado: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_estado: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  pasos: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  icono: {
    type: DataTypes.STRING,
    allowNull: true
  },
  orden: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  proyecto_cerrado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  timestamps: false
});

// 4.6 Portfolios Model
const Portfolios = sequelize.define('Portfolios', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

// 4.7 Tags Model
const Tags = sequelize.define('Tags', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
});

// 5. [Eliminado] KeyUsers model fue reemplazado por ContactosProveedor

// 6. Proyectos Model
const Proyectos = sequelize.define('Proyectos', {
  id_proyecto: {
    type: DataTypes.STRING,
    primaryKey: true, // Custom format: PRJ-YYYY-XXX
    allowNull: false
  },
  nombre_proyecto: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  id_pm: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Usuarios,
      key: 'id_usuario'
    }
  },
  id_proveedor: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Proveedores,
      key: 'id_proveedor'
    }
  },
  id_sede: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Sedes,
      key: 'id_sede'
    }
  },
  id_sponsor: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: ContactosProveedor,
      key: 'id_contacto'
    }
  },
  id_estado: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Estados_Proyecto',
      key: 'id_estado'
    }
  },
  portfolio_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Portfolios',
      key: 'id'
    }
  },
  estado_proyecto: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.Estado ? this.Estado.nombre_estado : null;
    }
  },
  indicador_rag: {
    type: DataTypes.ENUM('VERDE', 'AMARILLO', 'ROJO'),
    allowNull: false,
    defaultValue: 'VERDE'
  },
  fecha_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  fecha_fin_inicial: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  es_capex: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  codigo_capex: {
    type: DataTypes.STRING,
    allowNull: true
  },
  es_estrategico: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  budget_inicial: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  // Weekly Communication Plan
  com_semanal_activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  com_semanal_finalidad: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Monthly Communication Plan
  com_mensual_activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  com_mensual_finalidad: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // SteerCo Communication Plan
  com_steerco_activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  com_steerco_finalidad: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Scope (Alcance) Columns
  alcance_por_que: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  alcance_objetivo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  alcance_resultados: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  alcance_limitaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  alcance_integraciones: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  alcance_desarrollo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Closing Criteria (Cierre) Columns
  cierre_aceptacion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cierre_exito: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fecha_peticion: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  fecha_alcance_definido: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  fecha_aprobacion: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  fecha_planificacion: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  fecha_kickoff: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  fecha_go_live: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  fecha_cierre: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Usuarios,
      key: 'id_usuario'
    }
  },
  modifiedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Usuarios,
      key: 'id_usuario'
    }
  }
}, {
  indexes: [
    { name: 'idx_proyectos_id_pm', fields: ['id_pm'] },
    { name: 'idx_proyectos_id_proveedor', fields: ['id_proveedor'] },
    { name: 'idx_proyectos_id_sede', fields: ['id_sede'] },
    { name: 'idx_proyectos_id_sponsor', fields: ['id_sponsor'] },
    { name: 'idx_proyectos_id_estado', fields: ['id_estado'] },
    { name: 'idx_proyectos_portfolio_id', fields: ['portfolio_id'] }
  ]
});

// Join tables for Many-to-Many// Association tables
const ProyectoContactos = sequelize.define('Proyecto_Contactos', {
  id_proyecto: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  },
  id_contacto: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  rol: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Usuario funcional'
  },
  raci: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'I'
  }
}, { 
  timestamps: false,
  indexes: [
    { name: 'idx_proyecto_contactos_contacto', fields: ['id_contacto'] }
  ]
});

const ProyectoComSemanalContacto = sequelize.define('Proyecto_ComSemanal_Contacto', {
  id_proyecto: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  },
  id_contacto: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  }
}, { 
  timestamps: false,
  indexes: [
    { name: 'idx_proj_comsem_contacto', fields: ['id_contacto'] }
  ]
});

const ProyectoComMensualContacto = sequelize.define('Proyecto_ComMensual_Contacto', {
  id_proyecto: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  },
  id_contacto: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  }
}, { 
  timestamps: false,
  indexes: [
    { name: 'idx_proj_commens_contacto', fields: ['id_contacto'] }
  ]
});

const ProyectoComSteerCoContacto = sequelize.define('Proyecto_SteerCo_Contacto', {
  id_proyecto: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  },
  id_contacto: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  }
}, { 
  timestamps: false,
  indexes: [
    { name: 'idx_proj_steerco_contacto', fields: ['id_contacto'] }
  ]
});

const ProyectoTags = sequelize.define('Proyecto_Tags', {
  proyecto_id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  },
  tag_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  }
}, {
  timestamps: false,
  tableName: 'Proyecto_Tags',
  indexes: [
    { name: 'idx_proyecto_tags_tag', fields: ['tag_id'] }
  ]
});

// 7. Incidencias Model
const Incidencias = sequelize.define('Incidencias', {
  id_incidencia: {
    type: DataTypes.STRING, // Format: INC-YYYY-XXX
    primaryKey: true,
    allowNull: false
  },
  id_proyecto: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Proyectos,
      key: 'id_proyecto'
    },
    onDelete: 'CASCADE'
  },
  titulo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false
  },
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
  fecha_apertura: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  fecha_cierre: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  solucion_aplicada: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Usuarios,
      key: 'id_usuario'
    }
  },
  modifiedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Usuarios,
      key: 'id_usuario'
    }
  }
}, {
  validate: {
    requiredSolutionOnResolved() {
      if (this.estado === 'RESUELTA' && (!this.solucion_aplicada || this.solucion_aplicada.trim() === '')) {
        throw new Error('La solución aplicada es obligatoria cuando la incidencia está RESUELTA.');
      }
    }
  },
  indexes: [
    { name: 'idx_incidencias_id_proyecto', fields: ['id_proyecto'] }
  ]
});

// 8. Riesgos Model
const Riesgos = sequelize.define('Riesgos', {
  id_riesgo: {
    type: DataTypes.STRING, // Format: RSG-YYYY-XXX
    primaryKey: true,
    allowNull: false
  },
  id_proyecto: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Proyectos,
      key: 'id_proyecto'
    },
    onDelete: 'CASCADE'
  },
  titulo_riesgo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  probabilidad: {
    type: DataTypes.ENUM('ALTA', 'MEDIA', 'BAJA'),
    allowNull: false
  },
  impacto: {
    type: DataTypes.ENUM('ALTA', 'MEDIA', 'BAJA'),
    allowNull: false
  },
  plan_mitigacion: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  estado_riesgo: {
    type: DataTypes.ENUM('ACTIVO', 'CERRADO'),
    allowNull: false,
    defaultValue: 'ACTIVO'
  },
  fecha_proxima_revision: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Usuarios,
      key: 'id_usuario'
    }
  },
  modifiedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Usuarios,
      key: 'id_usuario'
    }
  }
}, {
  indexes: [
    { name: 'idx_riesgos_id_proyecto', fields: ['id_proyecto'] }
  ]
});

// 9. LeccionesAprendidas Model (Knowledge Base)
const LeccionesAprendidas = sequelize.define('Lecciones_Aprendidas', {
  id_leccion: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  tipo_leccion: {
    type: DataTypes.ENUM('BUENA_PRACTICA', 'ERROR_A_EVITAR'),
    allowNull: false,
    defaultValue: 'BUENA_PRACTICA'
  },
  id_proyecto: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: Proyectos,
      key: 'id_proyecto'
    },
    onDelete: 'SET NULL'
  },
  id_proveedor: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Proveedores,
      key: 'id_proveedor'
    },
    onDelete: 'SET NULL'
  },
  titulo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contexto: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  recomendacion_futura: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fecha_registro: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  indexes: [
    { name: 'idx_lecciones_id_proyecto', fields: ['id_proyecto'] },
    { name: 'idx_lecciones_id_proveedor', fields: ['id_proveedor'] }
  ]
});


// 10. Facturas Model
const Facturas = sequelize.define('Facturas', {
  id_interno_factura: {
    type: DataTypes.STRING, // Format: FAC-YYYY-XXX
    primaryKey: true,
    allowNull: false
  },
  id_proyecto: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Proyectos,
      key: 'id_proyecto'
    },
    onDelete: 'CASCADE'
  },
  id_proveedor: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Proveedores,
      key: 'id_proveedor'
    }
  },
  numero_factura: {
    type: DataTypes.STRING,
    allowNull: true
  },
  concepto: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  fecha_factura: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  importe: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM('PENDIENTE_DE_RECIBIR', 'RECIBIDA'),
    allowNull: false
  },
  PO: {
    type: DataTypes.STRING,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Usuarios,
      key: 'id_usuario'
    }
  },
  modifiedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Usuarios,
      key: 'id_usuario'
    }
  }
}, {
  indexes: [
    { name: 'idx_facturas_id_proyecto', fields: ['id_proyecto'] },
    { name: 'idx_facturas_id_proveedor', fields: ['id_proveedor'] }
  ]
});

// 11. CambiosAlcance Model
const CambiosAlcance = sequelize.define('Cambios_Alcance', {
  id_cambio: {
    type: DataTypes.STRING, // Format: CR-YYYY-XXX
    primaryKey: true,
    allowNull: false
  },
  id_proyecto: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Proyectos,
      key: 'id_proyecto'
    },
    onDelete: 'CASCADE'
  },
  fecha_solicitud: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  fecha_resolucion: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  id_solicitante_contacto: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: ContactosProveedor,
      key: 'id_contacto'
    }
  },
  id_aprobador_contacto: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: ContactosProveedor,
      key: 'id_contacto'
    }
  },
  estado_cambio: {
    type: DataTypes.ENUM('SOLICITADO', 'APROBADO', 'RECHAZADO'),
    allowNull: false,
    defaultValue: 'SOLICITADO'
  },
  descripcion_motivo: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  impacta_importe: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  importe_impacto: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  impacta_tiempo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  dias_impacto: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Usuarios,
      key: 'id_usuario'
    }
  },
  modifiedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Usuarios,
      key: 'id_usuario'
    }
  }
}, {
  indexes: [
    { name: 'idx_cambios_id_proyecto', fields: ['id_proyecto'] },
    { name: 'idx_cambios_id_solicitante', fields: ['id_solicitante_contacto'] },
    { name: 'idx_cambios_id_aprobador', fields: ['id_aprobador_contacto'] }
  ]
});

// 12. Tareas Model
const Tareas = sequelize.define('Tareas', {
  id_tarea: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_proyecto: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Proyectos,
      key: 'id_proyecto'
    },
    onDelete: 'CASCADE'
  },
  titulo_tarea: {
    type: DataTypes.STRING,
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  es_hito: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  estado: {
    type: DataTypes.ENUM('PENDIENTE', 'COMPLETADA'),
    allowNull: false,
    defaultValue: 'PENDIENTE'
  },
  fecha_limite: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  fecha_original_cierre: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  fecha_actual_cierre: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  fecha_real_cierre: {
    type: DataTypes.DATEONLY,
    allowNull: true
  }
}, {
  indexes: [
    { name: 'idx_tareas_id_proyecto', fields: ['id_proyecto'] }
  ]
});

// 13. ComentariosProyecto Model
const ComentariosProyecto = sequelize.define('Comentarios_Proyecto', {
  id_comentario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_proyecto: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'Proyectos',
      key: 'id_proyecto'
    },
    onDelete: 'CASCADE'
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Usuarios',
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
  para_direccion: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  fecha_registro: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
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
      model: 'Usuarios',
      key: 'id_usuario'
    }
  },
  fecha_modificacion: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  indexes: [
    { name: 'idx_comentarios_id_proyecto', fields: ['id_proyecto'] },
    { name: 'idx_comentarios_id_usuario', fields: ['id_usuario'] },
    { name: 'idx_comentarios_id_usuario_mod', fields: ['id_usuario_modificacion'] }
  ]
});

// Set up Associations
// Proveedor has many Contacts
Proveedores.hasMany(ContactosProveedor, { foreignKey: 'id_proveedor', onDelete: 'CASCADE' });
ContactosProveedor.belongsTo(Proveedores, { foreignKey: 'id_proveedor' });

// PM/Usuario has many Projects
Usuarios.hasMany(Proyectos, { foreignKey: 'id_pm' });
Proyectos.belongsTo(Usuarios, { foreignKey: 'id_pm', as: 'PM' });

// Proveedor has many Projects
Proveedores.hasMany(Proyectos, { foreignKey: 'id_proveedor' });
Proyectos.belongsTo(Proveedores, { foreignKey: 'id_proveedor', as: 'Proveedor' });

// Sede has many Projects
Sedes.hasMany(Proyectos, { foreignKey: 'id_sede' });
Proyectos.belongsTo(Sedes, { foreignKey: 'id_sede', as: 'Sede' });

// Sponsor Contact has many Projects
ContactosProveedor.hasMany(Proyectos, { foreignKey: 'id_sponsor' });
Proyectos.belongsTo(ContactosProveedor, { foreignKey: 'id_sponsor', as: 'Sponsor' });

// Many-to-Many involved Contacts
Proyectos.belongsToMany(ContactosProveedor, { through: ProyectoContactos, foreignKey: 'id_proyecto', as: 'InvolvedContacts' });
ContactosProveedor.belongsToMany(Proyectos, { through: ProyectoContactos, foreignKey: 'id_contacto' });

// Many-to-Many for Weekly Communication
Proyectos.belongsToMany(ContactosProveedor, { through: ProyectoComSemanalContacto, foreignKey: 'id_proyecto', as: 'ComSemanalContactos' });
ContactosProveedor.belongsToMany(Proyectos, { through: ProyectoComSemanalContacto, foreignKey: 'id_contacto' });

// Many-to-Many for Monthly Communication
Proyectos.belongsToMany(ContactosProveedor, { through: ProyectoComMensualContacto, foreignKey: 'id_proyecto', as: 'ComMensualContactos' });
ContactosProveedor.belongsToMany(Proyectos, { through: ProyectoComMensualContacto, foreignKey: 'id_contacto' });

// Many-to-Many for SteerCo Communication
Proyectos.belongsToMany(ContactosProveedor, { through: ProyectoComSteerCoContacto, foreignKey: 'id_proyecto', as: 'ComSteerCoContactos' });
ContactosProveedor.belongsToMany(Proyectos, { through: ProyectoComSteerCoContacto, foreignKey: 'id_contacto' });

// Project has many Incidencias
Proyectos.hasMany(Incidencias, { foreignKey: 'id_proyecto', onDelete: 'CASCADE' });
Incidencias.belongsTo(Proyectos, { foreignKey: 'id_proyecto' });

// Project has many Risks
Proyectos.hasMany(Riesgos, { foreignKey: 'id_proyecto', onDelete: 'CASCADE' });
Riesgos.belongsTo(Proyectos, { foreignKey: 'id_proyecto' });

// Project has many LeccionesAprendidas
Proyectos.hasMany(LeccionesAprendidas, { foreignKey: 'id_proyecto', onDelete: 'SET NULL' });
LeccionesAprendidas.belongsTo(Proyectos, { foreignKey: 'id_proyecto', as: 'Proyecto' });

// Vendor has many LeccionesAprendidas
Proveedores.hasMany(LeccionesAprendidas, { foreignKey: 'id_proveedor', onDelete: 'SET NULL' });
LeccionesAprendidas.belongsTo(Proveedores, { foreignKey: 'id_proveedor', as: 'Proveedore' });


// Project has many Facturas
Proyectos.hasMany(Facturas, { foreignKey: 'id_proyecto', onDelete: 'CASCADE' });
Facturas.belongsTo(Proyectos, { foreignKey: 'id_proyecto' });

// Vendor has many Facturas
Proveedores.hasMany(Facturas, { foreignKey: 'id_proveedor' });
Facturas.belongsTo(Proveedores, { foreignKey: 'id_proveedor' });

// Project has many CambiosAlcance
Proyectos.hasMany(CambiosAlcance, { foreignKey: 'id_proyecto', onDelete: 'CASCADE' });
CambiosAlcance.belongsTo(Proyectos, { foreignKey: 'id_proyecto' });

// Contacts link to CambiosAlcance
ContactosProveedor.hasMany(CambiosAlcance, { foreignKey: 'id_solicitante_contacto' });
CambiosAlcance.belongsTo(ContactosProveedor, { foreignKey: 'id_solicitante_contacto', as: 'Solicitante' });

ContactosProveedor.hasMany(CambiosAlcance, { foreignKey: 'id_aprobador_contacto' });
CambiosAlcance.belongsTo(ContactosProveedor, { foreignKey: 'id_aprobador_contacto', as: 'Aprobador' });

// Project has many Tareas
Proyectos.hasMany(Tareas, { foreignKey: 'id_proyecto', onDelete: 'CASCADE' });
Tareas.belongsTo(Proyectos, { foreignKey: 'id_proyecto' });

// EstadosProyecto has many Proyectos
EstadosProyecto.hasMany(Proyectos, { foreignKey: 'id_estado', as: 'Proyectos' });
Proyectos.belongsTo(EstadosProyecto, { foreignKey: 'id_estado', as: 'Estado' });

// Project has many ComentariosProyecto
Proyectos.hasMany(ComentariosProyecto, { foreignKey: 'id_proyecto', onDelete: 'CASCADE' });
ComentariosProyecto.belongsTo(Proyectos, { foreignKey: 'id_proyecto' });

// Usuario has many ComentariosProyecto (Autor)
Usuarios.hasMany(ComentariosProyecto, { foreignKey: 'id_usuario' });
ComentariosProyecto.belongsTo(Usuarios, { foreignKey: 'id_usuario', as: 'Autor' });

// Usuario has many ComentariosProyecto (Editor)
Usuarios.hasMany(ComentariosProyecto, { foreignKey: 'id_usuario_modificacion' });
ComentariosProyecto.belongsTo(Usuarios, { foreignKey: 'id_usuario_modificacion', as: 'Editor' });

// Portfolios associations
Portfolios.hasMany(Proyectos, { foreignKey: 'portfolio_id', as: 'Proyectos' });
Proyectos.belongsTo(Portfolios, { foreignKey: 'portfolio_id', as: 'Portfolio' });

// Tags associations (Many-to-Many)
Proyectos.belongsToMany(Tags, { through: ProyectoTags, foreignKey: 'proyecto_id', otherKey: 'tag_id', as: 'Tags' });
Tags.belongsToMany(Proyectos, { through: ProyectoTags, foreignKey: 'tag_id', otherKey: 'proyecto_id', as: 'Proyectos' });

// Audit associations
[Proyectos, Facturas, Riesgos, Incidencias, CambiosAlcance].forEach(Model => {
  Model.belongsTo(Usuarios, { foreignKey: 'createdBy', as: 'Creator' });
  Model.belongsTo(Usuarios, { foreignKey: 'modifiedBy', as: 'Modifier' });
});

module.exports = {
  sequelize,
  Sedes,
  Proveedores,
  ContactosProveedor,
  Usuarios,
  EstadosProyecto,
  Proyectos,
  ProyectoContactos,
  ProyectoComSemanalContacto,
  ProyectoComMensualContacto,
  ProyectoComSteerCoContacto,
  Incidencias,
  Riesgos,
  LeccionesAprendidas,
  Facturas,
  CambiosAlcance,
  Tareas,
  EstadosProyecto,
  ComentariosProyecto,
  Portfolios,
  Tags,
  ProyectoTags
};
