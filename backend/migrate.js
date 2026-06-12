const { Umzug, SequelizeStorage } = require('umzug');
const { sequelize } = require('./models/index');

const umzug = new Umzug({
  migrations: { 
    glob: 'migrations/*.js',
    resolve: ({ name, path, context }) => {
      // require the migration file
      const migration = require(path);
      return {
        name,
        up: async () => migration.up(context, sequelize),
        down: async () => migration.down(context, sequelize),
      };
    }
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

if (require.main === module) {
  umzug.runAsCLI()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = umzug;
