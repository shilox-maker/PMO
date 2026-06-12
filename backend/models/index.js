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

// 5. KeyUsers Model
const KeyUsers = sequelize.define('Key_Users', {
  id_ku: {
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
  id_proveedor_empresa: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Proveedores,
      key: 'id_proveedor'
    }
  }
});

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
    allowNull: false,
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
  id_sponsor_ku: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: KeyUsers,
      key: 'id_ku'
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
    allowNull: false
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
  budget_inicial: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
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
  }
});

// Join tables for Many-to-Many relationships
const ProyectoKeyUsers = sequelize.define('Proyecto_KeyUsers', {}, { timestamps: false });
const ProyectoComSemanalKU = sequelize.define('Proyecto_ComSemanal_KU', {}, { timestamps: false });
const ProyectoComMensualKU = sequelize.define('Proyecto_ComMensual_KU', {}, { timestamps: false });
const ProyectoComSteerCoKU = sequelize.define('Proyecto_SteerCo_KU', {}, { timestamps: false });

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
  }
}, {
  validate: {
    requiredSolutionOnResolved() {
      if (this.estado === 'RESUELTA' && (!this.solucion_aplicada || this.solucion_aplicada.trim() === '')) {
        throw new Error('La solución aplicada es obligatoria cuando la incidencia está RESUELTA.');
      }
    }
  }
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
    allowNull: false
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
    type: DataTypes.ENUM('ACTIVO', 'MITIGADO', 'CERRADO'),
    allowNull: false,
    defaultValue: 'ACTIVO'
  },
  fecha_proxima_revision: {
    type: DataTypes.DATEONLY,
    allowNull: false
  }
});

// 9. LeccionesAprendidas Model (Knowledge Base)
const LeccionesAprendidas = sequelize.define('Lecciones_Aprendidas', {
  id_leccion: {
    type: DataTypes.STRING, // Format: LEA-YYYY-XXX
    primaryKey: true,
    allowNull: false
  },
  tipo_leccion: {
    type: DataTypes.ENUM('BUENA_PRACTICA', 'ERROR_A_EVITAR'),
    allowNull: false
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
    allowNull: false
  },
  recomendacion_futura: {
    type: DataTypes.TEXT,
    allowNull: false
  }
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
    allowNull: false,
    references: {
      model: Proveedores,
      key: 'id_proveedor'
    }
  },
  numero_factura: {
    type: DataTypes.STRING,
    allowNull: false
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
    type: DataTypes.ENUM('PENDIENTE_DE_RECIBIR', 'PAGADA'),
    allowNull: false
  },
  PO: {
    type: DataTypes.STRING,
    allowNull: true
  }
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
  id_solicitante_ku: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: KeyUsers,
      key: 'id_ku'
    }
  },
  id_aprobador_ku: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: KeyUsers,
      key: 'id_ku'
    }
  },
  estado_cambio: {
    type: DataTypes.ENUM('SOLICITADO', 'EN_REVISION', 'APROBADO', 'RECHAZADO'),
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
  }
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
  }
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
});

// Set up Associations
// Proveedor has many Contacts
Proveedores.hasMany(ContactosProveedor, { foreignKey: 'id_proveedor', onDelete: 'CASCADE' });
ContactosProveedor.belongsTo(Proveedores, { foreignKey: 'id_proveedor' });

// Proveedor has many KeyUsers
Proveedores.hasMany(KeyUsers, { foreignKey: 'id_proveedor_empresa' });
KeyUsers.belongsTo(Proveedores, { foreignKey: 'id_proveedor_empresa' });

// PM/Usuario has many Projects
Usuarios.hasMany(Proyectos, { foreignKey: 'id_pm' });
Proyectos.belongsTo(Usuarios, { foreignKey: 'id_pm', as: 'PM' });

// Proveedor has many Projects
Proveedores.hasMany(Proyectos, { foreignKey: 'id_proveedor' });
Proyectos.belongsTo(Proveedores, { foreignKey: 'id_proveedor', as: 'Proveedor' });

// Sede has many Projects
Sedes.hasMany(Proyectos, { foreignKey: 'id_sede' });
Proyectos.belongsTo(Sedes, { foreignKey: 'id_sede', as: 'Sede' });

