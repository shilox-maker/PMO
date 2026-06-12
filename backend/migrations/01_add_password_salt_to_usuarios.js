const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Verificamos si la columna existe antes de añadirla para evitar errores
    // si ya se había creado previamente con sync({ alter: true }) en otros entornos
    const tableDesc = await queryInterface.describeTable('Usuarios');
    if (!tableDesc.password_salt) {
      await queryInterface.addColumn('Usuarios', 'password_salt', {
        type: DataTypes.STRING,
        allowNull: true,
      });
    }
  },
  down: async (queryInterface, Sequelize) => {
    const tableDesc = await queryInterface.describeTable('Usuarios');
    if (tableDesc.password_salt) {
      await queryInterface.removeColumn('Usuarios', 'password_salt');
    }
  }
};
