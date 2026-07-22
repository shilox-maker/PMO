export const formatCurrency = (val) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);

export const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth()+1).padStart(2, '0')}/${dt.getFullYear()}`;
};

export const formatDateTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} a las ${hours}:${minutes}`;
};

export const milestoneRows = (list, type) => {
  if (list.length === 0) return `<tr><td colspan="3" style="text-align:center;color:#999;padding:12px;">Sin hitos ${type}</td></tr>`;
  return list.map(m => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;">${m.titulo_tarea}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;">${formatDate(m.fecha_limite)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;">
        <span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600;background:${m.estado === 'COMPLETADA' ? '#e8f5e9' : '#fff3e0'};color:${m.estado === 'COMPLETADA' ? '#2e7d32' : '#e65100'};">
          ${m.estado === 'COMPLETADA' ? '✅ Completado' : '⏳ Pendiente'}
        </span>
      </td>
    </tr>
  `).join('');
};

export const getReportStyles = () => `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', system-ui, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; font-size: 13px; line-height: 1.6; }
  @media print {
    body { padding: 20px; }
    .no-print { display: none !important; }
  }
  .report-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #1a1a2e; }
  .report-header h1 { font-size: 22px; font-weight: 700; color: #1a1a2e; }
  .report-header .meta { font-size: 12px; color: #666; text-align: right; }
  .section { margin-bottom: 28px; }
  .section h2 { font-size: 15px; font-weight: 700; color: #1a1a2e; margin-bottom: 14px; padding-bottom: 6px; border-bottom: 2px solid #eee; text-transform: uppercase; letter-spacing: 0.05em; }
  .kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 8px; }
  .kpi-box { padding: 16px; border-radius: 10px; background: #f8f9fa; border: 1px solid #e9ecef; }
  .kpi-box .label { font-size: 11px; color: #888; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em; margin-bottom: 4px; }
  .kpi-box .value { font-size: 18px; font-weight: 700; }
  .alert-red { color: #dc2626 !important; }
  .alert-green { color: #16a34a !important; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { padding: 10px 12px; background: #f1f3f5; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; color: #555; text-align: left; border-bottom: 2px solid #dee2e6; }
  .print-btn { position: fixed; top: 20px; right: 20px; padding: 12px 24px; background: #1a1a2e; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 14px; z-index: 100; }
  .print-btn:hover { background: #2d2d4e; }
`;

export const getHeaderHtml = (project) => `
  <div class="report-header">
    <div>
      <h1>${project.Estado?.icono || ''} ${project.nombre_proyecto}</h1>
      <p style="font-size:13px;color:#666;margin-top:4px;">${project.id_proyecto} · ${project.Estado?.nombre_estado || 'Sin Estado'}</p>
    </div>
    <div class="meta">
      <p><strong>PM:</strong> ${project.PM?.nombre || ''} ${project.PM?.apellidos || ''}</p>
      <p><strong>Partner:</strong> ${project.Proveedor?.nombre_razon_social || '—'}</p>
      <p><strong>Sede:</strong> ${project.Sede?.nombre_sede || '—'}</p>
      <p><strong>Generado:</strong> ${formatDate(new Date().toISOString())}</p>
    </div>
  </div>
`;

export {
  getKpisHtml,
  getAlcanceHtml,
  getCierreHtml,
  getHitosHtml,
  getRisksHtml,
  getIncidentsHtml,
  getCrHtml,
  getLessonsHtml,
  getTimelineHtml,
  getCommentsHtml
} from './reportHtmlSections';
