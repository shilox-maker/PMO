const { DataTypes } = require('sequelize');

module.exports = {
  async up(queryInterface) {
    const showTables = await queryInterface.showAllTables();

    const schema = queryInterface.sequelize.options.define.schema || 'dbo';
    const targetTable = { tableName: 'Portfolio_Budgets', schema };

    if (!showTables.includes('Portfolio_Budgets')) {
      await queryInterface.createTable(targetTable, {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        portfolio_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: {
              tableName: 'Portfolios',
              schema
            },
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        id_tipo_capex: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: {
              tableName: 'Tipos_Capex',
              schema
            },
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        id_subtipo_capex: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: {
              tableName: 'Subtipos_Capex',
              schema
            },
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        importe: {
          type: DataTypes.DECIMAL(15, 2),
          allowNull: false,
          defaultValue: 0.00
        }
      });

      try {
        await queryInterface.addIndex(targetTable, ['portfolio_id'], {
          name: 'idx_portfolio_budgets_portfolio'
        });
        await queryInterface.addIndex(targetTable, ['id_tipo_capex'], {
          name: 'idx_portfolio_budgets_tipo'
        });
        await queryInterface.addIndex(targetTable, ['id_subtipo_capex'], {
          name: 'idx_portfolio_budgets_subtipo'
        });
      } catch (err) {
        console.log('⚠️ index for Portfolio_Budgets already exists, skipping.');
      }
    }
  },

  async down(queryInterface) {
    const showTables = await queryInterface.showAllTables();
    const schema = queryInterface.sequelize.options.define.schema || 'dbo';
    if (showTables.includes('Portfolio_Budgets')) {
      await queryInterface.dropTable({ tableName: 'Portfolio_Budgets', schema });
    }
  }
};
