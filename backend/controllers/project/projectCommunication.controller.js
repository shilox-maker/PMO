const { 
  PlanesComunicacion, 
  PlanComunicacionContacto, 
  PlanComunicacionLog, 
  ContactosProveedor, 
  Usuarios 
} = require('../../models/index');
const { asyncHandler } = require('../../middlewares/errorHandler');

// Get all communication plans for a project
const getCommunicationPlans = asyncHandler(async (req, res) => {
  const { id_proyecto } = req.params;
  const plans = await PlanesComunicacion.findAll({
    where: { id_proyecto },
    include: [
      {
        model: ContactosProveedor,
        as: 'Contactos',
        through: { attributes: [] }
      },
      {
        model: PlanComunicacionLog,
        as: 'Logs',
        limit: 5,
        order: [['fecha_envio', 'DESC']]
      }
    ],
    order: [['createdAt', 'ASC']]
  });
  res.json(plans);
});

// Create a communication plan
const createCommunicationPlan = asyncHandler(async (req, res) => {
  const { id_proyecto } = req.params;
  const { titulo, finalidad, periodicidad, intervalo, dia_semana, dia_mes, activo, contactosIds } = req.body;

  if (!titulo) {
    return res.status(400).json({ error: 'El título del plan de comunicación es obligatorio.' });
  }

  const cleanNumber = (val) => {
    if (val === null || val === undefined || val === '') return null;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? null : parsed;
  };

  const plan = await PlanesComunicacion.create({
    id_proyecto,
    titulo: titulo.trim(),
    finalidad: finalidad || null,
    periodicidad: periodicidad || 'SEMANAL',
    intervalo: cleanNumber(intervalo) || 1,
    dia_semana: cleanNumber(dia_semana),
    dia_mes: cleanNumber(dia_mes),
    activo: activo !== undefined ? !!activo : true
  });

  if (Array.isArray(contactosIds) && contactosIds.length > 0) {
    await plan.setContactos(contactosIds);
  }

  const reloaded = await PlanesComunicacion.findByPk(plan.id, {
    include: [{ model: ContactosProveedor, as: 'Contactos', through: { attributes: [] } }]
  });

  res.status(201).json(reloaded);
});

// Update a communication plan
const updateCommunicationPlan = asyncHandler(async (req, res) => {
  const { id_plan } = req.params;
  const { titulo, finalidad, periodicidad, intervalo, dia_semana, dia_mes, activo, contactosIds } = req.body;

  const plan = await PlanesComunicacion.findByPk(id_plan);
  if (!plan) {
    return res.status(404).json({ error: 'Plan de comunicación no encontrado.' });
  }

  const cleanNumber = (val) => {
    if (val === null || val === undefined || val === '') return null;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? null : parsed;
  };

  if (titulo !== undefined) plan.titulo = titulo.trim();
  if (finalidad !== undefined) plan.finalidad = finalidad;
  if (periodicidad !== undefined) plan.periodicidad = periodicidad;
  if (intervalo !== undefined) plan.intervalo = cleanNumber(intervalo) || 1;
  if (dia_semana !== undefined) plan.dia_semana = cleanNumber(dia_semana);
  if (dia_mes !== undefined) plan.dia_mes = cleanNumber(dia_mes);
  if (activo !== undefined) plan.activo = !!activo;

  await plan.save();

  if (Array.isArray(contactosIds)) {
    await plan.setContactos(contactosIds);
  }

  const reloaded = await PlanesComunicacion.findByPk(plan.id, {
    include: [{ model: ContactosProveedor, as: 'Contactos', through: { attributes: [] } }]
  });

  res.json(reloaded);
});

// Delete a communication plan
const deleteCommunicationPlan = asyncHandler(async (req, res) => {
  const { id_plan } = req.params;
  const plan = await PlanesComunicacion.findByPk(id_plan);
  if (!plan) {
    return res.status(404).json({ error: 'Plan de comunicación no encontrado.' });
  }
  await plan.destroy();
  res.json({ message: 'Plan de comunicación eliminado correctamente.' });
});

// Create audit log entry for email send
const createCommunicationLog = asyncHandler(async (req, res) => {
  const { id_proyecto } = req.params;
  const { id_plan_comunicacion, destinatarios, observaciones } = req.body;

  const log = await PlanComunicacionLog.create({
    id_proyecto,
    id_plan_comunicacion: id_plan_comunicacion ? parseInt(id_plan_comunicacion, 10) : null,
    id_usuario: req.user ? req.user.id_usuario : null,
    fecha_envio: new Date(),
    destinatarios: Array.isArray(destinatarios) ? destinatarios.join(', ') : (destinatarios || ''),
    observaciones: observaciones || null
  });

  res.status(201).json(log);
});

// Get communication audit logs for a project
const getCommunicationLogs = asyncHandler(async (req, res) => {
  const { id_proyecto } = req.params;
  const logs = await PlanComunicacionLog.findAll({
    where: { id_proyecto },
    include: [
      { model: PlanesComunicacion, as: 'PlanComunicacion', attributes: ['id', 'titulo'] },
      { model: Usuarios, as: 'Usuario', attributes: ['id_usuario', 'nombre', 'apellidos', 'correo'] }
    ],
    order: [['fecha_envio', 'DESC']]
  });
  res.json(logs);
});

module.exports = {
  getCommunicationPlans,
  createCommunicationPlan,
  updateCommunicationPlan,
  deleteCommunicationPlan,
  createCommunicationLog,
  getCommunicationLogs
};
