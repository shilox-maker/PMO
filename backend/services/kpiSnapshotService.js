const { Op } = require('sequelize');
const { KpiSnapshots } = require('../models/index');

/**
 * Registra o actualiza la foto diaria de KPIs para la fecha actual.
 * @param {Object} metricsMap Objeto clave-valor con las métricas actuales (ej. { delayed_partial: 3, inactive: 1 })
 * @param {number|null} portfolioId ID opcional del portfolio
 */
async function recordDailySnapshots(metricsMap, portfolioId = null) {
  if (!metricsMap || typeof metricsMap !== 'object') return;
  const todayStr = new Date().toISOString().split('T')[0];

  const entries = Object.entries(metricsMap);
  for (const [key, val] of entries) {
    if (val === undefined || val === null || isNaN(val)) continue;
    const numValue = parseFloat(val);

    const where = {
      fecha: todayStr,
      metric_key: key,
      portfolio_id: portfolioId || null
    };

    const existing = await KpiSnapshots.findOne({ where });
    if (existing) {
      if (existing.metric_value !== numValue) {
        existing.metric_value = numValue;
        await existing.save();
      }
    } else {
      await KpiSnapshots.create({
        fecha: todayStr,
        metric_key: key,
        metric_value: numValue,
        portfolio_id: portfolioId || null
      });
    }
  }
}

/**
 * Obtiene la tendencia comparando los valores actuales de KPIs con la foto más cercana de hace N días.
 * @param {Object} currentMetrics Objeto con las métricas actuales
 * @param {number} timeframeDays Días a retroceder (ej. 7 o 30)
 * @param {number|null} portfolioId ID opcional del portfolio
 */
async function getKpiTrends(currentMetrics, timeframeDays = 7, portfolioId = null) {
  const result = {};
  if (!currentMetrics || typeof currentMetrics !== 'object') return result;

  const targetDateObj = new Date();
  targetDateObj.setDate(targetDateObj.getDate() - parseInt(timeframeDays, 10));
  const targetDateStr = targetDateObj.toISOString().split('T')[0];

  const keys = Object.keys(currentMetrics);
  if (keys.length === 0) return result;

  // Buscar los snapshots registrados en o antes de la fecha objetivo
  const pastSnapshots = await KpiSnapshots.findAll({
    where: {
      metric_key: { [Op.in]: keys },
      fecha: { [Op.lte]: targetDateStr },
      portfolio_id: portfolioId || null
    },
    order: [['fecha', 'DESC']]
  });

  // Mapear por metric_key la foto más reciente anterior a la fecha objetivo
  const pastMap = new Map();
  pastSnapshots.forEach(snap => {
    if (!pastMap.has(snap.metric_key)) {
      pastMap.set(snap.metric_key, parseFloat(snap.metric_value));
    }
  });

  // Métricas donde un incremento es alerta/negativo
  const negativeIfHigher = new Set(['delayed_partial', 'inactive', 'rag_rojo', 'rag_amarillo']);

  keys.forEach(key => {
    const current = parseFloat(currentMetrics[key] || 0);
    const hasHistory = pastMap.has(key);
    const previous = hasHistory ? pastMap.get(key) : current;
    const delta = Math.round((current - previous) * 100) / 100;

    let pct = 0;
    if (hasHistory && previous !== 0) {
      pct = Math.round(((current - previous) / Math.abs(previous)) * 100);
    }

    let direction = 'flat';
    if (delta > 0) direction = 'up';
    else if (delta < 0) direction = 'down';

    const isAlertMetric = negativeIfHigher.has(key);
    let isPositive = true;
    if (isAlertMetric) {
      isPositive = delta <= 0;
    } else {
      isPositive = delta >= 0;
    }

    result[key] = {
      current,
      previous,
      delta,
      pct,
      direction,
      isPositive,
      hasHistory
    };
  });

  return result;
}

module.exports = {
  recordDailySnapshots,
  getKpiTrends
};
