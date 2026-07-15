const crypto = require('crypto');
const { Sedes, Proyectos, EstadosProyecto, Usuarios, Portfolios, TiposCapex, SubtiposCapex, PortfolioBudgets } = require('../models/index');
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

// --- USUARIOS ---
const getUsers = asyncHandler(async (req, res) => {
  const users = await Usuarios.findAll({ order: [['nombre', 'ASC']] });
  res.json(users);
});

const createUser = asyncHandler(async (req, res) => {
  const { nombre, apellidos, correo, password, perfil, activo, metodo_acceso } = req.body;
  const accessMethod = metodo_acceso || 'PASSWORD';

  if (!nombre || !apellidos || !correo || !perfil) {
    return res.status(400).json({ error: 'Todos los campos obligatorios son requeridos.' });
  }

  let finalPassword = password;
  if (accessMethod === 'PASSWORD') {
    if (!password) {
      return res.status(400).json({ error: 'La contraseña es obligatoria para cuentas con acceso local.' });
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]).{10,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ error: 'La contraseña no cumple con la política de seguridad requerida' });
    }
  } else if (accessMethod === 'ENTRA_ID') {
    // Autogenerar una contraseña aleatoria robusta e inutilizable
    finalPassword = crypto.randomBytes(16).toString('hex') + 'aA1!';
  } else {
    return res.status(400).json({ error: 'Método de acceso no válido.' });
  }

  const user = await Usuarios.create({
    nombre,
    apellidos,
    correo,
    password: await hashPassword(finalPassword),
    password_salt: null,
    perfil,
    activo: activo !== undefined ? activo : true,
    metodo_acceso: accessMethod
  });
  res.status(201).json(user);
});

const updateUser = asyncHandler(async (req, res) => {
  const { id_usuario } = req.params;
  const { nombre, apellidos, correo, password, perfil, activo, metodo_acceso } = req.body;
  const user = await Usuarios.findByPk(id_usuario);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }

  const targetMethod = metodo_acceso !== undefined ? metodo_acceso : user.metodo_acceso;

  if (targetMethod === 'PASSWORD' && user.metodo_acceso === 'ENTRA_ID' && (!password || password.trim() === '')) {
    return res.status(400).json({ error: 'Debe especificar una contraseña al cambiar el método de acceso a Contraseña.' });
  }

  const updates = {
    nombre: nombre !== undefined ? nombre : user.nombre,
    apellidos: apellidos !== undefined ? apellidos : user.apellidos,
    correo: correo !== undefined ? correo : user.correo,
    perfil: perfil !== undefined ? perfil : user.perfil,
    activo: activo !== undefined ? activo : user.activo,
    metodo_acceso: targetMethod
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

// --- PORTFOLIO BUDGETS ---
const createPortfolioBudget = asyncHandler(async (req, res) => {
  const { id } = req.params; // portfolio_id
  const { id_tipo_capex, id_subtipo_capex, importe } = req.body;

  if (!id_tipo_capex || importe === undefined) {
    return res.status(400).json({ error: 'El tipo de CAPEX y el importe son obligatorios.' });
  }

  const numImporte = parseFloat(importe);
  if (isNaN(numImporte) || numImporte < 0) {
    return res.status(400).json({ error: 'El importe debe ser un número válido mayor o igual a 0.' });
  }

  const portfolio = await Portfolios.findByPk(id);
  if (!portfolio) {
    return res.status(404).json({ error: 'Portfolio no encontrado.' });
  }

  const tipo = await TiposCapex.findByPk(id_tipo_capex);
  if (!tipo) {
    return res.status(404).json({ error: 'Tipo de CAPEX no encontrado.' });
  }

  if (id_subtipo_capex) {
    const subtipo = await SubtiposCapex.findByPk(id_subtipo_capex);
    if (!subtipo) {
      return res.status(404).json({ error: 'Subtipo de CAPEX no encontrado.' });
    }
    if (subtipo.id_tipo_capex !== parseInt(id_tipo_capex, 10)) {
      return res.status(400).json({ error: 'El subtipo de CAPEX no pertenece al tipo de CAPEX seleccionado.' });
    }
  }

  // Check for duplicates
  const duplicate = await PortfolioBudgets.findOne({
    where: {
      portfolio_id: id,
      id_tipo_capex,
      id_subtipo_capex: id_subtipo_capex || null
    }
  });

  if (duplicate) {
    return res.status(400).json({ error: 'Ya existe una asignación de presupuesto para esta combinación de Tipo/Subtipo CAPEX en este portfolio.' });
  }

  const budget = await PortfolioBudgets.create({
    portfolio_id: id,
    id_tipo_capex,
    id_subtipo_capex: id_subtipo_capex || null,
    importe: numImporte
  });

  res.status(201).json(budget);
});

const updatePortfolioBudget = asyncHandler(async (req, res) => {
  const { budgetId } = req.params;
  const { importe } = req.body;

  if (importe === undefined) {
    return res.status(400).json({ error: 'El importe es obligatorio.' });
  }

  const numImporte = parseFloat(importe);
  if (isNaN(numImporte) || numImporte < 0) {
    return res.status(400).json({ error: 'El importe debe ser un número válido mayor o igual a 0.' });
  }

  const budget = await PortfolioBudgets.findByPk(budgetId);
  if (!budget) {
    return res.status(404).json({ error: 'Presupuesto no encontrado.' });
  }

  await budget.update({ importe: numImporte });
  res.json(budget);
});

const deletePortfolioBudget = asyncHandler(async (req, res) => {
  const { budgetId } = req.params;
  const budget = await PortfolioBudgets.findByPk(budgetId);
  if (!budget) {
    return res.status(404).json({ error: 'Presupuesto no encontrado.' });
  }
  await budget.destroy();
  res.json({ message: 'Presupuesto eliminado correctamente.' });
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
  deletePortfolio,
  getTiposCapex,
  createTipoCapex,
  updateTipoCapex,
  deleteTipoCapex,
  createSubtipoCapex,
  updateSubtipoCapex,
  deleteSubtipoCapex,
  createPortfolioBudget,
  updatePortfolioBudget,
  deletePortfolioBudget
};
