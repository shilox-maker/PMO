import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Filter, Search, ChevronDown, ChevronUp, RefreshCw, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useTableColumns } from '../hooks/useTableColumns';
import ColumnSelector from '../components/ColumnSelector';
import GovernanceKpiHeader from '../components/governance/GovernanceKpiHeader';
import GovernanceCommitteesSection from '../components/governance/GovernanceCommitteesSection';
import GovernanceHealthSection from '../components/governance/GovernanceHealthSection';

const DEFAULT_GOV_COLUMNS = [
  { id: 'id_proyecto', label: 'Código', fixed: true, visible: true },
  { id: 'nombre_proyecto', label: 'Proyecto', fixed: true, visible: true },
  { id: 'pm_nombre', label: 'PM', fixed: false, visible: true },
  { id: 'indicador_rag', label: 'RAG', fixed: false, visible: true },
  { id: 'fecha_inicio', label: 'Fecha de Inicio', fixed: false, visible: true },
  { id: 'fecha_fin_inicial', label: 'Fecha Fin Base', fixed: false, visible: true },
  { id: 'fecha_fin_estimada', label: 'Fecha Fin Estimada', fixed: false, visible: true },
  { id: 'gasto_total_facturas', label: 'Gasto Facturado', fixed: false, visible: true },
  { id: 'alerta_tiempo', label: 'Alerta de Tiempo', fixed: false, visible: true },
  { id: 'alerta_dinero', label: 'Alerta de Dinero', fixed: false, visible: true },
  { id: 'proximo_hito', label: 'Próximo Hito', fixed: false, visible: true },
  { id: 'ultimo_comentario', label: 'Último Comentario', fixed: false, visible: true },
  { id: 'accion', label: 'Ficha', fixed: true, visible: true }
];

