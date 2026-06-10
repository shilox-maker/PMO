import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  AlertOctagon, Coins, ShieldCheck, Clock, Eye, 
  Filter, Calendar, User, RefreshCw, AlertTriangle
} from 'lucide-react';

export default function GovernanceDashboard({ onViewProject, onViewVendor }) {
  const { getAuthHeaders } = useAuth();
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Maestro Filters
  const [filterPm, setFilterPm] = useState('');
  const [fechaDesde, setFechaDesde] = useState('2026-01-01');
  const [fechaHasta, setFechaHasta] = useState('2026-12-31');

  // Secondary/Drilldown Filters
  const [activeKpiFilter, setActiveKpiFilter] = useState(null); // 'overrun', 'capex_warn', or null
  const [activeStateFilter, setActiveStateFilter] = useState(null); // 'Kickoff', 'Desarrollo', etc., or null

  // Dropdowns lists
  const [pmsList, setPmsList] = useState([]);
  const [statesList, setStatesList] = useState([]);

  useEffect(() => {
    // Fetch PMs list
    fetch('http://localhost:5000/api/pms')
      .then(res => res.json())
      .then(data => setPmsList(data))
      .catch(err => console.error(err));

    // Fetch States list
    fetch('http://localhost:5000/api/portfolio/states')
      .then(res => res.json())
      .then(data => setStatesList(data))
      .catch(err => console.error(err));
  }, []);

  const fetchDashboardData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterPm) params.append('pm', filterPm);
    if (fechaDesde) params.append('fecha_desde', fechaDesde);
    if (fechaHasta) params.append('fecha_hasta', fechaHasta);

    fetch(`http://localhost:5000/api/portfolio/dashboard?${params.toString()}`)
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

  // Re-fetch when Maestro filters change
  useEffect(() => {
    fetchDashboardData();
    // Reset secondary filters on maestro filter change
    setActiveKpiFilter(null);
    setActiveStateFilter(null);
  }, [filterPm, fechaDesde, fechaHasta]);

  // ==========================================
  // METRIC COMPUTATIONS (AFFECTED BY MAESTRO FILTERS)
  // ==========================================
  
  // KPI 1: Overrun count
  const overrunCount = projects.filter(p => p.gasto_total_facturas > p.budget_inicial).length;
  
  // KPI 2: CAPEX warning count
  const capexWarnCount = projects.filter(p => p.es_capex && p.gasto_total_facturas >= (p.budget_inicial * 0.90)).length;

  // Breakdown by State count
  const getStateCount = (stateName) => {
    return projects.filter(p => p.estado_proyecto === stateName).length;
  };

  // Governance Compliance
  const coveredCount = projects.filter(p => p.com_semanal_activo || p.com_mensual_activo || p.com_steerco_activo).length;
  const coveragePercent = projects.length > 0 ? Math.round((coveredCount / projects.length) * 100) : 0;

  // Inactivity Warnings (> 30 days and has plans)
  const inactiveProjects = projects.filter(p => {
    const hasPlan = p.com_semanal_activo || p.com_mensual_activo || p.com_steerco_activo;
    if (!hasPlan) return false;
    const diffMs = Date.now() - new Date(p.ultima_actualizacion).getTime();
    return (diffMs / (1000 * 60 * 60 * 24)) > 30;
  });

  // ==========================================
  // SECONDARY DRILLDOWN FILTERING
  // ==========================================
  const filteredGridData = projects.filter(p => {
    // Apply KPI filter
    if (activeKpiFilter === 'overrun') {
      if (p.gasto_total_facturas <= p.budget_inicial) return false;
    }
    if (activeKpiFilter === 'capex_warn') {
      if (!p.es_capex || p.gasto_total_facturas < (p.budget_inicial * 0.90)) return false;
    }
    
    // Apply State filter
    if (activeStateFilter) {
      if (p.estado_proyecto !== activeStateFilter) return false;
    }

    return true;
  });

  const getProgressColor = (percent) => {
    if (percent > 90) return 'var(--color-rag-red)';
    if (percent > 75) return 'var(--color-rag-yellow)';
    return 'var(--md-sys-color-primary)';
  };

  return (
    <div>
      {/* Combined Master Filters & State Segmentation Panel */}
      <div className="m3-card glass-panel" style={{ padding: '20px 24px', marginBottom: 24 }}>
        {/* Row 1: Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--md-sys-color-outline)' }}>
            <Filter size={18} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Filtros Maestros:</span>
          </div>

          {/* Date Desde */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)', fontWeight: 500 }}>Desde:</span>
            <input 
              type="date" 
              value={fechaDesde} 
              onChange={(e) => setFechaDesde(e.target.value)}
              className="m3-input"
              style={{ width: '150px', height: '40px', padding: '0 12px' }}
            />
          </div>

          {/* Date Hasta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)', fontWeight: 500 }}>Hasta:</span>
            <input 
              type="date" 
              value={fechaHasta} 
              onChange={(e) => setFechaHasta(e.target.value)}
              className="m3-input"
              style={{ width: '150px', height: '40px', padding: '0 12px' }}
            />
          </div>

          {/* PM dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexGrow: 1 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)', fontWeight: 500 }}>PM:</span>
            <select 
              value={filterPm} 
              onChange={(e) => setFilterPm(e.target.value)}
              className="user-select"
              style={{ width: 'auto', minWidth: '180px', height: '40px', paddingTop: 0, paddingBottom: 0 }}
            >
              <option value="">Cualquier Gestor PM</option>
              {pmsList.map(p => (
                <option key={p.id_usuario} value={p.id_usuario}>{p.nombre} {p.apellidos}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Separator Line */}
        <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', margin: '16px 0' }}></div>

        {/* Row 2: State Segmentation Buttons */}
        <div>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.05em' }}>
            Segmentación por Estado del Proyecto (Filtro Rápido)
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {statesList.map(state => {
              const st = state.nombre_estado;
              const isSelected = activeStateFilter === st;
              
              return (
                <div 
                  key={state.id_estado}
                  onClick={() => setActiveStateFilter(prev => prev === st ? null : st)}
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
                    {getStateCount(st)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* BLOQUE 1: Central KPIs cards */}
      <div className="metrics-grid" style={{ marginBottom: 24 }}>
        
        {/* KPI 1: Overruns */}
        <div 
          className="m3-card metric-card glass-panel"
          onClick={() => setActiveKpiFilter(prev => prev === 'overrun' ? null : 'overrun')}
          style={{ 
            cursor: 'pointer',
            border: activeKpiFilter === 'overrun' ? '2px solid var(--color-rag-red)' : '1px solid var(--md-sys-color-outline-variant)',
            transition: 'var(--transition-smooth)'
          }}
        >
          <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(255, 69, 58, 0.2)', color: 'var(--color-rag-red)' }}>
            <AlertOctagon size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value" style={{ color: 'var(--color-rag-red)' }}>{overrunCount}</span>
            <span className="metric-label" style={{ fontWeight: 600 }}>Proyectos en Desborde</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-outline)' }}>
              {activeKpiFilter === 'overrun' ? '🟢 Filtro Activo (Click para limpiar)' : 'Click para filtrar cuadrícula'}
            </span>
          </div>
        </div>

        {/* KPI 2: Capex Warning */}
        <div 
          className="m3-card metric-card glass-panel"
          onClick={() => setActiveKpiFilter(prev => prev === 'capex_warn' ? null : 'capex_warn')}
          style={{ 
            cursor: 'pointer',
            border: activeKpiFilter === 'capex_warn' ? '2px solid var(--priority-alta)' : '1px solid var(--md-sys-color-outline-variant)',
            transition: 'var(--transition-smooth)'
          }}
        >
          <div className="metric-icon-wrapper" style={{ backgroundColor: 'rgba(255, 159, 10, 0.2)', color: 'var(--priority-alta)' }}>
            <Coins size={24} />
          </div>
          <div className="metric-info">
            <span className="metric-value" style={{ color: 'var(--priority-alta)' }}>{capexWarnCount}</span>
            <span className="metric-label" style={{ fontWeight: 600 }}>Alerta Preventiva CAPEX</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-outline)' }}>
              {activeKpiFilter === 'capex_warn' ? '🟢 Filtro Activo' : 'Consumo ≥ 90% del inicial'}
            </span>
          </div>
        </div>
      </div>

      {/* BLOQUE 3: Grid Control Left & Compliance Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 32, alignItems: 'flex-start' }}>
        
        {/* Table High Density */}
        <div style={{ minWidth: 0 }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: 16 }}>
              <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--md-sys-color-primary)' }} />
              <span>Cargando cuadrícula ejecutiva...</span>
            </div>
          ) : filteredGridData.length === 0 ? (
            <div className="m3-card" style={{ textAlign: 'center', padding: '32px', color: 'var(--md-sys-color-outline)' }}>
              No hay proyectos en el periodo que coincidan con las alertas seleccionadas.
            </div>
          ) : (
            <div className="m3-table-wrapper glass-panel">
              <table className="m3-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Proyecto</th>
                    <th>PM</th>
                    <th>RAG</th>
                    <th>Alerta de Tiempo</th>
                    <th>Alerta de Dinero</th>
                    <th>Próximo Hito</th>
                    <th>Ficha</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGridData.map(p => {
                    const isTimeDelayed = new Date(p.fecha_fin_estimada) > new Date(p.fecha_fin_inicial);
                    const isOverBudget = p.gasto_total_facturas > p.budget_inicial;
                    let devPercent = 0;
                    if (isOverBudget) {
                      devPercent = Math.round(((p.gasto_total_facturas - p.budget_inicial) / p.budget_inicial) * 100);
                    }

                    return (
                      <tr key={p.id_proyecto}>
                        {/* ID */}
                        <td style={{ fontWeight: 700, fontSize: '0.8rem' }}>{p.id_proyecto}</td>

                        {/* Nombre */}
                        <td style={{ minWidth: '180px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}>
                            {p.nombre_proyecto}
                          </span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)', marginTop: 2 }}>
                            {p.estado_proyecto} {p.es_capex ? `• CAPEX (${p.codigo_capex})` : '• OPEX'}
                          </div>
                        </td>

                        {/* PM */}
                        <td>{p.pm_nombre}</td>

                        {/* RAG */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div className={`project-rag-dot ${p.indicador_rag}`} style={{ width: 10, height: 10 }}></div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{p.indicador_rag}</span>
                          </div>
                        </td>

                        {/* Time Alert (Retraso Real) */}
                        <td>
                          {isTimeDelayed ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ color: 'var(--color-rag-red)', fontWeight: 700, fontSize: '0.85rem' }}>
                                +{p.dias_retraso_aprobados} días retraso
                              </span>
                              {p.has_hito_vencido && (
                                <span className="badge badge-red" style={{ fontSize: '0.65rem', alignSelf: 'flex-start' }}>
                                  ⚠️ Hito Vencido
                                </span>
                              )}
                            </div>
                          ) : p.has_hito_vencido ? (
                            <span className="badge badge-red" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                              ⚠️ Hito Vencido
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-rag-green)', fontWeight: 600, fontSize: '0.85rem' }}>
                              En plazo
                            </span>
                          )}
                        </td>

                        {/* Money Alert (Riesgo Presupuestario) */}
                        <td>
                          {isOverBudget ? (
                            <span style={{ color: 'var(--color-rag-red)', fontWeight: 700, fontSize: '0.85rem' }}>
                              ⚠️ Excede en {devPercent}% al inicial
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-rag-green)', fontWeight: 600, fontSize: '0.85rem' }}>
                              OK
                            </span>
                          )}
                        </td>

                        {/* Next Milestone */}
                        <td style={{ fontSize: '0.8rem' }}>
                          {p.proximo_hito ? (
                            <div>
                              <div style={{ fontWeight: 600 }}>{p.proximo_hito.titulo_tarea}</div>
                              <div style={{ color: 'var(--md-sys-color-outline)', fontSize: '0.7rem' }}>{p.proximo_hito.fecha_limite}</div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--md-sys-color-outline)' }}>Sin hitos</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td>
                          <button 
                            className="icon-btn" 
                            onClick={() => onViewProject(p.id_proyecto)}
                            style={{ backgroundColor: 'var(--md-sys-color-surface-container-high)', width: 32, height: 32 }}
                          >
                            <Eye size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Governance Compliance Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Active plan coverage */}
          <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={20} style={{ color: 'var(--md-sys-color-primary)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Gobernanza</h3>
            </div>
            
            <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 12, textAlign: 'center' }}>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--md-sys-color-primary)' }}>
                {coveragePercent}%
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)', fontWeight: 500 }}>
                Cobertura Activa Comunicaciones
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-outline)', marginTop: 4 }}>
                {coveredCount} de {projects.length} con algún plan
              </div>
            </div>
          </div>

          {/* Inactive warn list (>30 days since update) */}
          <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={20} style={{ color: 'var(--priority-alta)' }} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Planes Inactivos ({inactiveProjects.length})</h3>
            </div>
            
            <p style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>
              Proyectos con planes activos sin registrar actividad en más de 30 días.
            </p>

            <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '250px', overflowY: 'auto' }}>
              {inactiveProjects.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-rag-green)', fontWeight: 600, textAlign: 'center' }}>
                  🟢 Cartera Actualizada
                </div>
              ) : (
                inactiveProjects.map(p => {
                  const diffDays = Math.round((Date.now() - new Date(p.ultima_actualizacion).getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div 
                      key={p.id_proyecto} 
                      onClick={() => onViewProject(p.id_proyecto)}
                      style={{ 
                        padding: 10, 
                        backgroundColor: 'var(--md-sys-color-surface-container-high)', 
                        borderRadius: 12, 
                        cursor: 'pointer',
                        border: '1px solid var(--md-sys-color-outline-variant)'
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '0.8rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {p.nombre_proyecto}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--color-rag-red)', marginTop: 4, fontWeight: 500 }}>
                        <span>Hace {diffDays} días</span>
                        <span>{p.id_proyecto}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
