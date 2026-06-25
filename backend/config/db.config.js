const { Sequelize } = require('sequelize');
const path = require('path');

const dialect = process.env.DB_DIALECT || 'sqlite';
let sequelize;

if (dialect === 'mssql') {
  // Azure SQL Server connection (PRE / PRO via DB_SCHEMA)
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '1433', 10),
      dialect: 'mssql',
      dialectOptions: {
        options: {
          encrypt: true,
          enableArithAbort: true
        }
      },
      define: {
        timestamps: true,
        freezeTableName: true,
        schema: process.env.DB_SCHEMA || 'dbo'
      },
      logging: false
    }
  );
} else {
  // SQLite connection (desarrollo local + tests)
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.NODE_ENV === 'test' ? ':memory:' : path.join(__dirname, '../ppm_governance.db'),
    logging: false,
    define: {
      timestamps: true,
      freezeTableName: true
    }
  });
}

module.exports = {
  sequelize,
  Sequelize
};
