const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    const schema = queryInterface.sequelize.options.define.schema || 'dbo';
    const showTables = await queryInterface.showAllTables();

    const targetTipos = { tableName: 'Tipos_Capex', schema };
    const targetSubtipos = { tableName: 'Subtipos_Capex', schema };
    const targetProyectos = { tableName: 'Proyectos', schema };

    // 1. Create Tipos_Capex table safely
    if (!showTables.includes('Tipos_Capex')) {
      await queryInterface.createTable(targetTipos, {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: DataTypes.STRING, allowNull: false, unique: true },
        orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
      });
    }

    // 2. Create Subtipos_Capex table safely
    if (!showTables.includes('Subtipos_Capex')) {
      await queryInterface.createTable(targetSubtipos, {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        id_tipo_capex: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: targetTipos,
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        nombre: { type: DataTypes.STRING, allowNull: false },
        orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
      });
      try {
        await queryInterface.addIndex(targetSubtipos, ['id_tipo_capex'], {
          name: 'idx_subtipos_capex_tipo'
        });
      } catch (err) {
        console.log('⚠️ index idx_subtipos_capex_tipo already exists, skipping.');
      }
    }

    // 3. Add FK columns to Proyectos safely
    const tableInfo = await queryInterface.describeTable(targetProyectos);
    if (!tableInfo.id_tipo_capex) {
      await queryInterface.addColumn(targetProyectos, 'id_tipo_capex', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: targetTipos,
          key: 'id'
        }
      });
    }

    if (!tableInfo.id_subtipo_capex) {
      await queryInterface.addColumn(targetProyectos, 'id_subtipo_capex', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: targetSubtipos,
          key: 'id'
        }
      });
    }

    // 4. Seed initial data if table is empty
    const qualifiedTiposName = `[${schema}].[Tipos_Capex]`;
    const qualifiedSubtiposName = `[${schema}].[Subtipos_Capex]`;
    const [existingTipos] = await queryInterface.sequelize.query(`SELECT COUNT(*) as count FROM ${qualifiedTiposName}`);
    if (existingTipos[0].count === 0 || existingTipos[0].count === "0") {
      await queryInterface.bulkInsert(targetTipos, [
        { nombre: 'Growth', orden: 1 },
        { nombre: 'Special', orden: 2 },
        { nombre: 'Operational', orden: 3 }
      ]);

      // Get Special type id
      const [rows] = await queryInterface.sequelize.query(
        `SELECT id FROM ${qualifiedTiposName} WHERE nombre = 'Special'`
      );
      const specialId = rows[0].id;

      await queryInterface.bulkInsert(targetSubtipos, [
        { id_tipo_capex: specialId, nombre: 'Dynamics', orden: 1 },
        { id_tipo_capex: specialId, nombre: 'AI', orden: 2 },
        { id_tipo_capex: specialId, nombre: 'Industry 4.0', orden: 3 }
      ]);
    }
  },

  async down(queryInterface) {
    const schema = queryInterface.sequelize.options.define.schema || 'dbo';
    const targetProyectos = { tableName: 'Proyectos', schema };
    const targetTipos = { tableName: 'Tipos_Capex', schema };
    const targetSubtipos = { tableName: 'Subtipos_Capex', schema };

    const tableInfo = await queryInterface.describeTable(targetProyectos);
    if (tableInfo.id_subtipo_capex) {
      await queryInterface.removeColumn(targetProyectos, 'id_subtipo_capex');
    }
    if (tableInfo.id_tipo_capex) {
      await queryInterface.removeColumn(targetProyectos, 'id_tipo_capex');
    }
    
    const showTables = await queryInterface.showAllTables();
    if (showTables.includes('Subtipos_Capex')) {
      await queryInterface.dropTable(targetSubtipos);
    }
    if (showTables.includes('Tipos_Capex')) {
      await queryInterface.dropTable(targetTipos);
    }
  }
};
