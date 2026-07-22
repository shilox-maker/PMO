const Joi = require('joi');

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

module.exports = {
  taskCreateSchema,
  taskUpdateSchema
};
