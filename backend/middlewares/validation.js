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

// Importar los esquemas desde sus respectivos ficheros modulares
const { projectCreateSchema, projectUpdateSchema } = require('./validations/project.validation');
const { invoiceCreateSchema, invoiceUpdateSchema } = require('./validations/invoice.validation');
const { scopeChangeCreateSchema, scopeChangeUpdateSchema } = require('./validations/scopeChange.validation');
const { riskCreateSchema, riskUpdateSchema } = require('./validations/risk.validation');
const { issueCreateSchema, issueUpdateSchema } = require('./validations/issue.validation');
const { taskCreateSchema, taskUpdateSchema } = require('./validations/task.validation');
const { commentCreateSchema, commentUpdateSchema } = require('./validations/comment.validation');
const { lessonCreateSchema, lessonUpdateSchema } = require('./validations/lesson.validation');

// Exportar todos los elementos manteniendo compatibilidad absoluta
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
