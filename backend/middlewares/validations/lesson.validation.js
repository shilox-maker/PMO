const Joi = require('joi');

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
  lessonCreateSchema,
  lessonUpdateSchema
};
