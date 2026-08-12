const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

// Ambitos Model (Maestro de Ámbitos / Unidades de Negocio)
const Ambitos = sequelize.define('Ambitos', {
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
  }
}, {
  tableName: 'Ambitos'
});

// UsuarioAmbitos Model (Tabla de asociación N:M entre Usuarios y Ambitos)
const UsuarioAmbitos = sequelize.define('Usuario_Ambitos', {
  id_usuario_ambito: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_ambito: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  rol_ambito: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'MEMBER'
  }
}, {
  tableName: 'Usuario_Ambitos'
});

module.exports = {
  Ambitos,
  UsuarioAmbitos
};
