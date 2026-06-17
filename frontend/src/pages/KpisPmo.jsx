import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Filter, Search, AlertOctagon, Coins, ShieldCheck, Clock, CheckCircle2,
  RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';

export default function KpisPmo() {
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
    states: []
  });

  const [isStatesOpen, setIsStatesOpen] = useState(false);
  const [selectedKpi, setSelectedKpi] = useState(null);

  const getFilteredProjects = () => {
    if (!selectedKpi) return [];
    switch(selectedKpi) {
      case 'overrun': return projects.filter(p => p.gasto_total_facturas > p.budget_inicial);
      case 'capex': return projects.filter(p => p.es_capex && p.gasto_total_facturas >= (p.budget_inicial * 0.90));
      case 'governance': return projects.filter(p => p.com_semanal_activo || p.com_mensual_activo || p.com_steerco_activo);
      case 'inactive': return projects.filter(p => {
        const hasPlan = p.com_semanal_activo || p.com_mensual_activo || p.com_steerco_activo;
        if (!hasPlan) return false;
        const diffMs = Date.now() - new Date(p.ultima_actualizacion).getTime();
        return (diffMs / (1000 * 60 * 60 * 24)) > 30;
      });
      case 'rag_verde': return projects.filter(p => p.indicador_rag === 'VERDE');
      case 'rag_amarillo': return projects.filter(p => p.indicador_rag === 'AMARILLO');
      case 'rag_rojo': return projects.filter(p => p.indicador_rag === 'ROJO');
      default: return [];
    }
  };

  // Dropdowns
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
    if (filters.estrategico) params.append('estrategico', filters.estrategico);
    if (filters.fechaDesde) params.append('fecha_desde', filters.fechaDesde);
    if (filters.fechaHasta) params.append('fecha_hasta', filters.fechaHasta);
    if (filters.states && filters.states.length > 0) params.append('state', filters.states.join(','));

    // Fetch from the governance/dashboard endpoint to get calculations and basic grouping easily
    fetch(`${import.meta.env.VITE_API_URL}/portfolio/dashboard?${params.toString()}`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        setProjects(data);
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
  
  // 1. Proyectos en Desborde
  const overrunCount = projects.filter(p => p.gasto_total_facturas > p.budget_inicial).length;
  
  // 2. Alerta Preventiva CAPEX
  const capexWarnCount = projects.filter(p => p.es_capex && p.gasto_total_facturas >= (p.budget_inicial * 0.90)).length;

  // 3. Gobernanza
  const coveredCount = projects.filter(p => p.com_semanal_activo || p.com_mensual_activo || p.com_steerco_activo).length;
  const coveragePercent = projects.length > 0 ? Math.round((coveredCount / projects.length) * 100) : 0;

  // 4. Planes Inactivos (>30 días sin actualización)
  const inactiveProjects = projects.filter(p => {
    const hasPlan = p.com_semanal_activo || p.com_mensual_activo || p.com_steerco_activo;
    if (!hasPlan) return false;
    const diffMs = Date.now() - new Date(p.ultima_actualizacion).getTime();
    return (diffMs / (1000 * 60 * 60 * 24)) > 30;
  });

  // 5. Distribución RAG
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
    const vendorName = p.Proveedor?.nombre_razon_social || 'Desconocido';
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
          {/* KPI CARDS (5) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
            
            <div 
              className="m3-card metric-card glass-panel" 
              onClick={() => setSelectedKpi(selectedKpi === 'overrun' ? null : 'overrun')}
              style={{ cursor: 'pointer', border: selectedKpi === 'overrun' ? '2px solid var(--md-sys-color-primary)' : '1px solid transparent' }}
            >
              <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(255, 69, 58, 0.2)', color: 'var(--color-rag-red)' }}>
                <AlertOctagon size={24} />
              </div>
              <div className="metric-info">
                <span className="metric-value" style={{ color: 'var(--color-rag-red)' }}>{overrunCount}</span>
                <span className="metric-label" style={{ fontWeight: 600 }}>Proyectos en Desborde</span>
              </div>
            </div>

            <div 
              className="m3-card metric-card glass-panel"
              onClick={() => setSelectedKpi(selectedKpi === 'capex' ? null : 'capex')}
              style={{ cursor: 'pointer', border: selectedKpi === 'capex' ? '2px solid var(--md-sys-color-primary)' : '1px solid transparent' }}
            >
              <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(255, 159, 10, 0.2)', color: 'var(--priority-alta)' }}>
                <Coins size={24} />
              </div>
              <div className="metric-info">
                <span className="metric-value" style={{ color: 'var(--priority-alta)' }}>{capexWarnCount}</span>
                <span className="metric-label" style={{ fontWeight: 600 }}>Alerta CAPEX</span>
              </div>
            </div>

            <div 
              className="m3-card metric-card glass-panel"
              onClick={() => setSelectedKpi(selectedKpi === 'governance' ? null : 'governance')}
              style={{ cursor: 'pointer', border: selectedKpi === 'governance' ? '2px solid var(--md-sys-color-primary)' : '1px solid transparent' }}
            >
              <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(168, 199, 250, 0.2)', color: 'var(--md-sys-color-primary)' }}>
                <ShieldCheck size={24} />
              </div>
              <div className="metric-info">
                <span className="metric-value" style={{ color: 'var(--md-sys-color-primary)' }}>{coveragePercent}%</span>
                <span className="metric-label" style={{ fontWeight: 600 }}>Gobernanza Activa</span>
              </div>
            </div>

            <div 
              className="m3-card metric-card glass-panel"
              onClick={() => setSelectedKpi(selectedKpi === 'inactive' ? null : 'inactive')}
              style={{ cursor: 'pointer', border: selectedKpi === 'inactive' ? '2px solid var(--md-sys-color-primary)' : '1px solid transparent' }}
            >
              <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(255, 159, 10, 0.2)', color: 'var(--priority-alta)' }}>
                <Clock size={24} />
              </div>
              <div className="metric-info">
                <span className="metric-value" style={{ color: 'var(--priority-alta)' }}>{inactiveProjects.length}</span>
                <span className="metric-label" style={{ fontWeight: 600 }}>Planes Inactivos</span>
              </div>
            </div>

            <div className="m3-card metric-card glass-panel" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                <div 
                  style={{ flex: 1, textAlign: 'center', cursor: 'pointer', borderRadius: 8, padding: 4, backgroundColor: selectedKpi === 'rag_verde' ? 'rgba(52, 199, 89, 0.1)' : 'transparent' }}
                  onClick={() => setSelectedKpi(selectedKpi === 'rag_verde' ? null : 'rag_verde')}
                >
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-rag-green)' }}>{ragVerde}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>🟢 Verdes</div>
                </div>
                <div style={{ width: 1, backgroundColor: 'var(--md-sys-color-outline-variant)' }}></div>
                <div 
                  style={{ flex: 1, textAlign: 'center', cursor: 'pointer', borderRadius: 8, padding: 4, backgroundColor: selectedKpi === 'rag_amarillo' ? 'rgba(255, 159, 10, 0.1)' : 'transparent' }}
                  onClick={() => setSelectedKpi(selectedKpi === 'rag_amarillo' ? null : 'rag_amarillo')}
                >
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-rag-yellow)' }}>{ragAmarillo}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>🟡 Amar.</div>
                </div>
                <div style={{ width: 1, backgroundColor: 'var(--md-sys-color-outline-variant)' }}></div>
                <div 
                  style={{ flex: 1, textAlign: 'center', cursor: 'pointer', borderRadius: 8, padding: 4, backgroundColor: selectedKpi === 'rag_rojo' ? 'rgba(255, 69, 58, 0.1)' : 'transparent' }}
                  onClick={() => setSelectedKpi(selectedKpi === 'rag_rojo' ? null : 'rag_rojo')}
                >
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-rag-red)' }}>{ragRojo}</div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>🔴 Rojos</div>
                </div>
              </div>
              <div style={{ marginTop: 8, textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--md-sys-color-outline)' }}>
                Distribución RAG
              </div>
            </div>
          </div>

          {/* CHARTS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            
            {/* Chart 1 */}
            <div className="m3-card glass-panel" style={{ padding: 24, height: 400 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>Proyectos por Fase / Estado</h3>
              {dataStatus.length === 0 ? <p style={{ color: '#999' }}>Sin datos</p> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dataStatus} innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                      {dataStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip />
                    <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '0.8rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Chart 2 */}
            <div className="m3-card glass-panel" style={{ padding: 24, height: 400 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>Salud Financiera</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dataFinances} innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                    {dataFinances.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip formatter={(value) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)} />
                  <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '0.8rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 3 */}
            <div className="m3-card glass-panel" style={{ padding: 24, height: 400 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>Proyectos por PM</h3>
              {dataPM.length === 0 ? <p style={{ color: '#999' }}>Sin datos</p> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataPM} layout="vertical" margin={{ left: 50, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                    <RechartsTooltip />
                    <Bar dataKey="proyectos" fill="var(--md-sys-color-primary)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Chart 4 */}
            <div className="m3-card glass-panel" style={{ padding: 24, height: 400 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 16 }}>Carga de Trabajo por Partner</h3>
              {dataVendor.length === 0 ? <p style={{ color: '#999' }}>Sin datos</p> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataVendor}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-25} textAnchor="end" height={60} />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="proyectos" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

          </div>

          {selectedKpi && (
            <div className="m3-card glass-panel" style={{ marginTop: 24, padding: 24 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 16 }}>Proyectos Seleccionados</h3>
              <div className="m3-table-wrapper">
                <table className="m3-table">
                  <thead>
                    <tr>
                      <th style={{ width: '80px', textAlign: 'center' }}>ID</th>
                      <th>Nombre de Proyecto</th>
                      <th>Estado</th>
                      <th>Project Manager</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>RAG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredProjects().map(p => (
                      <tr key={p.id_proyecto}>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{p.id_proyecto}</td>
                        <td style={{ fontWeight: 600 }}>{p.nombre_proyecto}</td>
                        <td>{p.estado_proyecto}</td>
                        <td>{p.pm_nombre || 'Sin Asignar'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge badge-${p.indicador_rag === 'VERDE' ? 'green' : p.indicador_rag === 'AMARILLO' ? 'yellow' : 'red'}`} style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
                            {p.indicador_rag}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {getFilteredProjects().length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--md-sys-color-outline)' }}>
                          No hay proyectos que cumplan con este KPI.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
