const { isValidISODate } = require('../utils/helpers');

function validateTaskDate(req, res, next) {
  const { fecha_limite } = req.body;
  if (fecha_limite !== undefined) {
    if (!isValidISODate(fecha_limite)) {
      return res.status(400).json({ error: 'La fecha límite de la tarea debe tener el formato YYYY-MM-DD y ser una fecha válida.' });
    }
  }
  next();
}

module.exports = {
  validateTaskDate
};
