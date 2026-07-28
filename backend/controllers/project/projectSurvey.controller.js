const { EncuestasCalidad } = require('../../models/index');
const { asyncHandler } = require('../../middlewares/errorHandler');

// Get all quality surveys for a project
const getProjectSurveys = asyncHandler(async (req, res) => {
  const { id_proyecto } = req.params;
  const surveys = await EncuestasCalidad.findAll({
    where: { id_proyecto },
    order: [['fecha_evaluacion', 'DESC'], ['createdAt', 'DESC']]
  });

  const total = surveys.length;
  const average = total > 0
    ? Number((surveys.reduce((acc, s) => acc + parseFloat(s.puntuacion || 0), 0) / total).toFixed(1))
    : null;

  res.json({ surveys, total, average });
});

// Create a new quality survey
const createProjectSurvey = asyncHandler(async (req, res) => {
  const { id_proyecto } = req.params;
  const { concepto, puntuacion, escala_maxima, fecha_evaluacion, evaluador, observaciones } = req.body;

  if (!concepto || puntuacion === undefined || !fecha_evaluacion) {
    return res.status(400).json({ error: 'El concepto, la puntuación y la fecha son obligatorios.' });
  }

  const survey = await EncuestasCalidad.create({
    id_proyecto,
    concepto: concepto.trim(),
    puntuacion: parseFloat(puntuacion),
    escala_maxima: escala_maxima ? parseInt(escala_maxima, 10) : 10,
    fecha_evaluacion,
    evaluador: evaluador ? evaluador.trim() : null,
    observaciones: observaciones ? observaciones.trim() : null
  });

  res.status(201).json(survey);
});

// Update a quality survey
const updateProjectSurvey = asyncHandler(async (req, res) => {
  const { id_encuesta } = req.params;
  const { concepto, puntuacion, escala_maxima, fecha_evaluacion, evaluador, observaciones } = req.body;

  const survey = await EncuestasCalidad.findByPk(id_encuesta);
  if (!survey) {
    return res.status(404).json({ error: 'Encuesta no encontrada.' });
  }

  if (concepto !== undefined) survey.concepto = concepto.trim();
  if (puntuacion !== undefined) survey.puntuacion = parseFloat(puntuacion);
  if (escala_maxima !== undefined) survey.escala_maxima = parseInt(escala_maxima, 10);
  if (fecha_evaluacion !== undefined) survey.fecha_evaluacion = fecha_evaluacion;
  if (evaluador !== undefined) survey.evaluador = evaluador ? evaluador.trim() : null;
  if (observaciones !== undefined) survey.observaciones = observaciones ? observaciones.trim() : null;

  await survey.save();
  res.json(survey);
});

// Delete a quality survey
const deleteProjectSurvey = asyncHandler(async (req, res) => {
  const { id_encuesta } = req.params;
  const survey = await EncuestasCalidad.findByPk(id_encuesta);
  if (!survey) {
    return res.status(404).json({ error: 'Encuesta no encontrada.' });
  }
  await survey.destroy();
  res.json({ message: 'Encuesta eliminada correctamente.' });
});

module.exports = {
  getProjectSurveys,
  createProjectSurvey,
  updateProjectSurvey,
  deleteProjectSurvey
};
