const { Tareas, sequelize } = require('../backend/models/index');

async function run() {
  try {
    const task = await Tareas.findOne({ where: { id_proyecto: 'PRJ-2026-001', es_hito: true } });
    if (!task) {
      console.log('No milestone task found to test');
      return;
    }
    console.log('Initial task dates:', {
      fecha_limite: task.fecha_limite,
      fecha_original_cierre: task.fecha_original_cierre,
      fecha_actual_cierre: task.fecha_actual_cierre,
      fecha_real_cierre: task.fecha_real_cierre
    });

    console.log('Updating state to PENDIENTE...');
    await task.update({ estado: 'PENDIENTE' });
    console.log('After updating to PENDIENTE:', {
      fecha_limite: task.fecha_limite,
      fecha_original_cierre: task.fecha_original_cierre,
      fecha_actual_cierre: task.fecha_actual_cierre,
      fecha_real_cierre: task.fecha_real_cierre
    });

    console.log('Updating state to COMPLETADA...');
    await task.update({ estado: 'COMPLETADA' });
    console.log('After updating to COMPLETADA:', {
      fecha_limite: task.fecha_limite,
      fecha_original_cierre: task.fecha_original_cierre,
      fecha_actual_cierre: task.fecha_actual_cierre,
      fecha_real_cierre: task.fecha_real_cierre
    });
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

run();
