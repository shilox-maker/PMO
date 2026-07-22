import React from 'react';
import { Filter, ZoomIn, ZoomOut } from 'lucide-react';

const ZOOM_LEVELS = ['trimestral', 'mensual', 'semanal'];
const ZOOM_LABELS = { trimestral: 'Trimestral', mensual: 'Mensual', semanal: 'Semanal' };
const RAG_COLORS = {
  VERDE: 'var(--color-rag-green)',
  AMARILLO: 'var(--color-rag-yellow)',
  ROJO: 'var(--color-rag-red)'
};

export default function TimelineToolbar({
  filterRag, setFilterRag,
  filterPm, setFilterPm,
  filterStartDate, setFilterStartDate,
  filterEndDate, setFilterEndDate,
  showClosed, setShowClosed,
  zoomIndex, setZoomIndex,
  pmList, zoom
}) {
  return (
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

          <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="timeline-select" title="Rango de fecha inicio" />
          <span style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>a</span>
          <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="timeline-select" title="Rango de fecha fin" />

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
  );
}
