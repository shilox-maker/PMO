import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Filter, Search, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import DashboardKpiGrid from '../components/dashboard/DashboardKpiGrid';
import DashboardChartsSection from '../components/dashboard/DashboardChartsSection';
import DashboardSummaryTable from '../components/dashboard/DashboardSummaryTable';

export default function Dashboard({ onViewProject, onViewVendor }) {
  const { getAuthHeaders } = useAuth();
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    pm: '',
    vendor: '',
    rag: '',
    search: '',
    estrategico: '',
    fechaDesde: '2026-01-01',
    fechaHasta: '2026-12-31',
    states: [],
    portfolio: '',
    tag: ''
  });

  const [isStatesOpen, setIsStatesOpen] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState(null);
  const [selectedChartFilter, setSelectedChartFilter] = useState(null);
  const [isChartOpen, setIsChartOpen] = useState(true);

  const getFilteredProjects = () => {
    let res = [...projects];
    const todayStr = new Date().toISOString().split('T')[0];
    if (selectedKpi) {
      switch(selectedKpi) {
        case 'overrun': 
          res = res.filter(p => p.gasto_total_facturas > p.budget_inicial);
          break;
        case 'overrun_extended': 
          res = res.filter(p => p.gasto_total_facturas > (p.calculations?.budget_actualizado || p.budget_inicial));
          break;
        case 'delayed_partial': 
          res = res.filter(p => p.has_hito_vencido);
          break;
        case 'delayed_base': 
          res = res.filter(p => {
            const isClosed = ['CERRADO', 'CANCELADO', 'FINALIZADO', 'COMPLETADO', 'PARKING'].includes(p.estado_proyecto?.toUpperCase());
            return !isClosed && p.fecha_fin_inicial && p.fecha_fin_inicial < todayStr;
          });
          break;
        case 'delayed_extended': 
          res = res.filter(p => {
            const isClosed = ['CERRADO', 'CANCELADO', 'FINALIZADO', 'COMPLETADO', 'PARKING'].includes(p.estado_proyecto?.toUpperCase());
            return !isClosed && p.fecha_fin_estimada && p.fecha_fin_estimada < todayStr;
          });
          break;
        case 'governance': 
          res = res.filter(p => !p.com_semanal_activo && !p.com_mensual_activo && !p.com_steerco_activo);
          break;
        case 'inactive': 
          res = res.filter(p => {
            const diffMs = Date.now() - new Date(p.ultima_actualizacion).getTime();
            return (diffMs / (1000 * 60 * 60 * 24)) > 30;
          });
          break;
        case 'rag_verde': 
          res = res.filter(p => p.indicador_rag === 'VERDE');
          break;
        case 'rag_amarillo': 
          res = res.filter(p => p.indicador_rag === 'AMARILLO');
          break;
        case 'rag_rojo': 
          res = res.filter(p => p.indicador_rag === 'ROJO');
          break;
        default: 
          break;
      }
    }
    if (selectedChartFilter) {
      const { type, value } = selectedChartFilter;
      if (type === 'estado') {
        res = res.filter(p => p.estado_proyecto === value);
      }
    }
    return res;
  };

  // Dropdowns
  const [pmsList, setPmsList] = useState([]);
  const [vendorsList, setVendorsList] = useState([]);
  const [statesList, setStatesList] = useState([]);
  const [portfoliosList, setPortfoliosList] = useState([]);
  const [tagsList, setTagsList] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/pms`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setPmsList(data));
    fetch(`${import.meta.env.VITE_API_URL}/vendors`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setVendorsList(data));
    fetch(`${import.meta.env.VITE_API_URL}/portfolio/states`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setStatesList(data));
    fetch(`${import.meta.env.VITE_API_URL}/portfolios`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setPortfoliosList(data));
    fetch(`${import.meta.env.VITE_API_URL}/tags`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setTagsList(data));
  }, []);

  const fetchDashboardData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.pm) params.append('pm', filters.pm);
    if (filters.vendor) params.append('vendor', filters.vendor);
    if (filters.rag) params.append('rag', filters.rag);
    if (filters.search) params.append('search', filters.search);
    if (filters.estrategico) params.append('estrategico', filters.estrategico);
    if (filters.fechaDesde) params.append('fecha_desde', filters.fechaDesde);
    if (filters.fechaHasta) params.append('fecha_hasta', filters.fechaHasta);
    if (filters.states && filters.states.length > 0) params.append('state', filters.states.join(','));
    if (filters.portfolio) params.append('portfolio', filters.portfolio);
    if (filters.tag) params.append('tag', filters.tag);

    fetch(`${import.meta.env.VITE_API_URL}/portfolio/dashboard?${params.toString()}`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        setProjects(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching KPIs data:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Metric Computations
  const overrunCount = projects.filter(p => p.gasto_total_facturas > p.budget_inicial).length;
  const overrunExtendedCount = projects.filter(p => p.gasto_total_facturas > (p.calculations?.budget_actualizado || p.budget_inicial)).length;
  const delayedPartialCount = projects.filter(p => p.has_hito_vencido).length;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const delayedBaseCount = projects.filter(p => {
    const isClosed = ['CERRADO', 'CANCELADO', 'FINALIZADO', 'COMPLETADO', 'PARKING'].includes(p.estado_proyecto?.toUpperCase());
    return !isClosed && p.fecha_fin_inicial && p.fecha_fin_inicial < todayStr;
  }).length;

  const delayedExtendedCount = projects.filter(p => {
    const isClosed = ['CERRADO', 'CANCELADO', 'FINALIZADO', 'COMPLETADO', 'PARKING'].includes(p.estado_proyecto?.toUpperCase());
    return !isClosed && p.fecha_fin_estimada && p.fecha_fin_estimada < todayStr;
  }).length;

  const nonGovernedCount = projects.filter(p => !p.com_semanal_activo && !p.com_mensual_activo && !p.com_steerco_activo).length;

  const inactiveCount = projects.filter(p => {
    const diffMs = Date.now() - new Date(p.ultima_actualizacion).getTime();
    return (diffMs / (1000 * 60 * 60 * 24)) > 30;
  }).length;

  const ragVerde = projects.filter(p => p.indicador_rag === 'VERDE').length;
  const ragAmarillo = projects.filter(p => p.indicador_rag === 'AMARILLO').length;
  const ragRojo = projects.filter(p => p.indicador_rag === 'ROJO').length;

  // Chart data
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658', '#8dd1e1', '#a4de6c'];

  const stateCounts = {};
  projects.forEach(p => {
    stateCounts[p.estado_proyecto] = (stateCounts[p.estado_proyecto] || 0) + 1;
  });
  const dataStatus = Object.keys(stateCounts).map(key => ({ name: key, value: stateCounts[key] })).sort((a,b) => b.value - a.value);

  return (
    <div>
      {/* Filters Bar */}
      <div className="m3-card glass-panel" style={{ padding: '20px 24px', marginBottom: 24, position: 'relative', zIndex: 10, overflow: 'visible' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--md-sys-color-outline)' }}>
            <Filter size={18} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Filtros Maestros:</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)', fontWeight: 500 }}>Desde:</span>
            <input 
              type="date" 
              value={filters.fechaDesde} 
              onChange={(e) => handleFilterChange('fechaDesde', e.target.value)}
              className="m3-input"
              style={{ width: '150px', height: '40px', padding: '0 12px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)', fontWeight: 500 }}>Hasta:</span>
            <input 
              type="date" 
              value={filters.fechaHasta} 
              onChange={(e) => handleFilterChange('fechaHasta', e.target.value)}
              className="m3-input"
              style={{ width: '150px', height: '40px', padding: '0 12px' }}
            />
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select 
              value={filters.estrategico} 
              onChange={(e) => handleFilterChange('estrategico', e.target.value)}
              className="user-select"
              style={{ width: 'auto', minWidth: '130px', height: '40px', paddingTop: 0, paddingBottom: 0 }}
            >
              <option value="">¿Estratégico?</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select 
              value={filters.portfolio} 
              onChange={(e) => handleFilterChange('portfolio', e.target.value)}
              className="user-select"
              style={{ width: 'auto', minWidth: '150px', height: '40px', paddingTop: 0, paddingBottom: 0 }}
            >
              <option value="">Todos los Portfolios</option>
              {portfoliosList.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select 
              value={filters.tag} 
              onChange={(e) => handleFilterChange('tag', e.target.value)}
              className="user-select"
              style={{ width: 'auto', minWidth: '130px', height: '40px', paddingTop: 0, paddingBottom: 0 }}
            >
              <option value="">Todos los Tags</option>
              {tagsList.map(t => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', margin: '16px 0' }}></div>

        {/* State Filters */}
        <div>
          <div 
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setIsStatesOpen(!isStatesOpen)}
          >
            <h4 style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Filtro por Estados
            </h4>
            {isStatesOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
          
          {isStatesOpen && (
            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="m3-btn m3-btn-tonal" style={{ borderRadius: 20, padding: '4px 12px' }} onClick={() => handleFilterChange('states', [])}>Limpiar</button>
              <button 
                className="m3-btn" 
                style={{ borderRadius: 20, padding: '4px 12px', backgroundColor: 'var(--md-sys-color-primary)', color: '#fff', border: 'none', cursor: 'pointer' }} 
                onClick={() => {
                  const openStates = statesList
                    .map(s => s.nombre_estado)
                    .filter(st => !['CERRADO', 'CANCELADO', 'FINALIZADO', 'COMPLETADO', 'PARKING'].includes(st.toUpperCase()));
                  handleFilterChange('states', openStates);
                }}
              >
                Abiertos
              </button>
              {statesList.map(state => {
                const st = state.nombre_estado;
                const isSelected = filters.states.includes(st);
                return (
                  <button 
                    key={state.id_estado}
                    onClick={() => {
                      const newStates = isSelected ? filters.states.filter(x => x !== st) : [...filters.states, st];
                      handleFilterChange('states', newStates);
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: isSelected ? 'var(--md-sys-color-primary)' : 'transparent',
                      color: isSelected ? '#fff' : 'var(--md-sys-color-on-surface)',
                      border: '1px solid var(--md-sys-color-primary)',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    {state.icono} {st}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--md-sys-color-primary)' }} />
        </div>
      ) : (
        <>
          {/* KPI CARDS (8) */}
          <DashboardKpiGrid 
            overrunCount={overrunCount}
            overrunExtendedCount={overrunExtendedCount}
            delayedPartialCount={delayedPartialCount}
            delayedBaseCount={delayedBaseCount}
            delayedExtendedCount={delayedExtendedCount}
            nonGovernedCount={nonGovernedCount}
            inactiveCount={inactiveCount}
            ragVerde={ragVerde}
            ragAmarillo={ragAmarillo}
            ragRojo={ragRojo}
            selectedKpi={selectedKpi}
            setSelectedKpi={setSelectedKpi}
          />

          {/* CHARTS */}
          <DashboardChartsSection 
            isChartOpen={isChartOpen}
            setIsChartOpen={setIsChartOpen}
            dataStatus={dataStatus}
            selectedChartFilter={selectedChartFilter}
            setSelectedChartFilter={setSelectedChartFilter}
            COLORS={COLORS}
          />

          {/* TABLE */}
          <DashboardSummaryTable 
            filteredProjects={getFilteredProjects()}
            selectedKpi={selectedKpi}
            setSelectedKpi={setSelectedKpi}
            selectedChartFilter={selectedChartFilter}
            setSelectedChartFilter={setSelectedChartFilter}
            onViewProject={onViewProject}
            onViewVendor={onViewVendor}
          />
        </>
      )}
    </div>
  );
}
