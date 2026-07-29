const { Op } = require('sequelize');
const { 
  Sedes, Proveedores, Usuarios, EstadosProyecto, 
  Proyectos, Facturas, CambiosAlcance, Riesgos, Incidencias, Tareas, ComentariosProyecto,
  Portfolios, Tags
} = require('../../models/index');
const { getProjectsCalculationsBatch } = require('../../models/automations');
const { asyncHandler } = require('../../middlewares/errorHandler');
const { getPortfolioBudgetReport } = require('./dashboardReport.controller');
const { getTimeline } = require('./dashboardTimeline.controller');

const getPortfolioDashboard = asyncHandler(async (req, res) => {
  const { pm, fecha_desde, fecha_hasta, search, vendor, rag, state, portfolio, tag, iniciativa_ligera, estrategico } = req.query;
  const user = await Usuarios.findByPk(req.currentPmId);
  const canSeeDireccion = user && (user.perfil === 'ADMINISTRADOR' || user.perfil === 'DIRECTOR');
  
  const where = {};
  if (pm) where.id_pm = parseInt(pm, 10);
  if (vendor) where.id_proveedor = parseInt(vendor, 10);
  if (rag) where.indicador_rag = rag;
  if (iniciativa_ligera) where.es_iniciativa_ligera = iniciativa_ligera === 'true';
  if (estrategico) where.es_estrategico = estrategico === 'true';
  if (portfolio) where.portfolio_id = parseInt(portfolio, 10);
  if (search) where.nombre_proyecto = { [Op.like]: `%${search}%` };
  if (tag) {
    const pTag = await Proyectos.findAll({ attributes: ['id_proyecto'], include: [{ model: Tags, as: 'Tags', where: { id: tag }, attributes: [] }], raw: true });
    where.id_proyecto = { [Op.in]: pTag.map(p => p.id_proyecto) };
  }

  const projectsList = await Proyectos.findAll({
    where,
    attributes: { exclude: ['descripcion', 'alcance_por_que', 'alcance_objetivo', 'alcance_resultados', 'alcance_limitaciones', 'alcance_integraciones', 'alcance_desarrollo', 'cierre_aceptacion', 'cierre_exito', 'com_semanal_finalidad', 'com_mensual_finalidad', 'com_steerco_finalidad'] },
    include: [
      { model: Usuarios, as: 'PM', attributes: ['nombre', 'apellidos'] },
      { model: Proveedores, as: 'Proveedor', attributes: ['nombre_razon_social'] },
      { model: Sedes, as: 'Sede', attributes: ['nombre_sede'] },
      { model: Sedes, as: 'SedeDistribuir', attributes: ['nombre_sede'] },
      { model: Portfolios, as: 'Portfolio', attributes: ['id', 'nombre'] },
      { model: Tags, as: 'Tags', through: { attributes: [] } },
      { model: EstadosProyecto, as: 'Estado', attributes: ['nombre_estado', 'icono', 'descripcion'], ...(state ? { where: { nombre_estado: { [Op.in]: state.split(',') } } } : {}) }
    ],
    order: [['createdAt', 'DESC']]
  });

  if (!projectsList || projectsList.length === 0) return res.json([]);

  const projectIds = projectsList.map(p => p.id_proyecto);
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Batch calculations & child queries
  const [calcMap, allFacturas, allCRs, allMilestones, allRiesgos, allIncidencias, allComments] = await Promise.all([
    getProjectsCalculationsBatch(projectsList),
    Facturas.findAll({ where: { id_proyecto: { [Op.in]: projectIds } }, attributes: ['id_proyecto', 'PO', 'updatedAt'], raw: true }),
    CambiosAlcance.findAll({ where: { id_proyecto: { [Op.in]: projectIds } }, attributes: ['id_proyecto', 'updatedAt'], raw: true }),
    Tareas.findAll({ where: { id_proyecto: { [Op.in]: projectIds }, es_hito: true }, attributes: ['id_proyecto', 'titulo_tarea', 'fecha_limite', 'estado', 'updatedAt'], order: [['fecha_limite', 'ASC']], raw: true }),
    Riesgos.findAll({ where: { id_proyecto: { [Op.in]: projectIds } }, attributes: ['id_proyecto', 'updatedAt'], raw: true }),
    Incidencias.findAll({ where: { id_proyecto: { [Op.in]: projectIds } }, attributes: ['id_proyecto', 'updatedAt'], raw: true }),
    ComentariosProyecto.findAll({ where: { id_proyecto: { [Op.in]: projectIds }, ...(!canSeeDireccion ? { para_direccion: false } : {}) }, attributes: ['id_proyecto', 'texto_comentario', 'fecha_registro'], order: [['fecha_registro', 'DESC']], raw: true })
  ]);

  const poSets = new Map(), maxUpdatedMap = new Map(), crCountMap = new Map(), nextMilestoneMap = new Map(), overdueSet = new Set(), lastCommentMap = new Map();
  projectsList.forEach(p => maxUpdatedMap.set(p.id_proyecto, new Date(p.updatedAt || p.createdAt)));

  allFacturas.forEach(f => {
    if (f.PO) { const s = poSets.get(f.id_proyecto) || new Set(); s.add(f.PO); poSets.set(f.id_proyecto, s); }
    if (f.updatedAt && new Date(f.updatedAt) > maxUpdatedMap.get(f.id_proyecto)) maxUpdatedMap.set(f.id_proyecto, new Date(f.updatedAt));
  });

  allCRs.forEach(cr => {
    crCountMap.set(cr.id_proyecto, (crCountMap.get(cr.id_proyecto) || 0) + 1);
    if (cr.updatedAt && new Date(cr.updatedAt) > maxUpdatedMap.get(cr.id_proyecto)) maxUpdatedMap.set(cr.id_proyecto, new Date(cr.updatedAt));
  });

  allMilestones.forEach(t => {
    if (t.estado === 'PENDIENTE') {
      if (!nextMilestoneMap.has(t.id_proyecto)) nextMilestoneMap.set(t.id_proyecto, { titulo_tarea: t.titulo_tarea, fecha_limite: t.fecha_limite });
      if (t.fecha_limite && t.fecha_limite < todayStr) overdueSet.add(t.id_proyecto);
    }
    if (t.updatedAt && new Date(t.updatedAt) > maxUpdatedMap.get(t.id_proyecto)) maxUpdatedMap.set(t.id_proyecto, new Date(t.updatedAt));
  });

  [...allRiesgos, ...allIncidencias].forEach(item => {
    if (item.updatedAt && new Date(item.updatedAt) > maxUpdatedMap.get(item.id_proyecto)) maxUpdatedMap.set(item.id_proyecto, new Date(item.updatedAt));
  });

  allComments.forEach(c => {
    if (!lastCommentMap.has(c.id_proyecto)) lastCommentMap.set(c.id_proyecto, c.texto_comentario ? c.texto_comentario.replace(/<[^>]+>/g, '') : '');
  });

  const dashboardData = projectsList.map(p => {
    const id = p.id_proyecto, calc = calcMap.get(id) || {};
    const pos = poSets.get(id), po_list = pos ? Array.from(pos).join(', ') : '';
    const maxUpdated = maxUpdatedMap.get(id) || new Date(p.updatedAt || p.createdAt);

    return {
      ...p.toJSON(), calculations: calc, id_proyecto: p.id_proyecto, nombre_proyecto: p.nombre_proyecto, id_pm: p.id_pm,
      pm_nombre: p.PM ? `${p.PM.nombre} ${p.PM.apellidos}` : 'Sin PM', id_proveedor: p.id_proveedor,
      prov_nombre: p.Proveedor ? p.Proveedor.nombre_razon_social : 'Sin Partner', sede_nombre: p.Sede ? p.Sede.nombre_sede : '',
      id_sede_distribuir: p.id_sede_distribuir, distribuir_sede_nombre: p.SedeDistribuir ? p.SedeDistribuir.nombre_sede : '',
      id_estado: p.id_estado, estado_proyecto: p.Estado ? p.Estado.nombre_estado : 'Sin Estado',
      estado_descripcion: p.Estado ? p.Estado.descripcion : null, estado_icono: p.Estado ? p.Estado.icono : '❓',
      indicador_rag: p.indicador_rag, es_capex: p.es_capex, codigo_capex: p.codigo_capex, budget_inicial: parseFloat(p.budget_inicial),
      fecha_inicio: p.fecha_inicio, fecha_fin_inicial: p.fecha_fin_inicial, fecha_fin_estimada: calc.fecha_fin_estimada,
      dias_retraso_aprobados: calc.total_cr_dias || 0, gasto_total_facturas: calc.consumo_real || 0,
      cambios_alcance_count: crCountMap.get(id) || 0, po_list, proximo_hito: nextMilestoneMap.get(id) || null,
      has_hito_vencido: overdueSet.has(id), com_semanal_activo: p.com_semanal_activo, com_mensual_activo: p.com_mensual_activo,
      com_steerco_activo: p.com_steerco_activo, ultima_actualizacion: maxUpdated.toISOString(), ultimo_comentario: lastCommentMap.get(id) || ''
    };
  });

  let finalData = dashboardData;
  if (fecha_desde || fecha_hasta) {
    finalData = dashboardData.filter(p => (!fecha_desde || p.fecha_fin_estimada >= fecha_desde) && (!fecha_hasta || p.fecha_inicio <= fecha_hasta));
  }

  res.json(finalData);
});

module.exports = { getPortfolioDashboard, getTimeline, getPortfolioBudgetReport };
