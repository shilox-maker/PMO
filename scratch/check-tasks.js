const { Tareas, sequelize } = require('../backend/models/index');

async function test() {
  try {
    const list = await Tareas.findAll({ limit: 5 });
    console.log('Columns and data:', list.map(t => t.toJSON()));
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

test();
