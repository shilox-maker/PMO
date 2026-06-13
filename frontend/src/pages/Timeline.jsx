import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Filter, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Diamond } from 'lucide-react';

const ZOOM_LEVELS = ['trimestral', 'mensual', 'semanal'];
const ZOOM_LABELS = { trimestral: 'Trimestral', mensual: 'Mensual', semanal: 'Semanal' };
const MS_PER_DAY = 86400000;

const RAG_COLORS = {
  VERDE: 'var(--color-rag-green)',
  AMARILLO: 'var(--color-rag-yellow)',
  ROJO: 'var(--color-rag-red)'
};

function parseDate(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatMonthYear(date) {
  return date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
}

function formatWeek(date) {
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

function diffDays(a, b) {
  return Math.round((b - a) / MS_PER_DAY);
}

export default function Timeline({ onViewProject }) {
  const { getAuthHeaders } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoomIndex, setZoomIndex] = useState(1); // default: mensual
  const [showClosed, setShowClosed] = useState(false);
  const [filterRag, setFilterRag] = useState('');
  const [filterPm, setFilterPm] = useState('');
  const [tooltip, setTooltip] = useState(null);
  const scrollRef = useRef(null);
  const todayLineRef = useRef(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/timeline`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => { setProjects(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  }, []);

  // Scroll to "today" line on first load
  useEffect(() => {
    if (!loading && todayLineRef.current && scrollRef.current) {
      const containerRect = scrollRef.current.getBoundingClientRect();
      const lineRect = todayLineRef.current.getBoundingClientRect();
      const scrollTarget = lineRect.left - containerRect.left - containerRect.width / 3;
      scrollRef.current.scrollLeft = Math.max(0, scrollRef.current.scrollLeft + scrollTarget);
    }
  }, [loading, zoomIndex]);

  const zoom = ZOOM_LEVELS[zoomIndex];

  // Filter
  const filtered = useMemo(() => {
    return projects.filter(p => {
      if (!showClosed && p.proyecto_cerrado) return false;
      if (filterRag && p.indicador_rag !== filterRag) return false;
      if (filterPm && p.pm_nombre !== filterPm) return false;
      return true;
    });
  }, [projects, showClosed, filterRag, filterPm]);

  // Unique PMs for filter
  const pmList = useMemo(() => [...new Set(projects.map(p => p.pm_nombre))].sort(), [projects]);

  // Timeline range: earliest start - latest end, with padding
  const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
    if (filtered.length === 0) return { timelineStart: new Date(), timelineEnd: new Date(), totalDays: 365 };
    const starts = filtered.map(p => parseDate(p.fecha_inicio)).filter(Boolean);
    const ends = filtered.map(p => parseDate(p.fecha_fin_estimada)).filter(Boolean);
    const allDates = [...starts, ...ends];
    if (allDates.length === 0) return { timelineStart: new Date(), timelineEnd: new Date(), totalDays: 365 };

    let minDate = new Date(Math.min(...allDates));
    let maxDate = new Date(Math.max(...allDates));

    // Pad 30 days on each side
    minDate = new Date(minDate.getTime() - 30 * MS_PER_DAY);
    maxDate = new Date(maxDate.getTime() + 30 * MS_PER_DAY);

    // Align to month start
    minDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);

    return { timelineStart: minDate, timelineEnd: maxDate, totalDays: diffDays(minDate, maxDate) };
  }, [filtered]);

  // Pixel width per day based on zoom
  const pxPerDay = zoom === 'semanal' ? 12 : zoom === 'mensual' ? 4 : 1.5;
  const chartWidth = totalDays * pxPerDay;

  // Generate column headers
  const columns = useMemo(() => {
    const cols = [];
    const d = new Date(timelineStart);
    if (zoom === 'semanal') {
      // Align to Monday
      const dayOfWeek = d.getDay();
      d.setDate(d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      while (d <= timelineEnd) {
        const start = new Date(d);
        const end = new Date(d);
        end.setDate(end.getDate() + 6);
        cols.push({ label: formatWeek(start), startOffset: diffDays(timelineStart, start) * pxPerDay, width: 7 * pxPerDay });
        d.setDate(d.getDate() + 7);
      }
    } else if (zoom === 'mensual') {
      while (d <= timelineEnd) {
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        const daysInMonth = monthEnd.getDate();
        cols.push({ label: formatMonthYear(monthStart), startOffset: diffDays(timelineStart, monthStart) * pxPerDay, width: daysInMonth * pxPerDay });
        d.setMonth(d.getMonth() + 1);
      }
    } else {
      // Trimestral
      while (d <= timelineEnd) {
        const qStart = new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
        const qEnd = new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3 + 3, 0);
        const days = diffDays(qStart, qEnd) + 1;
        const qNum = Math.floor(d.getMonth() / 3) + 1;
        cols.push({ label: `Q${qNum} ${d.getFullYear()}`, startOffset: diffDays(timelineStart, qStart) * pxPerDay, width: days * pxPerDay });
        d.setMonth(Math.floor(d.getMonth() / 3) * 3 + 3);
      }
    }
    return cols;
  }, [timelineStart, timelineEnd, zoom, pxPerDay, totalDays]);

  // Today position
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOffset = diffDays(timelineStart, today) * pxPerDay;
  const todayVisible = todayOffset >= 0 && todayOffset <= chartWidth;

  const handleMilestoneHover = (e, hito, project) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      titulo: hito.titulo_tarea,
      fecha: hito.fecha_limite,
      estado: hito.estado,
      proyecto: project.nombre_proyecto
    });
  };

  if (loading) {
    return (
      <div className="m3-card glass-panel" style={{ padding: 40, textAlign: 'center' }}>
        <span>Cargando timeline...</span>
      </div>
    );
  }

  return (
    <div className="timeline-page">
      {/* Toolbar */}
      <div className="m3-card glass-panel timeline-toolbar">
        <div className="timeline-filters">
          <div className="timeline-filter-group">
            <Filter size={16} style={{ opacity: 0.6 }} />
            <select value={filterRag} onChange={e => setFilterRag(e.target.value)} className="timeline-select">
              <option value="">Todos RAG</option>
              <option value="VERDE">🟢 Verde</option>
              <option value="AMARILLO">🟡 Amarillo</option>
              <option value="ROJO">🔴 Rojo</option>
            </select>

            <select value={filterPm} onChange={e => setFilterPm(e.target.value)} className="timeline-select">
              <option value="">Todos PM</option>
              {pmList.map(pm => <option key={pm} value={pm}>{pm}</option>)}
            </select>

            <label className="timeline-toggle">
              <input type="checkbox" checked={showClosed} onChange={e => setShowClosed(e.target.checked)} />
              <span>Cerrados</span>
            </label>
          </div>

          <div className="timeline-zoom-controls">
            <button
              className="icon-btn"
              disabled={zoomIndex === 0}
              onClick={() => setZoomIndex(i => Math.max(0, i - 1))}
              title="Menos zoom"
            >
              <ZoomOut size={18} />
            </button>
            <span className="timeline-zoom-label">{ZOOM_LABELS[zoom]}</span>
            <button
              className="icon-btn"
              disabled={zoomIndex === ZOOM_LEVELS.length - 1}
              onClick={() => setZoomIndex(i => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
              title="Más zoom"
            >
              <ZoomIn size={18} />
            </button>
          </div>
        </div>

        <div className="timeline-legend">
          <span className="timeline-legend-item"><span className="timeline-legend-dot" style={{ background: RAG_COLORS.VERDE }}></span> Verde</span>
          <span className="timeline-legend-item"><span className="timeline-legend-dot" style={{ background: RAG_COLORS.AMARILLO }}></span> Amarillo</span>
          <span className="timeline-legend-item"><span className="timeline-legend-dot" style={{ background: RAG_COLORS.ROJO }}></span> Rojo</span>
          <span className="timeline-legend-item"><span className="timeline-legend-diamond completed"></span> Hito completado</span>
          <span className="timeline-legend-item"><span className="timeline-legend-diamond pending"></span> Hito pendiente</span>
          <span className="timeline-legend-item"><span className="timeline-today-indicator"></span> Hoy</span>
        </div>
      </div>

      {/* Gantt Chart */}
      {filtered.length === 0 ? (
        <div className="m3-card glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--md-sys-color-outline)' }}>
          No hay proyectos que mostrar con los filtros actuales.
        </div>
      ) : (
        <div className="timeline-chart-wrapper">
          {/* Project labels (sticky left) */}
          <div className="timeline-labels">
            <div className="timeline-labels-header">Proyecto</div>
            {filtered.map((p, i) => (
              <div
                key={p.id_proyecto}
                className={`timeline-label-row ${i % 2 === 0 ? 'even' : 'odd'}`}
                onClick={() => onViewProject(p.id_proyecto)}
                title={`Ir a ${p.nombre_proyecto}`}
              >
                <div className="timeline-label-rag" style={{ background: RAG_COLORS[p.indicador_rag] }}></div>
                <div className="timeline-label-info">
                  <span className="timeline-label-id">{p.id_proyecto}</span>
                  <span className="timeline-label-name">{p.nombre_proyecto}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Chart area with scroll */}
          <div className="timeline-chart-scroll" ref={scrollRef}>
            <div className="timeline-chart" style={{ width: chartWidth, minWidth: chartWidth }}>
              {/* Column headers */}
              <div className="timeline-header-row">
                {columns.map((col, idx) => (
                  <div
                    key={idx}
                    className="timeline-col-header"
                    style={{ left: col.startOffset, width: col.width }}
                  >
                    {col.label}
                  </div>
                ))}
              </div>

              {/* Grid lines */}
              <div className="timeline-grid">
                {columns.map((col, idx) => (
                  <div key={idx} className="timeline-grid-line" style={{ left: col.startOffset }}></div>
                ))}
              </div>

              {/* Today line */}
              {todayVisible && (
                <div
                  ref={todayLineRef}
                  className="timeline-today-line"
                  style={{ left: todayOffset }}
                >
                  <span className="timeline-today-badge">Hoy</span>
                </div>
              )}

              {/* Project bars */}
              {filtered.map((p, i) => {
                const start = parseDate(p.fecha_inicio);
                const end = parseDate(p.fecha_fin_estimada);
                if (!start || !end) return null;

                const barLeft = diffDays(timelineStart, start) * pxPerDay;
                const barWidth = Math.max(diffDays(start, end) * pxPerDay, 8);

                return (
                  <div key={p.id_proyecto} className={`timeline-bar-row ${i % 2 === 0 ? 'even' : 'odd'}`}>
                    <div
                      className="timeline-bar"
                      style={{
                        left: barLeft,
                        width: barWidth,
                        backgroundColor: RAG_COLORS[p.indicador_rag],
                      }}
                      onClick={() => onViewProject(p.id_proyecto)}
                      title={`${p.nombre_proyecto}\n${p.fecha_inicio} → ${p.fecha_fin_estimada}\nPM: ${p.pm_nombre}`}
                    >
                      {barWidth > 80 && (
                        <span className="timeline-bar-text">{p.nombre_proyecto}</span>
                      )}
                    </div>

                    {/* Milestones */}
                    {p.hitos.map(h => {
                      const hDate = parseDate(h.fecha_limite);
                      if (!hDate) return null;
                      const hOffset = diffDays(timelineStart, hDate) * pxPerDay;
                      return (
                        <div
                          key={h.id_tarea}
                          className={`timeline-milestone ${h.estado === 'COMPLETADA' ? 'completed' : 'pending'}`}
                          style={{ left: hOffset }}
                          onMouseEnter={(e) => handleMilestoneHover(e, h, p)}
                          onMouseLeave={() => setTooltip(null)}
                        ></div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="timeline-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <strong>{tooltip.titulo}</strong>
          <span>{tooltip.fecha}</span>
          <span className={`badge ${tooltip.estado === 'COMPLETADA' ? 'badge-green' : 'badge-yellow'}`}>
            {tooltip.estado}
          </span>
        </div>
      )}
    </div>
  );
}
