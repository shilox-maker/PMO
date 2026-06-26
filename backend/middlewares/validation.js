const { isValidISODate } = require('../utils/helpers');

function validateTaskDate(req, res, next) {
  const { fecha_limite, fecha_original_cierre, fecha_actual_cierre, fecha_real_cierre } = req.body;
  if (fecha_limite !== undefined) {
    if (!isValidISODate(fecha_limite)) {
      return res.status(400).json({ error: 'La fecha límite de la tarea debe tener el formato YYYY-MM-DD y ser una fecha válida.' });
    }
  }
  if (fecha_original_cierre) {
    if (!isValidISODate(fecha_original_cierre)) {
      return res.status(400).json({ error: 'La fecha original de cierre debe tener el formato YYYY-MM-DD y ser una fecha válida.' });
    }
  }
  if (fecha_actual_cierre) {
    if (!isValidISODate(fecha_actual_cierre)) {
      return res.status(400).json({ error: 'La fecha actual de cierre debe tener el formato YYYY-MM-DD y ser una fecha válida.' });
    }
  }
  if (fecha_real_cierre) {
    if (!isValidISODate(fecha_real_cierre)) {
      return res.status(400).json({ error: 'La fecha real de cierre debe tener el formato YYYY-MM-DD y ser una fecha válida.' });
    }
  }
  next();
}

module.exports = {
  validateTaskDate
};
