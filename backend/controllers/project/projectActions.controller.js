const { prepareProjectsData } = require('../../services/projectDataPrepService');
const { generateProjectsExcel } = require('../../services/projectExcelService');
const { Op } = require('sequelize');
const { 
  Proyectos, Usuarios, Proveedores, Sedes, EstadosProyecto, ProyectoContactos, Tareas
} = require('../../models/index');
const { asyncHandler } = require('../../middlewares/errorHandler');


const exportProjects = asyncHandler(async (req, res) => {
  const { pm, vendor, rag, search, state, cols, estrategico, ids } = req.query;

  const where = {};
  if (ids) {
    where.id_proyecto = { [Op.in]: ids.split(',') };
  } else {
    if (pm) where.id_pm = pm;
    if (vendor) where.id_proveedor = vendor;
    if (rag) where.indicador_rag = rag;
    if (estrategico) {
      where.es_estrategico = estrategico === 'true';
    }
    if (search) {
      where.nombre_proyecto = { [Op.like]: `%${search}%` };
    }
    if (state) {
      where['$Estado.nombre_estado$'] = { [Op.in]: state.split(',') };
    }
  }

  const projectsList = await Proyectos.findAll({
    where,
    include: [
      { model: Usuarios, as: 'PM', attributes: ['nombre', 'apellidos'] },
      { model: Proveedores, as: 'Proveedor', attributes: ['nombre_razon_social'] },
      { model: Sedes, as: 'Sede', attributes: ['nombre_sede'] },
      { model: EstadosProyecto, as: 'Estado', attributes: ['nombre_estado', 'icono'] }
    ],
    order: [['createdAt', 'DESC']]
  });

  const rowsData = await prepareProjectsData(projectsList);

  let exportCols = [
    { header: 'Código', key: 'id_proyecto', width: 15 },
    { header: 'Nombre del Proyecto', key: 'nombre_proyecto', width: 30 },
    { header: 'Estado / Fase', key: 'estado_proyecto', width: 15 },
    { header: 'RAG', key: 'indicador_rag', width: 12 },
    { header: 'Socio Tecnológico', key: 'proveedor', width: 25 },
    { header: 'Gestor PM', key: 'pm', width: 20 },
    { header: 'Sede', key: 'sede', width: 15 },
    { header: 'Presupuesto Inicial', key: 'budget_inicial', width: 20 },
    { header: 'Budget Actualizado', key: 'budget_actualizado', width: 20 },
    { header: 'Consumo Real', key: 'consumo_real', width: 20 },
    { header: 'Presupuesto Disponible', key: 'presupuesto_disponible', width: 22 },
    { header: 'Fecha Inicio', key: 'fecha_inicio', width: 15 },
    { header: 'Fecha Fin Inicial', key: 'fecha_fin_inicial', width: 15 },
    { header: 'Fecha Fin Estimada', key: 'fecha_fin_estimada', width: 18 }
  ];

  if (cols) {
    const allowedCols = cols.split(',');
    const mappedAllowed = new Set(allowedCols);
    if (mappedAllowed.has('budget')) {
      mappedAllowed.add('budget_inicial');
      mappedAllowed.add('budget_actualizado');
      mappedAllowed.add('presupuesto_disponible');
    }
    if (mappedAllowed.has('progreso')) {
      mappedAllowed.add('consumo_real');
    }
    if (mappedAllowed.has('proveedor')) {
      mappedAllowed.add('proveedor');
    }
    if (mappedAllowed.has('pm')) {
      mappedAllowed.add('pm');
    }
    if (mappedAllowed.has('estado_proyecto')) {
      mappedAllowed.add('estado_proyecto');
    }

    exportCols = exportCols.filter(c => mappedAllowed.has(c.key) || c.key === 'id_proyecto' || c.key === 'nombre_proyecto');
  }

  const workbook = await generateProjectsExcel(rowsData, exportCols);

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="Reporte_Proyectos.xlsx"'
  );

  await workbook.xlsx.write(res);
  res.end();
});

const addParticipant = asyncHandler(async (req, res) => {
  const { id_proyecto } = req.params;
  const { id_contacto, rol, raci } = req.body;
  if (!id_contacto || !rol || !raci) {
    return res.status(400).json({ error: 'Faltan campos obligatorios: id_contacto, rol, raci.' });
  }
  const project = await Proyectos.findByPk(id_proyecto);
  if (!project) {
    return res.status(404).json({ error: 'Proyecto no encontrado.' });
  }
  
  const [association, created] = await ProyectoContactos.findOrCreate({
    where: { id_proyecto, id_contacto },
    defaults: { rol, raci }
  });

  if (!created) {
    await association.update({ rol, raci });
  }

  res.json({ message: 'Participante guardado con éxito', association });
});

const removeParticipant = asyncHandler(async (req, res) => {
  const { id_proyecto, id_contacto } = req.params;
  const count = await ProyectoContactos.destroy({
    where: { id_proyecto, id_contacto }
  });
  if (count === 0) {
    return res.status(404).json({ error: 'Participante no encontrado en este proyecto.' });
  }
  res.json({ message: 'Participante eliminado con éxito.' });
});

const applyStateTasks = asyncHandler(async (req, res) => {
  const { id_proyecto } = req.params;
  const { tareas } = req.body;

  if (!Array.isArray(tareas) || tareas.length === 0) {
    return res.status(400).json({ error: 'Debes proporcionar una lista de tareas para añadir.' });
  }

  const project = await Proyectos.findByPk(id_proyecto);
  if (!project) {
    return res.status(404).json({ error: 'Proyecto no encontrado.' });
  }

  const today = new Date().toISOString().split('T')[0];
  const newTasks = tareas.map(t => ({
    id_proyecto,
    titulo_tarea: t.nombre_tarea || t.titulo_tarea,
    descripcion: t.descripcion || null,
    es_hito: !!t.es_hito,
    estado: 'PENDIENTE',
    fecha_limite: t.fecha_limite || today
  }));

  const createdTasks = await Tareas.bulkCreate(newTasks);
  res.status(201).json({ message: 'Tareas añadidas con éxito', createdTasks });
});

module.exports = {
  exportProjects,
  addParticipant,
  removeParticipant,
  applyStateTasks
};

