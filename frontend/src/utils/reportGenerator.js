export const generateProjectReport = (project, comments, reportOptions) => {
  if (!project) return;

  const importantComments = comments.filter(c => c.es_importante);
  const calc = project.calculations || {};
  const budgetInitial = parseFloat(project.budget_inicial) || 0;
  const gastoTotal = calc.gasto_comprometido || 0;
  const budgetOverrun = gastoTotal > budgetInitial;
  const budgetPercent = budgetInitial > 0 ? ((gastoTotal / budgetInitial) * 100).toFixed(1) : 0;

  const fechaFinInicial = project.fecha_fin_inicial || '—';
  const fechaFinEstimada = calc.fecha_fin_estimada || fechaFinInicial;
  const diasRetraso = calc.dias_retraso_aprobados || 0;
  const hasDelay = diasRetraso > 0;

  // Milestones (from tasks that are hitos)
  const allTasks = project.Tareas || [];
  const milestones = allTasks.filter(t => t.es_hito);
  const completed = milestones.filter(t => t.estado === 'COMPLETADA')
    .sort((a, b) => new Date(b.fecha_limite) - new Date(a.fecha_limite))
    .slice(0, 3);
  const pending = milestones.filter(t => t.estado === 'PENDIENTE')
    .sort((a, b) => new Date(a.fecha_limite) - new Date(b.fecha_limite))
    .slice(0, 3);

  const formatCurrency = (val) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);
  const formatDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth()+1).padStart(2, '0')}/${dt.getFullYear()}`;
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} a las ${hours}:${minutes}`;
  };

  const milestoneRows = (list, type) => {
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

  const kpisHtml = reportOptions.resumen ? `
<div class="section">
  <h2>📊 KPIs de Control</h2>
  <div class="kpi-grid">
    <div class="kpi-box">
      <div class="label">Fecha Fin Inicial</div>
      <div class="value">${formatDate(fechaFinInicial)}</div>
    </div>
    <div class="kpi-box">
      <div class="label">Fecha Fin Estimada</div>
      <div class="value ${hasDelay ? 'alert-red' : ''}">${formatDate(fechaFinEstimada)} ${hasDelay ? `<span style="font-size:12px;font-weight:500;">(+${diasRetraso} días)</span>` : ''}</div>
    </div>
    <div class="kpi-box">
      <div class="label">Presupuesto Inicial</div>
      <div class="value">${formatCurrency(budgetInitial)}</div>
    </div>
    <div class="kpi-box">
      <div class="label">Gasto Comprometido (${budgetPercent}%)</div>
      <div class="value ${budgetOverrun ? 'alert-red' : 'alert-green'}">${formatCurrency(gastoTotal)} ${budgetOverrun ? '<span style="font-size:12px;">⚠️ SOBRECOSTO</span>' : ''}</div>
    </div>
  </div>
</div>` : '';

  const alcanceHtml = reportOptions.alcance ? `
<div class="section">
  <h2>🎯 Alcance del Proyecto</h2>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 8px;">
    <div style="padding:12px; background:#f8f9fa; border:1px solid #e9ecef; border-radius:8px;">
      <strong style="color:#1a1a2e; font-size:12px;">¿Por qué?</strong>
      <div style="margin-top:6px; font-size:12px;">${project.alcance_por_que || '<span style="color:#999;font-style:italic;">No definido</span>'}</div>
    </div>
    <div style="padding:12px; background:#f8f9fa; border:1px solid #e9ecef; border-radius:8px;">
      <strong style="color:#1a1a2e; font-size:12px;">Objetivo principal</strong>
      <div style="margin-top:6px; font-size:12px;">${project.alcance_objetivo || '<span style="color:#999;font-style:italic;">No definido</span>'}</div>
    </div>
    <div style="padding:12px; background:#f8f9fa; border:1px solid #e9ecef; border-radius:8px;">
      <strong style="color:#1a1a2e; font-size:12px;">Resultados deseados</strong>
      <div style="margin-top:6px; font-size:12px;">${project.alcance_resultados || '<span style="color:#999;font-style:italic;">No definido</span>'}</div>
    </div>
    <div style="padding:12px; background:#f8f9fa; border:1px solid #e9ecef; border-radius:8px;">
      <strong style="color:#1a1a2e; font-size:12px;">Limitaciones e hipótesis</strong>
      <div style="margin-top:6px; font-size:12px;">${project.alcance_limitaciones || '<span style="color:#999;font-style:italic;">No definido</span>'}</div>
    </div>
    <div style="padding:12px; background:#f8f9fa; border:1px solid #e9ecef; border-radius:8px;">
      <strong style="color:#1a1a2e; font-size:12px;">Integraciones</strong>
      <div style="margin-top:6px; font-size:12px;">${project.alcance_integraciones || '<span style="color:#999;font-style:italic;">No definido</span>'}</div>
    </div>
    <div style="padding:12px; background:#f8f9fa; border:1px solid #e9ecef; border-radius:8px;">
      <strong style="color:#1a1a2e; font-size:12px;">Cómo se desarrollará</strong>
      <div style="margin-top:6px; font-size:12px;">${project.alcance_desarrollo || '<span style="color:#999;font-style:italic;">No definido</span>'}</div>
    </div>
  </div>
</div>` : '';

  const cierreHtml = reportOptions.cierre ? `
<div class="section">
  <h2>🏆 Criterios de Cierre</h2>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 8px;">
    <div style="padding:12px; background:#f8f9fa; border:1px solid #e9ecef; border-radius:8px;">
      <strong style="color:#1a1a2e; font-size:12px;">Criterios de aceptación</strong>
      <div style="margin-top:6px; font-size:12px;">${project.cierre_aceptacion || '<span style="color:#999;font-style:italic;">No definido</span>'}</div>
    </div>
    <div style="padding:12px; background:#f8f9fa; border:1px solid #e9ecef; border-radius:8px;">
      <strong style="color:#1a1a2e; font-size:12px;">Criterios de éxito</strong>
      <div style="margin-top:6px; font-size:12px;">${project.cierre_exito || '<span style="color:#999;font-style:italic;">No definido</span>'}</div>
    </div>
  </div>
</div>` : '';

  const hitosHtml = reportOptions.hitos ? `
<div class="section">
  <h2>🏁 Hitos del Proyecto</h2>
  <table>
    <thead><tr><th>Hito</th><th>Fecha</th><th>Estado</th></tr></thead>
    <tbody>
      ${milestoneRows(completed, 'completados')}
      ${milestoneRows(pending, 'pendientes')}
    </tbody>
  </table>
</div>` : '';

  const risksList = project.Riesgos || [];
  const risksHtml = reportOptions.riesgos ? `
<div class="section">
  <h2>⚠️ Matriz de Riesgos</h2>
  ${risksList.length === 0 ? '<p style="color:#999;padding:8px;">Sin riesgos registrados.</p>' : `
  <table>
    <thead><tr><th>Código</th><th>Riesgo</th><th>Prob. / Imp.</th><th>Mitigación</th><th>Estado</th></tr></thead>
    <tbody>
      ${risksList.map(r => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e0e0e0;font-weight:bold;">${r.id_riesgo}</td>
          <td style="padding:8px;border-bottom:1px solid #e0e0e0;">${r.titulo_riesgo}</td>
          <td style="padding:8px;border-bottom:1px solid #e0e0e0;">P: ${r.probabilidad} | I: ${r.impacto}</td>
          <td style="padding:8px;border-bottom:1px solid #e0e0e0;">${r.plan_mitigacion}</td>
          <td style="padding:8px;border-bottom:1px solid #e0e0e0;">${r.estado_riesgo}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>`}
</div>` : '';

  const incidentsList = project.Incidencias || [];
  const incidentsHtml = reportOptions.incidencias ? `
<div class="section">
  <h2>🛑 Incidencias Técnicas o de Plazos</h2>
  ${incidentsList.length === 0 ? '<p style="color:#999;padding:8px;">Sin incidencias registradas.</p>' : `
  <table>
    <thead><tr><th>Código</th><th>Incidencia</th><th>Tipo</th><th>Criticidad</th><th>Estado</th></tr></thead>
    <tbody>
      ${incidentsList.map(i => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e0e0e0;font-weight:bold;">${i.id_incidencia}</td>
          <td style="padding:8px;border-bottom:1px solid #e0e0e0;">${i.titulo}</td>
          <td style="padding:8px;border-bottom:1px solid #e0e0e0;">${i.tipo_incidencias}</td>
          <td style="padding:8px;border-bottom:1px solid #e0e0e0;">${i.criticidad}</td>
          <td style="padding:8px;border-bottom:1px solid #e0e0e0;">${i.estado}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>`}
</div>` : '';

  const crList = project.Cambios_Alcances || [];
  const crHtml = reportOptions.cambios ? `
<div class="section">
  <h2>📈 Cambios de Alcance (CR)</h2>
  ${crList.length === 0 ? '<p style="color:#999;padding:8px;">Sin solicitudes de cambio de alcance.</p>' : `
  <table>
    <thead><tr><th>Código</th><th>Descripción / Motivo</th><th>Importe</th><th>Tiempo</th><th>Estado</th></tr></thead>
    <tbody>
      ${crList.map(c => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e0e0e0;font-weight:bold;">${c.id_cambio}</td>
          <td style="padding:8px;border-bottom:1px solid #e0e0e0;">${c.descripcion_motivo}</td>
          <td style="padding:8px;border-bottom:1px solid #e0e0e0;">${c.impacta_importe ? `${formatCurrency(parseFloat(c.importe_impacto))}` : 'Sin impacto'}</td>
          <td style="padding:8px;border-bottom:1px solid #e0e0e0;">${c.impacta_tiempo ? `+${c.dias_impacto} días` : 'Sin impacto'}</td>
          <td style="padding:8px;border-bottom:1px solid #e0e0e0;">${c.estado_cambio}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>`}
</div>` : '';

  const lessonsList = project.Lecciones_Aprendidas || project.LeccionesAprendidas || [];
  const lessonsHtml = reportOptions.lecciones ? `
<div class="section">
  <h2>⭐ Lecciones Aprendidas</h2>
  ${lessonsList.length === 0 ? '<p style="color:#999;padding:8px;">Sin lecciones registradas.</p>' : `
  <table>
    <thead><tr><th>Código</th><th>Tipo</th><th>Título</th><th>Contexto / Recomendación</th></tr></thead>
    <tbody>
      ${lessonsList.map(l => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e0e0e0;font-weight:bold;">${l.id_leccion}</td>
          <td style="padding:8px;border-bottom:1px solid #e0e0e0;">${l.tipo_leccion === 'BUENA_PRACTICA' ? 'Buena Práctica' : 'Error a Evitar'}</td>
          <td style="padding:8px;border-bottom:1px solid #e0e0e0;font-weight:bold;">${l.titulo}</td>
          <td style="padding:8px;border-bottom:1px solid #e0e0e0;">
            ${l.contexto ? `<p><strong>Contexto:</strong> ${l.contexto}</p>` : ''}
            ${l.recomendacion_futura ? `<p><strong>Recomendación:</strong> ${l.recomendacion_futura}</p>` : ''}
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>`}
</div>` : '';

  const sortedTimelineEvents = [...allTasks]
    .sort((a, b) => new Date(a.fecha_limite) - new Date(b.fecha_limite));

  const timelineHtml = reportOptions.timeline ? `
<div class="section">
  <h2>📅 Cronología del Proyecto (Timeline)</h2>
  ${sortedTimelineEvents.length === 0 ? '<p style="color:#999;padding:8px;">Sin tareas ni hitos en el cronograma.</p>' : `
  <div style="position:relative; padding-left: 20px; border-left: 2px solid #1a1a2e; margin: 16px 0 16px 10px;">
    ${sortedTimelineEvents.map(event => `
      <div style="position:relative; margin-bottom: 20px;">
        <div style="position:absolute; left:-27px; top:4px; width:12px; height:12px; border-radius:50%; background:${event.es_hito ? '#e65100' : '#1a1a2e'}; border: 2px solid #fff; box-shadow: 0 0 0 2px ${event.es_hito ? '#e65100' : '#1a1a2e'};"></div>
        <div style="font-weight: 600; font-size: 13px; color: #1a1a2e;">
          ${event.titulo_tarea} ${event.es_hito ? '<span style="font-size:10px; background:#ffe0b2; color:#e65100; padding:2px 6px; border-radius:10px; margin-left:6px; font-weight:700;">HITO</span>' : ''}
        </div>
        <div style="font-size: 11px; color: #666; margin-top: 2px;">
          Fecha límite: ${formatDate(event.fecha_limite)} · Estado: <span style="font-weight:600; color:${event.estado === 'COMPLETADA' ? '#2e7d32' : '#e65100'};">${event.estado}</span>
        </div>
        ${event.descripcion ? `<div style="font-size: 12px; color: #555; margin-top: 4px; font-style: italic;">${event.descripcion}</div>` : ''}
      </div>
    `).join('')}
  </div>
  `}
</div>` : '';

  const commentsHtml = reportOptions.resumen ? (importantComments.length === 0
    ? '<p style="color:#999;text-align:center;padding:20px;">No hay comentarios ejecutivos marcados como importantes.</p>'
    : importantComments.map(c => `
      <div style="padding:16px;margin-bottom:12px;background:#fffbf0;border-left:4px solid #f59e0b;border-radius:8px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <strong style="font-size:13px;color:#1a1a2e;">
            ${c.Autor?.nombre || ''} ${c.Autor?.apellidos || ''}
          </strong>
          <span style="font-size:11px;color:#888;">${formatDate(c.fecha_registro)}</span>
        </div>
        <div style="font-size:13px;line-height:1.6;color:#333;">${c.texto_comentario}</div>
        ${c.editado ? `<div style="font-size:11px;color:#999;margin-top:6px;font-style:italic;">Editado por ${c.Editor?.nombre || ''} ${c.Editor?.apellidos || ''} el ${formatDateTime(c.fecha_modificacion)}</div>` : ''}
      </div>
    `).join('')) : '';

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Informe Ejecutivo — ${project.id_proyecto}</title>
  <style>
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
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>

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

  ${kpisHtml}
  ${alcanceHtml}
  ${cierreHtml}
  ${hitosHtml}
  ${timelineHtml}
  ${risksHtml}
  ${incidentsHtml}
  ${crHtml}
  ${lessonsHtml}
  ${commentsHtml ? `
  <div class="section">
    <h2>⭐ Muro Ejecutivo — Comentarios Importantes</h2>
    ${commentsHtml}
  </div>` : ''}

  <div style="margin-top:40px;padding-top:16px;border-top:2px solid #eee;font-size:11px;color:#999;text-align:center;">
    PPM Dashboard — Informe generado automáticamente el ${formatDate(new Date().toISOString())} a las ${new Date().toLocaleTimeString('es-ES', {hour:'2-digit', minute:'2-digit'})}
  </div>
</body>
</html>`;

  const reportWindow = window.open('', '_blank');
  if (reportWindow) {
    reportWindow.document.write(html);
    reportWindow.document.close();
  }
};
