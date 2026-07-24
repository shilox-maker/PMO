const Joi = require('joi');

const issueCreateSchema = Joi.object({
  id_incidencia: Joi.string().optional(),
  id_proyecto: Joi.string().required(),
  titulo: Joi.string().max(255).required(),
  descripcion: Joi.string().required(),
  tipo_incidencias: Joi.string().valid('TECNICA', 'RETRASO_PLAZOS', 'PROVEEDOR_DESAPARECIDO', 'PRESUPUESTARIA').required(),
  criticidad: Joi.string().valid('BLOQUEANTE', 'ALTA', 'MEDIA', 'BAJA').required(),
  estado: Joi.string().valid('ABIERTA', 'EN_PROCESO', 'RESUELTA', 'CANCELADA').default('ABIERTA'),
  fecha_apertura: Joi.string().isoDate().required(),
  fecha_cierre: Joi.string().isoDate().allow('', null).optional(),
  solucion_aplicada: Joi.string().allow('', null).optional().when('estado', {
    is: 'RESUELTA',
    then: Joi.string().required().messages({ 'any.required': 'La solución aplicada es obligatoria cuando la incidencia está RESUELTA.' })
  }),
  id_tarea: Joi.alternatives().try(Joi.number().integer(), Joi.string().allow('', null)).optional()
});

const issueUpdateSchema = Joi.object({
  id_incidencia: Joi.string().optional(),
  id_proyecto: Joi.string().optional(),
  titulo: Joi.string().max(255).optional(),
  descripcion: Joi.string().optional(),
  tipo_incidencias: Joi.string().valid('TECNICA', 'RETRASO_PLAZOS', 'PROVEEDOR_DESAPARECIDO', 'PRESUPUESTARIA').optional(),
  criticidad: Joi.string().valid('BLOQUEANTE', 'ALTA', 'MEDIA', 'BAJA').optional(),
  estado: Joi.string().valid('ABIERTA', 'EN_PROCESO', 'RESUELTA', 'CANCELADA').optional(),
  fecha_apertura: Joi.string().isoDate().optional(),
  fecha_cierre: Joi.string().isoDate().allow('', null).optional(),
  solucion_aplicada: Joi.string().allow('', null).optional().when('estado', {
    is: 'RESUELTA',
    then: Joi.string().required().messages({ 'any.required': 'La solución aplicada es obligatoria cuando la incidencia está RESUELTA.' })
  }),
  id_tarea: Joi.alternatives().try(Joi.number().integer(), Joi.string().allow('', null)).optional()
});

module.exports = {
  issueCreateSchema,
  issueUpdateSchema
};
