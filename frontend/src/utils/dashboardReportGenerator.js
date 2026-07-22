import { formatDate, formatCurrency } from './reportHtmlComponents';
import { getDashboardStyles, renderProjectCard } from './dashboardReportHtmlComponents';

export const generateDashboardReport = (detailedProjects, reportOptions, highlightDate) => {
  if (!detailedProjects || detailedProjects.length === 0) return;

  const todayStr = new Date().toISOString().slice(0, 10);
  const totalProjects = detailedProjects.length;
  const ragRedCount = detailedProjects.filter(dp => dp.project.indicador_rag === 'ROJO').length;
  const ragYellowCount = detailedProjects.filter(dp => dp.project.indicador_rag === 'AMARILLO').length;
  const ragGreenCount = detailedProjects.filter(dp => dp.project.indicador_rag === 'VERDE').length;

  const alertedProjects = [];
  detailedProjects.forEach(dp => {
    const project = dp.project;
    const calc = project.calculations || {};
    const budgetInitial = parseFloat(project.budget_inicial) || 0;
    const gastoTotal = calc.gasto_comprometido || 0;
    const budgetOverrun = gastoTotal > budgetInitial;
    
    const milestones = (project.Tareas || []).filter(t => t.es_hito);
    const overdueMilestones = milestones.filter(m => m.estado === 'PENDIENTE' && m.fecha_limite < todayStr);

    const reasons = [];
    if (project.indicador_rag === 'ROJO') reasons.push('RAG Crítico (Rojo)');
    if (overdueMilestones.length > 0) reasons.push(`${overdueMilestones.length} hito(s) vencido(s)`);
    if (budgetOverrun) {
      const overCost = gastoTotal - budgetInitial;
      reasons.push(`Desvío Presupuestario (${formatCurrency(overCost)})`);
    }

    if (reasons.length > 0) {
      alertedProjects.push({
        id_proyecto: project.id_proyecto,
        nombre_proyecto: project.nombre_proyecto,
        pm: `${project.PM?.nombre || ''} ${project.PM?.apellidos || ''}`,
        partner: project.Proveedor?.nombre_razon_social || '—',
        rag: project.indicador_rag,
        reasons: reasons.join(' | ')
      });
    }
  });

  const summaryHtml = `
    <div class="summary-page">
      <div style="margin-bottom: 24px; text-align: center;">
        <h2 style="font-size: 16px; font-weight: 700; color: #1a1a2e; text-transform: uppercase; margin-bottom: 4px;">Cuadro de Mando Ejecutivo</h2>
        <p style="font-size: 11px; color: #666;">Dacsa IT PPM Governance · Resumen de Cartera</p>
      </div>
      
      <div class="summary-kpi-grid">
        <div class="summary-kpi-box"><div class="label">Total Proyectos</div><div class="value">${totalProjects}</div></div>
        <div class="summary-kpi-box rag-green"><div class="label">Green (Estables)</div><div class="value">${ragGreenCount}</div></div>
        <div class="summary-kpi-box rag-yellow"><div class="label">Yellow (Advertencia)</div><div class="value">${ragYellowCount}</div></div>
        <div class="summary-kpi-box rag-red"><div class="label">Red (Críticos)</div><div class="value">${ragRedCount}</div></div>
      </div>

      <div style="margin-top: 24px;">
        <h3 style="font-size: 11px; text-transform: uppercase; color: #1a1a2e; border-bottom: 2px solid #1a1a2e; padding-bottom: 6px; margin-bottom: 12px; font-weight: 700;">🚨 Alertas Importantes y Proyectos a Revisar</h3>
        ${alertedProjects.length === 0 ? `
          <p style="text-align: center; color: #666; font-style: italic; padding: 20px; background: #f8f9fa; border-radius: 6px; border: 1px dashed #ccc;">No se registran alertas de revisión prioritaria en la cartera.</p>
        ` : `
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Proyecto</th>
                <th>RAG</th>
                <th>Motivo Alerta</th>
                <th>PM</th>
                <th>Socio Tecnológico</th>
              </tr>
            </thead>
            <tbody>
              ${alertedProjects.map(ap => `
                <tr>
                  <td style="font-weight: 600;">${ap.id_proyecto}</td>
                  <td>${ap.nombre_proyecto}</td>
                  <td><span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:9px;font-weight:700;${ap.rag === 'ROJO' ? 'background:#ffebeb;color:#dc2626;' : ap.rag === 'AMARILLO' ? 'background:#fff3e0;color:#e65100;' : 'background:#e8f5e9;color:#2e7d32;'}">${ap.rag}</span></td>
                  <td style="color: #c00000; font-weight: 600;">${ap.reasons}</td>
                  <td>${ap.pm}</td>
                  <td>${ap.partner}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>
    </div>
  `;

  const projectsHtml = detailedProjects.map(dp => renderProjectCard(dp.project, dp.comments, reportOptions, highlightDate)).join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Informe Consolidado de Proyectos</title>
  <style>
    ${getDashboardStyles()}
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>

  <div class="report-header">
    <div>
      <h1>Informe Consolidado de Proyectos</h1>
      <p style="font-size:12px;color:#666;">Dacsa IT PPM Governance</p>
    </div>
    <div style="font-size:11px; text-align:right;">
      <p><strong>Fecha:</strong> ${formatDate(new Date().toISOString())}</p>
      ${highlightDate ? `<p><strong>Filtro "A revisar" desde:</strong> ${formatDate(highlightDate)}</p>` : ''}
    </div>
  </div>

  ${summaryHtml}

  ${projectsHtml}
</body>
</html>`;

  const reportWindow = window.open('', '_blank');
  if (reportWindow) {
    reportWindow.document.write(html);
    reportWindow.document.close();
  }
};
