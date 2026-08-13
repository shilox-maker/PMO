import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Filter, Activity } from 'lucide-react';
import { useTableColumns } from '../hooks/useTableColumns';
import ProjectsFilterPanel from '../components/projects/ProjectsFilterPanel';
import DashboardKpiGrid from '../components/dashboard/DashboardKpiGrid';
import DashboardChartsSection from '../components/dashboard/DashboardChartsSection';
import DashboardSummaryTable from '../components/dashboard/DashboardSummaryTable';
import DashboardReportModal from '../components/modals/DashboardReportModal';

const DEFAULT_DASHBOARD_COLUMNS = [
  { id: 'id_proyecto', label: 'Código', fixed: true, visible: true },
  { id: 'nombre_proyecto', label: 'Proyecto', fixed: true, visible: true },
  { id: 'pm_nombre', label: 'PM', fixed: false, visible: true },
  { id: 'indicador_rag', label: 'RAG', fixed: false, visible: true },
  { id: 'fecha_inicio', label: 'Inicio', fixed: false, visible: true },
  { id: 'fecha_fin_inicial', label: 'Fin Base', fixed: false, visible: true },
  { id: 'fecha_fin_estimada', label: 'Fin Est.', fixed: false, visible: true },
  { id: 'gasto_total_facturas', label: 'Gasto Facturado', fixed: false, visible: true },
  { id: 'proximo_hito', label: 'Próximo Hito', fixed: false, visible: true },
  { id: 'ultimo_comentario', label: 'Último Comentario', fixed: false, visible: true },
  { id: 'accion', label: 'Ficha', fixed: true, visible: true }
];

