const { Op } = require('sequelize');
const { 
  Proyectos, 
  Tareas, 
  PlanesComunicacion, 
  PlanComunicacionLog,
  Usuarios,
  ContactosProveedor
} = require('../models/index');
const { asyncHandler } = require('../middlewares/errorHandler');

// Auxiliar: Calcula si un plan de comunicación tiene ejecución pendiente en los próximos N días
function isPlanPendingInWindow(plan, logs, startDate, endDate) {
  const periodicity = (plan.periodicidad || '').toLowerCase();
  let nextDate = null;
  const today = new Date(startDate);
  today.setHours(0, 0, 0, 0);

  if (periodicity.includes('semanal')) {
    const targetDay = Number(plan.dia_semana) || 1; // 1: Lunes ... 7: Domingo
    const currentDay = today.getDay() === 0 ? 7 : today.getDay();
    let diff = targetDay - currentDay;
    if (diff < 0) diff += 7;
    nextDate = new Date(today);
    nextDate.setDate(today.getDate() + diff);
  } else if (periodicity.includes('mensual')) {
    const targetDay = Number(plan.dia_mes) || 1;
    nextDate = new Date(today.getFullYear(), today.getMonth(), targetDay);
    if (nextDate < today) {
      nextDate = new Date(today.getFullYear(), today.getMonth() + 1, targetDay);
    }
  } else {
    nextDate = new Date(today);
  }

  if (!nextDate || nextDate > endDate) return null;

  // Inicio del ciclo para la próxima fecha
  const cycleStart = new Date(nextDate);
  if (periodicity.includes('semanal')) {
    cycleStart.setDate(nextDate.getDate() - 6);
  } else if (periodicity.includes('mensual')) {
    cycleStart.setDate(1);
  }
  cycleStart.setHours(0, 0, 0, 0);

  // Verificar si ya se envió un informe para el ciclo actual
  const hasRecentLog = logs.some(log => {
    if (log.id_plan_comunicacion !== plan.id) return false;
    const logDate = new Date(log.fecha_envio || log.createdAt);
    return logDate >= cycleStart && logDate <= nextDate;
  });

  return hasRecentLog ? null : nextDate;
}

const getPendingAssistant = asyncHandler(async (req, res) => {
  const pmId = req.currentPmId;
  const daysParam = parseInt(req.query.days, 10);
  const days = [7, 15, 30].includes(daysParam) ? daysParam : 7;

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + days);
  endDate.setHours(23, 59, 59, 999);

  // El asistente recuerda pendientes de proyectos donde el usuario es el Project Manager asignado (id_pm)
  const userProjects = await Proyectos.findAll({
    where: { id_pm: pmId },
    attributes: ['id_proyecto', 'uuid_v7', 'nombre_proyecto', 'estado_proyecto']
  });

  if (!userProjects.length) {
    return res.json({ totalPendingCount: 0, projects: [] });
  }

  const projectIds = userProjects.map(p => p.id_proyecto);

  // Obtener todas las tareas de los proyectos asignados
  const allTasks = await Tareas.findAll({
    where: { id_proyecto: { [Op.in]: projectIds } },
    order: [['fecha_limite', 'ASC']]
  });

  // Filtrar en Javascript para manejar insensibilidad a mayúsculas y fechas compuestas
  const filteredTasks = allTasks.filter(t => {
    const status = String(t.estado || '').trim().toLowerCase();
    if (status === 'completada' || status === 'cerrada' || status === 'finalizada') return false;

    const effDateStr = t.fecha_actual_cierre || t.fecha_original_cierre || t.fecha_limite;
    if (!effDateStr) return false;

    const effDate = new Date(effDateStr);
    return effDate <= endDate;
  });

  // Obtener planes de comunicación activos
  const commPlans = await PlanesComunicacion.findAll({
    where: {
      id_proyecto: { [Op.in]: projectIds },
      activo: true
    },
    include: [
      {
        model: ContactosProveedor,
        as: 'Contactos',
        through: { attributes: [] }
      }
    ]
  });

  const planIds = commPlans.map(cp => cp.id);
  const commLogs = planIds.length ? await PlanComunicacionLog.findAll({
    where: { id_plan_comunicacion: { [Op.in]: planIds } },
    order: [['fecha_envio', 'DESC']]
  }) : [];

  let totalPendingCount = 0;
  const projectMap = {};

  userProjects.forEach(p => {
    projectMap[p.id_proyecto] = {
      id_proyecto: p.id_proyecto,
      uuid_v7: p.uuid_v7,
      nombre_proyecto: p.nombre_proyecto,
      tareas: [],
      planesComunicacion: []
    };
  });

  // Mapear tareas pendientes
  filteredTasks.forEach(t => {
    const effDateStr = t.fecha_actual_cierre || t.fecha_original_cierre || t.fecha_limite;
    const isOverdue = new Date(effDateStr) < startDate;
    const item = {
      id_tarea: t.id_tarea,
      id_proyecto: t.id_proyecto,
      titulo_tarea: t.titulo_tarea,
      descripcion: t.descripcion,
      fecha_limite: t.fecha_limite || effDateStr,
      fecha_original_cierre: t.fecha_original_cierre,
      fecha_actual_cierre: t.fecha_actual_cierre,
      fecha_real_cierre: t.fecha_real_cierre,
      es_hito: t.es_hito,
      estado: t.estado,
      isOverdue
    };
    if (projectMap[t.id_proyecto]) { projectMap[t.id_proyecto].tareas.push(item); totalPendingCount++; }
  });

  // Mapear planes de comunicación
  commPlans.forEach(cp => {
    const nextDate = isPlanPendingInWindow(cp, commLogs, startDate, endDate);
    if (nextDate) {
      const item = { id: cp.id, titulo: cp.titulo, finalidad: cp.finalidad, periodicidad: cp.periodicidad, proximaFecha: nextDate, Contactos: cp.Contactos || [] };
      if (projectMap[cp.id_proyecto]) { projectMap[cp.id_proyecto].planesComunicacion.push(item); totalPendingCount++; }
    }
  });

  const projectsWithPending = Object.values(projectMap).filter(p => p.tareas.length > 0 || p.planesComunicacion.length > 0);
  res.json({ totalPendingCount, projects: projectsWithPending });
});

module.exports = { getPendingAssistant };
