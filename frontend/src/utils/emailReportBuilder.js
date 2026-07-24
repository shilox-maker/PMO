/**
 * Construye el cuerpo en Texto Plano Estructurado con elementos gráficos Unicode
 * para la apertura mediante enlace mailto:
 */
export function buildProjectEmailBody(project, reportOptions, committeeName) {
  if (!project) return '';

  const calc = project.calculations || {};
  const lines = [];

  const getProgressBar = (pct) => {
    const val = Math.min(Math.max(Math.round(pct || 0), 0), 100);
    const filled = Math.round(val / 10);
    const empty = 10 - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${val}%`;
  };

  const getStatusBadge = (estado) => {
    const est = (estado || '').toUpperCase();
    if (est.includes('EJECUCI') || est.includes('ACTIVO') || est === 'COMPLETADA') return '🟢 ' + est;
    if (est.includes('PLAN') || est.includes('PENDIENTE')) return '🟡 ' + est;
    if (est.includes('CANCEL') || est.includes('PAUSA') || est.includes('CRITIC')) return '🔴 ' + est;
    return '🔷 ' + (est || 'N/A');
  };

  lines.push('====================================================');
  lines.push(`📊 INFORME EJECUTIVO DE PROYECTO`);
  lines.push(`📌 [${project.id_proyecto}] ${project.nombre_proyecto || ''}`);
  if (committeeName) lines.push(`🏛️ Gobernanza: ${committeeName}`);
  lines.push(`📅 Fecha: ${new Date().toLocaleDateString('es-ES')}`);
  lines.push('====================================================\n');

  // Resumen / KPIs
  if (reportOptions.resumen) {
    lines.push('┌──────────────────────────────────────────────────┐');
    lines.push('│ 📈 RESUMEN GENERAL Y KPIS DE CONTROL             │');
    lines.push('└──────────────────────────────────────────────────┘');
    lines.push(`  • Estado: ${getStatusBadge(project.Estado?.nombre_estado || project.estado)}`);
    lines.push(`  • Salud General: ${project.salud_proyecto ?? 'N/A'}%`);
    lines.push(`  • Avance Tiempo:  ${getProgressBar(calc.tiempoTranscurridoPorcentaje)}`);
    lines.push(`  • Progreso Gasto: ${getProgressBar(calc.gastoEjecutadoPorcentaje)}`);
    if (project.proximo_hito) lines.push(`  • Próximo Hito: 🎯 ${project.proximo_hito}`);
    if (project.ultimo_comentario) lines.push(`  • Comentario PMO: 💬 "${project.ultimo_comentario}"`);
    lines.push('');
  }

  // Alcance
  if (reportOptions.alcance && project.alcance_proyecto) {
    lines.push('════════════════════════════════════════════════════');
    lines.push('🎯 ALCANCE DEL PROYECTO');
    lines.push('════════════════════════════════════════════════════');
    lines.push(project.alcance_proyecto.replace(/<[^>]+>/g, '').trim());
    lines.push('');
  }

  // Criterios Cierre
  if (reportOptions.cierre && project.criterios_cierre) {
    lines.push('════════════════════════════════════════════════════');
    lines.push('🏁 CRITERIOS DE CIERRE');
    lines.push('════════════════════════════════════════════════════');
    lines.push(project.criterios_cierre.replace(/<[^>]+>/g, '').trim());
    lines.push('');
  }

  // Hitos
  if (reportOptions.hitos) {
    const tasks = project.Tareas || [];
    const hitos = tasks.filter(t => t.es_hito);
    if (hitos.length > 0) {
      lines.push('════════════════════════════════════════════════════');
      lines.push('🚩 HITOS PRINCIPALES');
      lines.push('════════════════════════════════════════════════════');
      hitos.slice(0, 5).forEach(h => {
        const fecha = h.fecha_limite ? new Date(h.fecha_limite).toLocaleDateString('es-ES') : 'Sin fecha';
        const isDone = h.estado === 'COMPLETADA';
        lines.push(`  ${isDone ? '✅' : '⏳'} ${h.titulo_tarea || h.nombre} (${fecha}) - ${h.estado || 'PENDIENTE'}`);
      });
      lines.push('');
    }
  }

  // Riesgos
  if (reportOptions.riesgos) {
    const riesgos = (project.Riesgos || []).filter(r => r.estado !== 'CERRADO');
    if (riesgos.length > 0) {
      lines.push('════════════════════════════════════════════════════');
      lines.push('🚨 MATRIZ DE RIESGOS ABIERTOS');
      lines.push('════════════════════════════════════════════════════');
      riesgos.slice(0, 5).forEach(r => {
        lines.push(`  ⚠️  ${r.titulo_riesgo || r.descripcion} [Prob: ${r.probabilidad || '-'}, Imp: ${r.impacto || '-'}]`);
      });
      lines.push('');
    }
  }

  // Incidencias
  if (reportOptions.incidencias) {
    const incs = (project.Incidencias || []).filter(i => i.estado !== 'RESUELTA' && i.estado !== 'CERRADA');
    if (incs.length > 0) {
      lines.push('════════════════════════════════════════════════════');
      lines.push('⚡ INCIDENCIAS PENDIENTES');
      lines.push('════════════════════════════════════════════════════');
      incs.slice(0, 5).forEach(i => {
        lines.push(`  💥 [${i.prioridad || i.severidad || 'MEDIA'}] ${i.titulo_incidencia || i.descripcion}`);
      });
      lines.push('');
    }
  }

  // Cambios de Alcance
  if (reportOptions.cambios) {
    const cambios = project.CambiosAlcance || project.Cambios_Alcances || [];
    if (cambios.length > 0) {
      lines.push('════════════════════════════════════════════════════');
      lines.push('🔄 CAMBIOS DE ALCANCE (CR)');
      lines.push('════════════════════════════════════════════════════');
      cambios.slice(0, 5).forEach(c => {
        lines.push(`  📋 [${c.estado || 'PENDIENTE'}] ${c.titulo || c.descripcion}`);
      });
      lines.push('');
    }
  }

  // Lecciones Aprendidas
  if (reportOptions.lecciones) {
    const lecciones = project.LeccionesAprendidas || project.Lecciones_Aprendidas || [];
    if (lecciones.length > 0) {
      lines.push('════════════════════════════════════════════════════');
      lines.push('💡 LECCIONES APRENDIDAS');
      lines.push('════════════════════════════════════════════════════');
      lecciones.slice(0, 3).forEach(l => {
        lines.push(`  💡 ${l.titulo || l.descripcion}`);
      });
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Genera una plantilla HTML de diseño profesional e inline CSS para correo electrónico
 */
export function buildProjectEmailHtml(project, reportOptions, committeeName) {
  if (!project) return '';

  const calc = project.calculations || {};
  const dateStr = new Date().toLocaleDateString('es-ES');
  const estadoStr = project.Estado?.nombre_estado || project.estado || 'En Ejecución';

  let html = `
  <div style="font-family: Arial, Helvetica, sans-serif; max-width: 680px; margin: 0 auto; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
    <!-- Header -->
    <div style="background-color: #0f172a; color: #ffffff; padding: 24px; border-bottom: 4px solid #2563eb;">
      <table width="100%" cellPadding="0" cellSpacing="0" border="0">
        <tr>
          <td>
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: bold; margin-bottom: 4px;">Informe PMO Control Tower</div>
            <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">[${project.id_proyecto}] ${project.nombre_proyecto || ''}</h2>
            <div style="font-size: 13px; color: #cbd5e1; margin-top: 6px;">🏛️ ${committeeName || 'Plan de Comunicación'}</div>
          </td>
          <td align="right" valign="top" style="font-size: 12px; color: #94a3b8;">
            📅 ${dateStr}
          </td>
        </tr>
      </table>
    </div>

    <div style="padding: 24px;">
  `;

  // Resumen / KPIs
  if (reportOptions.resumen) {
    html += `
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; text-transform: uppercase; color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 0; margin-bottom: 14px;">📈 Resumen General y KPIs de Control</h3>
        <table width="100%" cellPadding="12" cellSpacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px;">
          <tr>
            <td width="50%" valign="top" style="border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
              <div style="font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase;">Estado del Proyecto</div>
              <div style="font-size: 14px; font-weight: bold; margin-top: 4px; color: #0f172a;">
                <span style="display: inline-block; padding: 3px 10px; background-color: #dcfce7; color: #166534; border-radius: 12px; font-size: 12px;">🟢 ${estadoStr}</span>
              </div>
            </td>
            <td width="50%" valign="top" style="border-bottom: 1px solid #e2e8f0;">
              <div style="font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase;">Salud General</div>
              <div style="font-size: 16px; font-weight: bold; margin-top: 4px; color: #2563eb;">${project.salud_proyecto ?? 'N/A'}%</div>
            </td>
          </tr>
          <tr>
            <td width="50%" valign="top" style="border-right: 1px solid #e2e8f0;">
              <div style="font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase;">Avance de Tiempo</div>
              <div style="font-size: 14px; font-weight: bold; margin-top: 4px; color: #334155;">${calc.tiempoTranscurridoPorcentaje ?? 0}%</div>
            </td>
            <td width="50%" valign="top">
              <div style="font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase;">Progreso de Gasto</div>
              <div style="font-size: 14px; font-weight: bold; margin-top: 4px; color: #334155;">${calc.gastoEjecutadoPorcentaje ?? 0}%</div>
            </td>
          </tr>
        </table>
        ${project.proximo_hito ? `<div style="margin-top: 10px; font-size: 13px; background: #eff6ff; padding: 10px; border-radius: 6px; border-left: 4px solid #2563eb;"><strong>🎯 Próximo Hito:</strong> ${project.proximo_hito}</div>` : ''}
        ${project.ultimo_comentario ? `<div style="margin-top: 8px; font-size: 13px; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; font-style: italic;"><strong>💬 Comentario PMO:</strong> "${project.ultimo_comentario}"</div>` : ''}
      </div>
    `;
  }

  // Alcance
  if (reportOptions.alcance && project.alcance_proyecto) {
    html += `
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; text-transform: uppercase; color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 0; margin-bottom: 10px;">🎯 Alcance del Proyecto</h3>
        <div style="font-size: 13px; line-height: 1.5; color: #334155;">${project.alcance_proyecto}</div>
      </div>
    `;
  }

  // Criterios Cierre
  if (reportOptions.cierre && project.criterios_cierre) {
    html += `
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 14px; text-transform: uppercase; color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 0; margin-bottom: 10px;">🏁 Criterios de Cierre</h3>
        <div style="font-size: 13px; line-height: 1.5; color: #334155;">${project.criterios_cierre}</div>
      </div>
    `;
  }

  // Hitos
  if (reportOptions.hitos) {
    const tasks = project.Tareas || [];
    const hitos = tasks.filter(t => t.es_hito);
    if (hitos.length > 0) {
      html += `
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; text-transform: uppercase; color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 0; margin-bottom: 10px;">🚩 Hitos Principales</h3>
          <table width="100%" cellPadding="8" cellSpacing="0" style="border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background-color: #f1f5f9; text-align: left;">
                <th style="border-bottom: 2px solid #cbd5e1; padding: 8px;">Hito</th>
                <th style="border-bottom: 2px solid #cbd5e1; padding: 8px;">Fecha Límite</th>
                <th style="border-bottom: 2px solid #cbd5e1; padding: 8px;">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${hitos.slice(0, 5).map(h => `
                <tr>
                  <td style="border-bottom: 1px solid #e2e8f0; padding: 8px; font-weight: 600;">${h.titulo_tarea || h.nombre}</td>
                  <td style="border-bottom: 1px solid #e2e8f0; padding: 8px;">${h.fecha_limite ? new Date(h.fecha_limite).toLocaleDateString('es-ES') : '—'}</td>
                  <td style="border-bottom: 1px solid #e2e8f0; padding: 8px;">
                    <span style="padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: bold; background-color: ${h.estado === 'COMPLETADA' ? '#dcfce7' : '#fef3c7'}; color: ${h.estado === 'COMPLETADA' ? '#15803d' : '#b45309'};">
                      ${h.estado === 'COMPLETADA' ? '✅ Completado' : '⏳ Pendiente'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  }

  // Riesgos
  if (reportOptions.riesgos) {
    const riesgos = (project.Riesgos || []).filter(r => r.estado !== 'CERRADO');
    if (riesgos.length > 0) {
      html += `
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; text-transform: uppercase; color: #dc2626; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 0; margin-bottom: 10px;">🚨 Matriz de Riesgos Abiertos</h3>
          <table width="100%" cellPadding="8" cellSpacing="0" style="border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background-color: #fee2e2; text-align: left; color: #991b1b;">
                <th style="border-bottom: 2px solid #fca5a5; padding: 8px;">Riesgo</th>
                <th style="border-bottom: 2px solid #fca5a5; padding: 8px;">Probabilidad</th>
                <th style="border-bottom: 2px solid #fca5a5; padding: 8px;">Impacto</th>
              </tr>
            </thead>
            <tbody>
              ${riesgos.slice(0, 5).map(r => `
                <tr>
                  <td style="border-bottom: 1px solid #e2e8f0; padding: 8px; font-weight: 500;">${r.titulo_riesgo || r.descripcion}</td>
                  <td style="border-bottom: 1px solid #e2e8f0; padding: 8px;">${r.probabilidad || '-'}</td>
                  <td style="border-bottom: 1px solid #e2e8f0; padding: 8px; font-weight: bold; color: #dc2626;">${r.impacto || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  }

  // Incidencias
  if (reportOptions.incidencias) {
    const incs = (project.Incidencias || []).filter(i => i.estado !== 'RESUELTA' && i.estado !== 'CERRADA');
    if (incs.length > 0) {
      html += `
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; text-transform: uppercase; color: #ea580c; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 0; margin-bottom: 10px;">⚡ Incidencias Pendientes</h3>
          <table width="100%" cellPadding="8" cellSpacing="0" style="border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="background-color: #ffedd5; text-align: left; color: #9a3412;">
                <th style="border-bottom: 2px solid #fdba74; padding: 8px;">Incidencia</th>
                <th style="border-bottom: 2px solid #fdba74; padding: 8px;">Prioridad</th>
              </tr>
            </thead>
            <tbody>
              ${incs.slice(0, 5).map(i => `
                <tr>
                  <td style="border-bottom: 1px solid #e2e8f0; padding: 8px; font-weight: 500;">${i.titulo_incidencia || i.descripcion}</td>
                  <td style="border-bottom: 1px solid #e2e8f0; padding: 8px; font-weight: bold;">${i.prioridad || i.severidad || 'MEDIA'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
  }

  // Lecciones
  if (reportOptions.lecciones) {
    const lecciones = project.LeccionesAprendidas || project.Lecciones_Aprendidas || [];
    if (lecciones.length > 0) {
      html += `
        <div style="margin-bottom: 24px;">
          <h3 style="font-size: 14px; text-transform: uppercase; color: #0284c7; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 0; margin-bottom: 10px;">💡 Lecciones Aprendidas</h3>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155;">
            ${lecciones.slice(0, 3).map(l => `<li style="margin-bottom: 6px;">${l.titulo || l.descripcion}</li>`).join('')}
          </ul>
        </div>
      `;
    }
  }

  html += `
      <!-- Footer -->
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
        Generado automáticamente por PMO Control Tower — ${dateStr}
      </div>
    </div>
  </div>
  `;

  return html;
}

/**
 * Copia contenido HTML rico y texto plano al portapapeles
 */
export async function copyHtmlToClipboard(htmlText, plainText) {
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const item = new ClipboardItem({
        'text/html': new Blob([htmlText], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' })
      });
      await navigator.clipboard.write([item]);
      return true;
    } else {
      await navigator.clipboard.writeText(plainText);
      return false;
    }
  } catch (e) {
    console.warn('Fallback a texto plano en el portapapeles:', e);
    await navigator.clipboard.writeText(plainText);
    return false;
  }
}

export function openMailClient({ recipientEmails = [], subject = '', body = '' }) {
  const toParam = recipientEmails.filter(Boolean).join(',');
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  const mailtoUrl = `mailto:${toParam}?subject=${encodedSubject}&body=${encodedBody}`;
  
  window.location.href = mailtoUrl;
}
