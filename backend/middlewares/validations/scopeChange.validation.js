const Joi = require('joi');

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

module.exports = {
  scopeChangeCreateSchema,
  scopeChangeUpdateSchema
};
