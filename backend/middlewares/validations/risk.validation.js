const Joi = require('joi');

const riskCreateSchema = Joi.object({
  id_riesgo: Joi.string().optional(),
  id_proyecto: Joi.string().required(),
  titulo_riesgo: Joi.string().max(255).required(),
  descripcion: Joi.string().allow('', null).optional(),
  probabilidad: Joi.string().valid('ALTA', 'MEDIA', 'BAJA').required(),
  impacto: Joi.string().valid('ALTA', 'MEDIA', 'BAJA').required(),
  plan_mitigacion: Joi.string().required(),
  estado_riesgo: Joi.string().valid('ACTIVO', 'CERRADO').default('ACTIVO'),
  fecha_proxima_revision: Joi.string().isoDate().required(),
  id_tarea: Joi.alternatives().try(Joi.number().integer(), Joi.string().allow('', null)).optional()
});

const riskUpdateSchema = Joi.object({
  id_riesgo: Joi.string().optional(),
  id_proyecto: Joi.string().optional(),
  titulo_riesgo: Joi.string().max(255).optional(),
  descripcion: Joi.string().allow('', null).optional(),
  probabilidad: Joi.string().valid('ALTA', 'MEDIA', 'BAJA').optional(),
  impacto: Joi.string().valid('ALTA', 'MEDIA', 'BAJA').optional(),
  plan_mitigacion: Joi.string().optional(),
  estado_riesgo: Joi.string().valid('ACTIVO', 'CERRADO').optional(),
  fecha_proxima_revision: Joi.string().isoDate().optional(),
  id_tarea: Joi.alternatives().try(Joi.number().integer(), Joi.string().allow('', null)).optional()
});

module.exports = {
  riskCreateSchema,
  riskUpdateSchema
};
