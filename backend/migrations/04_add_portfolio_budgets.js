const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    const showTables = await queryInterface.showAllTables();

    if (!showTables.includes('Portfolio_Budgets')) {
      await queryInterface.createTable('Portfolio_Budgets', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        portfolio_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'Portfolios', key: 'id' },
          onDelete: 'CASCADE'
        },
        id_tipo_capex: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'Tipos_Capex', key: 'id' },
          onDelete: 'CASCADE'
        },
        id_subtipo_capex: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'Subtipos_Capex', key: 'id' },
          onDelete: 'CASCADE'
        },
        importe: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0.00
        }
      });

      try {
        await queryInterface.addIndex('Portfolio_Budgets', ['portfolio_id'], {
          name: 'idx_portfolio_budgets_portfolio'
        });
        await queryInterface.addIndex('Portfolio_Budgets', ['id_tipo_capex'], {
          name: 'idx_portfolio_budgets_tipo'
        });
        await queryInterface.addIndex('Portfolio_Budgets', ['id_subtipo_capex'], {
          name: 'idx_portfolio_budgets_subtipo'
        });
      } catch (err) {
        console.log('⚠️ index for Portfolio_Budgets already exists, skipping.');
      }
    }
  },

  async down(queryInterface) {
    const showTables = await queryInterface.showAllTables();
    if (showTables.includes('Portfolio_Budgets')) {
      await queryInterface.dropTable('Portfolio_Budgets');
    }
  }
};
