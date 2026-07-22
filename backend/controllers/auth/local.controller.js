const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { JWT_SECRET } = require('../../config/jwt');
const { Usuarios } = require('../../models/index');
const { hashPassword } = require('../../utils/helpers');
const { asyncHandler } = require('../../middlewares/errorHandler');

const login = asyncHandler(async (req, res) => {
  const { correo, password } = req.body;
  if (!correo || !password) {
    return res.status(400).json({ error: 'El correo y la contraseña son obligatorios.' });
  }

  const user = await Usuarios.scope('withPassword').findOne({ where: { correo } });
  if (!user) {
    return res.status(401).json({ error: 'Usuario no registrado o credenciales incorrectas.' });
  }

  if (!user.activo) {
    return res.status(403).json({ error: 'Tu usuario se encuentra inactivo. Contacta a un administrador.' });
  }

  if (user.metodo_acceso !== 'PASSWORD') {
    return res.status(401).json({ error: 'Este usuario está configurado para acceder únicamente a través de Microsoft Entra ID (Azure AD).' });
  }

  let isValid = false;
  
  if (user.password.startsWith('$2')) {
    isValid = await bcrypt.compare(password, user.password);
  } else {
    let hashedInput;
    if (!user.password_salt) {
      hashedInput = crypto.createHash('sha256').update(password).digest('hex');
    } else {
      hashedInput = crypto.createHash('sha256').update(password + user.password_salt).digest('hex');
    }
    
    if (user.password === hashedInput) {
      isValid = true;
      const newHash = await hashPassword(password);
      await user.update({ password: newHash, password_salt: null });
    }
  }

  if (!isValid) {
    return res.status(401).json({ error: 'Credenciales inválidas.' });
  }

  const token = jwt.sign(
    { id_usuario: user.id_usuario, perfil: user.perfil },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id_usuario: user.id_usuario,
      nombre: user.nombre,
      apellidos: user.apellidos,
      correo: user.correo,
      perfil: user.perfil,
      activo: user.activo
    }
  });
});

const verify = asyncHandler(async (req, res) => {
  const pmId = req.currentPmId;
  if (!pmId) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }

  const user = await Usuarios.findByPk(pmId);
  if (!user || !user.activo) {
    return res.status(401).json({ error: 'Usuario inactivo o no encontrado.' });
  }

  res.json({
    user: {
      id_usuario: user.id_usuario,
      nombre: user.nombre,
      apellidos: user.apellidos,
      correo: user.correo,
      perfil: user.perfil,
      activo: user.activo
    }
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const userId = req.currentPmId;
  if (!userId) {
    return res.status(401).json({ error: 'No autorizado. Inicie sesión.' });
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Ambas contraseñas son obligatorias.' });
  }

  const user = await Usuarios.scope('withPassword').findByPk(userId);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }

  let isValid = false;
  if (user.password.startsWith('$2')) {
    isValid = await bcrypt.compare(currentPassword, user.password);
  } else {
    let hashedCurrent = crypto.createHash('sha256').update(currentPassword).digest('hex');
    if (user.password_salt) {
       hashedCurrent = crypto.createHash('sha256').update(currentPassword + user.password_salt).digest('hex');
    }
    if (user.password === hashedCurrent) {
      isValid = true;
    }
  }

  if (!isValid) {
    return res.status(401).json({ error: 'La contraseña actual es incorrecta.' });
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]).{10,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({ error: 'La nueva contraseña no cumple con la política de seguridad requerida.' });
  }

  const newHash = await hashPassword(newPassword);

  await user.update({ password: newHash, password_salt: null });

  res.json({ message: 'Contraseña actualizada correctamente.' });
});

module.exports = {
  login,
  verify,
  changePassword
};
