const logger = require('../config/logger');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const errorHandler = (err, req, res, next) => {
  const errorDetails = err.parent?.message || err.original?.message || err.message || 'Error interno del servidor';
  logger.error('❌ Error capturado por el middleware global: %s %s - %s (Detalle: %s, SQL: %s)', 
    req.method, 
    req.originalUrl, 
    err.stack || err.message || err,
    errorDetails,
    err.sql || 'N/A'
  );

  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';

  // Formatear errores específicos de Sequelize de forma amigable
  if (
    err.name === 'SequelizeValidationError' ||
    err.name === 'SequelizeUniqueConstraintError' ||
    err.name === 'SequelizeForeignKeyConstraintError' ||
    err.name === 'SequelizeDatabaseError'
  ) {
    status = 400;
    message = err.errors ? err.errors.map(e => e.message).join(', ') : (err.parent?.message || err.message);
  }

  res.status(status).json({
    error: message,
    details: process.env.NODE_ENV !== 'production' ? errorDetails : undefined
  });
};

module.exports = {
  asyncHandler,
  errorHandler
};
