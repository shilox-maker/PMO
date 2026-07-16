const { CambiosAlcance, Facturas, Tareas } = require('../models/index');
const { Op } = require('sequelize');
const { sanitizeExcelValue } = require('../utils/helpers');

async function prepareProjectsData(projectsList) {
  const todayStr = new Date().toISOString().slice(0, 10);
  
  return Promise.all(
    projectsList.map(async (p) => {
      const id_proyecto = p.id_proyecto;

      // Obtener cambios de alcance aprobados
      const approvedCRs = await CambiosAlcance.findAll({
        where: { id_proyecto, estado_cambio: 'APROBADO' }
      });
      let totalCRDays = 0;
      let totalCRAmount = 0;
      approvedCRs.forEach(cr => {
        if (cr.impacta_tiempo) {
          totalCRDays += parseInt(cr.dias_impacto || 0, 10);
        }
        if (cr.impacta_importe) {
          totalCRAmount += parseFloat(cr.importe_impacto || 0);
        }
      });

      const budget_inicial = parseFloat(p.budget_inicial) || 0;
      const budget_actualizado = budget_inicial + totalCRAmount;

      const initialEndDate = new Date(p.fecha_fin_inicial);
      initialEndDate.setDate(initialEndDate.getDate() + totalCRDays);
      const year = initialEndDate.getFullYear();
      const month = String(initialEndDate.getMonth() + 1).padStart(2, '0');
      const day = String(initialEndDate.getDate()).padStart(2, '0');
      const fecha_fin_estimada = `${year}-${month}-${day}`;

      // Facturas
      const invoices = await Facturas.findAll({ where: { id_proyecto } });
      let consumo_real = 0;
      let pos = new Set();
      invoices.forEach(f => {
        if (f.PO) pos.add(f.PO);
        if (f.estado === 'RECIBIDA' || f.estado === 'PENDIENTE_DE_RECIBIR') {
          consumo_real += parseFloat(f.importe || 0);
        }
      });
      const po_list = Array.from(pos).join(', ');
      const presupuesto_disponible = budget_actualizado - consumo_real;

      // Hitos vencidos
      const overdueCount = await Tareas.count({
        where: {
          id_proyecto,
          es_hito: true,
          estado: 'PENDIENTE',
          fecha_limite: { [Op.lt]: todayStr }
        }
      });

      return {
        id_proyecto: sanitizeExcelValue(p.id_proyecto),
        nombre_proyecto: sanitizeExcelValue(p.nombre_proyecto),
        estado_proyecto: sanitizeExcelValue(p.Estado ? p.Estado.nombre_estado : 'Sin Estado'),
        indicador_rag: sanitizeExcelValue(p.indicador_rag),
        proveedor: sanitizeExcelValue(p.Proveedor ? p.Proveedor.nombre_razon_social : 'Sin Partner'),
        pm: sanitizeExcelValue(p.PM ? `${p.PM.nombre} ${p.PM.apellidos}` : 'Sin PM'),
        sede: sanitizeExcelValue(p.Sede ? p.Sede.nombre_sede : ''),
        po_list: sanitizeExcelValue(po_list),
        budget_inicial,
        budget_actualizado,
        consumo_real,
        presupuesto_disponible,
        fecha_inicio: p.fecha_inicio,
        fecha_fin_inicial: p.fecha_fin_inicial,
        fecha_fin_estimada,
        overdueCount
      };
    })
  );
}

module.exports = {
  prepareProjectsData
};
