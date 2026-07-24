const { Sedes, Proyectos } = require('../../models/index');
const { asyncHandler } = require('../../middlewares/errorHandler');

// --- SEDES ---
const createSede = asyncHandler(async (req, res) => {
  const { nombre_sede, orden } = req.body;
  if (!nombre_sede || !nombre_sede.trim()) {
    return res.status(400).json({ error: 'El nombre de la sede es obligatorio.' });
  }
  const existing = await Sedes.findOne({ where: { nombre_sede: nombre_sede.trim() } });
  if (existing) {
    return res.status(400).json({ error: 'Ya existe una sede con ese nombre.' });
  }
  const ordenVal = orden !== undefined && orden !== '' ? parseInt(orden, 10) : 0;
  const sede = await Sedes.create({ nombre_sede: nombre_sede.trim(), orden: Number.isNaN(ordenVal) ? 0 : ordenVal });
  res.json(sede);
});

const updateSede = asyncHandler(async (req, res) => {
  const { nombre_sede, orden } = req.body;
  if (!nombre_sede || !nombre_sede.trim()) {
    return res.status(400).json({ error: 'El nombre de la sede es obligatorio.' });
  }
  const sede = await Sedes.findByPk(req.params.id_sede);
  if (!sede) return res.status(404).json({ error: 'Sede no encontrada.' });

  const existing = await Sedes.findOne({ where: { nombre_sede: nombre_sede.trim() } });
  if (existing && existing.id_sede != sede.id_sede) {
    return res.status(400).json({ error: 'Ya existe otra sede con ese nombre.' });
  }

  const ordenVal = orden !== undefined && orden !== '' ? parseInt(orden, 10) : sede.orden;
  await sede.update({ nombre_sede: nombre_sede.trim(), orden: Number.isNaN(ordenVal) ? 0 : ordenVal });
  res.json(sede);
});

const deleteSede = asyncHandler(async (req, res) => {
  const sede = await Sedes.findByPk(req.params.id_sede);
  if (!sede) return res.status(404).json({ error: 'Sede no encontrada.' });

  const inUse = await Proyectos.count({ where: { id_sede: req.params.id_sede } });
  if (inUse > 0) {
    return res.status(400).json({ error: 'No se puede eliminar la sede porque existen proyectos en ella.' });
  }

  await sede.destroy();
  res.json({ message: 'Sede eliminada correctamente.' });
});

module.exports = {
  createSede,
  updateSede,
  deleteSede
};
