const { Facturas, CambiosAlcance } = require('./index');

/**
 * Calculates dynamic project fields in a DB-agnostic way using Sequelize.
 * Works perfectly on SQLite and MS SQL Server.
 * 
 * @param {string} id_proyecto - The unique project identifier.
 * @param {number} budget_inicial - The initial baseline budget.
 * @param {string} fecha_fin_inicial - The initial baseline end date (YYYY-MM-DD).
 */
async function getProjectCalculations(id_proyecto, budget_inicial, fecha_fin_inicial) {
  // 1. Calculate scope change impact
  const approvedCRs = await CambiosAlcance.findAll({
    where: {
      id_proyecto,
      estado_cambio: 'APROBADO'
    }
  });

  let totalCRImporte = 0;
  let totalCRDays = 0;

  approvedCRs.forEach(cr => {
    if (cr.impacta_importe) {
      totalCRImporte += parseFloat(cr.importe_impacto || 0);
    }
    if (cr.impacta_tiempo) {
      totalCRDays += parseInt(cr.dias_impacto || 0);
    }
  });

  const budget_actualizado = parseFloat(budget_inicial) + totalCRImporte;

  // 2. Calculate actual consumption (all invoices, both PENDIENTE_DE_RECIBIR and PAGADA count)
  const invoices = await Facturas.findAll({
    where: {
      id_proyecto,
      estado: ['PAGADA', 'PENDIENTE_DE_RECIBIR']
    }
  });

  let consumo_real = 0;
  invoices.forEach(fac => {
    consumo_real += parseFloat(fac.importe || 0);
  });

  // 3. Calculate budget available
  const presupuesto_disponible = budget_actualizado - consumo_real;

  // 4. Calculate estimated end date
  const initialEndDate = new Date(fecha_fin_inicial);
  initialEndDate.setDate(initialEndDate.getDate() + totalCRDays);
  
  // Format Date to YYYY-MM-DD
  const year = initialEndDate.getFullYear();
  const month = String(initialEndDate.getMonth() + 1).padStart(2, '0');
  const day = String(initialEndDate.getDate()).padStart(2, '0');
  const fecha_fin_estimada = `${year}-${month}-${day}`;

  return {
    budget_actualizado: Number(budget_actualizado.toFixed(2)),
    consumo_real: Number(consumo_real.toFixed(2)),
    presupuesto_disponible: Number(presupuesto_disponible.toFixed(2)),
    fecha_fin_estimada
  };
}

module.exports = {
  getProjectCalculations
};
