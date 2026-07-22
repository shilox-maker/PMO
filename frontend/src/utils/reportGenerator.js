import { 
  formatDate, 
  getReportStyles, 
  getHeaderHtml, 
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
} from './reportHtmlComponents';

export const generateProjectReport = (project, comments, reportOptions) => {
  if (!project) return;

  const importantComments = comments.filter(c => c.es_importante);
  const calc = project.calculations || {};

  // Milestones (from tasks that are hitos)
  const allTasks = project.Tareas || [];
  const milestones = allTasks.filter(t => t.es_hito);
  const completed = milestones.filter(t => t.estado === 'COMPLETADA')
    .sort((a, b) => new Date(b.fecha_limite) - new Date(a.fecha_limite))
    .slice(0, 3);
  const pending = milestones.filter(t => t.estado === 'PENDIENTE')
    .sort((a, b) => new Date(a.fecha_limite) - new Date(b.fecha_limite))
    .slice(0, 3);

  const kpisHtml = getKpisHtml(project, calc, reportOptions);
  const alcanceHtml = getAlcanceHtml(project, reportOptions);
  const cierreHtml = getCierreHtml(project, reportOptions);
  const hitosHtml = getHitosHtml(completed, pending, reportOptions);
  const risksHtml = getRisksHtml(project.Riesgos || [], reportOptions);
  const incidentsHtml = getIncidentsHtml(project.Incidencias || [], reportOptions);
  const crHtml = getCrHtml(project.Cambios_Alcances || [], reportOptions);
  const lessonsHtml = getLessonsHtml(project.Lecciones_Aprendidas || project.LeccionesAprendidas || [], reportOptions);

  const sortedTimelineEvents = [...allTasks].sort((a, b) => new Date(a.fecha_limite) - new Date(b.fecha_limite));
  const timelineHtml = getTimelineHtml(sortedTimelineEvents, reportOptions);
  const commentsHtml = getCommentsHtml(importantComments, reportOptions);

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Informe Ejecutivo — ${project.id_proyecto}</title>
  <style>
    ${getReportStyles()}
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>

  ${getHeaderHtml(project)}
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
