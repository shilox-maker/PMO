import React from 'react';
import { Filter, Search, Printer, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import ColumnSelector from '../ColumnSelector';

export default function ProjectsFilterPanel({
  filterPm, setFilterPm,
  filterVendor, setFilterVendor,
  filterRag, setFilterRag,
  filterEstrategico, setFilterEstrategico,
  filterPortfolio, setFilterPortfolio,
  filterTag, setFilterTag,
  filterStates, setFilterStates,
  searchTerm, setSearchTerm,
  isStatesOpen, setIsStatesOpen,
  pmsList, vendorsList, portfoliosList, tagsList, statesList, projects,
  tableCols, toggleColumn, resetColumns,
  onOpenReport, onOpenCreate
}) {
  return (
    <div className="m3-card glass-panel" style={{ padding: '20px 24px', marginBottom: 24, position: 'relative', zIndex: 10, overflow: 'visible' }}>
      {/* Row 1: Search & Master Dropdowns */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--md-sys-color-outline)' }}>
          <Filter size={18} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Filtros:</span>
        </div>
      
        {/* Search */}
        <div style={{ position: 'relative', flexGrow: 1, minWidth: '180px' }}>
          <input 
            type="text" 
            placeholder="Buscar por nombre..." 
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
            <option value="">Todos los PM</option>
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
            <option value="">Todos los Partners</option>
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
            <option value="">Todos los RAG</option>
            <option value="VERDE">VERDE 🟢</option>
            <option value="AMARILLO">AMARILLO 🟡</option>
            <option value="ROJO">ROJO 🔴</option>
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
            <option value="">¿Estratégico?</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </div>

        {/* Portfolio Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select 
            value={filterPortfolio} 
            onChange={(e) => setFilterPortfolio(e.target.value)}
            className="user-select"
            style={{ width: 'auto', minWidth: '150px', height: '40px', paddingTop: 0, paddingBottom: 0 }}
          >
            <option value="">Todos los Portfolios</option>
            {portfoliosList.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>

        {/* Tag Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select 
            value={filterTag} 
            onChange={(e) => setFilterTag(e.target.value)}
            className="user-select"
            style={{ width: 'auto', minWidth: '130px', height: '40px', paddingTop: 0, paddingBottom: 0 }}
          >
            <option value="">Todos los Tags</option>
            {tagsList.map(t => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>
        
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginLeft: 'auto', position: 'relative', zIndex: 50 }}>
          <ColumnSelector columns={tableCols} toggleColumn={toggleColumn} resetColumns={resetColumns} />
          
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
            <span>Generar Informe</span>
          </button>

          <button className="m3-btn m3-btn-primary" onClick={onOpenCreate} style={{ height: '40px' }}>
            <Plus size={18} />
            Crear Proyecto
          </button>
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
          <h4 style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Filtro por Estados del Proyecto
          </h4>
          {isStatesOpen ? <ChevronUp size={18} color="var(--md-sys-color-outline)" /> : <ChevronDown size={18} color="var(--md-sys-color-outline)" />}
        </div>
        
        {isStatesOpen && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  const openStates = statesList
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
              {statesList.map(state => {
                const st = state.nombre_estado;
                const isSelected = filterStates.includes(st);
                
                return (
                  <div 
                    key={state.id_estado}
                    onClick={() => {
                      const newStates = isSelected 
                        ? filterStates.filter(x => x !== st) 
                        : [...filterStates, st];
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
