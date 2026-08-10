import React from 'react';
import { ChevronRight, ChevronDown, CheckCircle2, Clock } from 'lucide-react';

const RAG_COLORS = {
  VERDE: 'var(--color-rag-green)',
  AMARILLO: 'var(--color-rag-yellow)',
  ROJO: 'var(--color-rag-red)'
};

export function diffDays(a, b) {
  const MS_PER_DAY = 86400000;
  return Math.round((b - a) / MS_PER_DAY);
}

export function parseDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatMonthYear(date, lang = 'es') {
  return date.toLocaleDateString(lang, { month: 'short', year: '2-digit' });
}

export function formatWeek(date, lang = 'es') {
  return date.toLocaleDateString(lang, { day: '2-digit', month: 'short' });
}

export function generateTimelineColumns(timelineStart, timelineEnd, zoom, pxPerDay) {
  const cols = [];
  const d = new Date(timelineStart);
  if (zoom === 'semanal') {
    const dayOfWeek = d.getDay();
    d.setDate(d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    while (d <= timelineEnd) {
      const start = new Date(d);
      cols.push({ label: formatWeek(start), startOffset: diffDays(timelineStart, start) * pxPerDay, width: 7 * pxPerDay });
      d.setDate(d.getDate() + 7);
    }
  } else if (zoom === 'mensual') {
    while (d <= timelineEnd) {
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      cols.push({ label: formatMonthYear(monthStart), startOffset: diffDays(timelineStart, monthStart) * pxPerDay, width: daysInMonth * pxPerDay });
      d.setMonth(d.getMonth() + 1);
    }
  } else {
    while (d <= timelineEnd) {
      const qStart = new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
      const qEnd = new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3 + 3, 0);
      cols.push({ label: `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`, startOffset: diffDays(timelineStart, qStart) * pxPerDay, width: (diffDays(qStart, qEnd) + 1) * pxPerDay });
      d.setMonth(Math.floor(d.getMonth() / 3) * 3 + 3);
    }
  }
  return cols;
}

export function filterTimelineProjects(projects, filters) {
  const {
    projectId, showClosed, filterRag, filterPm, filterVendor,
    filterPortfolio, filterState, filterEstrategico, searchTerm,
    filterStartDate, filterEndDate
  } = filters;

  if (projectId) return projects.filter(p => p.id_proyecto === projectId);

  return projects.filter(p => {
    if (!showClosed && (p.proyecto_cerrado === true || p.proyecto_cerrado === 1)) return false;
    if (filterRag && p.indicador_rag !== filterRag) return false;
    if (filterPm && String(p.id_pm || '') !== String(filterPm) && p.pm_nombre !== filterPm) return false;
    if (filterVendor && String(p.id_proveedor || '') !== String(filterVendor)) return false;
    if (filterPortfolio && String(p.portfolio_id || '') !== String(filterPortfolio)) return false;
    if (filterState && String(p.id_estado || '') !== String(filterState)) return false;
    if (filterEstrategico !== '' && String(p.es_estrategico) !== String(filterEstrategico)) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = (p.nombre_proyecto || '').toLowerCase().includes(term);
      const matchCode = (p.id_proyecto || '').toLowerCase().includes(term);
      const matchPm = (p.pm_nombre || '').toLowerCase().includes(term);
      const matchVendor = (p.prov_nombre || '').toLowerCase().includes(term);
      if (!matchName && !matchCode && !matchPm && !matchVendor) return false;
    }

    const pStart = p.fecha_kickoff || p.fecha_inicio;
    const pEnd = p.fecha_go_live || p.fecha_fin_estimada;
    if (filterStartDate && pEnd && pEnd < filterStartDate) return false;
    if (filterEndDate && pStart && pStart > filterEndDate) return false;

    return true;
  });
}

