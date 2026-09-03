const Joi = require('joi');

const createWorkflowSchema = Joi.object({
  nombre: Joi.string().max(100).required()
    .messages({
      'string.empty': 'El nombre del flujo es obligatorio.',
      'any.required': 'El nombre del flujo es obligatorio.'
    }),
  descripcion: Joi.string().allow('', null).optional(),
  activo: Joi.boolean().default(true),
  is_default: Joi.boolean().default(false),
  id_ambito: Joi.number().integer().allow(null).optional(),
  code: Joi.string().max(50).allow('', null).optional(),
  stateIds: Joi.array().items(Joi.number().integer()).optional(),
  states: Joi.array().items(
    Joi.alternatives().try(
      Joi.number().integer(),
      Joi.object({
        id_estado: Joi.number().integer().required(),
        orden: Joi.number().integer().optional()
      })
    )
  ).optional()
});

const updateWorkflowSchema = Joi.object({
  nombre: Joi.string().max(100).optional(),
  descripcion: Joi.string().allow('', null).optional(),
  activo: Joi.boolean().optional(),
  is_default: Joi.boolean().optional(),
  id_ambito: Joi.number().integer().allow(null).optional(),
  code: Joi.string().max(50).allow('', null).optional()
});

const setWorkflowStatesSchema = Joi.object({
  states: Joi.array().items(
    Joi.object({
      id_estado: Joi.number().integer().required(),
      orden: Joi.number().integer().optional()
    })
  ).required()
    .messages({
      'any.required': 'La lista de estados es obligatoria.'
    })
});

module.exports = {
  createWorkflowSchema,
  updateWorkflowSchema,
  setWorkflowStatesSchema
};
