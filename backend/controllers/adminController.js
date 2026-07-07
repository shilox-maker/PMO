const { Sedes, Proyectos, EstadosProyecto, Usuarios, Portfolios } = require('../models/index');
const { hashPassword } = require('../utils/helpers');
const { asyncHandler } = require('../middlewares/errorHandler');

// --- SEDES ---
const createSede = asyncHandler(async (req, res) => {
  const { nombre_sede } = req.body;
  if (!nombre_sede || !nombre_sede.trim()) {
    return res.status(400).json({ error: 'El nombre de la sede es obligatorio.' });
  }
  const existing = await Sedes.findOne({ where: { nombre_sede: nombre_sede.trim() } });
  if (existing) {
    return res.status(400).json({ error: 'Ya existe una sede con ese nombre.' });
  }
  const sede = await Sedes.create({ nombre_sede: nombre_sede.trim() });
  res.json(sede);
});

const updateSede = asyncHandler(async (req, res) => {
  const { nombre_sede } = req.body;
  if (!nombre_sede || !nombre_sede.trim()) {
    return res.status(400).json({ error: 'El nombre de la sede es obligatorio.' });
  }
  const sede = await Sedes.findByPk(req.params.id_sede);
  if (!sede) return res.status(404).json({ error: 'Sede no encontrada.' });

  const existing = await Sedes.findOne({ where: { nombre_sede: nombre_sede.trim() } });
  if (existing && existing.id_sede !== sede.id_sede) {
    return res.status(400).json({ error: 'Ya existe otra sede con ese nombre.' });
  }

  await sede.update({ nombre_sede: nombre_sede.trim() });
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

// --- ESTADOS ---
const getStates = asyncHandler(async (req, res) => {
  const states = await EstadosProyecto.findAll({ order: [['orden', 'ASC']] });
  res.json(states);
});

const createState = asyncHandler(async (req, res) => {
  const { nombre_estado, icono, orden, proyecto_cerrado, pasos } = req.body;
  if (!nombre_estado || orden === undefined) {
    return res.status(400).json({ error: 'El nombre del estado y el orden son obligatorios.' });
  }
  const state = await EstadosProyecto.create({
    nombre_estado,
    icono,
    orden: parseInt(orden, 10),
    proyecto_cerrado: proyecto_cerrado !== undefined ? !!proyecto_cerrado : false,
    pasos: pasos !== undefined ? pasos : null
  });
  res.status(201).json(state);
});

const updateState = asyncHandler(async (req, res) => {
  const { id_estado } = req.params;
  const { nombre_estado, icono, orden, proyecto_cerrado, pasos } = req.body;
  const state = await EstadosProyecto.findByPk(id_estado);
  if (!state) {
    return res.status(404).json({ error: 'Estado no encontrado.' });
  }
  await state.update({
    nombre_estado: nombre_estado !== undefined ? nombre_estado : state.nombre_estado,
    icono: icono !== undefined ? icono : state.icono,
    orden: orden !== undefined ? parseInt(orden, 10) : state.orden,
    proyecto_cerrado: proyecto_cerrado !== undefined ? !!proyecto_cerrado : state.proyecto_cerrado,
    pasos: pasos !== undefined ? pasos : state.pasos
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

// --- USUARIOS ---
const getUsers = asyncHandler(async (req, res) => {
  const users = await Usuarios.findAll({ order: [['nombre', 'ASC']] });
  res.json(users);
});

const createUser = asyncHandler(async (req, res) => {
  const { nombre, apellidos, correo, password, perfil, activo } = req.body;
  if (!nombre || !apellidos || !correo || !password || !perfil) {
    return res.status(400).json({ error: 'Todos los campos obligatorios son requeridos.' });
  }
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]).{10,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ error: 'La contraseña no cumple con la política de seguridad requerida' });
  }
  const user = await Usuarios.create({
    nombre,
    apellidos,
    correo,
    password: await hashPassword(password),
    password_salt: null,
    perfil,
    activo: activo !== undefined ? activo : true
  });
  res.status(201).json(user);
});

const updateUser = asyncHandler(async (req, res) => {
  const { id_usuario } = req.params;
  const { nombre, apellidos, correo, password, perfil, activo } = req.body;
  const user = await Usuarios.findByPk(id_usuario);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }
  const updates = {
    nombre: nombre !== undefined ? nombre : user.nombre,
    apellidos: apellidos !== undefined ? apellidos : user.apellidos,
    correo: correo !== undefined ? correo : user.correo,
    perfil: perfil !== undefined ? perfil : user.perfil,
    activo: activo !== undefined ? activo : user.activo
  };
  if (password && password.trim() !== '') {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]).{10,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ error: 'La contraseña no cumple con la política de seguridad requerida' });
    }
    updates.password_salt = null;
    updates.password = await hashPassword(password);
  }
  await user.update(updates);
  res.json(user);
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id_usuario } = req.params;
  const user = await Usuarios.findByPk(id_usuario);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }
  const count = await Proyectos.count({ where: { id_pm: id_usuario } });
  if (count > 0) {
    return res.status(400).json({ error: 'No se puede eliminar el usuario porque tiene proyectos asignados.' });
  }
  await user.destroy();
  res.json({ message: 'Usuario eliminado con éxito.' });
});

// --- PORTFOLIOS ---
const createPortfolio = asyncHandler(async (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del portfolio es obligatorio.' });
  }
  const existing = await Portfolios.findOne({ where: { nombre: nombre.trim() } });
  if (existing) {
    return res.status(400).json({ error: 'Ya existe un portfolio con ese nombre.' });
  }
  const portfolio = await Portfolios.create({
    nombre: nombre.trim(),
    descripcion: descripcion ? descripcion.trim() : null
  });
  res.json(portfolio);
});

const updatePortfolio = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre del portfolio es obligatorio.' });
  }
  const portfolio = await Portfolios.findByPk(id);
  if (!portfolio) {
    return res.status(404).json({ error: 'Portfolio no encontrado.' });
  }
  const existing = await Portfolios.findOne({ where: { nombre: nombre.trim() } });
  if (existing && existing.id !== portfolio.id) {
    return res.status(400).json({ error: 'Ya existe otro portfolio con ese nombre.' });
  }
  await portfolio.update({
    nombre: nombre.trim(),
    descripcion: descripcion !== undefined ? (descripcion ? descripcion.trim() : null) : portfolio.descripcion
  });
  res.json(portfolio);
});

const deletePortfolio = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const portfolio = await Portfolios.findByPk(id);
  if (!portfolio) {
    return res.status(404).json({ error: 'Portfolio no encontrado.' });
  }
  const inUse = await Proyectos.count({ where: { portfolio_id: id } });
  if (inUse > 0) {
    return res.status(400).json({ error: 'No se puede eliminar el portfolio porque tiene proyectos asociados.' });
  }
  await portfolio.destroy();
  res.json({ message: 'Portfolio eliminado con éxito.' });
});

module.exports = {
  createSede,
  updateSede,
  deleteSede,
  getStates,
  createState,
  updateState,
  deleteState,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  createPortfolio,
  updatePortfolio,
  deletePortfolio
};
