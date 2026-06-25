'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const tableInfo = await queryInterface.describeTable('Cambios_Alcance');
      
      if (tableInfo.id_solicitante_ku) {
        await queryInterface.removeColumn('Cambios_Alcance', 'id_solicitante_ku');
      }
      
      if (tableInfo.id_aprobador_ku) {
        await queryInterface.removeColumn('Cambios_Alcance', 'id_aprobador_ku');
      }
    } catch (error) {
      console.error('Migration failed to remove legacy ku columns:', error.message);
    }
  },

  async down(queryInterface, Sequelize) {
    // No rollback needed for dropping deprecated unused columns.
  }
};
