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

  // 2. Calculate actual consumption (all invoices, both PENDIENTE_DE_RECIBIR and RECIBIDA count)
  const invoices = await Facturas.findAll({
    where: {
      id_proyecto,
      estado: ['RECIBIDA', 'PENDIENTE_DE_RECIBIR']
    }
  });

  let consumo_real = 0;
  let total_facturado = 0;
  let total_pendiente = 0;
  invoices.forEach(fac => {
    const amount = parseFloat(fac.importe || 0);
    consumo_real += amount;
    if (fac.estado === 'RECIBIDA') total_facturado += amount;
    if (fac.estado === 'PENDIENTE_DE_RECIBIR') total_pendiente += amount;
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

  const parsedInitialBudget = parseFloat(budget_inicial || 0);
  const tasa_volatilidad_pct = parsedInitialBudget > 0 
    ? Number(((totalCRImporte / parsedInitialBudget) * 100).toFixed(1))
    : 0;

  return {
    budget_actualizado: Number(budget_actualizado.toFixed(2)),
    consumo_real: Number(consumo_real.toFixed(2)),
    total_facturado: Number(total_facturado.toFixed(2)),
    total_pendiente: Number(total_pendiente.toFixed(2)),
    presupuesto_disponible: Number(presupuesto_disponible.toFixed(2)),
    fecha_fin_estimada,
    total_cr_importe: Number(totalCRImporte.toFixed(2)),
    total_cr_dias: totalCRDays,
    tasa_volatilidad_pct
  };
}

/**
 * Calculates dynamic project fields in BATCH for an array of projects.
 * Executes ONLY 2 SQL queries total instead of 2 queries PER project.
 * 
 * @param {Array} projectsList - Array of project objects/instances containing id_proyecto, budget_inicial, fecha_fin_inicial.
 * @returns {Promise<Map<string, Object>>} Map keyed by id_proyecto containing calculation objects.
 */
async function getProjectsCalculationsBatch(projectsList) {
  const calculationsMap = new Map();
  if (!projectsList || projectsList.length === 0) return calculationsMap;

  const projectIds = projectsList.map(p => p.id_proyecto);
  const { Op } = require('sequelize');

  // 1. Fetch all approved CRs in 1 query
  const allCRs = await CambiosAlcance.findAll({
    where: {
      id_proyecto: { [Op.in]: projectIds },
      estado_cambio: 'APROBADO'
    }
  });

  // Group CRs by id_proyecto
  const crsByProject = new Map();
  allCRs.forEach(cr => {
    const list = crsByProject.get(cr.id_proyecto) || [];
    list.push(cr);
    crsByProject.set(cr.id_proyecto, list);
  });

  // 2. Fetch all relevant invoices in 1 query
  const allInvoices = await Facturas.findAll({
    where: {
      id_proyecto: { [Op.in]: projectIds },
      estado: ['RECIBIDA', 'PENDIENTE_DE_RECIBIR']
    }
  });

  // Group Invoices by id_proyecto
  const invoicesByProject = new Map();
  allInvoices.forEach(fac => {
    const list = invoicesByProject.get(fac.id_proyecto) || [];
    list.push(fac);
    invoicesByProject.set(fac.id_proyecto, list);
  });

  // 3. Compute in-memory for each project
  projectsList.forEach(p => {
    const id = p.id_proyecto;
    const budget_inicial = p.budget_inicial;
    const fecha_fin_inicial = p.fecha_fin_inicial;

    const approvedCRs = crsByProject.get(id) || [];
    let totalCRImporte = 0;
    let totalCRDays = 0;
    approvedCRs.forEach(cr => {
      if (cr.impacta_importe) totalCRImporte += parseFloat(cr.importe_impacto || 0);
      if (cr.impacta_tiempo) totalCRDays += parseInt(cr.dias_impacto || 0);
    });

    const budget_actualizado = parseFloat(budget_inicial || 0) + totalCRImporte;

    const invoices = invoicesByProject.get(id) || [];
    let consumo_real = 0;
    let total_facturado = 0;
    let total_pendiente = 0;
    invoices.forEach(fac => {
      const amount = parseFloat(fac.importe || 0);
      consumo_real += amount;
      if (fac.estado === 'RECIBIDA') total_facturado += amount;
      if (fac.estado === 'PENDIENTE_DE_RECIBIR') total_pendiente += amount;
    });

    const presupuesto_disponible = budget_actualizado - consumo_real;

    let fecha_fin_estimada = fecha_fin_inicial;
    if (fecha_fin_inicial) {
      const initialEndDate = new Date(fecha_fin_inicial);
      initialEndDate.setDate(initialEndDate.getDate() + totalCRDays);
      const year = initialEndDate.getFullYear();
      const month = String(initialEndDate.getMonth() + 1).padStart(2, '0');
      const day = String(initialEndDate.getDate()).padStart(2, '0');
      fecha_fin_estimada = `${year}-${month}-${day}`;
    }

    const parsedInitialBudget = parseFloat(budget_inicial || 0);
    const tasa_volatilidad_pct = parsedInitialBudget > 0
      ? Number(((totalCRImporte / parsedInitialBudget) * 100).toFixed(1))
      : 0;

    calculationsMap.set(id, {
      budget_actualizado: Number(budget_actualizado.toFixed(2)),
      consumo_real: Number(consumo_real.toFixed(2)),
      total_facturado: Number(total_facturado.toFixed(2)),
      total_pendiente: Number(total_pendiente.toFixed(2)),
      presupuesto_disponible: Number(presupuesto_disponible.toFixed(2)),
      fecha_fin_estimada,
      total_cr_importe: Number(totalCRImporte.toFixed(2)),
      total_cr_dias: totalCRDays,
      tasa_volatilidad_pct
    });
  });

  return calculationsMap;
}

module.exports = {
  getProjectCalculations,
  getProjectsCalculationsBatch
};

