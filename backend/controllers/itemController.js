const { 
  Facturas, CambiosAlcance, Riesgos, Incidencias, Tareas, 
  LeccionesAprendidas, Proyectos, Proveedores, ComentariosProyecto, Usuarios 
} = require('../models/index');
const { generateNextId, sanitizeHTML } = require('../utils/helpers');
const { asyncHandler } = require('../middlewares/errorHandler');

// --- FACTURAS ---
const createInvoice = asyncHandler(async (req, res) => {
  const data = req.body;
  data.createdBy = req.currentPmId;
  data.modifiedBy = req.currentPmId;
  if (!data.id_interno_factura || data.id_interno_factura.trim() === '') {
    data.id_interno_factura = await generateNextId(Facturas, 'FAC', 'id_interno_factura');
  } else {
    const facRegex = /^FAC-\d{4}-\d{3}$/;
    if (!facRegex.test(data.id_interno_factura)) {
      return res.status(400).json({ error: 'El ID de factura debe tener el formato FAC-YYYY-XXX.' });
    }
  }
  const fac = await Facturas.create(data);
  res.status(201).json(fac);
});

const updateInvoice = asyncHandler(async (req, res) => {
  const { id_interno_factura } = req.params;
  const data = req.body;
  delete data.createdBy;
  data.modifiedBy = req.currentPmId;
  const fac = await Facturas.findByPk(id_interno_factura);
  if (!fac) {
    return res.status(404).json({ error: 'Factura no encontrada' });
  }
  await fac.update(data);
  res.json(fac);
});

const deleteInvoice = asyncHandler(async (req, res) => {
  const { id_interno_factura } = req.params;
  const fac = await Facturas.findByPk(id_interno_factura);
  if (!fac) {
    return res.status(404).json({ error: 'Factura no encontrada' });
  }
  await fac.destroy();
  res.json({ message: 'Factura eliminada con éxito' });
});

// --- CAMBIOS DE ALCANCE ---
const createScopeChange = asyncHandler(async (req, res) => {
  const data = req.body;
  data.createdBy = req.currentPmId;
  data.modifiedBy = req.currentPmId;
  if (!data.id_cambio || data.id_cambio.trim() === '') {
    data.id_cambio = await generateNextId(CambiosAlcance, 'CR', 'id_cambio');
  } else {
    const crRegex = /^CR-\d{4}-\d{3}$/;
    if (!crRegex.test(data.id_cambio)) {
      return res.status(400).json({ error: 'El ID del cambio de alcance debe tener el formato CR-YYYY-XXX.' });
    }
  }
  if (!data.impacta_importe) {
    data.importe_impacto = 0.00;
  }
  if (!data.impacta_tiempo) {
    data.dias_impacto = 0;
  }
  const cr = await CambiosAlcance.create(data);
  res.status(201).json(cr);
});

const updateScopeChange = asyncHandler(async (req, res) => {
  const { id_cambio } = req.params;
  const data = req.body;
  delete data.createdBy;
  data.modifiedBy = req.currentPmId;
  const cr = await CambiosAlcance.findByPk(id_cambio);
  if (!cr) {
    return res.status(404).json({ error: 'Cambio de alcance no encontrado' });
  }
  if (data.hasOwnProperty('impacta_importe') && !data.impacta_importe) {
    data.importe_impacto = 0.00;
  }
  if (data.hasOwnProperty('impacta_tiempo') && !data.impacta_tiempo) {
    data.dias_impacto = 0;
  }
  await cr.update(data);
  res.json(cr);
});

// --- RIESGOS ---
const createRisk = asyncHandler(async (req, res) => {
  const data = req.body;
  data.createdBy = req.currentPmId;
  data.modifiedBy = req.currentPmId;
  if (!data.id_riesgo || data.id_riesgo.trim() === '') {
    data.id_riesgo = await generateNextId(Riesgos, 'RSG', 'id_riesgo');
  } else {
    const rsgRegex = /^RSG-\d{4}-\d{3}$/;
    if (!rsgRegex.test(data.id_riesgo)) {
      return res.status(400).json({ error: 'El ID de riesgo debe tener el formato RSG-YYYY-XXX.' });
    }
  }
  const rsg = await Riesgos.create(data);
  res.status(201).json(rsg);
});

const updateRisk = asyncHandler(async (req, res) => {
  const { id_riesgo } = req.params;
  const data = req.body;
  delete data.createdBy;
  data.modifiedBy = req.currentPmId;
  const rsg = await Riesgos.findByPk(id_riesgo);
  if (!rsg) {
    return res.status(404).json({ error: 'Riesgo no encontrado' });
  }
  await rsg.update(data);
  res.json(rsg);
});

// --- INCIDENCIAS ---
const createIssue = asyncHandler(async (req, res) => {
  const data = req.body;
  data.createdBy = req.currentPmId;
  data.modifiedBy = req.currentPmId;
  if (!data.id_incidencia || data.id_incidencia.trim() === '') {
    data.id_incidencia = await generateNextId(Incidencias, 'INC', 'id_incidencia');
  } else {
    const incRegex = /^INC-\d{4}-\d{3}$/;
    if (!incRegex.test(data.id_incidencia)) {
      return res.status(400).json({ error: 'El ID de incidencia debe tener el formato INC-YYYY-XXX.' });
    }
  }
  if (data.estado === 'RESUELTA' && (!data.solucion_aplicada || data.solucion_aplicada.trim() === '')) {
    return res.status(400).json({ error: 'La solución aplicada es obligatoria cuando la incidencia está RESUELTA.' });
  }
  const inc = await Incidencias.create(data);
  res.status(201).json(inc);
});