// KeyUser Sponsor has many Projects
KeyUsers.hasMany(Proyectos, { foreignKey: 'id_sponsor_ku' });
Proyectos.belongsTo(KeyUsers, { foreignKey: 'id_sponsor_ku', as: 'Sponsor' });

// Many-to-Many involved Key Users
Proyectos.belongsToMany(KeyUsers, { through: ProyectoKeyUsers, foreignKey: 'id_proyecto', as: 'InvolvedKeyUsers' });
KeyUsers.belongsToMany(Proyectos, { through: ProyectoKeyUsers, foreignKey: 'id_ku' });

// Many-to-Many for Weekly Communication
Proyectos.belongsToMany(KeyUsers, { through: ProyectoComSemanalKU, foreignKey: 'id_proyecto', as: 'ComSemanalKUs' });
KeyUsers.belongsToMany(Proyectos, { through: ProyectoComSemanalKU, foreignKey: 'id_ku' });

// Many-to-Many for Monthly Communication
Proyectos.belongsToMany(KeyUsers, { through: ProyectoComMensualKU, foreignKey: 'id_proyecto', as: 'ComMensualKUs' });
KeyUsers.belongsToMany(Proyectos, { through: ProyectoComMensualKU, foreignKey: 'id_ku' });

// Many-to-Many for SteerCo Communication
Proyectos.belongsToMany(KeyUsers, { through: ProyectoComSteerCoKU, foreignKey: 'id_proyecto', as: 'ComSteerCoKUs' });
KeyUsers.belongsToMany(Proyectos, { through: ProyectoComSteerCoKU, foreignKey: 'id_ku' });

// Project has many Incidencias
Proyectos.hasMany(Incidencias, { foreignKey: 'id_proyecto', onDelete: 'CASCADE' });
Incidencias.belongsTo(Proyectos, { foreignKey: 'id_proyecto' });

// Project has many Risks
Proyectos.hasMany(Riesgos, { foreignKey: 'id_proyecto', onDelete: 'CASCADE' });
Riesgos.belongsTo(Proyectos, { foreignKey: 'id_proyecto' });

// Project and Proveedor have optional links to LeccionesAprendidas
Proyectos.hasMany(LeccionesAprendidas, { foreignKey: 'id_proyecto', onDelete: 'SET NULL' });
LeccionesAprendidas.belongsTo(Proyectos, { foreignKey: 'id_proyecto', allowNull: true });

Proveedores.hasMany(LeccionesAprendidas, { foreignKey: 'id_proveedor', onDelete: 'SET NULL' });
LeccionesAprendidas.belongsTo(Proveedores, { foreignKey: 'id_proveedor', allowNull: true });

// Project has many Facturas
Proyectos.hasMany(Facturas, { foreignKey: 'id_proyecto', onDelete: 'CASCADE' });
Facturas.belongsTo(Proyectos, { foreignKey: 'id_proyecto' });

// Vendor has many Facturas
Proveedores.hasMany(Facturas, { foreignKey: 'id_proveedor' });
Facturas.belongsTo(Proveedores, { foreignKey: 'id_proveedor' });

// Project has many CambiosAlcance
Proyectos.hasMany(CambiosAlcance, { foreignKey: 'id_proyecto', onDelete: 'CASCADE' });
CambiosAlcance.belongsTo(Proyectos, { foreignKey: 'id_proyecto' });

// Key Users link to CambiosAlcance
KeyUsers.hasMany(CambiosAlcance, { foreignKey: 'id_solicitante_ku' });
CambiosAlcance.belongsTo(KeyUsers, { foreignKey: 'id_solicitante_ku', as: 'Solicitante' });

KeyUsers.hasMany(CambiosAlcance, { foreignKey: 'id_aprobador_ku' });
CambiosAlcance.belongsTo(KeyUsers, { foreignKey: 'id_aprobador_ku', as: 'Aprobador' });

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

module.exports = {
  sequelize,
  Sedes,
  Proveedores,
  ContactosProveedor,
  Usuarios,
  KeyUsers,
  Proyectos,
  ProyectoKeyUsers,
  ProyectoComSemanalKU,
  ProyectoComMensualKU,
  ProyectoComSteerCoKU,
  Incidencias,
  Riesgos,
  LeccionesAprendidas,
  Facturas,
  CambiosAlcance,
  Tareas,
  EstadosProyecto,
  ComentariosProyecto
};
