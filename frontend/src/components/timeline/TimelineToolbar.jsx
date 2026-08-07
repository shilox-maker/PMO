import React from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, ZoomIn, ZoomOut } from 'lucide-react';

const ZOOM_LEVELS = ['trimestral', 'mensual', 'semanal'];
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
  const { t } = useTranslation();

  const ZOOM_LABELS = {
    trimestral: t('timeline.quarterly'),
    mensual: t('timeline.monthly'),
    semanal: t('timeline.weekly')
  };

  return (
    <div className="m3-card glass-panel timeline-toolbar">
      <div className="timeline-filters">
        <div className="timeline-filter-group">
          <Filter size={16} style={{ opacity: 0.6 }} />
          <select value={filterRag} onChange={e => setFilterRag(e.target.value)} className="timeline-select">
            <option value="">{t('timeline.allRag')}</option>
            <option value="VERDE">🟢 {t('status.VERDE')}</option>
            <option value="AMARILLO">🟡 {t('status.AMARILLO')}</option>
            <option value="ROJO">🔴 {t('status.ROJO')}</option>
          </select>

          <select value={filterPm} onChange={e => setFilterPm(e.target.value)} className="timeline-select">
            <option value="">{t('timeline.allPm')}</option>
            {pmList.map(pm => <option key={pm} value={pm}>{pm}</option>)}
          </select>

          <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="timeline-select" title={t('timeline.startDateRange')} />
          <span style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>-</span>
          <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="timeline-select" title={t('timeline.endDateRange')} />

          <label className="timeline-toggle">
            <input type="checkbox" checked={showClosed} onChange={e => setShowClosed(e.target.checked)} />
            <span>{t('timeline.closed')}</span>
          </label>
        </div>

        <div className="timeline-zoom-controls">
          <button
            className="icon-btn"
            disabled={zoomIndex === 0}
            onClick={() => setZoomIndex(i => Math.max(0, i - 1))}
            title={t('timeline.zoomOut')}
          >
            <ZoomOut size={18} />
          </button>
          <span className="timeline-zoom-label">{ZOOM_LABELS[zoom]}</span>
          <button
            className="icon-btn"
            disabled={zoomIndex === ZOOM_LEVELS.length - 1}
            onClick={() => setZoomIndex(i => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
            title={t('timeline.zoomIn')}
          >
            <ZoomIn size={18} />
          </button>
        </div>
      </div>

      <div className="timeline-legend">
        <span className="timeline-legend-item"><span className="timeline-legend-dot" style={{ background: RAG_COLORS.VERDE }}></span> {t('status.VERDE')}</span>
        <span className="timeline-legend-item"><span className="timeline-legend-dot" style={{ background: RAG_COLORS.AMARILLO }}></span> {t('status.AMARILLO')}</span>
        <span className="timeline-legend-item"><span className="timeline-legend-dot" style={{ background: RAG_COLORS.ROJO }}></span> {t('status.ROJO')}</span>
        <span className="timeline-legend-item"><span className="timeline-legend-diamond completed"></span> {t('timeline.completedMilestone')}</span>
        <span className="timeline-legend-item"><span className="timeline-legend-diamond pending"></span> {t('timeline.pendingMilestone')}</span>
        <span className="timeline-legend-item"><span className="timeline-today-indicator"></span> {t('timeline.today')}</span>
      </div>
    </div>
  );
}
