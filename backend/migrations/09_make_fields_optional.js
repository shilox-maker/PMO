'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.changeColumn('Proyectos', 'id_proveedor', { type: DataTypes.INTEGER, allowNull: true });
      await queryInterface.changeColumn('Proyectos', 'id_sponsor_ku', { type: DataTypes.INTEGER, allowNull: true });
      await queryInterface.changeColumn('Proyectos', 'fecha_fin_inicial', { type: DataTypes.DATEONLY, allowNull: true });
      await queryInterface.changeColumn('Proyectos', 'budget_inicial', { type: DataTypes.DECIMAL(15, 2), allowNull: true });

      await queryInterface.changeColumn('Facturas', 'id_proveedor', { type: DataTypes.INTEGER, allowNull: true });
      await queryInterface.changeColumn('Facturas', 'numero_factura', { type: DataTypes.STRING, allowNull: true });
    } catch (error) {
      console.warn("changeColumn failed, ignoring due to SQLite limits.", error);
    }
  },

  down: async (queryInterface, Sequelize) => {}
};
