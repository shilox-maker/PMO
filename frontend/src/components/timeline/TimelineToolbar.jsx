import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, Search, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const ZOOM_LEVELS = ['trimestral', 'mensual', 'semanal'];
const RAG_COLORS = {
  VERDE: 'var(--color-rag-green)',
  AMARILLO: 'var(--color-rag-yellow)',
  ROJO: 'var(--color-rag-red)'
};

export default function TimelineToolbar({
  searchTerm, setSearchTerm,
  filterRag, setFilterRag,
  filterPm, setFilterPm,
  filterVendor, setFilterVendor,
  filterPortfolio, setFilterPortfolio,
  filterWorkflow, setFilterWorkflow,
  filterEstrategico, setFilterEstrategico,
  filterIniciativa, setFilterIniciativa,
  filterState, setFilterState,
  filterStartDate, setFilterStartDate,
  filterEndDate, setFilterEndDate,
  showClosed, setShowClosed,
  zoomIndex, setZoomIndex,
  pmsList = [], vendorsList = [], portfoliosList = [], workflowsList = [], statesList = [], zoom,
  activeFiltersCount = 0,
  onResetFilters
}) {
  const { t } = useTranslation();

  const ZOOM_LABELS = {
    trimestral: t('timeline.quarterly'),
    mensual: t('timeline.monthly'),
    semanal: t('timeline.weekly')
  };

  const effectiveStates = useMemo(() => {
    if (filterWorkflow && workflowsList?.length > 0) {
      const selectedWf = workflowsList.find(w => String(w.id) === String(filterWorkflow));
      if (selectedWf && Array.isArray(selectedWf.Estados) && selectedWf.Estados.length > 0) {
        return [...selectedWf.Estados].sort((a, b) => {
          const ordA = a.WorkflowEstados?.orden !== undefined ? a.WorkflowEstados.orden : (a.orden || 0);
          const ordB = b.WorkflowEstados?.orden !== undefined ? b.WorkflowEstados.orden : (b.orden || 0);
          return ordA - ordB;
        });
      }
    }
    return statesList || [];
  }, [filterWorkflow, workflowsList, statesList]);

  const groupedEffectiveStates = useMemo(() => {
    const groups = {
      INICIATIVA: [],
      PLANIFICACION: [],
      EJECUCION: [],
      PAUSA: [],
      CIERRE: []
    };
    effectiveStates.forEach(st => {
      const macro = (st.macro_etapa || (st.proyecto_cerrado ? 'CIERRE' : 'EJECUCION')).toUpperCase();
      if (groups[macro]) {
        groups[macro].push(st);
      } else {
        groups.EJECUCION.push(st);
      }
    });
    return groups;
  }, [effectiveStates]);

  const handleWorkflowChange = (newWf) => {
    setFilterWorkflow(newWf);
    if (newWf && workflowsList?.length > 0 && filterState) {
      const selectedWf = workflowsList.find(w => String(w.id) === String(newWf));
      if (selectedWf && Array.isArray(selectedWf.Estados)) {
        const allowedStateIds = new Set(selectedWf.Estados.map(s => String(s.id_estado)));
        if (!allowedStateIds.has(String(filterState))) {
          setFilterState('');
        }
      }
    }
  };

  return (
    <div className="m3-card glass-panel timeline-toolbar" style={{ padding: '16px 20px', marginBottom: 20 }}>
      <div className="timeline-filters" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--md-sys-color-outline)' }}>
          <Filter size={18} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t('common.filters')}</span>
          {activeFiltersCount > 0 && (
            <span 
              className="badge badge-blue"
              style={{
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: '12px',
                fontWeight: 700,
                backgroundColor: 'var(--md-sys-color-primary-container)',
                color: 'var(--md-sys-color-on-primary-container)',
                border: '1px solid var(--md-sys-color-primary)'
              }}
              title={t('common.activeFiltersCount', { count: activeFiltersCount })}
            >
              {activeFiltersCount}
            </span>
          )}
        </div>

        {onResetFilters && activeFiltersCount > 0 && (
          <button 
            type="button" 
            onClick={onResetFilters} 
            className="m3-btn m3-btn-tonal"
            style={{ 
              height: '38px', 
              padding: '0 12px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6, 
              fontSize: '0.8rem',
              color: 'var(--md-sys-color-error)',
              backgroundColor: 'var(--md-sys-color-error-container)'
            }}
            title={t('common.cleanAllFilters')}
          >
            <RotateCcw size={14} />
            <span>{t('common.cleanFilters')}</span>
          </button>
        )}

        {/* Buscador de texto */}
        <div style={{ position: 'relative', flexGrow: 1, minWidth: '180px' }}>
          <input 
            type="text" 
            placeholder={t('projectsTable.searchPlaceholder')} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="m3-input"
            style={{ paddingLeft: '36px', height: '38px', borderRadius: '12px' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--md-sys-color-outline)' }} />
        </div>

        {/* PM filter */}
        <select 
          value={filterPm} 
          onChange={e => setFilterPm(e.target.value)} 
          className="user-select"
          style={{ height: '38px', borderRadius: '12px', minWidth: '130px' }}
        >
          <option key="all-pms" value="">{t('projectsTable.allPms')}</option>
          {pmsList.map((p, idx) => (
            <option key={p.id_usuario || `pm-${idx}`} value={p.id_usuario || p.nombre}>
              {p.nombre_completo || (p.nombre ? `${p.nombre} ${p.apellidos || ''}`.trim() : p)}
            </option>
          ))}
        </select>

        {/* Partner/Vendor filter */}
        <select 
          value={filterVendor} 
          onChange={e => setFilterVendor(e.target.value)} 
          className="user-select"
          style={{ height: '38px', borderRadius: '12px', minWidth: '130px' }}
        >
          <option key="all-vendors" value="">{t('projectsTable.allPartners')}</option>
          {vendorsList.map(v => (
            <option key={v.id_proveedor} value={v.id_proveedor}>{v.nombre_razon_social}</option>
          ))}
        </select>

        {/* RAG Status Filter */}
        <select 
          value={filterRag} 
          onChange={e => setFilterRag(e.target.value)} 
          className="user-select"
          style={{ height: '38px', borderRadius: '12px', minWidth: '120px' }}
        >
          <option key="all-rags" value="">{t('projectsTable.allRags')}</option>
          <option key="rag-verde" value="VERDE">🟢 {t('status.VERDE')}</option>
          <option key="rag-amarillo" value="AMARILLO">🟡 {t('status.AMARILLO')}</option>
          <option key="rag-rojo" value="ROJO">🔴 {t('status.ROJO')}</option>
        </select>

        {/* Estado Proyecto agrupado por Macro-Etapas */}
        {effectiveStates.length > 0 && (
          <select
            value={filterState}
            onChange={e => setFilterState(e.target.value)}
            className="user-select"
            style={{ height: '38px', borderRadius: '12px', minWidth: '130px' }}
          >
            <option key="all-states" value="">{t('projectsTable.allStates')}</option>
            {Object.entries(groupedEffectiveStates).map(([macroKey, statesInGroup]) => {
              if (statesInGroup.length === 0) return null;
              return (
                <optgroup key={macroKey} label={t(`macroEtapas.${macroKey}`, macroKey)}>
                  {statesInGroup.map(s => (
                    <option key={s.id_estado} value={s.id_estado}>
                      {s.icono ? `${s.icono} ` : ''}{s.nombre_estado}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        )}

        {/* Portfolio Filter */}
        {portfoliosList.length > 0 && (
          <select
            value={filterPortfolio}
            onChange={e => setFilterPortfolio(e.target.value)} 
            className="user-select"
            style={{ height: '38px', borderRadius: '12px', minWidth: '130px' }}
          >
            <option key="all-portfolios" value="">{t('projectsTable.allPortfolios')}</option>
            {portfoliosList.map(p => (
              <option key={p.id_portfolio} value={p.id_portfolio}>{p.nombre}</option>
            ))}
          </select>
        )}

        {/* Workflow Filter */}
        {workflowsList.length > 0 && (
          <select
            value={filterWorkflow}
            onChange={e => handleWorkflowChange(e.target.value)}
            className="user-select"
            style={{ height: '38px', borderRadius: '12px', minWidth: '130px' }}
          >
            <option key="all-workflows" value="">{t('projectsTable.allWorkflows', 'Todos los Flujos')}</option>
            {workflowsList.map(w => (
              <option key={w.id} value={w.id}>{w.nombre}</option>
            ))}
          </select>
        )}

        {/* Estratégico */}
        <select
          value={filterEstrategico}
          onChange={e => setFilterEstrategico(e.target.value)}
          className="user-select"
          style={{ height: '38px', borderRadius: '12px', minWidth: '120px' }}
        >
          <option key="all-strategic" value="">{t('projectsTable.isStrategic')}</option>
          <option key="strat-yes" value="true">{t('common.yes')}</option>
          <option key="strat-no" value="false">{t('common.no')}</option>
        </select>

        {/* Fechas inicio y fin */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input 
            type="date" 
            value={filterStartDate} 
            onChange={e => setFilterStartDate(e.target.value)} 
            className="user-select" 
            style={{ height: '38px', borderRadius: '12px' }}
            title={t('timeline.startDateRange')} 
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>-</span>
          <input 
            type="date" 
            value={filterEndDate} 
            onChange={e => setFilterEndDate(e.target.value)} 
            className="user-select" 
            style={{ height: '38px', borderRadius: '12px' }}
            title={t('timeline.endDateRange')} 
          />
        </div>

        {/* Checkbox Cerrados */}
        <label className="timeline-toggle" style={{ fontSize: '0.85rem' }}>
          <input type="checkbox" checked={showClosed} onChange={e => setShowClosed(e.target.checked)} />
          <span>{t('timeline.closed')}</span>
        </label>

        {/* Zoom Controls */}
        <div className="timeline-zoom-controls" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            className="icon-btn"
            disabled={zoomIndex === 0}
            onClick={() => setZoomIndex(i => Math.max(0, i - 1))}
            title={t('timeline.zoomOut')}
          >
            <ZoomOut size={18} />
          </button>
          <span className="timeline-zoom-label" style={{ fontWeight: 600, minWidth: '70px', textAlign: 'center' }}>{ZOOM_LABELS[zoom]}</span>
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

      <div className="timeline-legend" style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
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