const updateIssue = asyncHandler(async (req, res) => {
  const { id_incidencia } = req.params;
  const data = req.body;
  delete data.createdBy;
  data.modifiedBy = req.currentPmId;
  const inc = await Incidencias.findByPk(id_incidencia);
  if (!inc) {
    return res.status(404).json({ error: 'Incidencia no encontrada' });
  }
  const newStatus = data.estado || inc.estado;
  const newSolution = data.hasOwnProperty('solucion_aplicada') ? data.solucion_aplicada : inc.solucion_aplicada;
  if (newStatus === 'RESUELTA' && (!newSolution || newSolution.trim() === '')) {
    return res.status(400).json({ error: 'La solución aplicada es obligatoria cuando la incidencia está RESUELTA.' });
  }
  await inc.update(data);
  res.json(inc);
});

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

// --- COMENTARIOS ---
const getProjectComments = asyncHandler(async (req, res) => {
  const user = await Usuarios.findByPk(req.currentPmId);
  const canSeeDireccion = user && (user.perfil === 'ADMINISTRADOR' || user.perfil === 'DIRECTOR');

  const where = { id_proyecto: req.params.id_proyecto };
  if (!canSeeDireccion) {
    where.para_direccion = false;
  }

  const comments = await ComentariosProyecto.findAll({
    where,
    include: [
      { model: Usuarios, as: 'Autor', attributes: ['nombre', 'apellidos', 'correo'] },
      { model: Usuarios, as: 'Editor', attributes: ['nombre', 'apellidos', 'correo'] }
    ],
    order: [['fecha_registro', 'DESC']]
  });
  res.json(comments);
});

const createComment = asyncHandler(async (req, res) => {
  const { id_proyecto, texto_comentario, es_importante, para_direccion } = req.body;
  const authorId = req.currentPmId;
  if (!authorId) {
    return res.status(401).json({ error: 'No autorizado. Inicie sesión.' });
  }
  if (!id_proyecto || !texto_comentario || texto_comentario.trim() === '') {
    return res.status(400).json({ error: 'El código del proyecto y el texto del comentario son obligatorios.' });
  }

  const user = await Usuarios.findByPk(authorId);
  const canSeeDireccion = user && (user.perfil === 'ADMINISTRADOR' || user.perfil === 'DIRECTOR');

  const comment = await ComentariosProyecto.create({
    id_proyecto,
    id_usuario: authorId,
    texto_comentario: sanitizeHTML(texto_comentario),
    es_importante: es_importante !== undefined ? !!es_importante : false,
    para_direccion: (para_direccion !== undefined && canSeeDireccion) ? !!para_direccion : false,
    fecha_registro: new Date()
  });

  const fullComment = await ComentariosProyecto.findByPk(comment.id_comentario, {
    include: [
      { model: Usuarios, as: 'Autor', attributes: ['nombre', 'apellidos', 'correo'] },
      { model: Usuarios, as: 'Editor', attributes: ['nombre', 'apellidos', 'correo'] }
    ]
  });

  res.status(201).json(fullComment);
});

const updateComment = asyncHandler(async (req, res) => {
  const { id_comentario } = req.params;
  const { texto_comentario, es_importante, para_direccion } = req.body;
  const editorId = req.currentPmId;
  if (!editorId) {
    return res.status(401).json({ error: 'No autorizado. Inicie sesión.' });
  }
  if (!texto_comentario || texto_comentario.trim() === '') {
    return res.status(400).json({ error: 'El texto del comentario es obligatorio.' });
  }

  const comment = await ComentariosProyecto.findByPk(id_comentario);
  if (!comment) {
    return res.status(404).json({ error: 'Comentario no encontrado.' });
  }

  const user = await Usuarios.findByPk(editorId);
  const canSeeDireccion = user && (user.perfil === 'ADMINISTRADOR' || user.perfil === 'DIRECTOR');

  const updateData = {
    texto_comentario: sanitizeHTML(texto_comentario),
    editado: true,
    id_usuario_modificacion: editorId,
    fecha_modificacion: new Date()
  };
  if (es_importante !== undefined) {
    updateData.es_importante = !!es_importante;
  }
  if (para_direccion !== undefined) {
    updateData.para_direccion = canSeeDireccion ? !!para_direccion : false;
  }

  await comment.update(updateData);

  const fullComment = await ComentariosProyecto.findByPk(id_comentario, {
    include: [
      { model: Usuarios, as: 'Autor', attributes: ['nombre', 'apellidos', 'correo'] },
      { model: Usuarios, as: 'Editor', attributes: ['nombre', 'apellidos', 'correo'] }
    ]
  });

  res.json(fullComment);
});

const deleteComment = asyncHandler(async (req, res) => {
  const { id_comentario } = req.params;
  const comment = await ComentariosProyecto.findByPk(id_comentario);
  if (!comment) {
    return res.status(404).json({ error: 'Comentario no encontrado.' });
  }
  await comment.destroy();
  res.json({ message: 'Comentario eliminado con éxito.' });
});

module.exports = {
  createInvoice,
  updateInvoice,
  deleteInvoice,
  createScopeChange,
  updateScopeChange,
  createRisk,
  updateRisk,
  createIssue,
  updateIssue,
  createTask,
  updateTask,
  deleteTask,
  getLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  getProjectComments,
  createComment,
  updateComment,
  deleteComment
};
