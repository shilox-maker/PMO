const { TiposCapex, SubtiposCapex, Proyectos } = require('../../models/index');
const { asyncHandler } = require('../../middlewares/errorHandler');

// --- TIPOS CAPEX ---
const getTiposCapex = asyncHandler(async (req, res) => {
  const tipos = await TiposCapex.findAll({
    include: [{ model: SubtiposCapex, as: 'Subtipos', order: [['orden', 'ASC']] }],
    order: [['orden', 'ASC']]
  });
  res.json(tipos);
});

const createTipoCapex = asyncHandler(async (req, res) => {
  const { nombre, orden } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del tipo CAPEX es obligatorio.' });
  }
  const existing = await TiposCapex.findOne({ where: { nombre: nombre.trim() } });
  if (existing) {
    return res.status(400).json({ error: 'Ya existe un tipo CAPEX con ese nombre.' });
  }
  const maxOrden = await TiposCapex.max('orden') || 0;
  const tipo = await TiposCapex.create({ nombre: nombre.trim(), orden: orden ?? maxOrden + 1 });
  res.status(201).json(tipo);
});

const updateTipoCapex = asyncHandler(async (req, res) => {
  const tipo = await TiposCapex.findByPk(req.params.id);
  if (!tipo) return res.status(404).json({ error: 'Tipo CAPEX no encontrado.' });
  const { nombre, orden } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del tipo CAPEX es obligatorio.' });
  }
  const dup = await TiposCapex.findOne({ where: { nombre: nombre.trim() } });
  if (dup && dup.id !== tipo.id) {
    return res.status(400).json({ error: 'Ya existe otro tipo CAPEX con ese nombre.' });
  }
  await tipo.update({ nombre: nombre.trim(), orden: orden !== undefined ? orden : tipo.orden });
  res.json(tipo);
});

const deleteTipoCapex = asyncHandler(async (req, res) => {
  const tipo = await TiposCapex.findByPk(req.params.id);
  if (!tipo) return res.status(404).json({ error: 'Tipo CAPEX no encontrado.' });
  const inUse = await Proyectos.count({ where: { id_tipo_capex: req.params.id } });
  if (inUse > 0) {
    return res.status(400).json({ error: 'No se puede eliminar: hay proyectos asociados a este tipo CAPEX.' });
  }
  await tipo.destroy();
  res.json({ message: 'Tipo CAPEX eliminado correctamente.' });
});

// --- SUBTIPOS CAPEX ---
const createSubtipoCapex = asyncHandler(async (req, res) => {
  const tipo = await TiposCapex.findByPk(req.params.id);
  if (!tipo) return res.status(404).json({ error: 'Tipo CAPEX padre no encontrado.' });
  const { nombre, orden } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del subtipo es obligatorio.' });
  }
  const maxOrden = await SubtiposCapex.max('orden', { where: { id_tipo_capex: tipo.id } }) || 0;
  const sub = await SubtiposCapex.create({
    id_tipo_capex: tipo.id,
    nombre: nombre.trim(),
    orden: orden ?? maxOrden + 1
  });
  res.status(201).json(sub);
});

const updateSubtipoCapex = asyncHandler(async (req, res) => {
  const sub = await SubtiposCapex.findByPk(req.params.id);
  if (!sub) return res.status(404).json({ error: 'Subtipo CAPEX no encontrado.' });
  const { nombre, orden } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del subtipo es obligatorio.' });
  }
  await sub.update({ nombre: nombre.trim(), orden: orden !== undefined ? orden : sub.orden });
  res.json(sub);
});

const deleteSubtipoCapex = asyncHandler(async (req, res) => {
  const sub = await SubtiposCapex.findByPk(req.params.id);
  if (!sub) return res.status(404).json({ error: 'Subtipo CAPEX no encontrado.' });
  const inUse = await Proyectos.count({ where: { id_subtipo_capex: req.params.id } });
  if (inUse > 0) {
    return res.status(400).json({ error: 'No se puede eliminar: hay proyectos asociados a este subtipo.' });
  }
  await sub.destroy();
  res.json({ message: 'Subtipo CAPEX eliminado correctamente.' });
});

module.exports = {
  getTiposCapex,
  createTipoCapex,
  updateTipoCapex,
  deleteTipoCapex,
  createSubtipoCapex,
  updateSubtipoCapex,
  deleteSubtipoCapex
};
