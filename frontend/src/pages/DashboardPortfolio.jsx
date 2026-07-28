import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Filter, ArrowUp, ArrowDown, ArrowUpDown, PieChart } from 'lucide-react';
import { useTableColumns } from '../hooks/useTableColumns';
import ProjectsFilterPanel from '../components/projects/ProjectsFilterPanel';
import GovernanceKpiHeader from '../components/governance/GovernanceKpiHeader';

const DEFAULT_GOV_COLUMNS = [
  { id: 'id_proyecto', label: 'Código', fixed: true, visible: true },
  { id: 'nombre_proyecto', label: 'Proyecto', fixed: true, visible: true },
  { id: 'pm_nombre', label: 'PM', fixed: false, visible: true },
  { id: 'indicador_rag', label: 'RAG', fixed: false, visible: true },
  { id: 'fecha_inicio', label: 'Fecha de Inicio', fixed: false, visible: true },
  { id: 'fecha_fin_inicial', label: 'Fecha Fin Base', fixed: false, visible: true },
  { id: 'fecha_fin_estimada', label: 'Fecha Fin Estimada', fixed: false, visible: true },
  { id: 'gasto_total_facturas', label: 'Gasto Facturado', fixed: false, visible: true },
  { id: 'alerta_tiempo', label: 'Alerta Tiempo', fixed: false, visible: true },
  { id: 'alerta_dinero', label: 'Alerta Dinero', fixed: false, visible: true },
  { id: 'proximo_hito', label: 'Próximo Hito', fixed: false, visible: true },
  { id: 'ultimo_comentario', label: 'Último Comentario', fixed: false, visible: true },
  { id: 'accion', label: 'Ficha', fixed: true, visible: true }
];

