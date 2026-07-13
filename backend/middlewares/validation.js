const Joi = require('joi');

// Middleware genérico de validación
const validateBody = (schema) => (req, res, next) => {
  console.log(`[Validation Request] Path: ${req.path} | Body:`, req.body);
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const errorDetails = error.details.map(detail => detail.message).join(', ');
    console.error(`[Validation Failed] Path: ${req.path} | Error: ${errorDetails}`);
    return res.status(400).json({ error: errorDetails });
  }
  req.body = value; // Reemplazar con los datos validados y filtrados
  next();
};

// ==========================================
// ESQUEMAS DE VALIDACIÓN DE PROYECTOS
// ==========================================

const projectCreateSchema = Joi.object({
  id_proyecto: Joi.string().pattern(/^PRJ-\d{4}-\d{3}$/).required()
    .messages({ 'string.pattern.base': 'El ID del proyecto debe tener el formato PRJ-YYYY-XXX' }),
  nombre_proyecto: Joi.string().max(255).required(),
  descripcion: Joi.string().required(),
  id_pm: Joi.number().integer().required(),
  id_proveedor: Joi.number().integer().allow(null).optional(),
  id_sede: Joi.number().integer().required(),
  id_sponsor: Joi.number().integer().allow(null).optional(),
  id_estado: Joi.number().integer().optional(),
  portfolio_id: Joi.number().integer().allow(null).optional(),
  indicador_rag: Joi.string().valid('VERDE', 'AMARILLO', 'ROJO').default('VERDE'),
  fecha_inicio: Joi.string().isoDate().required(),
  fecha_fin_inicial: Joi.string().isoDate().allow(null).optional(),
  es_capex: Joi.boolean().default(false),
  codigo_capex: Joi.string().allow('', null).optional().when('es_capex', {
    is: true,
    then: Joi.string().required().messages({ 'any.required': 'El código CAPEX es obligatorio cuando el proyecto es CAPEX.' })
  }),
  es_estrategico: Joi.boolean().default(false),
  budget_inicial: Joi.number().precision(2).positive().allow(0).optional(),
  com_semanal_activo: Joi.boolean().default(false),
  com_semanal_finalidad: Joi.string().allow('', null).optional(),
  com_mensual_activo: Joi.boolean().default(false),
  com_mensual_finalidad: Joi.string().allow('', null).optional(),
  com_steerco_activo: Joi.boolean().default(false),
  com_steerco_finalidad: Joi.string().allow('', null).optional(),
  alcance_por_que: Joi.string().allow('', null).optional(),
  alcance_objetivo: Joi.string().allow('', null).optional(),
  alcance_resultados: Joi.string().allow('', null).optional(),
  alcance_limitaciones: Joi.string().allow('', null).optional(),
  alcance_integraciones: Joi.string().allow('', null).optional(),
  alcance_desarrollo: Joi.string().allow('', null).optional(),
  cierre_aceptacion: Joi.string().allow('', null).optional(),
  cierre_exito: Joi.string().allow('', null).optional(),
  fecha_peticion: Joi.string().empty('').isoDate().allow(null).optional(),
  fecha_alcance_definido: Joi.string().empty('').isoDate().allow(null).optional(),
  fecha_aprobacion: Joi.string().empty('').isoDate().allow(null).optional(),
  fecha_planificacion: Joi.string().empty('').isoDate().allow(null).optional(),
  fecha_kickoff: Joi.string().empty('').isoDate().allow(null).optional(),
  fecha_go_live: Joi.string().empty('').isoDate().allow(null).optional(),
  fecha_cierre: Joi.string().empty('').isoDate().allow(null).optional(),
  involvedKus: Joi.array().items(Joi.number().integer()).optional(),
  comSemanalKus: Joi.array().items(Joi.number().integer()).optional(),
  comMensualKus: Joi.array().items(Joi.number().integer()).optional(),
  comSteercoKus: Joi.array().items(Joi.number().integer()).optional(),
  tagIds: Joi.array().items(Joi.number().integer()).optional()
});

