'use strict';
const { Usuarios } = require('../models');

/**
 * Middleware de protección para perfil SOLO_LECTURA (Zero-Trust)
 * Bloquea cualquier solicitud de mutación (POST, PUT, DELETE, PATCH) en entidades de negocio.
 * Permite únicamente rutas de autoservicio para gestión de credenciales y preferencias del usuario.
 */
const restrictReadOnly = async (req, res, next) => {
  const mutatingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  if (!mutatingMethods.includes(req.method)) {
    return next();
  }

  // Rutas públicas y de autoservicio permitidas para usuarios de solo lectura
  const allowedSelfServicePaths = [
    '/api/login',
    '/api/login/azure',
    '/api/users/me/change-password',
    '/api/users/me/language',
    '/login',
    '/login/azure',
    '/users/me/change-password',
    '/users/me/language'
  ];

  if (allowedSelfServicePaths.some(p => req.path === p || req.path?.endsWith(p) || req.originalUrl?.startsWith(p))) {
    return next();
  }

  try {
    let user = req.currentUser;
    if (!user && req.currentPmId) {
      user = await Usuarios.findByPk(req.currentPmId);
    }

    if (user && user.perfil === 'SOLO_LECTURA') {
      console.warn(`[ReadOnlySecurity] Operación bloqueada (${req.method} ${req.originalUrl || req.path}) para usuario ${user.id_usuario} (${user.nombre} ${user.apellidos}) con perfil SOLO_LECTURA.`);
      return res.status(403).json({
        error: 'Acceso denegado. El perfil Solo Lectura no tiene permisos para crear, modificar o eliminar registros.'
      });
    }

    next();
  } catch (error) {
    console.error('Error en restrictReadOnly middleware:', error);
    return res.status(500).json({ error: 'Error interno de validación de permisos de usuario.' });
  }
};

module.exports = { restrictReadOnly };