export default function DashboardProyectos({ onViewProject, onViewVendor }) {
  const { t } = useTranslation();
  const { getAuthHeaders, selectedAmbito } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [filterPm, setFilterPm] = useState('');
  const [filterVendor, setFilterVendor] = useState('');
  const [filterRag, setFilterRag] = useState('');
  const [filterEstrategico, setFilterEstrategico] = useState('');
  const [filterIniciativa, setFilterIniciativa] = useState('');
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

  // Column Selector
  const { columns: tableCols, toggleColumn, resetColumns } = useTableColumns('ppm-dashboard-proyectos-columns', DEFAULT_DASHBOARD_COLUMNS);

  const [selectedKpi, setSelectedKpi] = useState(null);
  const [selectedChartFilter, setSelectedChartFilter] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [trends, setTrends] = useState({});
  const [timeframe, setTimeframe] = useState(7);
  const [customDate, setCustomDate] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/pms`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setPmsList(Array.isArray(data) ? data : [])).catch(() => {});
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/vendors`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setVendorsList(Array.isArray(data) ? data : [])).catch(() => {});
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/portfolios`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setPortfoliosList(Array.isArray(data) ? data : [])).catch(() => {});
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/tags`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setTagsList(Array.isArray(data) ? data : [])).catch(() => {});
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/portfolio/states`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setStatesList(Array.isArray(data) ? data : [])).catch(() => {});
  }, [selectedAmbito]);

  const fetchDashboardData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('include_trends', 'true');
    params.append('timeframe', timeframe.toString());
    if (filterPm) params.append('pm', filterPm);
    if (filterVendor) params.append('vendor', filterVendor);
    if (filterRag) params.append('rag', filterRag);
    if (filterEstrategico) params.append('estrategico', filterEstrategico);
    if (filterIniciativa) params.append('iniciativa_ligera', filterIniciativa);
    if (filterPortfolio) params.append('portfolio', filterPortfolio);
    if (filterTag) params.append('tag', filterTag);
    if (searchTerm) params.append('search', searchTerm);
    if (filterStates && filterStates.length > 0) params.append('states', filterStates.join(','));

    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/portfolio/dashboard?${params.toString()}`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProjects(data);
          setTrends({});
        } else {
          setProjects(data.projects || []);
          setTrends(data.trends || {});
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching dashboard proyectos data:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filterPm, filterVendor, filterRag, filterEstrategico, filterIniciativa, filterPortfolio, filterTag, filterStates, searchTerm, timeframe, selectedAmbito]);

  useEffect(() => {
    if (customDate) {
      const days = Math.max(1, Math.round((Date.now() - new Date(customDate).getTime()) / 86400000));
      setTimeframe(days);
    }
  }, [customDate]);

  const getFilteredProjects = () => {
    let res = [...projects];

    if (selectedKpi) {
      switch (selectedKpi) {
        case 'delayed_partial':
          res = res.filter(p => p.has_hito_vencido);
          break;
        case 'governance':
          res = res.filter(p => {
            const hasPlanes = p.PlanesComunicacion && p.PlanesComunicacion.length > 0;
            return !hasPlanes && !p.com_semanal_activo && !p.com_mensual_activo && !p.com_steerco_activo;
          });
          break;
        case 'inactive':
          res = res.filter(p => p.es_desactualizado);
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
      if (selectedChartFilter.type === 'rag') {
        res = res.filter(p => p.indicador_rag === selectedChartFilter.value);
      } else if (selectedChartFilter.type === 'state' || selectedChartFilter.type === 'estado') {
        res = res.filter(p => (p.estado_proyecto || p.Estado?.nombre_estado) === selectedChartFilter.value);
      } else if (selectedChartFilter.type === 'pm') {
        const pmFullName = p => `${p.PM?.nombre || ''} ${p.PM?.apellidos || ''}`.trim() || 'Sin PM';
        res = res.filter(p => pmFullName(p) === selectedChartFilter.value);
      } else if (selectedChartFilter.type === 'vendor') {
        const getVendorName = p => p.Proveedor?.nombre_razon_social || p.vendor_nombre || 'Sin Partner';
        res = res.filter(p => getVendorName(p) === selectedChartFilter.value);
      }
    }

    return res;
  };

  const filteredProjects = getFilteredProjects();

  const delayedPartialCount = projects.filter(p => p.has_hito_vencido).length;
  const inactiveCount = projects.filter(p => p.es_desactualizado).length;

  const ragVerde = projects.filter(p => p.indicador_rag === 'VERDE').length;
  const ragAmarillo = projects.filter(p => p.indicador_rag === 'AMARILLO').length;
  const ragRojo = projects.filter(p => p.indicador_rag === 'ROJO').length;

  return (
    <div className="dashboard-container" style={{ padding: '0 4px' }}>
      {/* Complete Projects Filter Panel */}
      <ProjectsFilterPanel
        filterPm={filterPm} setFilterPm={setFilterPm}
        filterVendor={filterVendor} setFilterVendor={setFilterVendor}
        filterRag={filterRag} setFilterRag={setFilterRag}
        filterEstrategico={filterEstrategico} setFilterEstrategico={setFilterEstrategico}
        filterIniciativa={filterIniciativa} setFilterIniciativa={setFilterIniciativa}
        filterPortfolio={filterPortfolio} setFilterPortfolio={setFilterPortfolio}
        filterTag={filterTag} setFilterTag={setFilterTag}
        filterStates={filterStates} setFilterStates={setFilterStates}
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        isStatesOpen={isStatesOpen} setIsStatesOpen={setIsStatesOpen}
        pmsList={pmsList} vendorsList={vendorsList} portfoliosList={portfoliosList} tagsList={tagsList} statesList={statesList}
        projects={projects}
        tableCols={tableCols} toggleColumn={toggleColumn} resetColumns={resetColumns}
        onOpenReport={() => setIsReportModalOpen(true)}
      />

      {/* KPI Grid */}
      <DashboardKpiGrid
        delayedPartialCount={delayedPartialCount}
        inactiveCount={inactiveCount}
        ragVerde={ragVerde}
        ragAmarillo={ragAmarillo}
        ragRojo={ragRojo}
        selectedKpi={selectedKpi}
        setSelectedKpi={setSelectedKpi}
        trends={trends}
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        customDate={customDate}
        setCustomDate={setCustomDate}
      />

      {/* Charts Section */}
      <div className="m3-card glass-panel" style={{ marginBottom: 20, padding: '12px 16px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12 }}>
          {t('dashboards.operationalDistribution')}
        </h3>
        <DashboardChartsSection
          projects={projects}
          statesList={statesList}
          selectedChartFilter={selectedChartFilter}
          setSelectedChartFilter={setSelectedChartFilter}
        />
      </div>

      {/* KPI Drill-down Active Banner */}
      {(selectedKpi || selectedChartFilter) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: 'var(--md-sys-color-surface-container-high)',
          border: '1px solid var(--md-sys-color-primary)',
          padding: '8px 16px', borderRadius: 10, marginBottom: 16, fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={16} color="var(--md-sys-color-primary)" />
            <span>
              {t('portfolioDashboard.filterBanner')} <strong style={{ color: 'var(--md-sys-color-primary)' }}>
                {selectedKpi ? {
                  delayed_partial: t('dashboards.overdueProjects'),
                  governance: t('governanceKpis.nonGoverned'),
                  inactive: t('dashboards.inactive'),
                  rag_verde: `${t('projectsTable.status')} ${t('status.VERDE')}`,
                  rag_amarillo: `${t('projectsTable.status')} ${t('status.AMARILLO')}`,
                  rag_rojo: `${t('projectsTable.status')} ${t('status.ROJO')}`
                }[selectedKpi] : `${selectedChartFilter.type}: ${selectedChartFilter.value}`}
              </strong> ({filteredProjects.length} / {projects.length})
            </span>
          </div>
          <button className="m3-btn m3-btn-outline" onClick={() => { setSelectedKpi(null); setSelectedChartFilter(null); }} style={{ padding: '2px 8px', fontSize: '0.78rem' }}>
            {t('portfolioDashboard.clearFilter')}
          </button>
        </div>
      )}

      {/* Summary Table */}
      <DashboardSummaryTable
        loading={loading}
        projects={filteredProjects}
        onViewProject={onViewProject}
        onViewVendor={onViewVendor}
      />

      <DashboardReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        projects={projects}
        getAuthHeaders={getAuthHeaders}
      />
    </div>
  );
}