const projectUpdateSchema = Joi.object({
  nombre_proyecto: Joi.string().max(255).optional(),
  descripcion: Joi.string().optional(),
  id_pm: Joi.number().integer().optional(),
  id_proveedor: Joi.number().integer().allow(null).optional(),
  id_sede: Joi.number().integer().optional(),
  id_sponsor: Joi.number().integer().allow(null).optional(),
  id_estado: Joi.number().integer().optional(),
  portfolio_id: Joi.number().integer().allow(null).optional(),
  indicador_rag: Joi.string().valid('VERDE', 'AMARILLO', 'ROJO').optional(),
  fecha_inicio: Joi.string().isoDate().optional(),
  fecha_fin_inicial: Joi.string().isoDate().allow(null).optional(),
  es_capex: Joi.boolean().optional(),
  codigo_capex: Joi.string().allow('', null).optional().when('es_capex', {
    is: true,
    then: Joi.string().required().messages({ 'any.required': 'El código CAPEX es obligatorio cuando el proyecto es CAPEX.' })
  }),
  es_estrategico: Joi.boolean().optional(),
  budget_inicial: Joi.number().precision(2).positive().allow(0).optional(),
  com_semanal_activo: Joi.boolean().optional(),
  com_semanal_finalidad: Joi.string().allow('', null).optional(),
  com_mensual_activo: Joi.boolean().optional(),
  com_mensual_finalidad: Joi.string().allow('', null).optional(),
  com_steerco_activo: Joi.boolean().optional(),
  com_steerco_finalidad: Joi.string().allow('', null).optional(),
  alcance_por_que: Joi.string().allow('', null).optional(),
  alcance_objetivo: Joi.string().allow('', null).optional(),
  alcance_resultados: Joi.string().allow('', null).optional(),
  alcance_limitaciones: Joi.string().allow('', null).optional(),
  alcance_integraciones: Joi.string().allow('', null).optional(),
  alcance_desarrollo: Joi.string().allow('', null).optional(),
  cierre_aceptacion: Joi.string().allow('', null).optional(),
  cierre_exito: Joi.string().allow('', null).optional(),
  fecha_peticion: Joi.string().empty('').isoDate().allow(null).optional(),
  fecha_alcance_definido: Joi.string().empty('').isoDate().allow(null).optional(),
  fecha_aprobacion: Joi.string().empty('').isoDate().allow(null).optional(),
  fecha_planificacion: Joi.string().empty('').isoDate().allow(null).optional(),
  fecha_kickoff: Joi.string().empty('').isoDate().allow(null).optional(),
  fecha_go_live: Joi.string().empty('').isoDate().allow(null).optional(),
  fecha_cierre: Joi.string().empty('').isoDate().allow(null).optional(),
  involvedKus: Joi.array().items(Joi.number().integer()).optional(),
  comSemanalKus: Joi.array().items(Joi.number().integer()).optional(),
  comMensualKus: Joi.array().items(Joi.number().integer()).optional(),
  comSteercoKus: Joi.array().items(Joi.number().integer()).optional(),
  tagIds: Joi.array().items(Joi.number().integer()).optional()
});

// ==========================================
// ESQUEMAS DE VALIDACIÓN DE FACTURAS
// ==========================================

const invoiceCreateSchema = Joi.object({
  id_interno_factura: Joi.string().optional(),
  id_proyecto: Joi.string().required(),
  id_proveedor: Joi.number().integer().allow(null).optional(),
  numero_factura: Joi.string().allow('', null).optional(),
  concepto: Joi.string().required(),
  fecha_factura: Joi.string().isoDate().required(),
  importe: Joi.number().precision(2).required(),
  estado: Joi.string().valid('PENDIENTE_DE_RECIBIR', 'RECIBIDA').required(),
  PO: Joi.string().allow('', null).optional()
});

const invoiceUpdateSchema = Joi.object({
  id_proyecto: Joi.string().optional(),
  id_proveedor: Joi.number().integer().allow(null).optional(),
  numero_factura: Joi.string().allow('', null).optional(),
  concepto: Joi.string().optional(),
  fecha_factura: Joi.string().isoDate().optional(),
  importe: Joi.number().precision(2).optional(),
  estado: Joi.string().valid('PENDIENTE_DE_RECIBIR', 'RECIBIDA').optional(),
  PO: Joi.string().allow('', null).optional()
});

// ==========================================
// ESQUEMAS DE VALIDACIÓN DE CAMBIOS DE ALCANCE
// ==========================================

const scopeChangeCreateSchema = Joi.object({
  id_cambio: Joi.string().optional(),
  id_proyecto: Joi.string().required(),
  fecha_solicitud: Joi.string().isoDate().required(),
  fecha_resolucion: Joi.string().isoDate().allow(null).optional(),
  id_solicitante_contacto: Joi.number().integer().required(),
  id_aprobador_contacto: Joi.number().integer().required(),
  estado_cambio: Joi.string().valid('SOLICITADO', 'APROBADO', 'RECHAZADO').default('SOLICITADO'),
  descripcion_motivo: Joi.string().required(),
  impacta_importe: Joi.boolean().default(false),
  importe_impacto: Joi.number().precision(2).allow(0).optional().when('impacta_importe', {
    is: true,
    then: Joi.number().required().messages({ 'any.required': 'El importe de impacto es obligatorio cuando impacta importe.' })
  }),
  impacta_tiempo: Joi.boolean().default(false),
  dias_impacto: Joi.number().integer().allow(0).optional().when('impacta_tiempo', {
    is: true,
    then: Joi.number().required().messages({ 'any.required': 'Los días de impacto son obligatorios cuando impacta tiempo.' })
  })
});

