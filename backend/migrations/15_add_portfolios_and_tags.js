'use strict';
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create Portfolios table
    await queryInterface.createTable('Portfolios', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 2. Create Tags table
    await queryInterface.createTable('Tags', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 3. Create Pivot table Proyecto_Tags
    await queryInterface.createTable('Proyecto_Tags', {
      proyecto_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'Proyectos',
          key: 'id_proyecto'
        },
        onDelete: 'CASCADE'
      },
      tag_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Tags',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 4. Add portfolio_id to Proyectos table
    const tableInfo = await queryInterface.describeTable('Proyectos');
    if (!tableInfo['portfolio_id']) {
      await queryInterface.addColumn('Proyectos', 'portfolio_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Portfolios',
          key: 'id'
        },
        onDelete: 'SET NULL'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Drop pivot table first
    await queryInterface.dropTable('Proyecto_Tags');
    // Drop tags table
    await queryInterface.dropTable('Tags');
    // Remove portfolio_id column
    try {
      await queryInterface.removeColumn('Proyectos', 'portfolio_id');
    } catch (e) {
      console.log('Error removing portfolio_id column:', e.message);
    }
    // Drop portfolios table
    await queryInterface.dropTable('Portfolios');
  }
};