export default function GovernanceDashboard({ onViewProject, onViewVendor }) {
  const { getAuthHeaders } = useAuth();
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Column visibility
  const { columns: tableCols, visibleColumnsMap, toggleColumn, resetColumns } = useTableColumns('ppm-governance-columns', DEFAULT_GOV_COLUMNS);

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'id_proyecto', direction: 'asc' });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const renderSortHeader = (label, key, extraStyle = {}) => {
    const isSorted = sortConfig.key === key;
    return (
      <th 
        onClick={() => handleSort(key)} 
        style={{ cursor: 'pointer', userSelect: 'none', ...extraStyle }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {label}
          {isSorted ? (
            sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
          ) : (
            <ArrowUpDown size={14} style={{ opacity: 0.3 }} />
          )}
        </div>
      </th>
    );
  };

  const [exportingExcel, setExportingExcel] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const [filters, setFilters] = useState({
    pm: '',
    vendor: '',
    rag: '',
    search: '',
    fechaDesde: '2026-01-01',
    fechaHasta: '2026-12-31',
    states: []
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const [isStatesOpen, setIsStatesOpen] = useState(false);
  const [activeKpiFilter, setActiveKpiFilter] = useState(null);

  // Dropdowns lists
  const [pmsList, setPmsList] = useState([]);
  const [vendorsList, setVendorsList] = useState([]);
  const [statesList, setStatesList] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/pms`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setPmsList(data));
    fetch(`${import.meta.env.VITE_API_URL}/vendors`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setVendorsList(data));
    fetch(`${import.meta.env.VITE_API_URL}/portfolio/states`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setStatesList(data));
  }, []);

  const fetchDashboardData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.pm) params.append('pm', filters.pm);
    if (filters.vendor) params.append('vendor', filters.vendor);
    if (filters.rag) params.append('rag', filters.rag);
    if (filters.search) params.append('search', filters.search);
    if (filters.fechaDesde) params.append('fecha_desde', filters.fechaDesde);
    if (filters.fechaHasta) params.append('fecha_hasta', filters.fechaHasta);
    if (filters.states && filters.states.length > 0) params.append('state', filters.states.join(','));

    fetch(`${import.meta.env.VITE_API_URL}/portfolio/dashboard?${params.toString()}`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching governance dashboard data:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboardData();
    setActiveKpiFilter(null);
  }, [filters]);

  const handleExportExcel = () => {
    setExportingExcel(true);
    const params = new URLSearchParams();
    if (filters.pm) params.append('pm', filters.pm);
    if (filters.vendor) params.append('vendor', filters.vendor);
    if (filters.rag) params.append('rag', filters.rag);
    if (filters.search) params.append('search', filters.search);
    if (filters.states && filters.states.length > 0) params.append('state', filters.states.join(','));
    if (filters.fechaDesde) params.append('fecha_desde', filters.fechaDesde);
    if (filters.fechaHasta) params.append('fecha_hasta', filters.fechaHasta);

    const visibleKeys = tableCols.filter(c => c.visible).map(c => c.id).join(',');
    if (visibleKeys) params.append('cols', visibleKeys);

    fetch(`${import.meta.env.VITE_API_URL}/projects/export?${params.toString()}`, {
      headers: getAuthHeaders()
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al exportar a Excel');
        return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Reporte_Portfolio.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(err => {
        console.error('Error al descargar el Excel:', err);
        alert(err.message);
      })
      .finally(() => {
        setExportingExcel(false);
      });
  };

  const generatePortfolioReport = () => {
    setGeneratingReport(true);
    setTimeout(() => {
      alert('Reporte generado correctamente.');
      setGeneratingReport(false);
    }, 1000);
  };

  // Metrics
  const overrunCount = projects.filter(p => p.gasto_total_facturas > p.budget_inicial).length;
  const capexWarnCount = projects.filter(p => p.es_capex && p.gasto_total_facturas >= (p.budget_inicial * 0.90)).length;
  const coveredCount = projects.filter(p => p.com_semanal_activo || p.com_mensual_activo || p.com_steerco_activo).length;
  const coveragePercent = projects.length > 0 ? Math.round((coveredCount / projects.length) * 100) : 0;
  
  const inactiveProjects = projects.filter(p => {
    const hasPlan = p.com_semanal_activo || p.com_mensual_activo || p.com_steerco_activo;
    if (!hasPlan) return false;
    const diffMs = Date.now() - new Date(p.ultima_actualizacion).getTime();
    return (diffMs / (1000 * 60 * 60 * 24)) > 30;
  });

  const filteredGridData = projects.filter(p => {
    if (activeKpiFilter === 'overrun') {
      if (p.gasto_total_facturas <= p.budget_inicial) return false;
    }
    if (activeKpiFilter === 'capex_warn') {
      if (!p.es_capex || p.gasto_total_facturas < (p.budget_inicial * 0.90)) return false;
    }
    if (activeKpiFilter === 'inactive') {
      const hasPlan = p.com_semanal_activo || p.com_mensual_activo || p.com_steerco_activo;
      if (!hasPlan) return false;
      const diffMs = Date.now() - new Date(p.ultima_actualizacion).getTime();
      if ((diffMs / (1000 * 60 * 60 * 24)) <= 30) return false;
    }
    return true;
  });

  return (
    <div>
      {/* Filters Bar */}
      <div className="m3-card glass-panel" style={{ padding: '20px 24px', marginBottom: 24, position: 'relative', zIndex: 10, overflow: 'visible' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--md-sys-color-outline)' }}>
            <Filter size={18} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Filtros de Gobernanza:</span>
          </div>

          <div style={{ position: 'relative', flexGrow: 1, minWidth: '180px' }}>
            <input 
              type="text" 
              placeholder="Buscar por nombre..." 
              value={filters.search} 
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="m3-input"
              style={{ paddingLeft: '40px', height: '40px' }}
            />
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '11px', color: 'var(--md-sys-color-outline)' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select 
              value={filters.pm} 
              onChange={(e) => handleFilterChange('pm', e.target.value)}
              className="user-select"
              style={{ width: 'auto', minWidth: '140px', height: '40px', paddingTop: 0, paddingBottom: 0 }}
            >
              <option value="">Todos los PM</option>
              {pmsList.map(p => (
                <option key={p.id_usuario} value={p.id_usuario}>{p.nombre} {p.apellidos}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select 
              value={filters.vendor} 
              onChange={(e) => handleFilterChange('vendor', e.target.value)}
              className="user-select"
              style={{ width: 'auto', minWidth: '140px', height: '40px', paddingTop: 0, paddingBottom: 0 }}
            >
              <option value="">Todos los Partners</option>
              {vendorsList.map(v => (
                <option key={v.id_proveedor} value={v.id_proveedor}>{v.nombre_razon_social}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginLeft: 'auto' }}>
            <ColumnSelector columns={tableCols} toggleColumn={toggleColumn} resetColumns={resetColumns} />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--md-sys-color-primary)' }} />
        </div>
      ) : (
        <>
          <GovernanceKpiHeader 
            projects={projects}
            overrunCount={overrunCount}
            capexWarnCount={capexWarnCount}
            coveragePercent={coveragePercent}
            inactiveProjects={inactiveProjects}
            activeKpiFilter={activeKpiFilter}
            setActiveKpiFilter={setActiveKpiFilter}
          />

          <GovernanceCommitteesSection 
            projects={projects}
            onViewProject={onViewProject}
          />

          <GovernanceHealthSection 
            filteredGridData={filteredGridData}
            visibleColumnsMap={visibleColumnsMap}
            sortConfig={sortConfig}
            renderSortHeader={renderSortHeader}
            onViewProject={onViewProject}
            onViewVendor={onViewVendor}
            handleExportExcel={handleExportExcel}
            generatePortfolioReport={generatePortfolioReport}
            exportingExcel={exportingExcel}
            generatingReport={generatingReport}
          />
        </>
      )}
    </div>
  );
}
