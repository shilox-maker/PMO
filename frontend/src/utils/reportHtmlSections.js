import { formatCurrency, formatDate, formatDateTime, milestoneRows } from './reportHtmlComponents';

export const getKpisHtml = (project, calc, reportOptions) => {
  if (!reportOptions.resumen) return '';
  const budgetInitial = parseFloat(project.budget_inicial) || 0;
  const gastoTotal = calc.gasto_comprometido || 0;
  const budgetOverrun = gastoTotal > budgetInitial;
  const budgetPercent = budgetInitial > 0 ? ((gastoTotal / budgetInitial) * 100).toFixed(1) : 0;

  const fechaFinInicial = project.fecha_fin_inicial || '—';
  const fechaFinEstimada = calc.fecha_fin_estimada || fechaFinInicial;
  const diasRetraso = calc.dias_retraso_aprobados || 0;
  const hasDelay = diasRetraso > 0;

  return `
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
    </div>
  `;
};

export const getAlcanceHtml = (project, reportOptions) => {
  if (!reportOptions.alcance) return '';
  return `
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
    </div>
  `;
};

export const getCierreHtml = (project, reportOptions) => {
  if (!reportOptions.cierre) return '';
  return `
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
    </div>
  `;
};

export const getHitosHtml = (completed, pending, reportOptions) => {
  if (!reportOptions.hitos) return '';
  return `
    <div class="section">
      <h2>🏁 Hitos del Proyecto</h2>
      <table>
        <thead><tr><th>Hito</th><th>Fecha</th><th>Estado</th></tr></thead>
        <tbody>
          ${milestoneRows(completed, 'completados')}
          ${milestoneRows(pending, 'pendientes')}
        </tbody>
      </table>
    </div>
  `;
};

export const getRisksHtml = (risksList, reportOptions) => {
  if (!reportOptions.riesgos) return '';
  return `
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
    </div>
  `;
};

export const getIncidentsHtml = (incidentsList, reportOptions) => {
  if (!reportOptions.incidencias) return '';
  return `
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
    </div>
  `;
};

export const getCrHtml = (crList, reportOptions) => {
  if (!reportOptions.cambios) return '';
  return `
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
    </div>
  `;
};

export const getLessonsHtml = (lessonsList, reportOptions) => {
  if (!reportOptions.lecciones) return '';
  return `
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
    </div>
  `;
};

export const getTimelineHtml = (sortedTimelineEvents, reportOptions) => {
  if (!reportOptions.timeline) return '';
  return `
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
    </div>
  `;
};

export const getCommentsHtml = (importantComments, reportOptions) => {
  if (!reportOptions.resumen) return '';
  return importantComments.length === 0
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
    `).join('');
};
