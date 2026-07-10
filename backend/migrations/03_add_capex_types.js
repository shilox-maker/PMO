const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    const showTables = await queryInterface.showAllTables();

    // 1. Create Tipos_Capex table safely
    if (!showTables.includes('Tipos_Capex')) {
      await queryInterface.createTable('Tipos_Capex', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: DataTypes.STRING, allowNull: false, unique: true },
        orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
      });
    }

    // 2. Create Subtipos_Capex table safely
    if (!showTables.includes('Subtipos_Capex')) {
      await queryInterface.createTable('Subtipos_Capex', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_tipo_capex: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'Tipos_Capex', key: 'id' },
          onDelete: 'CASCADE'
        },
        nombre: { type: DataTypes.STRING, allowNull: false },
        orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
      });
      try {
        await queryInterface.addIndex('Subtipos_Capex', ['id_tipo_capex'], {
          name: 'idx_subtipos_capex_tipo'
        });
      } catch (err) {
        console.log('⚠️ index idx_subtipos_capex_tipo already exists, skipping.');
      }
    }

    // 3. Add FK columns to Proyectos safely
    const tableInfo = await queryInterface.describeTable('Proyectos');
    if (!tableInfo.id_tipo_capex) {
      await queryInterface.addColumn('Proyectos', 'id_tipo_capex', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Tipos_Capex', key: 'id' }
      });
    }

    if (!tableInfo.id_subtipo_capex) {
      await queryInterface.addColumn('Proyectos', 'id_subtipo_capex', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Subtipos_Capex', key: 'id' }
      });
    }

    // 4. Seed initial data if table is empty
    const [existingTipos] = await queryInterface.sequelize.query("SELECT COUNT(*) as count FROM Tipos_Capex");
    if (existingTipos[0].count === 0 || existingTipos[0].count === "0") {
      await queryInterface.bulkInsert('Tipos_Capex', [
        { nombre: 'Growth', orden: 1 },
        { nombre: 'Special', orden: 2 },
        { nombre: 'Operational', orden: 3 }
      ]);

      // Get Special type id
      const [rows] = await queryInterface.sequelize.query(
        "SELECT id FROM Tipos_Capex WHERE nombre = 'Special'"
      );
      const specialId = rows[0].id;

      await queryInterface.bulkInsert('Subtipos_Capex', [
        { id_tipo_capex: specialId, nombre: 'Dynamics', orden: 1 },
        { id_tipo_capex: specialId, nombre: 'AI', orden: 2 },
        { id_tipo_capex: specialId, nombre: 'Industry 4.0', orden: 3 }
      ]);
    }
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('Proyectos');
    if (tableInfo.id_subtipo_capex) {
      await queryInterface.removeColumn('Proyectos', 'id_subtipo_capex');
    }
    if (tableInfo.id_tipo_capex) {
      await queryInterface.removeColumn('Proyectos', 'id_tipo_capex');
    }
    
    const showTables = await queryInterface.showAllTables();
    if (showTables.includes('Subtipos_Capex')) {
      await queryInterface.dropTable('Subtipos_Capex');
    }
    if (showTables.includes('Tipos_Capex')) {
      await queryInterface.dropTable('Tipos_Capex');
    }
  }
};
