/**
 * Helper para generar el desglose de cuotas de facturas/cobros recurrentes.
 */
export function generateRecurringInvoices({
  baseForm,
  frecuencia,
  fechaInicio,
  modoTermino,
  fechaFin,
  numCuotas
}) {
  if (!fechaInicio) return [];

  const parseDate = (str) => {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  };

  const formatDate = (dateObj) => {
    const y = dateObj.getUTCFullYear();
    const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const addMonths = (dateObj, months) => {
    const newDate = new Date(dateObj.getTime());
    const currentMonth = newDate.getUTCMonth();
    newDate.setUTCMonth(currentMonth + months);
    return newDate;
  };

  const stepMonths = frecuencia === 'TRIMESTRAL' ? 3 : frecuencia === 'ANUAL' ? 12 : 1;

  const dates = [];
  let currentDate = parseDate(fechaInicio);

  if (modoTermino === 'CUOTAS') {
    const limit = Math.max(1, Math.min(parseInt(numCuotas, 10) || 1, 60));
    for (let i = 0; i < limit; i++) {
      dates.push(formatDate(currentDate));
      currentDate = addMonths(currentDate, stepMonths);
    }
  } else {
    const endDate = fechaFin ? parseDate(fechaFin) : currentDate;
    let count = 0;
    // Límite de seguridad de 120 iteraciones para evitar bucles infinitos
    while (currentDate <= endDate && count < 120) {
      dates.push(formatDate(currentDate));
      currentDate = addMonths(currentDate, stepMonths);
      count++;
    }
  }

  const total = dates.length;

  return dates.map((fecha, idx) => ({
    id_temp: `temp-${idx + 1}`,
    fecha_factura: fecha,
    concepto: total > 1 ? `${baseForm.concepto} (${idx + 1}/${total})` : baseForm.concepto,
    importe: parseFloat(baseForm.importe) || 0,
    id_proveedor: baseForm.id_proveedor ? parseInt(baseForm.id_proveedor, 10) : null,
    id_tipo_factura: baseForm.id_tipo_factura ? parseInt(baseForm.id_tipo_factura, 10) : null,
    numero_factura: baseForm.numero_factura || null,
    PO: baseForm.PO || null,
    estado: baseForm.estado || 'PENDIENTE_DE_RECIBIR'
  }));
}
