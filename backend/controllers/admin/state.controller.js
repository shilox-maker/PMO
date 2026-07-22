const { EstadosProyecto, Proyectos } = require('../../models/index');
const { asyncHandler } = require('../../middlewares/errorHandler');

// --- ESTADOS ---
const getStates = asyncHandler(async (req, res) => {
  const states = await EstadosProyecto.findAll({ order: [['orden', 'ASC']] });
  res.json(states);
});

const createState = asyncHandler(async (req, res) => {
  const { nombre_estado, icono, orden, proyecto_cerrado, pasos, descripcion } = req.body;
  if (!nombre_estado || orden === undefined) {
    return res.status(400).json({ error: 'El nombre del estado y el orden son obligatorios.' });
  }
  const state = await EstadosProyecto.create({
    nombre_estado,
    icono,
    orden: parseInt(orden, 10),
    proyecto_cerrado: proyecto_cerrado !== undefined ? !!proyecto_cerrado : false,
    pasos: pasos !== undefined ? pasos : null,
    descripcion: descripcion !== undefined ? descripcion : null
  });
  res.status(201).json(state);
});

const updateState = asyncHandler(async (req, res) => {
  const { id_estado } = req.params;
  const { nombre_estado, icono, orden, proyecto_cerrado, pasos, descripcion } = req.body;
  const state = await EstadosProyecto.findByPk(id_estado);
  if (!state) {
    return res.status(404).json({ error: 'Estado no encontrado.' });
  }
  await state.update({
    nombre_estado: nombre_estado !== undefined ? nombre_estado : state.nombre_estado,
    icono: icono !== undefined ? icono : state.icono,
    orden: orden !== undefined ? parseInt(orden, 10) : state.orden,
    proyecto_cerrado: proyecto_cerrado !== undefined ? !!proyecto_cerrado : state.proyecto_cerrado,
    pasos: pasos !== undefined ? pasos : state.pasos,
    descripcion: descripcion !== undefined ? descripcion : state.descripcion
  });
  res.json(state);
});

const deleteState = asyncHandler(async (req, res) => {
  const { id_estado } = req.params;
  const state = await EstadosProyecto.findByPk(id_estado);
  if (!state) {
    return res.status(404).json({ error: 'Estado no encontrado.' });
  }
  const count = await Proyectos.count({ where: { id_estado } });
  if (count > 0) {
    return res.status(400).json({ error: 'No se puede eliminar el estado porque hay proyectos activos asociados a él.' });
  }
  await state.destroy();
  res.json({ message: 'Estado eliminado con éxito.' });
});

module.exports = {
  getStates,
  createState,
  updateState,
  deleteState
};
