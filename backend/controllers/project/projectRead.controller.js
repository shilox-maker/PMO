const { Op } = require('sequelize');
const { 
  Proyectos, Usuarios, Proveedores, Sedes, ContactosProveedor,
  Tareas, EstadosProyecto, CambiosAlcance, Facturas, ComentariosProyecto,
  Incidencias, Riesgos, LeccionesAprendidas, Portfolios, Tags, TiposCapex, SubtiposCapex, TiposFactura,
  PlanesComunicacion, PlanComunicacionLog
} = require('../../models/index');
const { getProjectCalculations, getProjectsCalculationsBatch } = require('../../models/automations');
const { asyncHandler } = require('../../middlewares/errorHandler');

const getProjects = asyncHandler(async (req, res) => {
  const { pm, vendor, rag, search, state, estrategico, portfolio, tag, iniciativa_ligera } = req.query;
  const user = await Usuarios.findByPk(req.currentPmId);
  const canSeeDireccion = user && (user.perfil === 'ADMINISTRADOR' || user.perfil === 'DIRECTOR');
  
  const where = {};
  if (pm) where.id_pm = pm;
  if (vendor) where.id_proveedor = vendor;
  if (rag) where.indicador_rag = rag;
  if (estrategico) where.es_estrategico = estrategico === 'true';
  if (iniciativa_ligera) where.es_iniciativa_ligera = iniciativa_ligera === 'true';
  if (portfolio) where.portfolio_id = portfolio;
  if (search) where.nombre_proyecto = { [Op.like]: `%${search}%` };
  if (tag) {
    const pTag = await Proyectos.findAll({ attributes: ['id_proyecto'], include: [{ model: Tags, as: 'Tags', where: { id: tag }, attributes: [] }], raw: true });
    where.id_proyecto = { [Op.in]: pTag.map(p => p.id_proyecto) };
  }

  const projectsList = await Proyectos.findAll({
    where,
    include: [
      { model: Usuarios, as: 'PM', attributes: ['nombre', 'apellidos', 'correo'] },
      { model: Proveedores, as: 'Proveedor', attributes: ['nombre_razon_social'] },
      { model: Sedes, as: 'Sede', attributes: ['nombre_sede'] },
      { model: ContactosProveedor, as: 'Sponsor', attributes: ['nombre', 'apellidos'] },
      { model: Portfolios, as: 'Portfolio', attributes: ['id', 'nombre'] },
      { model: Tags, as: 'Tags', through: { attributes: [] } },
      { model: TiposCapex, as: 'TipoCapex', attributes: ['id', 'nombre'] },
      { model: SubtiposCapex, as: 'SubtipoCapex', attributes: ['id', 'nombre'] },
      { model: EstadosProyecto, as: 'Estado', attributes: ['id_estado', 'nombre_estado', 'icono'], ...(state ? { where: { nombre_estado: { [Op.in]: state.split(',') } } } : {}) }
    ],
    order: [['createdAt', 'DESC']]
  });

  if (!projectsList || projectsList.length === 0) return res.json([]);

  const projectIds = projectsList.map(p => p.id_proyecto);

  // Batch load calculations & metadata
  const [calcMap, allMilestones, allComments, allTasksLatest] = await Promise.all([
    getProjectsCalculationsBatch(projectsList),
    Tareas.findAll({ where: { id_proyecto: { [Op.in]: projectIds }, es_hito: true, estado: 'PENDIENTE' }, attributes: ['id_proyecto', 'id_tarea', 'titulo_tarea', 'fecha_limite', 'estado'], order: [['fecha_limite', 'ASC']], raw: true }),
    ComentariosProyecto.findAll({ where: { id_proyecto: { [Op.in]: projectIds }, ...(!canSeeDireccion ? { para_direccion: false } : {}) }, attributes: ['id_proyecto', 'texto_comentario', 'fecha_registro', 'updatedAt'], order: [['fecha_registro', 'DESC']], raw: true }),
    Tareas.findAll({ where: { id_proyecto: { [Op.in]: projectIds } }, attributes: ['id_proyecto', 'updatedAt'], order: [['updatedAt', 'DESC']], raw: true })
  ]);

  const nextMilestoneMap = new Map(), lastCommentMap = new Map(), lastCommentDateMap = new Map(), lastTaskDateMap = new Map();
  allMilestones.forEach(t => { if (!nextMilestoneMap.has(t.id_proyecto)) nextMilestoneMap.set(t.id_proyecto, t); });
  allComments.forEach(c => {
    if (!lastCommentMap.has(c.id_proyecto)) {
      lastCommentMap.set(c.id_proyecto, c.texto_comentario ? c.texto_comentario.replace(/<[^>]+>/g, '') : '');
      lastCommentDateMap.set(c.id_proyecto, c.fecha_registro || c.updatedAt);
    }
  });
  allTasksLatest.forEach(t => { if (!lastTaskDateMap.has(t.id_proyecto)) lastTaskDateMap.set(t.id_proyecto, t.updatedAt); });

  const now = Date.now();
  const projectsWithCalculations = projectsList.map(project => {
    const id = project.id_proyecto;
    const calc = calcMap.get(id) || {};
    const nextMilestone = nextMilestoneMap.get(id) || null;
    const ultimo_comentario = lastCommentMap.get(id) || '';

    const projectDate = project.updatedAt || project.createdAt;
    const lastCommentDate = lastCommentDateMap.get(id);
    const lastTaskDate = lastTaskDateMap.get(id);

    const timestamps = [projectDate ? new Date(projectDate).getTime() : 0, lastCommentDate ? new Date(lastCommentDate).getTime() : 0, lastTaskDate ? new Date(lastTaskDate).getTime() : 0];
    const maxTime = Math.max(...timestamps);
    const fecha_ultima_actividad = new Date(maxTime).toISOString();
    const dias_sin_actualizar = Math.max(0, Math.floor((now - maxTime) / (1000 * 60 * 60 * 24)));

    return {
      ...project.toJSON(), calculations: calc, nextMilestone, ultimo_comentario, fecha_ultima_actividad,
      dias_sin_actualizar, es_desactualizado: dias_sin_actualizar > 14,
      nivel_frescura: dias_sin_actualizar <= 7 ? 'FRESCO' : (dias_sin_actualizar <= 14 ? 'MODERADO' : 'DESACTUALIZADO')
    };
  });

  res.json(projectsWithCalculations);
});