export default function DashboardPortfolio({ onViewProject }) {
  const { getAuthHeaders } = useAuth();

  const [rawProjects, setRawProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [filterPm, setFilterPm] = useState('');
  const [filterVendor, setFilterVendor] = useState('');
  const [filterRag, setFilterRag] = useState('');
  const [filterEstrategico, setFilterEstrategico] = useState('');
  const [filterPortfolio, setFilterPortfolio] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterStates, setFilterStates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isStatesOpen, setIsStatesOpen] = useState(false);

  // Master Lists
  const [pmsList, setPmsList] = useState([]);
  const [vendorsList, setVendorsList] = useState([]);
  const [portfoliosList, setPortfoliosList] = useState([]);
  const [tagsList, setTagsList] = useState([]);
  const [statesList, setStatesList] = useState([]);

  // Column visibility & Sorting
  const { columns: tableCols, visibleColumnsMap, toggleColumn, resetColumns } = useTableColumns('ppm-portfolio-columns', DEFAULT_GOV_COLUMNS);
  const [sortConfig, setSortConfig] = useState({ key: 'id_proyecto', direction: 'asc' });
  const [selectedKpi, setSelectedKpi] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/pms`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setPmsList(Array.isArray(data) ? data : [])).catch(() => {});
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/vendors`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setVendorsList(Array.isArray(data) ? data : [])).catch(() => {});
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/portfolios`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setPortfoliosList(Array.isArray(data) ? data : [])).catch(() => {});
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/tags`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setTagsList(Array.isArray(data) ? data : [])).catch(() => {});
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/portfolio/states`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setStatesList(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const fetchDashboardData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterPm) params.append('pm', filterPm);
    if (filterVendor) params.append('vendor', filterVendor);
    if (filterRag) params.append('rag', filterRag);
    if (filterEstrategico) params.append('estrategico', filterEstrategico);
    if (filterPortfolio) params.append('portfolio', filterPortfolio);
    if (filterTag) params.append('tag', filterTag);
    if (searchTerm) params.append('search', searchTerm);
    if (filterStates && filterStates.length > 0) params.append('states', filterStates.join(','));

    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/portfolio/dashboard?${params.toString()}`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        setRawProjects(Array.isArray(data) ? data : (data.projects || []));
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching portfolio dashboard data:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filterPm, filterVendor, filterRag, filterEstrategico, filterPortfolio, filterTag, filterStates, searchTerm]);

  // Exclude non-executed projects (CANCELADO / PARKING / DESCARTADO) by default unless state filter selected explicitly
  const baseProjects = rawProjects.filter(p => {
    const st = (p.estado_proyecto || p.Estado?.nombre_estado || '').toUpperCase();
    if (filterStates.length > 0) {
      return filterStates.includes(p.estado_proyecto) || filterStates.includes(p.Estado?.nombre_estado);
    }
    return !['CANCELADO', 'PARKING', 'DESCARTADO'].includes(st);
  });

  const todayStr = new Date().toISOString().split('T')[0];

  // Metric Computations
  const overrunCount = baseProjects.filter(p => p.gasto_total_facturas > p.budget_inicial).length;
  const overrunExtendedCount = baseProjects.filter(p => p.gasto_total_facturas > (p.calculations?.budget_actualizado || p.budget_inicial)).length;

  const delayedBaseCount = baseProjects.filter(p => {
    const isClosed = ['CERRADO', 'CANCELADO', 'FINALIZADO', 'COMPLETADO', 'PARKING'].includes((p.estado_proyecto || '').toUpperCase());
    return !isClosed && p.fecha_fin_inicial && p.fecha_fin_inicial < todayStr;
  }).length;

  const delayedExtendedCount = baseProjects.filter(p => {
    const isClosed = ['CERRADO', 'CANCELADO', 'FINALIZADO', 'COMPLETADO', 'PARKING'].includes((p.estado_proyecto || '').toUpperCase());
    return !isClosed && p.fecha_fin_estimada && p.fecha_fin_estimada < todayStr;
  }).length;

  const nonGovernedCount = baseProjects.filter(p => {
    const hasPlanes = p.PlanesComunicacion && p.PlanesComunicacion.length > 0;
    return !hasPlanes && !p.com_semanal_activo && !p.com_mensual_activo && !p.com_steerco_activo;
  }).length;

  const totalInitialBudget = baseProjects.reduce((acc, p) => acc + parseFloat(p.budget_inicial || 0), 0);
  const totalCrImporte = baseProjects.reduce((acc, p) => acc + parseFloat(p.calculations?.total_cr_importe || 0), 0);
  const scopeVolatilityPercent = totalInitialBudget > 0 ? Number(((totalCrImporte / totalInitialBudget) * 100).toFixed(1)) : 0;
  const volatilityCount = baseProjects.filter(p => (p.calculations?.tasa_volatilidad_pct || 0) > 0 || (p.calculations?.total_cr_importe || 0) > 0).length;

  // Filter by active KPI drill-down
  let filteredProjects = [...baseProjects];
  if (selectedKpi) {
    if (selectedKpi === 'scope_volatility') {
      filteredProjects = filteredProjects.filter(p => (p.calculations?.tasa_volatilidad_pct || 0) > 0 || (p.calculations?.total_cr_importe || 0) > 0);
    } else if (selectedKpi === 'overrun') {
      filteredProjects = filteredProjects.filter(p => p.gasto_total_facturas > p.budget_inicial);
    } else if (selectedKpi === 'overrun_extended') {
      filteredProjects = filteredProjects.filter(p => p.gasto_total_facturas > (p.calculations?.budget_actualizado || p.budget_inicial));
    } else if (selectedKpi === 'delayed_base') {
      filteredProjects = filteredProjects.filter(p => {
        const isClosed = ['CERRADO', 'CANCELADO', 'FINALIZADO', 'COMPLETADO', 'PARKING'].includes((p.estado_proyecto || '').toUpperCase());
        return !isClosed && p.fecha_fin_inicial && p.fecha_fin_inicial < todayStr;
      });
    } else if (selectedKpi === 'delayed_extended') {
      filteredProjects = filteredProjects.filter(p => {
        const isClosed = ['CERRADO', 'CANCELADO', 'FINALIZADO', 'COMPLETADO', 'PARKING'].includes((p.estado_proyecto || '').toUpperCase());
        return !isClosed && p.fecha_fin_estimada && p.fecha_fin_estimada < todayStr;
      });
    } else if (selectedKpi === 'non_governed') {
      filteredProjects = filteredProjects.filter(p => {
        const hasPlanes = p.PlanesComunicacion && p.PlanesComunicacion.length > 0;
        return !hasPlanes && !p.com_semanal_activo && !p.com_mensual_activo && !p.com_steerco_activo;
      });
    }
  }

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const renderSortHeader = (label, key, extraStyle = {}) => {
    const isSorted = sortConfig.key === key;
    return (
      <th onClick={() => handleSort(key)} style={{ cursor: 'pointer', userSelect: 'none', ...extraStyle }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {label}
          {isSorted ? (sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} style={{ opacity: 0.3 }} />}
        </div>
      </th>
    );
  };

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];
    if (sortConfig.key === 'pm_nombre') {
      aValue = `${a.PM?.nombre || ''} ${a.PM?.apellidos || ''}`.trim();
      bValue = `${b.PM?.apellidos || ''} ${b.PM?.apellidos || ''}`.trim();
    }
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="dashboard-container" style={{ padding: '0 4px' }}>
      {/* Reusable Projects Filter Panel */}
      <ProjectsFilterPanel
        filterPm={filterPm} setFilterPm={setFilterPm}
        filterVendor={filterVendor} setFilterVendor={setFilterVendor}
        filterRag={filterRag} setFilterRag={setFilterRag}
        filterEstrategico={filterEstrategico} setFilterEstrategico={setFilterEstrategico}
        filterPortfolio={filterPortfolio} setFilterPortfolio={setFilterPortfolio}
        filterTag={filterTag} setFilterTag={setFilterTag}
        filterStates={filterStates} setFilterStates={setFilterStates}
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        isStatesOpen={isStatesOpen} setIsStatesOpen={setIsStatesOpen}
        pmsList={pmsList} vendorsList={vendorsList} portfoliosList={portfoliosList} tagsList={tagsList} statesList={statesList}
        projects={rawProjects}
        tableCols={tableCols} toggleColumn={toggleColumn} resetColumns={resetColumns}
      />

      {/* KPI Cards Header */}
      <GovernanceKpiHeader
        overrunCount={overrunCount}
        overrunExtendedCount={overrunExtendedCount}
        delayedBaseCount={delayedBaseCount}
        delayedExtendedCount={delayedExtendedCount}
        nonGovernedCount={nonGovernedCount}
        scopeVolatilityPercent={scopeVolatilityPercent}
        volatilityCount={volatilityCount}
        activeKpiFilter={selectedKpi}
        setActiveKpiFilter={setSelectedKpi}
      />

      {/* Active KPI Banner */}
      {selectedKpi && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: 'var(--md-sys-color-surface-container-high)',
          border: '1px solid var(--md-sys-color-primary)',
          padding: '8px 16px', borderRadius: 10, marginBottom: 16, fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={16} color="var(--md-sys-color-primary)" />
            <span>
              Filtrado por KPI: <strong style={{ color: 'var(--md-sys-color-primary)' }}>
                {
                  {
                    scope_volatility: 'Volatilidad de Alcance (CRs Aprobados)',
                    overrun: 'Exc. coste (CAPEX Inicial)',
                    overrun_extended: 'Exc. coste (CAPEX Ampliado)',
                    delayed_base: 'Retrasados (L.Base Original)',
                    delayed_extended: 'Retrasados (L.Base Ampliada)',
                    non_governed: 'Sin Gobernanza (Sin Plan/Comités)'
                  }[selectedKpi]
                }
              </strong> ({filteredProjects.length} de {baseProjects.length} proyectos)
            </span>
          </div>
          <button className="m3-btn m3-btn-text" onClick={() => setSelectedKpi(null)} style={{ fontSize: '0.8rem', padding: '2px 8px' }}>
            Limpiar Filtro
          </button>
        </div>
      )}

      {/* Projects Table */}
      <div className="m3-card glass-panel" style={{ padding: 16 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14 }}>Resumen de Proyectos del Portfolio ({sortedProjects.length})</h3>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', opacity: 0.7 }}>Cargando proyectos de cartera...</div>
        ) : (
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="m3-table" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  {visibleColumnsMap.id_proyecto && renderSortHeader('Código', 'id_proyecto')}
                  {visibleColumnsMap.nombre_proyecto && renderSortHeader('Proyecto', 'nombre_proyecto')}
                  {visibleColumnsMap.pm_nombre && renderSortHeader('PM', 'pm_nombre')}
                  {visibleColumnsMap.indicador_rag && renderSortHeader('RAG', 'indicador_rag')}
                  {visibleColumnsMap.fecha_inicio && renderSortHeader('Inicio', 'fecha_inicio')}
                  {visibleColumnsMap.fecha_fin_inicial && renderSortHeader('Fin Base', 'fecha_fin_inicial')}
                  {visibleColumnsMap.fecha_fin_estimada && renderSortHeader('Fin Est.', 'fecha_fin_estimada')}
                  {visibleColumnsMap.gasto_total_facturas && renderSortHeader('Gasto', 'gasto_total_facturas')}
                  {visibleColumnsMap.proximo_hito && <th>Próximo Hito</th>}
                  {visibleColumnsMap.accion && <th style={{ textAlign: 'center' }}>Acción</th>}
                </tr>
              </thead>
              <tbody>
                {sortedProjects.map(p => {
                  const pmName = `${p.PM?.nombre || ''} ${p.PM?.apellidos || ''}`.trim() || p.pm_nombre || 'Sin PM';
                  return (
                    <tr key={p.id_proyecto}>
                      {visibleColumnsMap.id_proyecto && <td><strong>{p.id_proyecto}</strong></td>}
                      {visibleColumnsMap.nombre_proyecto && (
                        <td>
                          <button
                            className="btn-link"
                            onClick={() => onViewProject && onViewProject(p.id_proyecto)}
                            style={{ fontWeight: 600, color: 'var(--md-sys-color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
                          >
                            {p.nombre_proyecto}
                          </button>
                        </td>
                      )}
                      {visibleColumnsMap.pm_nombre && <td>{pmName}</td>}
                      {visibleColumnsMap.indicador_rag && (
                        <td>
                          <span className={`badge badge-${(p.indicador_rag || 'verde').toLowerCase()}`}>
                            {p.indicador_rag || 'N/A'}
                          </span>
                        </td>
                      )}
                      {visibleColumnsMap.fecha_inicio && <td>{p.fecha_inicio || '-'}</td>}
                      {visibleColumnsMap.fecha_fin_inicial && <td>{p.fecha_fin_inicial || '-'}</td>}
                      {visibleColumnsMap.fecha_fin_estimada && <td>{p.fecha_fin_estimada || '-'}</td>}
                      {visibleColumnsMap.gasto_total_facturas && (
                        <td>{p.gasto_total_facturas ? `${p.gasto_total_facturas.toLocaleString('es-ES')} €` : '0 €'}</td>
                      )}
                      {visibleColumnsMap.proximo_hito && (
                        <td>
                          {p.proximo_hito ? (
                            <span style={{ fontSize: '0.8rem' }}>
                              {p.proximo_hito.titulo_tarea} ({p.proximo_hito.fecha_planificada || p.proximo_hito.fecha_limite})
                            </span>
                          ) : (
                            <span style={{ opacity: 0.5 }}>-</span>
                          )}
                        </td>
                      )}
                      {visibleColumnsMap.accion && (
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="m3-btn m3-btn-outline"
                            onClick={() => onViewProject && onViewProject(p.id_proyecto)}
                            style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                          >
                            Ver Ficha
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
