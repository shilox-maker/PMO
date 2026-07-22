import React from 'react';
import ProjectTable from '../ProjectTable';

export default function DashboardSummaryTable({
  filteredProjects,
  selectedKpi,
  setSelectedKpi,
  selectedChartFilter,
  setSelectedChartFilter,
  onViewProject,
  onViewVendor
}) {
  return (
    <div className="m3-card glass-panel" style={{ marginTop: 24, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>
          Proyectos ({filteredProjects.length})
        </h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {selectedKpi && (
            <span 
              style={{ 
                padding: '4px 10px', 
                backgroundColor: 'var(--md-sys-color-primary-container)', 
                color: 'var(--md-sys-color-on-primary-container)', 
                borderRadius: 12, 
                fontSize: '0.8rem', 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer'
              }}
              onClick={() => setSelectedKpi(null)}
            >
              KPI: {selectedKpi === 'overrun' ? 'Excedido coste (CAPEX)' : 
                    selectedKpi === 'overrun_extended' ? 'Excedido coste ampliado' : 
                    selectedKpi === 'delayed_partial' ? 'Retrasados parc. (Hitos)' : 
                    selectedKpi === 'delayed_base' ? 'Retrasados (Fecha Base)' : 
                    selectedKpi === 'delayed_extended' ? 'Retrasados (Fecha Ampliada)' : 
                    selectedKpi === 'governance' ? 'Sin Gobernanza' : 
                    selectedKpi === 'inactive' ? 'Proyectos Inactivos' : 
                    selectedKpi === 'rag_verde' ? 'Verde' : 
                    selectedKpi === 'rag_amarillo' ? 'Amarillo' : 
                    selectedKpi === 'rag_rojo' ? 'Rojo' : ''} ✕
            </span>
          )}
          {selectedChartFilter && (
            <span 
              style={{ 
                padding: '4px 10px', 
                backgroundColor: 'var(--md-sys-color-secondary-container)', 
                color: 'var(--md-sys-color-on-secondary-container)', 
                borderRadius: 12, 
                fontSize: '0.8rem', 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer'
              }}
              onClick={() => setSelectedChartFilter(null)}
            >
              Gráfico: {selectedChartFilter.value} ✕
            </span>
          )}
          {(selectedKpi || selectedChartFilter) && (
            <button 
              className="m3-btn m3-btn-text" 
              style={{ padding: '2px 8px', fontSize: '0.8rem' }}
              onClick={() => {
                setSelectedKpi(null);
                setSelectedChartFilter(null);
              }}
            >
              Limpiar Filtros KPI/Gráfico
            </button>
          )}
        </div>
      </div>
      
      {filteredProjects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--md-sys-color-outline)' }}>
          No hay proyectos que cumplan con los filtros seleccionados.
        </div>
      ) : (
        <ProjectTable 
          projects={filteredProjects} 
          onViewProject={onViewProject} 
          onViewVendor={onViewVendor} 
          showHeaderSelector={true} 
        />
      )}
    </div>
  );
}
