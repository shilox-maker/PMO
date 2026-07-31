const { SystemConfig, Usuarios } = require('../models/index');

// Cache in memory to minimize DB load
let maintenanceCache = {
  active: false,
  message: 'La aplicación se encuentra en mantenimiento programado. Por favor, vuelva a intentarlo más tarde.',
  lastFetched: 0
};

const CACHE_TTL_MS = 5000; // Refresh cache every 5s if needed

const getMaintenanceStatus = async (forceRefresh = false) => {
  const now = Date.now();
  if (forceRefresh || now - maintenanceCache.lastFetched > CACHE_TTL_MS) {
    try {
      const modeRecord = await SystemConfig.findByPk('maintenance_mode');
      const msgRecord = await SystemConfig.findByPk('maintenance_message');
      
      maintenanceCache.active = modeRecord ? modeRecord.valor === 'true' : false;
      if (msgRecord && msgRecord.valor) {
        maintenanceCache.message = msgRecord.valor;
      }
      maintenanceCache.lastFetched = now;
    } catch (err) {
      console.error('Error al comprobar estado de mantenimiento en DB:', err);
    }
  }
  return maintenanceCache;
};

const updateMaintenanceCache = (active, message) => {
  maintenanceCache.active = !!active;
  if (message) maintenanceCache.message = message;
  maintenanceCache.lastFetched = Date.now();
};

const checkMaintenance = async (req, res, next) => {
  // Always bypass login, health check, and maintenance status check
  const bypassPaths = [
    '/api/login',
    '/api/login/azure',
    '/api/health',
    '/api/maintenance/status'
  ];

  if (bypassPaths.includes(req.path)) {
    return next();
  }

  const { active, message } = await getMaintenanceStatus();
  if (!active) {
    return next();
  }

  // If maintenance is active, verify if user is ADMINISTRADOR
  if (req.currentPmId) {
    try {
      const user = await Usuarios.findByPk(req.currentPmId);
      if (user && user.perfil === 'ADMINISTRADOR') {
        return next();
      }
    } catch (err) {
      console.error('Error al comprobar perfil de usuario en middleware de mantenimiento:', err);
    }
  }

  return res.status(503).json({
    error: message,
    maintenance: true
  });
};

module.exports = {
  checkMaintenance,
  getMaintenanceStatus,
  updateMaintenanceCache
};
