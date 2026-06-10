const { Sequelize } = require('sequelize');
const path = require('path');

// SQLite connection options
const sqliteConfig = {
  dialect: 'sqlite',
  storage: path.join(__dirname, '../ppm_governance.db'),
  logging: false, // Set to console.log to see SQL queries
  define: {
    timestamps: true, // adds createdAt and updatedAt
    freezeTableName: true // keeps table names same as model name
  }
};

// SQL Server connection options (Future migration)
/*
const sqlServerConfig = {
  dialect: 'mssql',
  host: 'YOUR_SQL_SERVER_HOST',
  port: 1433,
  database: 'ppm_governance',
  username: 'YOUR_DB_USER',
  password: 'YOUR_DB_PASSWORD',
  dialectOptions: {
    options: {
      encrypt: true, // For Azure or secure setups
      enableArithAbort: true
    }
  },
  define: {
    timestamps: true,
    freezeTableName: true
  }
};
*/

// Initialize Sequelize with current dialect (SQLite)
const sequelize = new Sequelize(sqliteConfig);

module.exports = {
  sequelize,
  Sequelize
};
