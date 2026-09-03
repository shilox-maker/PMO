import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, Search, Printer, Plus, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import ColumnSelector from '../ColumnSelector';
import DensitySelector from '../DensitySelector';

export default function ProjectsFilterPanel({
  filterPm, setFilterPm,
  filterVendor, setFilterVendor,
  filterRag, setFilterRag,
  filterEstrategico, setFilterEstrategico,
  filterIniciativa, setFilterIniciativa,
  filterPortfolio, setFilterPortfolio,
  filterWorkflow, setFilterWorkflow,
  filterTag, setFilterTag,
  filterStates, setFilterStates,
  searchTerm, setSearchTerm,
  isStatesOpen, setIsStatesOpen,
  pmsList, vendorsList, portfoliosList, workflowsList = [], tagsList, statesList = [], projects,
  tableCols, toggleColumn, resetColumns,
  density, onDensityChange,
  onOpenReport, onOpenCreate,
  activeFiltersCount = 0,
  onResetFilters
}) {
  const { t } = useTranslation();

  // Estados efectivos según el Flujo de Trabajo seleccionado
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

  const handleWorkflowChange = (newWf) => {
    setFilterWorkflow(newWf);
    if (newWf && workflowsList?.length > 0) {
      const selectedWf = workflowsList.find(w => String(w.id) === String(newWf));
      if (selectedWf && Array.isArray(selectedWf.Estados)) {
        const allowedStateNames = new Set(selectedWf.Estados.map(s => s.nombre_estado));
        setFilterStates(prev => (Array.isArray(prev) ? prev.filter(st => allowedStateNames.has(st)) : []));
      }
    }
  };

  return (
    <div className="m3-card glass-panel" style={{ padding: '20px 24px', marginBottom: 24, position: 'relative', zIndex: 10, overflow: 'visible' }}>
      {/* Row 1: Search & Master Dropdowns */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
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
      
        {/* Search */}
        <div style={{ position: 'relative', flexGrow: 1, minWidth: '180px' }}>
          <input 
            type="text" 
            placeholder={t('projectsTable.searchPlaceholder')} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="m3-input"
            style={{ paddingLeft: '40px', height: '40px' }}
          />
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '11px', color: 'var(--md-sys-color-outline)' }} />
        </div>

        {/* PM filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select 
            value={filterPm} 
            onChange={(e) => setFilterPm(e.target.value)}
            className="user-select"
            style={{ width: 'auto', minWidth: '140px', height: '40px', paddingTop: 0, paddingBottom: 0 }}
          >
            <option value="">{t('projectsTable.allPms')}</option>
            {pmsList.map(p => (
              <option key={p.id_usuario} value={p.id_usuario}>{p.nombre} {p.apellidos}</option>
            ))}
          </select>
        </div>

        {/* Vendor Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select 
            value={filterVendor} 
            onChange={(e) => setFilterVendor(e.target.value)}
            className="user-select"
            style={{ width: 'auto', minWidth: '140px', height: '40px', paddingTop: 0, paddingBottom: 0 }}
          >
            <option value="">{t('projectsTable.allPartners')}</option>
            {vendorsList.map(v => (
              <option key={v.id_proveedor} value={v.id_proveedor}>{v.nombre_razon_social}</option>
            ))}
          </select>
        </div>

        {/* RAG Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select 
            value={filterRag} 
            onChange={(e) => setFilterRag(e.target.value)}
            className="user-select"
            style={{ width: 'auto', minWidth: '130px', height: '40px', paddingTop: 0, paddingBottom: 0 }}
          >
            <option value="">{t('projectsTable.allRags')}</option>
            <option value="VERDE">🟢 VERDE</option>
            <option value="AMARILLO">🟡 AMARILLO</option>
            <option value="ROJO">🔴 ROJO</option>
          </select>
        </div>

        {/* Estratégico Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select 
            value={filterEstrategico} 
            onChange={(e) => setFilterEstrategico(e.target.value)}
            className="user-select"
            style={{ width: 'auto', minWidth: '130px', height: '40px', paddingTop: 0, paddingBottom: 0 }}
          >
            <option value="">{t('projectsTable.isStrategic')}</option>
            <option value="true">{t('common.yes')}</option>
            <option value="false">{t('common.no')}</option>
          </select>
        </div>

        {/* Tipo Iniciativa Filter */}
        {setFilterIniciativa && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select 
              value={filterIniciativa || ''} 
              onChange={(e) => setFilterIniciativa(e.target.value)}
              className="user-select"
              style={{ width: 'auto', minWidth: '150px', height: '40px', paddingTop: 0, paddingBottom: 0 }}
            >
              <option value="">{t('projectsTable.allTypes')}</option>
              <option value="false">📁 Proyectos Estándar</option>
              <option value="true">⚡ Iniciativas Ligeras</option>
            </select>
          </div>
        )}

        {/* Portfolio Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select 
            value={filterPortfolio} 
            onChange={(e) => setFilterPortfolio(e.target.value)}
            className="user-select"
            style={{ width: 'auto', minWidth: '150px', height: '40px', paddingTop: 0, paddingBottom: 0 }}
          >
            <option value="">{t('projectsTable.allPortfolios')}</option>
            {portfoliosList.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>

        {/* Workflow Filter */}
        {setFilterWorkflow && workflowsList?.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select 
              value={filterWorkflow || ''} 
              onChange={(e) => handleWorkflowChange(e.target.value)}
              className="user-select"
              style={{ width: 'auto', minWidth: '150px', height: '40px', paddingTop: 0, paddingBottom: 0 }}
            >
              <option value="">{t('projectsTable.allWorkflows', 'Todos los Flujos')}</option>
              {workflowsList.map(w => (
                <option key={w.id} value={w.id}>{w.nombre}</option>
              ))}
            </select>
          </div>
        )}

        {/* Tag Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select 
            value={filterTag} 
            onChange={(e) => setFilterTag(e.target.value)}
            className="user-select"
            style={{ width: 'auto', minWidth: '130px', height: '40px', paddingTop: 0, paddingBottom: 0 }}
          >
            <option value="">{t('projectsTable.allTags')}</option>
            {tagsList.map(t => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>
        
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginLeft: 'auto', position: 'relative', zIndex: 50 }}>
          <DensitySelector density={density} onChange={onDensityChange} />
          <ColumnSelector columns={tableCols} toggleColumn={toggleColumn} resetColumns={resetColumns} />
          
          {onOpenReport && (
            <button 
              className="m3-btn m3-btn-tonal" 
              onClick={onOpenReport}
              style={{ 
                height: '40px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8
              }}
            >
              <Printer size={18} />
              <span>{t('projectsTable.generateReport')}</span>
            </button>
          )}

          {onOpenCreate && (
            <button className="m3-btn m3-btn-primary" onClick={onOpenCreate} style={{ height: '40px' }}>
              <Plus size={18} />
              {t('projectsTable.newProject')}
            </button>
          )}
        </div>
      </div>

      {/* Separator Line */}
      <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', margin: '16px 0' }}></div>

      {/* Row 2: State Segmentation Buttons */}
      <div>
        <div 
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
          onClick={() => setIsStatesOpen(!isStatesOpen)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              {t('projectsTable.filterByStatus')}
            </h4>
            {filterStates && filterStates.length > 0 && (
              <span 
                style={{ 
                  fontSize: '0.75rem', 
                  padding: '2px 8px', 
                  borderRadius: '10px', 
                  backgroundColor: 'var(--md-sys-color-secondary-container)', 
                  color: 'var(--md-sys-color-on-secondary-container)', 
                  fontWeight: 600 
                }}
              >
                {filterStates.length}
              </span>
            )}
          </div>
          {isStatesOpen ? <ChevronUp size={18} color="var(--md-sys-color-outline)" /> : <ChevronDown size={18} color="var(--md-sys-color-outline)" />}
        </div>
        
        {isStatesOpen && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  const openStates = effectiveStates
                    .filter(s => !s.proyecto_cerrado)
                    .map(s => s.nombre_estado);
                  setFilterStates(openStates);
                }}
                style={{
                  borderRadius: '20px',
                  padding: '8px 16px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: '1px solid var(--md-sys-color-primary)',
                  color: 'var(--md-sys-color-primary)',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(168, 199, 250, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                📂 Proyectos abiertos
              </button>
              <button
                type="button"
                onClick={() => setFilterStates([])}
                style={{
                  borderRadius: '20px',
                  padding: '8px 16px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: 'none',
                  color: 'var(--md-sys-color-outline)',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--md-sys-color-on-surface)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--md-sys-color-outline)'}
              >
                🧹 Limpiar selección
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {effectiveStates.map(state => {
                const st = state.nombre_estado;
                const isSelected = Array.isArray(filterStates) && filterStates.includes(st);
                
                return (
                  <div 
                    key={state.id_estado}
                    onClick={() => {
                      const currentStates = Array.isArray(filterStates) ? filterStates : [];
                      const newStates = isSelected 
                        ? currentStates.filter(x => x !== st) 
                        : [...currentStates, st];
                      setFilterStates(newStates);
                    }}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: isSelected ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container-high)',
                      color: isSelected ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface)',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      border: isSelected ? '1px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '8px' }}>
                      {state.icono || '❓'} {st}
                    </span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                      {projects.filter(p => p.Estado && p.Estado.nombre_estado === st).length}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
