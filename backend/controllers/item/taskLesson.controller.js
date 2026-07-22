const { Tareas, LeccionesAprendidas, Proyectos, Proveedores } = require('../../models/index');
const { generateNextId } = require('../../utils/helpers');
const { asyncHandler } = require('../../middlewares/errorHandler');

// --- TAREAS ---
const createTask = asyncHandler(async (req, res) => {
  const data = { ...req.body };

  // Sanitize empty strings → null for date fields
  const DATE_FIELDS = ['fecha_limite', 'fecha_original_cierre', 'fecha_actual_cierre', 'fecha_real_cierre'];
  DATE_FIELDS.forEach(f => { if (data[f] === '') data[f] = null; });

  if (data.es_hito) {
    if (data.fecha_original_cierre && !data.fecha_actual_cierre) {
      data.fecha_actual_cierre = data.fecha_original_cierre;
    } else if (data.fecha_actual_cierre && !data.fecha_original_cierre) {
      data.fecha_original_cierre = data.fecha_actual_cierre;
    }
    if (data.fecha_actual_cierre) {
      data.fecha_limite = data.fecha_actual_cierre;
    }
    if (data.estado === 'COMPLETADA') {
      data.fecha_real_cierre = data.fecha_real_cierre || new Date().toISOString().split('T')[0];
    } else {
      data.fecha_real_cierre = null;
    }
  } else {
    data.fecha_original_cierre = null;
    data.fecha_actual_cierre = null;
    data.fecha_real_cierre = null;
  }
  const task = await Tareas.create(data);
  res.status(201).json(task);
});

const updateTask = asyncHandler(async (req, res) => {
  const { id_tarea } = req.params;
  const task = await Tareas.findByPk(id_tarea);
  if (!task) {
    return res.status(404).json({ error: 'Tarea no encontrada' });
  }

  // Sanitize empty strings → null for date fields
  const raw = { ...req.body };
  const DATE_FIELDS = ['fecha_limite', 'fecha_original_cierre', 'fecha_actual_cierre', 'fecha_real_cierre'];
  DATE_FIELDS.forEach(f => { if (raw[f] === '') raw[f] = null; });

  const nextEsHito = raw.hasOwnProperty('es_hito') ? raw.es_hito : task.es_hito;
  const nextEstado = raw.hasOwnProperty('estado') ? raw.estado : task.estado;

  if (nextEsHito) {
    // If only original is set, mirror to actual (first time creation)
    if (raw.fecha_original_cierre && !raw.fecha_actual_cierre && !task.fecha_actual_cierre) {
      raw.fecha_actual_cierre = raw.fecha_original_cierre;
    }
    // Keep fecha_limite in sync with actual closing date
    if (raw.fecha_actual_cierre) {
      raw.fecha_limite = raw.fecha_actual_cierre;
    }
    // Real closing date only when COMPLETADA
    if (nextEstado === 'COMPLETADA') {
      raw.fecha_real_cierre = raw.fecha_real_cierre || task.fecha_real_cierre || new Date().toISOString().split('T')[0];
    } else {
      raw.fecha_real_cierre = null;
    }
  } else {
    raw.fecha_original_cierre = null;
    raw.fecha_actual_cierre = null;
    raw.fecha_real_cierre = null;
  }

  // Use set() + save() to guarantee Sequelize detects all dirty fields
  task.set(raw);
  await task.save();
  res.json(task);
});

const deleteTask = asyncHandler(async (req, res) => {
  const { id_tarea } = req.params;
  const task = await Tareas.findByPk(id_tarea);
  if (!task) {
    return res.status(404).json({ error: 'Tarea no encontrada' });
  }
  await task.destroy();
  res.json({ message: 'Tarea eliminada con éxito' });
});

// --- LECCIONES APRENDIDAS ---
const getLessons = asyncHandler(async (req, res) => {
  const lessons = await LeccionesAprendidas.findAll({
    include: [
      { model: Proyectos, as: 'Proyecto', attributes: ['id_proyecto', 'nombre_proyecto'] },
      { model: Proveedores, as: 'Proveedore', attributes: ['id_proveedor', 'nombre_razon_social'] }
    ],
    order: [['createdAt', 'DESC']]
  });
  res.json(lessons);
});

const createLesson = asyncHandler(async (req, res) => {
  const data = req.body;
  if (!data.id_leccion || data.id_leccion.trim() === '') {
    data.id_leccion = await generateNextId(LeccionesAprendidas, 'LEA', 'id_leccion');
  } else {
    const leaRegex = /^LEA-\d{4}-\d{3}$/;
    if (!leaRegex.test(data.id_leccion)) {
      return res.status(400).json({ error: 'El ID de lección debe tener el formato LEA-YYYY-XXX.' });
    }
  }
  const lesson = await LeccionesAprendidas.create(data);
  res.status(201).json(lesson);
});

const updateLesson = asyncHandler(async (req, res) => {
  const lesson = await LeccionesAprendidas.findByPk(req.params.id);
  if (!lesson) return res.status(404).json({ error: 'Lección no encontrada.' });
  await lesson.update(req.body);
  res.json(lesson);
});

const deleteLesson = asyncHandler(async (req, res) => {
  const lesson = await LeccionesAprendidas.findByPk(req.params.id);
  if (!lesson) return res.status(404).json({ error: 'Lección no encontrada.' });
  await lesson.destroy();
  res.json({ message: 'Lección eliminada correctamente.' });
});

module.exports = {
  createTask,
  updateTask,
  deleteTask,
  getLessons,
  createLesson,
  updateLesson,
  deleteLesson
};