export function ProjectTimelineLabel({ project, isExpanded, onToggleExpand, onViewProject, index }) {
  const tasks = project.tareas || [];

  return (
    <React.Fragment>
      <div
        className={`timeline-label-row ${index % 2 === 0 ? 'even' : 'odd'}`}
        onClick={() => onViewProject(project.id_proyecto)}
        title={`Ir a ${project.nombre_proyecto}`}
        style={{ cursor: 'pointer' }}
      >
        <div 
          onClick={(e) => onToggleExpand(project.id_proyecto, e)}
          style={{ padding: '0 4px', display: 'flex', alignItems: 'center', opacity: tasks.length > 0 ? 0.9 : 0.3 }}
          title={tasks.length > 0 ? (isExpanded ? 'Colapsar tareas' : 'Expandir tareas') : 'Sin tareas'}
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
        <div className="timeline-label-rag" style={{ background: RAG_COLORS[project.indicador_rag] }}></div>
        <div className="timeline-label-info">
          <span className="timeline-label-id">{project.id_proyecto}</span>
          <span className="timeline-label-name">{project.nombre_proyecto}</span>
        </div>
      </div>

      {isExpanded && tasks.map((tItem) => (
        <div
          key={`task-label-${tItem.id_tarea}`}
          className="timeline-label-row sub-row"
          style={{ paddingLeft: '32px', fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.02)' }}
        >
          {tItem.es_hito ? <CheckCircle2 size={13} style={{ color: tItem.estado === 'COMPLETADA' ? '#4caf50' : '#ffb74d', marginRight: 6 }} /> : <Clock size={13} style={{ opacity: 0.6, marginRight: 6 }} />}
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tItem.titulo_tarea}</span>
        </div>
      ))}
    </React.Fragment>
  );
}

export function ProjectTimelineBar({ project, isExpanded, timelineStart, pxPerDay, index, onViewProject, onMilestoneHover, onMilestoneLeave }) {
  const start = parseDate(project.fecha_kickoff || project.fecha_inicio);
  const end = parseDate(project.fecha_go_live || project.fecha_fin_estimada);
  if (!start || !end) return null;

  const barLeft = diffDays(timelineStart, start) * pxPerDay;
  const barWidth = Math.max(diffDays(start, end) * pxPerDay, 8);
  const tasks = project.tareas || [];

  return (
    <React.Fragment>
      <div className={`timeline-bar-row ${index % 2 === 0 ? 'even' : 'odd'}`}>
        <div
          className="timeline-bar"
          style={{
            left: barLeft,
            width: barWidth,
            backgroundColor: RAG_COLORS[project.indicador_rag],
          }}
          onClick={() => onViewProject(project.id_proyecto)}
          title={`${project.nombre_proyecto}\n${project.fecha_kickoff || project.fecha_inicio} → ${project.fecha_go_live || project.fecha_fin_estimada}\nPM: ${project.pm_nombre}`}
        >
          {barWidth > 80 && (
            <span className="timeline-bar-text">{project.nombre_proyecto}</span>
          )}
        </div>

        {(project.hitos || []).map(h => {
          const hDate = parseDate(h.fecha_limite);
          if (!hDate) return null;
          const hOffset = diffDays(timelineStart, hDate) * pxPerDay;
          return (
            <div
              key={h.id_tarea}
              className={`timeline-milestone ${h.estado === 'COMPLETADA' ? 'completed' : 'pending'}`}
              style={{ left: hOffset }}
              onMouseEnter={(e) => onMilestoneHover(e, h, project)}
              onMouseLeave={onMilestoneLeave}
            ></div>
          );
        })}
      </div>

      {isExpanded && tasks.map((tItem) => {
        const tStart = parseDate(tItem.fecha_inicio || project.fecha_inicio);
        const tEnd = parseDate(tItem.fecha_limite);
        if (!tEnd) return null;

        const taskStart = tStart || tEnd;
        const tLeft = diffDays(timelineStart, taskStart) * pxPerDay;
        const tWidth = Math.max(diffDays(taskStart, tEnd) * pxPerDay, 10);

        return (
          <div key={`task-bar-${tItem.id_tarea}`} className="timeline-bar-row sub-row" style={{ height: '32px', background: 'rgba(255, 255, 255, 0.02)' }}>
            <div
              className="timeline-task-bar"
              style={{
                position: 'absolute',
                left: tLeft,
                width: tItem.es_hito ? 14 : tWidth,
                height: tItem.es_hito ? 14 : '10px',
                top: tItem.es_hito ? '9px' : '11px',
                borderRadius: tItem.es_hito ? '3px' : '4px',
                transform: tItem.es_hito ? 'rotate(45deg)' : 'none',
                backgroundColor: tItem.estado === 'COMPLETADA' ? '#4caf50' : tItem.es_hito ? '#ffb74d' : 'var(--md-sys-color-primary)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
              title={`${tItem.titulo_tarea} (${tItem.estado})`}
            >
            </div>
          </div>
        );
      })}
    </React.Fragment>
  );
}
