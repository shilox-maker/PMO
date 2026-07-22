const crypto = require('crypto');
const { Usuarios, Proyectos } = require('../../models/index');
const { hashPassword } = require('../../utils/helpers');
const { asyncHandler } = require('../../middlewares/errorHandler');

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

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser
};
