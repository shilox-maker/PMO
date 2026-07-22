import { formatDate, formatCurrency } from './reportHtmlComponents';

export const getDashboardStyles = () => `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', system-ui, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; font-size: 13px; line-height: 1.5; }
  @media print {
    body { padding: 20px; }
    .no-print { display: none !important; }
    .summary-page { page-break-after: always; border: none; padding: 0; margin-bottom: 0; }
    .project-card { page-break-after: always; }
  }
  .report-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #1a1a2e; }
  .report-header h1 { font-size: 20px; font-weight: 700; color: #1a1a2e; }
  .summary-page { border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px; background: #fff; page-break-after: always; }
  .summary-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 12px; }
  .summary-kpi-box { padding: 12px; border-radius: 8px; background: #f8f9fa; border: 1px solid #e9ecef; text-align: center; }
  .summary-kpi-box .label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
  .summary-kpi-box .value { font-size: 18px; font-weight: 700; }
  .summary-kpi-box.rag-red { background: #ffebeb; border-color: #ffccd5; color: #dc2626; }
  .summary-kpi-box.rag-yellow { background: #fffde6; border-color: #fff2cc; color: #d97706; }
  .summary-kpi-box.rag-green { background: #f0fdf4; border-color: #dcfce7; color: #16a34a; }
  .project-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; background: #fff; }
  .project-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .project-card-header h2 { font-size: 15px; font-weight: 700; }
  .project-id-badge { background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; }
  .sub-section { margin-top: 16px; }
  .sub-section h3 { font-size: 12px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 12px; }
  .kpi-box { padding: 10px; border-radius: 6px; background: #f8f9fa; border: 1px solid #e9ecef; }
  .kpi-box .label { font-size: 10px; color: #888; text-transform: uppercase; font-weight: 600; margin-bottom: 2px; }
  .kpi-box .value { font-size: 13px; font-weight: 700; }
  .alert-red { color: #dc2626 !important; }
  .alert-green { color: #16a34a !important; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th { padding: 6px 8px; background: #f1f3f5; font-size: 10px; text-transform: uppercase; font-weight: 700; text-align: left; border-bottom: 2px solid #dee2e6; }
  td { padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 11px; }
  .print-btn { position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #1a1a2e; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-family: 'Inter', sans-serif; font-weight: 600; font-size: 13px; z-index: 100; }
`;

