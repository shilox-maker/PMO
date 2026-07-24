const { Riesgos, Incidencias } = require('../../models/index');
const { generateNextId } = require('../../utils/helpers');
const { asyncHandler } = require('../../middlewares/errorHandler');

// --- RIESGOS ---
const createRisk = asyncHandler(async (req, res) => {
  const data = req.body;
  data.createdBy = req.currentPmId;
  data.modifiedBy = req.currentPmId;
  if (!data.id_riesgo || data.id_riesgo.trim() === '') {
    data.id_riesgo = await generateNextId(Riesgos, 'RSG', 'id_riesgo');
  } else {
    const rsgRegex = /^RSG-\d{4}-\d{3}$/;
    if (!rsgRegex.test(data.id_riesgo)) {
      return res.status(400).json({ error: 'El ID de riesgo debe tener el formato RSG-YYYY-XXX.' });
    }
  }
  if (!data.id_tarea || data.id_tarea === '') data.id_tarea = null;
  else data.id_tarea = Number(data.id_tarea);
  const rsg = await Riesgos.create(data);
  res.status(201).json(rsg);
});

const updateRisk = asyncHandler(async (req, res) => {
  const { id_riesgo } = req.params;
  const data = req.body;
  delete data.createdBy;
  data.modifiedBy = req.currentPmId;
  if (data.id_tarea === '' || data.id_tarea === null) data.id_tarea = null;
  else if (data.id_tarea) data.id_tarea = Number(data.id_tarea);
  const rsg = await Riesgos.findByPk(id_riesgo);
  if (!rsg) {
    return res.status(404).json({ error: 'Riesgo no encontrado' });
  }
  await rsg.update(data);
  res.json(rsg);
});

// --- INCIDENCIAS ---
const createIssue = asyncHandler(async (req, res) => {
  const data = req.body;
  data.createdBy = req.currentPmId;
  data.modifiedBy = req.currentPmId;
  if (!data.id_incidencia || data.id_incidencia.trim() === '') {
    data.id_incidencia = await generateNextId(Incidencias, 'INC', 'id_incidencia');
  } else {
    const incRegex = /^INC-\d{4}-\d{3}$/;
    if (!incRegex.test(data.id_incidencia)) {
      return res.status(400).json({ error: 'El ID de incidencia debe tener el formato INC-YYYY-XXX.' });
    }
  }
  if (data.estado === 'RESUELTA' && (!data.solucion_aplicada || data.solucion_aplicada.trim() === '')) {
    return res.status(400).json({ error: 'La solución aplicada es obligatoria cuando la incidencia está RESUELTA.' });
  }
  if (!data.id_tarea || data.id_tarea === '') data.id_tarea = null;
  else data.id_tarea = Number(data.id_tarea);
  const inc = await Incidencias.create(data);
  res.status(201).json(inc);
});

const updateIssue = asyncHandler(async (req, res) => {
  const { id_incidencia } = req.params;
  const data = req.body;
  delete data.createdBy;
  data.modifiedBy = req.currentPmId;
  if (data.id_tarea === '' || data.id_tarea === null) data.id_tarea = null;
  else if (data.id_tarea) data.id_tarea = Number(data.id_tarea);
  const inc = await Incidencias.findByPk(id_incidencia);
  if (!inc) {
    return res.status(404).json({ error: 'Incidencia no encontrada' });
  }
  const newStatus = data.estado || inc.estado;
  const newSolution = data.hasOwnProperty('solucion_aplicada') ? data.solucion_aplicada : inc.solucion_aplicada;
  if (newStatus === 'RESUELTA' && (!newSolution || newSolution.trim() === '')) {
    return res.status(400).json({ error: 'La solución aplicada es obligatoria cuando la incidencia está RESUELTA.' });
  }
  await inc.update(data);
  res.json(inc);
});

module.exports = {
  createRisk,
  updateRisk,
  createIssue,
  updateIssue
};
