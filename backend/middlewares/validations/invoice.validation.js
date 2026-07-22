const Joi = require('joi');

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

module.exports = {
  invoiceCreateSchema,
  invoiceUpdateSchema
};
