'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Proyectos: Remove 'po' if exists
    try {
      const tableInfo = await queryInterface.describeTable('Proyectos');
      if (tableInfo.po) {
        await queryInterface.removeColumn('Proyectos', 'po');
      }
    } catch (e) {
      console.log('Column po in Proyectos not found or already removed.');
    }

    // 2. Facturas: Ensure PO exists
    try {
      const facturasInfo = await queryInterface.describeTable('Facturas');
      if (!facturasInfo.PO) {
        await queryInterface.addColumn('Facturas', 'PO', {
          type: DataTypes.STRING,
          allowNull: true
        });
      }
    } catch (e) {
      console.log('Table Facturas not found or error adding PO.', e.message);
    }

    // 3. Riesgos: Update existing records and change schema
    // Convert 'MITIGADO' -> 'ACTIVO'
    await queryInterface.sequelize.query(
      `UPDATE Riesgos SET estado_riesgo = 'ACTIVO' WHERE estado_riesgo = 'MITIGADO'`
    );
    // Note: SQLite doesn't strictly enforce ENUM constraints on ALTER TABLE, so changing the DataTypes model is often enough for the application layer.

    // 4. Cambios de Alcance: Convert 'EN_REVISION' -> 'SOLICITADO'
    await queryInterface.sequelize.query(
      `UPDATE Cambios_Alcance SET estado_cambio = 'SOLICITADO' WHERE estado_cambio = 'EN_REVISION'`
    );

    // 5. Lecciones_Aprendidas: Drop and Recreate
    try {
      await queryInterface.dropTable('Lecciones_Aprendidas');
    } catch (e) {
      console.log('Lecciones_Aprendidas table not dropped (may not exist).');
    }

    await queryInterface.createTable('Lecciones_Aprendidas', {
      id: {
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
      titulo: {
        type: DataTypes.STRING,
        allowNull: false
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      fecha_registro: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert logic if needed
  }
};
