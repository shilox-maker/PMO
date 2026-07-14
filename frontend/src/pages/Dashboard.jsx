import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Filter, Search, AlertOctagon, Coins, ShieldCheck, ShieldAlert, Clock, CheckCircle2,
  RefreshCw, ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react';
import { 
  Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';
import ProjectTable from '../components/ProjectTable';

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
      } else if (type === 'pm') {
        res = res.filter(p => (p.pm_nombre || 'Sin Asignar') === value);
      } else if (type === 'partner') {
        res = res.filter(p => (p.prov_nombre || p.Proveedor?.nombre_razon_social || 'Desconocido') === value);
      } else if (type === 'finanzas') {
        if (value === 'Gastado') {
          res = res.filter(p => (p.gasto_total_facturas || 0) > 0);
        } else if (value === 'Disponible') {
          res = res.filter(p => (p.budget_inicial || 0) > (p.gasto_total_facturas || 0));
        }
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

    // Fetch from the governance/dashboard endpoint to get calculations and basic grouping easily
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

  // ==========================================
  // METRIC COMPUTATIONS
  // ==========================================
  
  // 1. Proyectos en Desborde Coste (CAPEX)
  const overrunCount = projects.filter(p => p.gasto_total_facturas > p.budget_inicial).length;
  
  // 2. Proyectos en Desborde Coste Ampliado (CAPEX + Cambios de Alcance Aprobados)
  const overrunExtendedCount = projects.filter(p => p.gasto_total_facturas > (p.calculations?.budget_actualizado || p.budget_inicial)).length;

  // 3. Proyectos Retrasados Parcialmente (Hitos)
  const delayedPartialCount = projects.filter(p => p.has_hito_vencido).length;

  // 4. Proyectos Retrasados Fecha Base
  const todayStr = new Date().toISOString().split('T')[0];
  const delayedBaseCount = projects.filter(p => {
    const isClosed = ['CERRADO', 'CANCELADO', 'FINALIZADO', 'COMPLETADO', 'PARKING'].includes(p.estado_proyecto?.toUpperCase());
    return !isClosed && p.fecha_fin_inicial && p.fecha_fin_inicial < todayStr;
  }).length;

  // 5. Proyectos Retrasados Fecha Ampliada
  const delayedExtendedCount = projects.filter(p => {
    const isClosed = ['CERRADO', 'CANCELADO', 'FINALIZADO', 'COMPLETADO', 'PARKING'].includes(p.estado_proyecto?.toUpperCase());
    return !isClosed && p.fecha_fin_estimada && p.fecha_fin_estimada < todayStr;
  }).length;

  // 6. Gobernanza (Proyectos sin Gobernanza)
  const nonGovernedCount = projects.filter(p => !p.com_semanal_activo && !p.com_mensual_activo && !p.com_steerco_activo).length;

  // 7. Proyectos Inactivos (>30 días sin actualización)
  const inactiveCount = projects.filter(p => {
    const diffMs = Date.now() - new Date(p.ultima_actualizacion).getTime();
    return (diffMs / (1000 * 60 * 60 * 24)) > 30;
  }).length;

  // 8. Distribución RAG
  const ragVerde = projects.filter(p => p.indicador_rag === 'VERDE').length;
  const ragAmarillo = projects.filter(p => p.indicador_rag === 'AMARILLO').length;
  const ragRojo = projects.filter(p => p.indicador_rag === 'ROJO').length;

  // ==========================================
  // CHART DATA PREPARATION
  // ==========================================
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658', '#8dd1e1', '#a4de6c'];

  // 1. Proyectos por Estado (Anillo)
  const stateCounts = {};
  projects.forEach(p => {
    stateCounts[p.estado_proyecto] = (stateCounts[p.estado_proyecto] || 0) + 1;
  });
  const dataStatus = Object.keys(stateCounts).map(key => ({ name: key, value: stateCounts[key] })).sort((a,b) => b.value - a.value);

  // 2. Proyectos por PM (Barras)
  const pmCounts = {};
  projects.forEach(p => {
    const pmName = p.pm_nombre || 'Sin Asignar';
    pmCounts[pmName] = (pmCounts[pmName] || 0) + 1;
  });
  const dataPM = Object.keys(pmCounts).map(key => ({ name: key, proyectos: pmCounts[key] })).sort((a,b) => b.proyectos - a.proyectos).slice(0, 10);

  // 3. Salud Financiera (Suma de Budget vs Suma Real) (Anillo)
  const totalBudget = projects.reduce((acc, p) => acc + (p.budget_inicial || 0), 0);
  const totalSpent = projects.reduce((acc, p) => acc + (p.gasto_total_facturas || 0), 0);
  const dataFinances = [
    { name: 'Gastado', value: totalSpent, color: '#FF8042' },
    { name: 'Disponible', value: Math.max(0, totalBudget - totalSpent), color: '#00C49F' }
  ];

  // 4. Carga por Proveedor (Barras)
  const vendorCounts = {};
  projects.forEach(p => {
    const vendorName = p.prov_nombre || p.Proveedor?.nombre_razon_social || 'Desconocido';
    vendorCounts[vendorName] = (vendorCounts[vendorName] || 0) + 1;
  });
  const dataVendor = Object.keys(vendorCounts).map(key => ({ name: key, proyectos: vendorCounts[key] })).sort((a,b) => b.proyectos - a.proyectos).slice(0, 10);


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

          {/* Portfolio Filter */}
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

          {/* Tag Filter */}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: 8, marginBottom: 24 }}>
            
            <div 
              className="m3-card metric-card glass-panel" 
              onClick={() => setSelectedKpi(selectedKpi === 'overrun' ? null : 'overrun')}
              style={{ 
                cursor: 'pointer', 
                border: selectedKpi === 'overrun' ? '2px solid var(--md-sys-color-primary)' : '1px solid transparent',
                padding: '10px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minWidth: 0
              }}
              title="Suma de facturas recibidas y pendientes de recibir es mayor que el CAPEX inicial aprobado"
            >
              <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(255, 69, 58, 0.2)', color: 'var(--color-rag-red)', width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}>
                <AlertOctagon size={16} />
              </div>
              <div className="metric-info" style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <span className="metric-value" style={{ color: 'var(--color-rag-red)', fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.1 }}>{overrunCount}</span>
                <span className="metric-label" style={{ fontWeight: 600, fontSize: '0.65rem', lineHeight: 1.1, whiteSpace: 'normal', color: 'var(--md-sys-color-outline)' }}>Exc. coste (CAPEX)</span>
              </div>
            </div>

            <div 
              className="m3-card metric-card glass-panel" 
              onClick={() => setSelectedKpi(selectedKpi === 'overrun_extended' ? null : 'overrun_extended')}
              style={{ 
                cursor: 'pointer', 
                border: selectedKpi === 'overrun_extended' ? '2px solid var(--md-sys-color-primary)' : '1px solid transparent',
                padding: '10px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minWidth: 0
              }}
              title="Suma de facturas recibidas y pendientes de recibir es mayor que el CAPEX inicial más los cambios de alcance aprobados"
            >
              <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(255, 159, 10, 0.2)', color: 'var(--priority-alta)', width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}>
                <Coins size={16} />
              </div>
              <div className="metric-info" style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <span className="metric-value" style={{ color: 'var(--priority-alta)', fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.1 }}>{overrunExtendedCount}</span>
                <span className="metric-label" style={{ fontWeight: 600, fontSize: '0.65rem', lineHeight: 1.1, whiteSpace: 'normal', color: 'var(--md-sys-color-outline)' }}>Exc. coste ampliado</span>
              </div>
            </div>

            <div 
              className="m3-card metric-card glass-panel" 
              onClick={() => setSelectedKpi(selectedKpi === 'delayed_partial' ? null : 'delayed_partial')}
              style={{ 
                cursor: 'pointer', 
                border: selectedKpi === 'delayed_partial' ? '2px solid var(--md-sys-color-primary)' : '1px solid transparent',
                padding: '10px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minWidth: 0
              }}
              title="Proyectos no cerrados con al menos un hito (fecha de control) pendiente y cuya fecha límite ha expirado"
            >
              <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(255, 159, 10, 0.2)', color: 'var(--priority-alta)', width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}>
                <Clock size={16} />
              </div>
              <div className="metric-info" style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <span className="metric-value" style={{ color: 'var(--priority-alta)', fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.1 }}>{delayedPartialCount}</span>
                <span className="metric-label" style={{ fontWeight: 600, fontSize: '0.65rem', lineHeight: 1.1, whiteSpace: 'normal', color: 'var(--md-sys-color-outline)' }}>Retrasados (Hitos)</span>
              </div>
            </div>

            <div 
              className="m3-card metric-card glass-panel" 
              onClick={() => setSelectedKpi(selectedKpi === 'delayed_base' ? null : 'delayed_base')}
              style={{ 
                cursor: 'pointer', 
                border: selectedKpi === 'delayed_base' ? '2px solid var(--md-sys-color-primary)' : '1px solid transparent',
                padding: '10px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minWidth: 0
              }}
              title="Proyectos no cerrados cuya fecha fin original planificada (Base) es anterior a hoy"
            >
              <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(255, 69, 58, 0.2)', color: 'var(--color-rag-red)', width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}>
                <AlertTriangle size={16} />
              </div>
              <div className="metric-info" style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <span className="metric-value" style={{ color: 'var(--color-rag-red)', fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.1 }}>{delayedBaseCount}</span>
                <span className="metric-label" style={{ fontWeight: 600, fontSize: '0.65rem', lineHeight: 1.1, whiteSpace: 'normal', color: 'var(--md-sys-color-outline)' }}>Retrasados (Base)</span>
              </div>
            </div>

            <div 
              className="m3-card metric-card glass-panel" 
              onClick={() => setSelectedKpi(selectedKpi === 'delayed_extended' ? null : 'delayed_extended')}
              style={{ 
                cursor: 'pointer', 
                border: selectedKpi === 'delayed_extended' ? '2px solid var(--md-sys-color-primary)' : '1px solid transparent',
                padding: '10px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minWidth: 0
              }}
              title="Proyectos no cerrados cuya fecha fin estimada (Fecha Fin Base + días aprobados en cambios de alcance) es anterior a hoy"
            >
              <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(255, 69, 58, 0.2)', color: 'var(--color-rag-red)', width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}>
                <AlertTriangle size={16} />
              </div>
              <div className="metric-info" style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <span className="metric-value" style={{ color: 'var(--color-rag-red)', fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.1 }}>{delayedExtendedCount}</span>
                <span className="metric-label" style={{ fontWeight: 600, fontSize: '0.65rem', lineHeight: 1.1, whiteSpace: 'normal', color: 'var(--md-sys-color-outline)' }}>Retrasados (Ampliada)</span>
              </div>
            </div>

            <div 
              className="m3-card metric-card glass-panel"
              onClick={() => setSelectedKpi(selectedKpi === 'governance' ? null : 'governance')}
              style={{ 
                cursor: 'pointer', 
                border: selectedKpi === 'governance' ? '2px solid var(--md-sys-color-primary)' : '1px solid transparent',
                padding: '10px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minWidth: 0
              }}
              title="Proyectos que no tienen ningún plan de comunicación activo (semanal, mensual ni steer co)"
            >
              <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(255, 69, 58, 0.2)', color: 'var(--color-rag-red)', width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}>
                <ShieldAlert size={16} />
              </div>
              <div className="metric-info" style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <span className="metric-value" style={{ color: 'var(--color-rag-red)', fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.1 }}>{nonGovernedCount}</span>
                <span className="metric-label" style={{ fontWeight: 600, fontSize: '0.65rem', lineHeight: 1.1, whiteSpace: 'normal', color: 'var(--md-sys-color-outline)' }}>Sin Gobernanza</span>
              </div>
            </div>

            <div 
              className="m3-card metric-card glass-panel"
              onClick={() => setSelectedKpi(selectedKpi === 'inactive' ? null : 'inactive')}
              style={{ 
                cursor: 'pointer', 
                border: selectedKpi === 'inactive' ? '2px solid var(--md-sys-color-primary)' : '1px solid transparent',
                padding: '10px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minWidth: 0
              }}
              title="Proyectos que no han registrado modificaciones en su ficha, tareas, facturas, riesgos ni cambios de alcance en los últimos 30 días"
            >
              <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(255, 159, 10, 0.2)', color: 'var(--priority-alta)', width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}>
                <Clock size={16} />
              </div>
              <div className="metric-info" style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <span className="metric-value" style={{ color: 'var(--priority-alta)', fontSize: '1.15rem', fontWeight: 800, lineHeight: 1.1 }}>{inactiveCount}</span>
                <span className="metric-label" style={{ fontWeight: 600, fontSize: '0.65rem', lineHeight: 1.1, whiteSpace: 'normal', color: 'var(--md-sys-color-outline)' }}>Proyectos Inactivos</span>
              </div>
            </div>

            <div 
              className="m3-card metric-card glass-panel" 
              style={{ padding: '10px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}
              title="Distribución de proyectos según su semáforo de estado de salud actual (Verde, Amarillo, Rojo)"
            >
              <div style={{ display: 'flex', gap: 6, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <div 
                  style={{ flex: 1, textAlign: 'center', cursor: 'pointer', borderRadius: 8, padding: '4px 2px', backgroundColor: selectedKpi === 'rag_verde' ? 'rgba(52, 199, 89, 0.15)' : 'transparent' }}
                  onClick={() => setSelectedKpi(selectedKpi === 'rag_verde' ? null : 'rag_verde')}
                >
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-rag-green)', lineHeight: 1 }}>{ragVerde}</div>
                </div>
                <div style={{ width: 1, height: '16px', backgroundColor: 'var(--md-sys-color-outline-variant)' }}></div>
                <div 
                  style={{ flex: 1, textAlign: 'center', cursor: 'pointer', borderRadius: 8, padding: '4px 2px', backgroundColor: selectedKpi === 'rag_amarillo' ? 'rgba(255, 159, 10, 0.15)' : 'transparent' }}
                  onClick={() => setSelectedKpi(selectedKpi === 'rag_amarillo' ? null : 'rag_amarillo')}
                >
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-rag-yellow)', lineHeight: 1 }}>{ragAmarillo}</div>
                </div>
                <div style={{ width: 1, height: '16px', backgroundColor: 'var(--md-sys-color-outline-variant)' }}></div>
                <div 
                  style={{ flex: 1, textAlign: 'center', cursor: 'pointer', borderRadius: 8, padding: '4px 2px', backgroundColor: selectedKpi === 'rag_rojo' ? 'rgba(255, 69, 58, 0.15)' : 'transparent' }}
                  onClick={() => setSelectedKpi(selectedKpi === 'rag_rojo' ? null : 'rag_rojo')}
                >
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-rag-red)', lineHeight: 1 }}>{ragRojo}</div>
                </div>
              </div>
            </div>
          </div>
              {/* CHARTS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, marginBottom: 24 }}>
            
            {/* Chart 1 */}
            <div className="m3-card glass-panel" style={{ padding: 24 }}>
              <div 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setIsChartOpen(!isChartOpen)}
              >
                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Proyectos por Fase / Estado</h3>
                <div style={{ color: 'var(--md-sys-color-outline)' }}>
                  {isChartOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
              
              {isChartOpen && (
                <div style={{ height: 350, marginTop: 16 }}>
                  {dataStatus.length === 0 ? <p style={{ color: '#999' }}>Sin datos</p> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dataStatus} margin={{ bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" interval={0} height={50} />
                        <YAxis allowDecimals={false} />
                        <RechartsTooltip />
                        <Bar 
                          dataKey="value" 
                          fill="var(--md-sys-color-primary)" 
                          radius={[4, 4, 0, 0]}
                          onClick={(data) => {
                            if (data && data.name) {
                              setSelectedChartFilter(prev => 
                                prev && prev.type === 'estado' && prev.value === data.name ? null : { type: 'estado', value: data.name }
                              );
                            }
                          }}
                        >
                          {dataStatus.map((entry, index) => {
                            const isSelected = selectedChartFilter && selectedChartFilter.type === 'estado' && selectedChartFilter.value === entry.name;
                            return (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={isSelected ? 'var(--md-sys-color-primary-container)' : COLORS[index % COLORS.length]} 
                                stroke={isSelected ? 'var(--md-sys-color-primary)' : 'none'}
                                strokeWidth={isSelected ? 2 : 0}
                              />
                            );
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="m3-card glass-panel" style={{ marginTop: 24, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0 }}>
                Proyectos ({getFilteredProjects().length})
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
            
            {getFilteredProjects().length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--md-sys-color-outline)' }}>
                No hay proyectos que cumplan con los filtros seleccionados.
              </div>
            ) : (
              <ProjectTable 
                projects={getFilteredProjects()} 
                onViewProject={onViewProject} 
                onViewVendor={onViewVendor} 
                showHeaderSelector={true} 
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