const scopeChangeUpdateSchema = Joi.object({
  id_proyecto: Joi.string().optional(),
  fecha_solicitud: Joi.string().isoDate().optional(),
  fecha_resolucion: Joi.string().isoDate().allow(null).optional(),
  id_solicitante_contacto: Joi.number().integer().optional(),
  id_aprobador_contacto: Joi.number().integer().optional(),
  estado_cambio: Joi.string().valid('SOLICITADO', 'APROBADO', 'RECHAZADO').optional(),
  descripcion_motivo: Joi.string().optional(),
  impacta_importe: Joi.boolean().optional(),
  importe_impacto: Joi.number().precision(2).allow(0).optional().when('impacta_importe', {
    is: true,
    then: Joi.number().required().messages({ 'any.required': 'El importe de impacto es obligatorio cuando impacta importe.' })
  }),
  impacta_tiempo: Joi.boolean().optional(),
  dias_impacto: Joi.number().integer().allow(0).optional().when('impacta_tiempo', {
    is: true,
    then: Joi.number().required().messages({ 'any.required': 'Los días de impacto son obligatorios cuando impacta tiempo.' })
  })
});

// ==========================================
// ESQUEMAS DE VALIDACIÓN DE RIESGOS
// ==========================================

const riskCreateSchema = Joi.object({
  id_riesgo: Joi.string().optional(),
  id_proyecto: Joi.string().required(),
  titulo_riesgo: Joi.string().max(255).required(),
  descripcion: Joi.string().allow('', null).optional(),
  probabilidad: Joi.string().valid('ALTA', 'MEDIA', 'BAJA').required(),
  impacto: Joi.string().valid('ALTA', 'MEDIA', 'BAJA').required(),
  plan_mitigacion: Joi.string().required(),
  estado_riesgo: Joi.string().valid('ACTIVO', 'CERRADO').default('ACTIVO'),
  fecha_proxima_revision: Joi.string().isoDate().required()
});

const riskUpdateSchema = Joi.object({
  id_proyecto: Joi.string().optional(),
  titulo_riesgo: Joi.string().max(255).optional(),
  descripcion: Joi.string().allow('', null).optional(),
  probabilidad: Joi.string().valid('ALTA', 'MEDIA', 'BAJA').optional(),
  impacto: Joi.string().valid('ALTA', 'MEDIA', 'BAJA').optional(),
  plan_mitigacion: Joi.string().optional(),
  estado_riesgo: Joi.string().valid('ACTIVO', 'CERRADO').optional(),
  fecha_proxima_revision: Joi.string().isoDate().optional()
});

// ==========================================
// ESQUEMAS DE VALIDACIÓN DE INCIDENCIAS
// ==========================================

const issueCreateSchema = Joi.object({
  id_incidencia: Joi.string().optional(),
  id_proyecto: Joi.string().required(),
  titulo: Joi.string().max(255).required(),
  descripcion: Joi.string().required(),
  tipo_incidencias: Joi.string().valid('TECNICA', 'RETRASO_PLAZOS', 'PROVEEDOR_DESAPARECIDO', 'PRESUPUESTARIA').required(),
  criticidad: Joi.string().valid('BLOQUEANTE', 'ALTA', 'MEDIA', 'BAJA').required(),
  estado: Joi.string().valid('ABIERTA', 'EN_PROCESO', 'RESUELTA', 'CANCELADA').default('ABIERTA'),
  fecha_apertura: Joi.string().isoDate().required(),
  fecha_cierre: Joi.string().isoDate().allow(null).optional(),
  solucion_aplicada: Joi.string().allow('', null).optional().when('estado', {
    is: 'RESUELTA',
    then: Joi.string().required().messages({ 'any.required': 'La solución aplicada es obligatoria cuando la incidencia está RESUELTA.' })
  })
});

