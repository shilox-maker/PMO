const { SystemConfig } = require('../../models/index');
const { handleErr } = require('../../utils/helpers');
const { getMaintenanceStatus, updateMaintenanceCache } = require('../../middlewares/maintenance');

const getStatus = async (req, res) => {
  try {
    const status = await getMaintenanceStatus(true);
    return res.json({
      maintenance_mode: status.active,
      maintenance_message: status.message
    });
  } catch (error) {
    return handleErr(res, error, 500);
  }
};

const updateStatus = async (req, res) => {
  try {
    const { maintenance_mode, maintenance_message } = req.body;

    if (typeof maintenance_mode !== 'undefined') {
      const modeStr = String(!!maintenance_mode);
      await SystemConfig.upsert({
        clave: 'maintenance_mode',
        valor: modeStr,
        descripcion: 'Modo mantenimiento activo (true/false)'
      });
    }

    if (typeof maintenance_message !== 'undefined' && maintenance_message.trim() !== '') {
      await SystemConfig.upsert({
        clave: 'maintenance_message',
        valor: maintenance_message.trim(),
        descripcion: 'Mensaje informativo mostrado a los usuarios durante el mantenimiento'
      });
    }

    const modeRecord = await SystemConfig.findByPk('maintenance_mode');
    const msgRecord = await SystemConfig.findByPk('maintenance_message');

    const isActive = modeRecord ? modeRecord.valor === 'true' : false;
    const msg = msgRecord ? msgRecord.valor : '';

    updateMaintenanceCache(isActive, msg);

    return res.json({
      message: isActive ? 'Modo mantenimiento activado correctamente.' : 'Modo mantenimiento desactivado correctamente.',
      maintenance_mode: isActive,
      maintenance_message: msg
    });
  } catch (error) {
    return handleErr(res, error, 500);
  }
};

module.exports = {
  getStatus,
  updateStatus
};
