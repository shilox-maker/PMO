import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useMetadata } from '../context/MetadataContext';
import usePersistentFilters from '../hooks/usePersistentFilters';
import TimelineToolbar from '../components/timeline/TimelineToolbar';
import { 
  ProjectTimelineLabel, 
  ProjectTimelineBar, 
  parseDate, 
  diffDays, 
  generateTimelineColumns, 
  filterTimelineProjects 
} from '../components/timeline/ProjectTimelineRow';

const ZOOM_LEVELS = ['trimestral', 'mensual', 'semanal'];
const MS_PER_DAY = 86400000;

const DEFAULT_TIMELINE_FILTERS = {
  searchTerm: '',
  showClosed: false,
  filterRag: '',
  filterPm: '',
  filterVendor: '',
  filterPortfolio: '',
  filterWorkflow: '',
  filterEstrategico: '',
  filterIniciativa: '',
  filterState: '',
  filterStartDate: '',
  filterEndDate: '',
  zoomIndex: 1
};

export default function Timeline({ onViewProject, projectId, hideHeader }) {
  const { t } = useTranslation();
  const { getAuthHeaders, selectedAmbito } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState(new Set());

  // Master Lists from global context
  const {
    pms: pmsList,
    vendors: vendorsList,
    portfolios: portfoliosList,
    workflows: workflowsList,
    states: statesList
  } = useMetadata();

  // Persistent Filters
  const {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    activeFiltersCount
  } = usePersistentFilters('timeline', DEFAULT_TIMELINE_FILTERS);

  const {
    searchTerm,
    showClosed,
    filterRag,
    filterPm,
    filterVendor,
    filterPortfolio,
    filterWorkflow,
    filterEstrategico,
    filterIniciativa,
    filterState,
    filterStartDate,
    filterEndDate,
    zoomIndex
  } = filters;

  const setSearchTerm = (val) => updateFilter('searchTerm', val);
  const setShowClosed = (val) => updateFilter('showClosed', typeof val === 'function' ? val(showClosed) : val);
  const setFilterRag = (val) => updateFilter('filterRag', val);
  const setFilterPm = (val) => updateFilter('filterPm', val);
  const setFilterVendor = (val) => updateFilter('filterVendor', val);
  const setFilterPortfolio = (val) => updateFilter('filterPortfolio', val);
  const setFilterWorkflow = (val) => updateFilter('filterWorkflow', val);
  const setFilterEstrategico = (val) => updateFilter('filterEstrategico', val);
  const setFilterIniciativa = (val) => updateFilter('filterIniciativa', val);
  const setFilterState = (val) => updateFilter('filterState', val);
  const setFilterStartDate = (val) => updateFilter('filterStartDate', val);
  const setFilterEndDate = (val) => updateFilter('filterEndDate', val);
  const setZoomIndex = (updater) => {
    setFilters(prev => ({
      ...prev,
      zoomIndex: typeof updater === 'function' ? updater(prev.zoomIndex !== undefined ? prev.zoomIndex : 1) : updater
    }));
  };

  const [tooltip, setTooltip] = useState(null);
  const scrollRef = useRef(null);
  const todayLineRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    const headers = getAuthHeaders();
    const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    fetch(`${API}/timeline`, { headers })
      .then(r => r.json())
      .then(tml => {
        setProjects(Array.isArray(tml) ? tml : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedAmbito]);

  useEffect(() => {
    if (!loading && todayLineRef.current && scrollRef.current) {
      const containerRect = scrollRef.current.getBoundingClientRect();
      const lineRect = todayLineRef.current.getBoundingClientRect();
      const scrollTarget = lineRect.left - containerRect.left - containerRect.width / 3;
      scrollRef.current.scrollLeft = Math.max(0, scrollRef.current.scrollLeft + scrollTarget);
    }
  }, [loading, zoomIndex]);

  const toggleExpandProject = (pId, e) => {
    if (e) e.stopPropagation();
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(pId)) next.delete(pId);
      else next.add(pId);
      return next;
    });
  };

  const zoom = ZOOM_LEVELS[zoomIndex];

  const filtered = useMemo(() => {
    return filterTimelineProjects(projects, {
      projectId, showClosed, filterRag, filterPm, filterVendor,
      filterPortfolio, filterWorkflow, filterState, filterEstrategico, searchTerm,
      filterStartDate, filterEndDate
    });
  }, [projects, showClosed, filterRag, filterPm, filterVendor, filterPortfolio, filterWorkflow, filterState, filterEstrategico, searchTerm, filterStartDate, filterEndDate, projectId]);

  const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
    if (filtered.length === 0) return { timelineStart: new Date(), timelineEnd: new Date(), totalDays: 365 };
    const starts = filtered.map(p => parseDate(p.fecha_kickoff || p.fecha_inicio)).filter(Boolean);
    const ends = filtered.map(p => parseDate(p.fecha_go_live || p.fecha_fin_estimada)).filter(Boolean);
    const allDates = [...starts, ...ends];
    if (allDates.length === 0) return { timelineStart: new Date(), timelineEnd: new Date(), totalDays: 365 };

    let minDate = new Date(Math.min(...allDates));
    let maxDate = new Date(Math.max(...allDates));

    minDate = new Date(minDate.getTime() - 30 * MS_PER_DAY);
    maxDate = new Date(maxDate.getTime() + 30 * MS_PER_DAY);

    minDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);

    return { timelineStart: minDate, timelineEnd: maxDate, totalDays: diffDays(minDate, maxDate) };
  }, [filtered]);

  const pxPerDay = zoom === 'semanal' ? 12 : zoom === 'mensual' ? 4 : 1.5;
  const chartWidth = totalDays * pxPerDay;

  const columns = useMemo(() => {
    return generateTimelineColumns(timelineStart, timelineEnd, zoom, pxPerDay);
  }, [timelineStart, timelineEnd, zoom, pxPerDay]);

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
        <span>{t('timeline.loadingTimeline')}</span>
      </div>
    );
  }

  return (
    <div className="timeline-page">
      {!hideHeader && (
        <TimelineToolbar
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          filterRag={filterRag} setFilterRag={setFilterRag}
          filterPm={filterPm} setFilterPm={setFilterPm}
          filterVendor={filterVendor} setFilterVendor={setFilterVendor}
          filterPortfolio={filterPortfolio} setFilterPortfolio={setFilterPortfolio}
          filterWorkflow={filterWorkflow} setFilterWorkflow={setFilterWorkflow}
          filterEstrategico={filterEstrategico} setFilterEstrategico={setFilterEstrategico}
          filterIniciativa={filterIniciativa} setFilterIniciativa={setFilterIniciativa}
          filterState={filterState} setFilterState={setFilterState}
          filterStartDate={filterStartDate} setFilterStartDate={setFilterStartDate}
          filterEndDate={filterEndDate} setFilterEndDate={setFilterEndDate}
          showClosed={showClosed} setShowClosed={setShowClosed}
          zoomIndex={zoomIndex} setZoomIndex={setZoomIndex}
          pmsList={pmsList} vendorsList={vendorsList} portfoliosList={portfoliosList} workflowsList={workflowsList} statesList={statesList}
          zoom={zoom}
          activeFiltersCount={activeFiltersCount}
          onResetFilters={resetFilters}
        />
      )}

      {filtered.length === 0 ? (
        <div className="m3-card glass-panel" style={{ padding: 40, textAlign: 'center', color: 'var(--md-sys-color-outline)' }}>
          {t('timeline.noProjects')}
        </div>
      ) : (
        <div className="timeline-chart-wrapper">
          <div className="timeline-labels">
            <div className="timeline-labels-header">{t('timeline.project')}</div>
            {filtered.map((p, i) => (
              <ProjectTimelineLabel
                key={p.id_proyecto}
                project={p}
                index={i}
                isExpanded={expandedProjects.has(p.id_proyecto)}
                onToggleExpand={toggleExpandProject}
                onViewProject={onViewProject}
              />
            ))}
          </div>

          <div className="timeline-chart-scroll" ref={scrollRef}>
            <div className="timeline-chart" style={{ width: chartWidth, minWidth: chartWidth }}>
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

              <div className="timeline-grid">
                {columns.map((col, idx) => (
                  <div key={idx} className="timeline-grid-line" style={{ left: col.startOffset }}></div>
                ))}
              </div>

              {todayVisible && (
                <div
                  ref={todayLineRef}
                  className="timeline-today-line"
                  style={{ left: todayOffset }}
                >
                  <span className="timeline-today-badge">{t('timeline.today')}</span>
                </div>
              )}

              {filtered.map((p, i) => (
                <ProjectTimelineBar
                  key={`bar-group-${p.id_proyecto}`}
                  project={p}
                  index={i}
                  isExpanded={expandedProjects.has(p.id_proyecto)}
                  timelineStart={timelineStart}
                  pxPerDay={pxPerDay}
                  onViewProject={onViewProject}
                  onMilestoneHover={handleMilestoneHover}
                  onMilestoneLeave={() => setTooltip(null)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

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