const getProjectDetail = asyncHandler(async (req, res) => {
  const { id_proyecto } = req.params;
  const project = await Proyectos.findByPk(id_proyecto, {
    include: [
      { model: Usuarios, as: 'PM', attributes: ['id_usuario', 'nombre', 'apellidos', 'correo'] },
      { model: Proveedores, as: 'Proveedor', attributes: ['id_proveedor', 'nombre_razon_social'] },
      { model: Sedes, as: 'Sede', attributes: ['id_sede', 'nombre_sede'] },
      { model: Sedes, as: 'SedeDistribuir', attributes: ['id_sede', 'nombre_sede'] },
      { model: ContactosProveedor, as: 'Sponsor', attributes: ['id_contacto', 'nombre', 'apellidos', 'email'] },
      { model: Portfolios, as: 'Portfolio', attributes: ['id', 'nombre', 'descripcion'] },
      { model: Tags, as: 'Tags', through: { attributes: [] } },
      { model: TiposCapex, as: 'TipoCapex', attributes: ['id', 'nombre'] },
      { model: SubtiposCapex, as: 'SubtipoCapex', attributes: ['id', 'nombre'] },
      { model: ContactosProveedor, as: 'InvolvedContacts', through: { attributes: ['rol', 'raci'] }, include: [{ model: Proveedores, attributes: ['nombre_razon_social', 'es_grupo_dacsa'] }] },
      { model: ContactosProveedor, as: 'ComSemanalContactos', through: { attributes: [] }, include: [{ model: Proveedores, attributes: ['nombre_razon_social', 'es_grupo_dacsa'] }] },
      { model: ContactosProveedor, as: 'ComMensualContactos', through: { attributes: [] }, include: [{ model: Proveedores, attributes: ['nombre_razon_social', 'es_grupo_dacsa'] }] },
      { model: ContactosProveedor, as: 'ComSteerCoContactos', through: { attributes: [] }, include: [{ model: Proveedores, attributes: ['nombre_razon_social', 'es_grupo_dacsa'] }] },
      { model: PlanesComunicacion, as: 'PlanesComunicacion', include: [{ model: ContactosProveedor, as: 'Contactos', through: { attributes: [] } }, { model: PlanComunicacionLog, as: 'Logs', limit: 5, order: [['fecha_envio', 'DESC']] }] },
      { model: Incidencias, include: [{ model: Tareas, as: 'tarea', attributes: ['id_tarea', 'titulo_tarea', 'es_hito', 'estado'] }], order: [['fecha_apertura', 'DESC']] },
      { model: Riesgos, include: [{ model: Tareas, as: 'tarea', attributes: ['id_tarea', 'titulo_tarea', 'es_hito', 'estado'] }], order: [['fecha_proxima_revision', 'ASC']] },
      { model: LeccionesAprendidas, order: [['fecha_registro', 'DESC']] },
      { model: Facturas, include: [{ model: TiposFactura, as: 'TipoFactura' }], order: [['fecha_factura', 'DESC']] },
      { model: CambiosAlcance, include: [{ model: ContactosProveedor, as: 'Solicitante', attributes: ['nombre', 'apellidos'] }, { model: ContactosProveedor, as: 'Aprobador', attributes: ['nombre', 'apellidos'] }], order: [['fecha_solicitud', 'DESC']] },
      { model: Tareas, order: [['fecha_limite', 'ASC']] },
      { model: EstadosProyecto, as: 'Estado', attributes: ['id_estado', 'nombre_estado', 'icono', 'descripcion', 'pasos'] }
    ]
  });

  if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
  const calc = await getProjectCalculations(project.id_proyecto, project.budget_inicial, project.fecha_fin_inicial);
  res.json({ ...project.toJSON(), calculations: calc });
});

module.exports = { getProjects, getProjectDetail };
