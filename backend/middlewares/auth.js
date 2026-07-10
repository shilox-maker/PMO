const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');
const { Usuarios } = require('../models/index');
const { handleErr } = require('../utils/helpers');

// Auth Middleware: Verify JWT from Authorization header
const verifyToken = (req, res, next) => {
  if (req.path === '/api/login' || req.path === '/api/login/azure') {
    return next();
  }
  
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.currentPmId = decoded.id_usuario;
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido o expirado.' });
    }
  } else {
    return res.status(401).json({ error: 'Acceso denegado. No se proporcionó token de autenticación.' });
  }
};

// Middleware: Restrict access to administrators
const restrictToAdmin = async (req, res, next) => {
  const pmId = req.currentPmId;
  if (!pmId) {
    return res.status(401).json({ error: 'Acceso denegado. Inicie sesión.' });
  }
  try {
    const user = await Usuarios.findByPk(pmId);
    if (!user || user.perfil !== 'ADMINISTRADOR') {
      return res.status(403).json({ error: 'Acceso restringido a administradores.' });
    }
    next();
  } catch (error) {
    handleErr(res, error, 500);
  }
};

module.exports = {
  verifyToken,
  restrictToAdmin
};
