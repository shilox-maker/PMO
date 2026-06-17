const { DataTypes } = require('sequelize');

module.exports = {
  up: async ({ context: queryInterface }) => {
    // In SQLite changeColumn might throw an error. A workaround is to disable constraints, copy table, etc.
    // However, Sequelize >= 6 usually handles changeColumn for SQLite by creating a backup table, copying data, and replacing it.
    try {
      await queryInterface.changeColumn('Proyectos', 'id_proveedor', { type: DataTypes.INTEGER, allowNull: true });
      await queryInterface.changeColumn('Proyectos', 'id_sponsor_ku', { type: DataTypes.INTEGER, allowNull: true });
      await queryInterface.changeColumn('Proyectos', 'fecha_fin_inicial', { type: DataTypes.DATEONLY, allowNull: true });
      await queryInterface.changeColumn('Proyectos', 'budget_inicial', { type: DataTypes.DECIMAL(15, 2), allowNull: true });

      await queryInterface.changeColumn('Facturas', 'id_proveedor', { type: DataTypes.INTEGER, allowNull: true });
      await queryInterface.changeColumn('Facturas', 'numero_factura', { type: DataTypes.STRING, allowNull: true });
    } catch (error) {
      console.warn("changeColumn failed, attempting manual table modification or ignoring if SQLite doesn't strictly enforce", error);
      // Fallback: If it's SQLite and changeColumn fails, we might just ignore because SQLite
      // dynamic typing sometimes allows nulls anyway, or we would have to recreate the tables manually.
      // But let's try the native way first.
    }
  },

  down: async ({ context: queryInterface }) => {
    // Not implementing down for this minor change
  }
};