export const renderProjectCard = (project, comments, reportOptions, highlightDate) => {
  const calc = project.calculations || {};
  const budgetInitial = parseFloat(project.budget_inicial) || 0;
  const gastoTotal = calc.gasto_comprometido || 0;
  const budgetOverrun = gastoTotal > budgetInitial;
  const budgetPercent = budgetInitial > 0 ? ((gastoTotal / budgetInitial) * 100).toFixed(1) : 0;

  const fechaFinInicial = project.fecha_fin_inicial || '—';
  const fechaFinEstimada = calc.fecha_fin_estimada || fechaFinInicial;
  const diasRetraso = calc.dias_retraso_aprobados || 0;
  const hasDelay = diasRetraso > 0;

  // Milestones
  const allTasks = project.Tareas || [];
  const milestones = allTasks.filter(t => t.es_hito);
  const completed = milestones.filter(t => t.estado === 'COMPLETADA').slice(0, 3);
  const pending = milestones.filter(t => t.estado === 'PENDIENTE').slice(0, 3);

  // Comments filter
  const importantComments = comments.filter(c => c.es_importante);

  const kpisHtml = reportOptions.resumen ? `
    <div class="kpi-grid">
      <div class="kpi-box"><div class="label">Fecha Fin Inicial</div><div class="value">${formatDate(fechaFinInicial)}</div></div>
      <div class="kpi-box"><div class="label">Fecha Fin Estimada</div><div class="value ${hasDelay ? 'alert-red' : ''}">${formatDate(fechaFinEstimada)} ${hasDelay ? `<span style="font-size:11px;font-weight:500;">(+${diasRetraso} días)</span>` : ''}</div></div>
      <div class="kpi-box"><div class="label">Presupuesto Inicial</div><div class="value">${formatCurrency(budgetInitial)}</div></div>
      <div class="kpi-box"><div class="label">Gasto Comprometido (${budgetPercent}%)</div><div class="value ${budgetOverrun ? 'alert-red' : 'alert-green'}">${formatCurrency(gastoTotal)} ${budgetOverrun ? '<span style="font-size:11px;">⚠️ SOBRECOSTO</span>' : ''}</div></div>
    </div>` : '';

  const alcanceHtml = reportOptions.alcance ? `
    <div class="sub-section">
      <h3>🎯 Alcance del Proyecto</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 6px;">
        <div style="padding:10px; background:#f8f9fa; border:1px solid #e9ecef; border-radius:6px;"><strong>¿Por qué?</strong><div style="margin-top:4px; font-size:11px;">${project.alcance_por_que || 'No definido'}</div></div>
        <div style="padding:10px; background:#f8f9fa; border:1px solid #e9ecef; border-radius:6px;"><strong>Objetivo principal</strong><div style="margin-top:4px; font-size:11px;">${project.alcance_objetivo || 'No definido'}</div></div>
      </div>
    </div>` : '';

  const cierreHtml = reportOptions.cierre ? `
    <div class="sub-section">
      <h3>🏆 Criterios de Cierre</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 6px;">
        <div style="padding:10px; background:#f8f9fa; border:1px solid #e9ecef; border-radius:6px;"><strong>Criterios de aceptación</strong><div style="margin-top:4px; font-size:11px;">${project.cierre_aceptacion || 'No definido'}</div></div>
        <div style="padding:10px; background:#f8f9fa; border:1px solid #e9ecef; border-radius:6px;"><strong>Criterios de éxito</strong><div style="margin-top:4px; font-size:11px;">${project.cierre_exito || 'No definido'}</div></div>
      </div>
    </div>` : '';

  const hitosHtml = reportOptions.hitos ? `
    <div class="sub-section">
      <h3>🏁 Hitos del Proyecto</h3>
      <table>
        <thead><tr><th>Hito</th><th>Fecha</th><th>Estado</th></tr></thead>
        <tbody>
          ${completed.length === 0 && pending.length === 0 ? '<tr><td colspan="3" style="text-align:center;color:#999;padding:8px;">Sin hitos</td></tr>' : ''}
          ${completed.map(m => `
            <tr>
              <td>${m.titulo_tarea}</td>
              <td>${formatDate(m.fecha_limite)}</td>
              <td><span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600;background:#e8f5e9;color:#2e7d32;">✅ Completado</span></td>
            </tr>
          `).join('')}
          ${pending.map(m => `
            <tr>
              <td>${m.titulo_tarea}</td>
              <td>${formatDate(m.fecha_limite)}</td>
              <td><span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:600;background:#fff3e0;color:#e65100;">⏳ Pendiente</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>` : '';

  const timelineHtml = reportOptions.timeline ? `
    <div class="sub-section">
      <h3>📅 Cronología del Proyecto (Timeline)</h3>
      ${allTasks.length === 0 ? '<p style="color:#999;font-size:11px;font-style:italic;">Sin cronograma.</p>' : `
      <div style="position:relative; padding-left: 15px; border-left: 2px solid #1a1a2e; margin: 12px 0 12px 5px;">
        ${allTasks.sort((a, b) => new Date(a.fecha_limite) - new Date(b.fecha_limite)).slice(0, 8).map(event => `
          <div style="position:relative; margin-bottom: 12px;">
            <div style="position:absolute; left:-21px; top:3px; width:10px; height:10px; border-radius:50%; background:${event.es_hito ? '#e65100' : '#1a1a2e'}; border: 2px solid #fff; box-shadow: 0 0 0 1.5px ${event.es_hito ? '#e65100' : '#1a1a2e'};"></div>
            <div style="font-weight: 600; font-size: 11.5px;">${event.titulo_tarea} ${event.es_hito ? '<span style="font-size:8.5px; background:#ffe0b2; color:#e65100; padding:1px 4px; border-radius:8px; margin-left:4px; font-weight:700;">HITO</span>' : ''}</div>
            <div style="font-size:10px; color:#666;">F. Límite: ${formatDate(event.fecha_limite)} · Estado: ${event.estado}</div>
          </div>
        `).join('')}
      </div>`}
    </div>` : '';

  const risksList = project.Riesgos || [];
  const risksHtml = (reportOptions.riesgos && risksList.length > 0) ? `
    <div class="sub-section">
      <h3>⚠️ Riesgos</h3>
      <table>
        <thead><tr><th>Código</th><th>Riesgo</th><th>P / I</th><th>Mitigación</th><th>Estado</th></tr></thead>
        <tbody>
          ${risksList.map(r => `
            <tr>
              <td><strong>${r.id_riesgo}</strong></td>
              <td>${r.titulo_riesgo}</td>
              <td>${r.probabilidad} / ${r.impacto}</td>
              <td>${r.plan_mitigacion}</td>
              <td>${r.estado_riesgo}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>` : '';

  const incidentsList = project.Incidencias || [];
  const incidentsHtml = (reportOptions.incidencias && incidentsList.length > 0) ? `
    <div class="sub-section">
      <h3>🛑 Incidencias</h3>
      <table>
        <thead><tr><th>Código</th><th>Incidencia</th><th>Tipo</th><th>Criticidad</th><th>Estado</th></tr></thead>
        <tbody>
          ${incidentsList.map(i => `
            <tr>
              <td><strong>${i.id_incidencia}</strong></td>
              <td>${i.titulo}</td>
              <td>${i.tipo_incidencias}</td>
              <td>${i.criticidad}</td>
              <td>${i.estado}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>` : '';

  const crList = project.CambiosAlcance || [];
  const crHtml = (reportOptions.cambios && crList.length > 0) ? `
    <div class="sub-section">
      <h3>📈 Cambios de Alcance (CR)</h3>
      <table>
        <thead><tr><th>Código</th><th>Descripción / Motivo</th><th>Importe</th><th>Tiempo</th><th>Estado</th></tr></thead>
        <tbody>
          ${crList.map(c => `
            <tr>
              <td><strong>${c.id_cambio}</strong></td>
              <td>${c.descripcion_motivo}</td>
              <td>${c.impacta_importe ? `${formatCurrency(parseFloat(c.importe_impacto))}` : 'Sin impacto'}</td>
              <td>${c.impacta_tiempo ? `+${c.dias_impacto} días` : 'Sin impacto'}</td>
              <td>${c.estado_cambio}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>` : '';

  const lessonsList = project.LeccionesAprendidas || [];
  const lessonsHtml = (reportOptions.lecciones && lessonsList.length > 0) ? `
    <div class="sub-section">
      <h3>⭐ Lecciones Aprendidas</h3>
      <table>
        <thead><tr><th>Código</th><th>Tipo</th><th>Título</th><th>Recomendación</th></tr></thead>
        <tbody>
          ${lessonsList.map(l => `
            <tr>
              <td><strong>${l.id_leccion}</strong></td>
              <td>${l.tipo_leccion === 'BUENA_PRACTICA' ? 'Buena Práctica' : 'Error a Evitar'}</td>
              <td><strong>${l.titulo}</strong></td>
              <td>${l.recomendacion_futura || l.contexto || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>` : '';

  const commentsHtml = reportOptions.resumen ? `
    <div class="sub-section">
      <h3>💬 Muro Ejecutivo</h3>
      ${importantComments.length === 0 ? '<p style="color:#999;font-style:italic;">No hay comentarios importantes.</p>' : importantComments.map(c => {
        const isDireccion = c.para_direccion;
        const commentDate = new Date(c.fecha_registro).toISOString().split('T')[0];
        const shouldHighlight = highlightDate && commentDate >= highlightDate;

        const highlightTag = shouldHighlight ? `
          <span style="display:inline-block;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;background-color:#ffebeb;color:#e63946;margin-left:8px;border:1px solid #ffccd5;">A REVISAR</span>
        ` : '';

        const directionTag = isDireccion ? `
          <span style="display:inline-block;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;background-color:#e8f0fe;color:#1a73e8;margin-left:8px;border:1px solid #d2e3fc;">⭐ DIRECCIÓN</span>
        ` : '';

        return `
          <div style="padding:10px; margin-bottom:8px; background:${isDireccion ? 'rgba(10, 132, 255, 0.05)' : '#f8f9fa'}; border-left:4px solid ${isDireccion ? '#007aff' : '#f59e0b'}; border-radius:4px;">
            <div style="display:flex; justify-content:space-between; font-size:11px; color:#666; margin-bottom:4px;">
              <strong>${c.Autor?.nombre || ''} ${c.Autor?.apellidos || ''} ${directionTag} ${highlightTag}</strong>
              <span>${formatDate(c.fecha_registro)}</span>
            </div>
            <div style="font-size:11.5px; line-height:1.4;">${c.texto_comentario}</div>
          </div>
        `;
      }).join('')}
    </div>` : '';

  return `
    <div class="project-card">
      <div class="project-card-header">
        <h2>${project.Estado?.icono || ''} ${project.nombre_proyecto}</h2>
        <span class="project-id-badge">${project.id_proyecto}</span>
      </div>
      <p style="margin-bottom:12px; color:#555; font-size:12px;"><strong>PM:</strong> ${project.PM?.nombre || ''} ${project.PM?.apellidos || ''} | <strong>Partner:</strong> ${project.Proveedor?.nombre_razon_social || '—'}</p>
      ${kpisHtml}
      ${alcanceHtml}
      ${cierreHtml}
      ${hitosHtml}
      ${timelineHtml}
      ${risksHtml}
      ${incidentsHtml}
      ${crHtml}
      ${lessonsHtml}
      ${commentsHtml}
    </div>
  `;
};
