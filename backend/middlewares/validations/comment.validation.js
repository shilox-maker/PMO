const Joi = require('joi');

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

module.exports = {
  commentCreateSchema,
  commentUpdateSchema
};
