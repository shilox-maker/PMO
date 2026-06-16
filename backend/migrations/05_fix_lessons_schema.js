'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop the old table
    try {
      await queryInterface.dropTable('Lecciones_Aprendidas');
    } catch (e) {
      console.log('Lecciones_Aprendidas table not dropped (may not exist).');
    }

    // Create correct table
    await queryInterface.createTable('Lecciones_Aprendidas', {
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
          model: 'Proyectos',
          key: 'id_proyecto'
        },
        onDelete: 'SET NULL'
      },
      id_proveedor: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Proveedores',
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
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Lecciones_Aprendidas');
  }
};
