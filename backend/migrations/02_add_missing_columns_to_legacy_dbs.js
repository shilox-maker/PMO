const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Migración general para añadir columnas que se crearon en local mediante alter:true
    // pero que las bases de datos de producción (Raspberry) no llegaron a recibir.

    // 1. Estados_Proyecto -> proyecto_cerrado
    const estadosDesc = await queryInterface.describeTable('Estados_Proyecto');
    if (!estadosDesc.proyecto_cerrado) {
      await queryInterface.addColumn('Estados_Proyecto', 'proyecto_cerrado', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }

    // 2. Facturas -> PO
    const facturasDesc = await queryInterface.describeTable('Facturas');
    if (!facturasDesc.PO) {
      await queryInterface.addColumn('Facturas', 'PO', {
        type: DataTypes.STRING,
        allowNull: true
      });
    }

    // 3. Comentarios_Proyecto -> es_importante
    const comentariosDesc = await queryInterface.describeTable('Comentarios_Proyecto');
    if (!comentariosDesc.es_importante) {
      await queryInterface.addColumn('Comentarios_Proyecto', 'es_importante', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const estadosDesc = await queryInterface.describeTable('Estados_Proyecto');
    if (estadosDesc.proyecto_cerrado) await queryInterface.removeColumn('Estados_Proyecto', 'proyecto_cerrado');

    const facturasDesc = await queryInterface.describeTable('Facturas');
    if (facturasDesc.PO) await queryInterface.removeColumn('Facturas', 'PO');

    const comentariosDesc = await queryInterface.describeTable('Comentarios_Proyecto');
    if (comentariosDesc.es_importante) await queryInterface.removeColumn('Comentarios_Proyecto', 'es_importante');
  }
};
