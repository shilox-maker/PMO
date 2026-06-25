'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add es_grupo_dacsa to Proveedores if it doesn't exist
    try {
      const tableInfo = await queryInterface.describeTable('Proveedores');
      if (!tableInfo.es_grupo_dacsa) {
        await queryInterface.addColumn('Proveedores', 'es_grupo_dacsa', {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        });
      }
    } catch (e) {
      console.log('Error modifying Proveedores:', e.message);
    }

    // 2. Purge orphan Key Users (Those without a provider or whose provider does not exist)
    await queryInterface.sequelize.query(
      `DELETE FROM Key_Users WHERE id_proveedor_empresa IS NULL OR id_proveedor_empresa NOT IN (SELECT id_proveedor FROM Proveedores)`
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Revert changes if necessary
  }
};
