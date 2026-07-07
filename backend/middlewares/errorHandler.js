const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const errorHandler = (err, req, res, next) => {
  console.error('❌ Error capturado por el middleware global:', err);

  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';

  // Formatear errores específicos de Sequelize de forma amigable
  if (
    err.name === 'SequelizeValidationError' ||
    err.name === 'SequelizeUniqueConstraintError' ||
    err.name === 'SequelizeForeignKeyConstraintError'
  ) {
    status = 400;
    message = err.errors ? err.errors.map(e => e.message).join(', ') : err.message;
  }

  res.status(status).json({
    error: message
  });
};

module.exports = {
  asyncHandler,
  errorHandler
};
