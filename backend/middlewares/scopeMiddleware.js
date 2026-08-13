const { Usuarios, Ambitos, UsuarioAmbitos } = require('../models');

/**
 * Scope Middleware (tenantScope)
 * Valida el ámbito activo enviado en las cabeceras HTTP ('x-ambito-id' o 'x-ambito-code').
 * Garantiza seguridad Zero-Trust rechazando peticiones no autorizadas con HTTP 403 Forbidden.
 */
const scopeMiddleware = async (req, res, next) => {
  try {
    const pmId = req.currentPmId;
    if (!pmId) {
      return next(); // Rutas públicas o middleware de autenticación previo manejarán el error
    }

    const user = await Usuarios.findByPk(pmId, {
      include: [{ model: Ambitos, as: 'Ambitos', through: { attributes: ['rol_ambito'] } }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado.' });
    }

    req.currentUser = user;
    const userAmbitos = user.Ambitos || [];
    const userAmbitoIds = userAmbitos.map(a => Number(a.id_ambito));
    const isAdminOrDirector = ['ADMINISTRADOR', 'DIRECTOR'].includes(user.perfil);
    const effectiveUserAmbitoIds = (!isAdminOrDirector && userAmbitoIds.length === 0) ? [1] : userAmbitoIds;

    const rawHeader = req.headers['x-ambito-id'] || req.headers['x-ambito-code'];

    // 1. Si solicita Vista Global ('ALL')
    if (rawHeader && String(rawHeader).toUpperCase() === 'ALL') {
      if (isAdminOrDirector) {
        req.currentAmbitoId = 'ALL';
        req.userAmbitoIds = 'ALL';
      } else {
        req.currentAmbitoId = effectiveUserAmbitoIds[0] || 1;
        req.userAmbitoIds = effectiveUserAmbitoIds;
      }
      return next();
    }

    // 2. Si solicita un Ámbito específico (por ID numeric o por Code string)
    if (rawHeader && String(rawHeader).toUpperCase() !== 'ALL') {
      let targetAmbito = null;
      if (!isNaN(rawHeader)) {
        targetAmbito = await Ambitos.findByPk(Number(rawHeader));
      } else {
        targetAmbito = await Ambitos.findOne({ where: { code: String(rawHeader).toUpperCase() } });
      }

      if (!targetAmbito || !targetAmbito.activo) {
        req.currentAmbitoId = effectiveUserAmbitoIds[0] || 1;
        req.userAmbitoIds = isAdminOrDirector ? 'ALL' : effectiveUserAmbitoIds;
        return next();
      }

      const isAuthorized = isAdminOrDirector || effectiveUserAmbitoIds.includes(targetAmbito.id_ambito);
      if (!isAuthorized) {
        req.currentAmbitoId = effectiveUserAmbitoIds[0] || 1;
        req.userAmbitoIds = isAdminOrDirector ? 'ALL' : effectiveUserAmbitoIds;
        return next();
      }

      req.currentAmbitoId = targetAmbito.id_ambito;
      req.currentAmbitoCode = targetAmbito.code;
      req.userAmbitoIds = isAdminOrDirector ? 'ALL' : effectiveUserAmbitoIds;
      return next();
    }

    // 3. Fallback: Sin cabecera explícita
    if (effectiveUserAmbitoIds.length > 0) {
      req.currentAmbitoId = effectiveUserAmbitoIds[0];
      req.userAmbitoIds = isAdminOrDirector ? 'ALL' : effectiveUserAmbitoIds;
    } else if (isAdminOrDirector) {
      req.currentAmbitoId = 'ALL';
      req.userAmbitoIds = 'ALL';
    } else {
      req.currentAmbitoId = 1; // Default fallback IT Corporate
      req.userAmbitoIds = [1];
    }

    next();
  } catch (error) {
    console.error('Error en scopeMiddleware:', error);
    return res.status(500).json({ error: 'Error interno en la verificación del ámbito del usuario.' });
  }
};

module.exports = { scopeMiddleware };