const issueUpdateSchema = Joi.object({
  id_proyecto: Joi.string().optional(),
  titulo: Joi.string().max(255).optional(),
  descripcion: Joi.string().optional(),
  tipo_incidencias: Joi.string().valid('TECNICA', 'RETRASO_PLAZOS', 'PROVEEDOR_DESAPARECIDO', 'PRESUPUESTARIA').optional(),
  criticidad: Joi.string().valid('BLOQUEANTE', 'ALTA', 'MEDIA', 'BAJA').optional(),
  estado: Joi.string().valid('ABIERTA', 'EN_PROCESO', 'RESUELTA', 'CANCELADA').optional(),
  fecha_apertura: Joi.string().isoDate().optional(),
  fecha_cierre: Joi.string().isoDate().allow(null).optional(),
  solucion_aplicada: Joi.string().allow('', null).optional().when('estado', {
    is: 'RESUELTA',
    then: Joi.string().required().messages({ 'any.required': 'La solución aplicada es obligatoria cuando la incidencia está RESUELTA.' })
  })
});

// ==========================================
// ESQUEMAS DE VALIDACIÓN DE TAREAS
// ==========================================

const taskCreateSchema = Joi.object({
  id_tarea: Joi.number().integer().optional(),
  id_proyecto: Joi.string().required(),
  titulo_tarea: Joi.string().max(255).required(),
  descripcion: Joi.string().allow('', null).optional(),
  es_hito: Joi.boolean().default(false),
  estado: Joi.string().valid('PENDIENTE', 'COMPLETADA').default('PENDIENTE'),
  fecha_limite: Joi.string().isoDate().optional().when('es_hito', {
    is: false,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  fecha_original_cierre: Joi.string().isoDate().allow(null, '').optional(),
  fecha_actual_cierre: Joi.string().isoDate().allow(null, '').optional(),
  fecha_real_cierre: Joi.string().isoDate().allow(null, '').optional()
});

const taskUpdateSchema = Joi.object({
  id_proyecto: Joi.string().optional(),
  titulo_tarea: Joi.string().max(255).optional(),
  descripcion: Joi.string().allow('', null).optional(),
  es_hito: Joi.boolean().optional(),
  estado: Joi.string().valid('PENDIENTE', 'COMPLETADA').optional(),
  fecha_limite: Joi.string().isoDate().optional(),
  fecha_original_cierre: Joi.string().isoDate().allow(null, '').optional(),
  fecha_actual_cierre: Joi.string().isoDate().allow(null, '').optional(),
  fecha_real_cierre: Joi.string().isoDate().allow(null, '').optional()
});

// ==========================================
// ESQUEMAS DE VALIDACIÓN DE COMENTARIOS
// ==========================================

const commentCreateSchema = Joi.object({
  id_proyecto: Joi.string().required(),
  texto_comentario: Joi.string().required(),
  es_importante: Joi.boolean().default(false),
  para_direccion: Joi.boolean().default(false)
});

const commentUpdateSchema = Joi.object({
  texto_comentario: Joi.string().optional(),
  es_importante: Joi.boolean().optional(),
  para_direccion: Joi.boolean().optional()
});

// ==========================================
// ESQUEMAS DE VALIDACIÓN DE LECCIONES
// ==========================================

const lessonCreateSchema = Joi.object({
  id_leccion: Joi.string().optional(),
  tipo_leccion: Joi.string().valid('BUENA_PRACTICA', 'ERROR_A_EVITAR').default('BUENA_PRACTICA'),
  id_proyecto: Joi.string().allow(null).optional(),
  id_proveedor: Joi.number().integer().allow(null).optional(),
  titulo: Joi.string().max(255).required(),
  contexto: Joi.string().allow('', null).optional(),
  recomendacion_futura: Joi.string().allow('', null).optional()
});

const lessonUpdateSchema = Joi.object({
  tipo_leccion: Joi.string().valid('BUENA_PRACTICA', 'ERROR_A_EVITAR').optional(),
  id_proyecto: Joi.string().allow(null).optional(),
  id_proveedor: Joi.number().integer().allow(null).optional(),
  titulo: Joi.string().max(255).optional(),
  contexto: Joi.string().allow('', null).optional(),
  recomendacion_futura: Joi.string().allow('', null).optional()
});

module.exports = {
  validateBody,
  projectCreateSchema,
  projectUpdateSchema,
  invoiceCreateSchema,
  invoiceUpdateSchema,
  scopeChangeCreateSchema,
  scopeChangeUpdateSchema,
  riskCreateSchema,
  riskUpdateSchema,
  issueCreateSchema,
  issueUpdateSchema,
  taskCreateSchema,
  taskUpdateSchema,
  commentCreateSchema,
  commentUpdateSchema,
  lessonCreateSchema,
  lessonUpdateSchema
};
