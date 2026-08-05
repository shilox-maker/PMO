const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');
const { Usuarios } = require('../models/index');
const { handleErr } = require('../utils/helpers');

// Auth Middleware: Verify JWT from Authorization header
const verifyToken = (req, res, next) => {
  const publicPaths = ['/api/login', '/api/login/azure', '/api/health', '/api/maintenance/status'];
  const authHeader = req.headers['authorization'];

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.currentPmId = decoded.id_usuario;
    } catch (err) {
      if (!publicPaths.includes(req.path)) {
        return res.status(401).json({ error: 'Token inválido o expirado.' });
      }
    }
  }

  if (publicPaths.includes(req.path) || req.path.startsWith('/mcp')) {
    return next();
  }

  if (req.currentPmId) {
    return next();
  }

  return res.status(401).json({ error: 'Acceso denegado. No se proporcionó token de autenticación.' });
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
