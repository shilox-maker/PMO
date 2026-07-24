import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import QuickCommentModal from '../components/modals/QuickCommentModal';
import DashboardReportModal from '../components/modals/DashboardReportModal';
import CreateProjectModal from '../components/modals/CreateProjectModal';
import ProjectsFilterPanel from '../components/projects/ProjectsFilterPanel';
import ProjectsTable from '../components/projects/ProjectsTable';
import { useTableColumns } from '../hooks/useTableColumns';

const DEFAULT_PROJECT_COLUMNS = [
  { id: 'id_proyecto', label: 'Código', fixed: true, visible: true },
  { id: 'nombre_proyecto', label: 'Nombre del Proyecto', fixed: true, visible: true },
  { id: 'estado_proyecto', label: 'Estado/Fase', fixed: false, visible: true },
  { id: 'indicador_rag', label: 'RAG', fixed: false, visible: true },
  { id: 'proveedor', label: 'Socio Tecnológico', fixed: false, visible: false },
  { id: 'pm', label: 'Gestor PM', fixed: false, visible: true },
  { id: 'sede', label: 'Sede', fixed: false, visible: false },
  { id: 'fecha_inicio', label: 'Fecha de Inicio', fixed: false, visible: true },
  { id: 'fecha_fin_inicial', label: 'Fecha Fin Base', fixed: false, visible: false },
  { id: 'fecha_fin_estimada', label: 'Fecha Fin Estimada', fixed: false, visible: true },
  { id: 'budget', label: 'Presupuesto', fixed: false, visible: true },
  { id: 'progreso', label: 'Progreso Gasto', fixed: false, visible: true },
  { id: 'proximo_hito', label: 'Próximo Hito', fixed: false, visible: true },
  { id: 'ultimo_comentario', label: 'Último Comentario', fixed: false, visible: true },
  { id: 'accion', label: 'Acción', fixed: true, visible: true }
];

export default function Projects({ onViewProject, onViewVendor }) {
  const { getAuthHeaders, currentPm } = useAuth();
  const canSeeDireccion = currentPm && (currentPm.perfil === 'ADMINISTRADOR' || currentPm.perfil === 'DIRECTOR');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Column visibility
  const { columns: tableCols, visibleColumnsMap, toggleColumn, resetColumns } = useTableColumns('ppm-projects-columns', DEFAULT_PROJECT_COLUMNS);

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'id_proyecto', direction: 'asc' });

  // Quick Comment state
  const [quickCommentProjectId, setQuickCommentProjectId] = useState(null);
  const [isQuickCommentOpen, setIsQuickCommentOpen] = useState(false);

  const handleOpenQuickComment = (pid) => {
    setQuickCommentProjectId(pid);
    setIsQuickCommentOpen(true);
  };

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

  const [isReportOpen, setIsReportOpen] = useState(false);

  // Technical List Filters
  const [filterPm, setFilterPm] = useState('');
  const [filterVendor, setFilterVendor] = useState('');
  const [filterRag, setFilterRag] = useState('');
  const [filterEstrategico, setFilterEstrategico] = useState('');
  const [filterPortfolio, setFilterPortfolio] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterStates, setFilterStates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isStatesOpen, setIsStatesOpen] = useState(false);

  // Dropdowns lists
  const [pmsList, setPmsList] = useState([]);
  const [vendorsList, setVendorsList] = useState([]);
  const [sedesList, setSedesList] = useState([]);
  const [contactosList, setContactosList] = useState([]);
  const [statesList, setStatesList] = useState([]);
  const [portfoliosList, setPortfoliosList] = useState([]);
  const [tagsList, setTagsList] = useState([]);
  const [capexTypes, setCapexTypes] = useState([]);

  // Modal creation state
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchProjects = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterPm) params.append('pm', filterPm);
    if (filterVendor) params.append('vendor', filterVendor);
    if (filterRag) params.append('rag', filterRag);
    if (filterEstrategico) params.append('estrategico', filterEstrategico);
    if (filterStates.length > 0) params.append('state', filterStates.join(','));
    if (filterPortfolio) params.append('portfolio', filterPortfolio);
    if (filterTag) params.append('tag', filterTag);
    if (searchTerm) params.append('search', searchTerm);

    fetch(`${import.meta.env.VITE_API_URL}/projects?${params.toString()}`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        setProjects(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching technical projects list:', err);
        setLoading(false);
      });
  };

  const fetchMetadata = () => {
    fetch(`${import.meta.env.VITE_API_URL}/pms`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setPmsList(data));
    fetch(`${import.meta.env.VITE_API_URL}/vendors`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setVendorsList(data));
    fetch(`${import.meta.env.VITE_API_URL}/sedes`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setSedesList(data));
    fetch(`${import.meta.env.VITE_API_URL}/contactos`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setContactosList(data));
    fetch(`${import.meta.env.VITE_API_URL}/portfolio/states`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setStatesList(data));
    fetch(`${import.meta.env.VITE_API_URL}/portfolios`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setPortfoliosList(data));
    fetch(`${import.meta.env.VITE_API_URL}/tags`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setTagsList(data));
    fetch(`${import.meta.env.VITE_API_URL}/capex-types`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setCapexTypes(data));
  };

  useEffect(() => {
    fetchProjects();
  }, [filterPm, filterVendor, filterRag, filterEstrategico, filterPortfolio, filterTag, filterStates, searchTerm]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  return (
    <div>
      {/* Filters bar */}
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
        pmsList={pmsList} vendorsList={vendorsList} portfoliosList={portfoliosList}
        tagsList={tagsList} statesList={statesList} projects={projects}
        tableCols={tableCols} toggleColumn={toggleColumn} resetColumns={resetColumns}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenCreate={() => setShowCreateModal(true)}
      />

      {/* Main Grid Table */}
      <ProjectsTable 
        projects={projects}
        loading={loading}
        visibleColumnsMap={visibleColumnsMap}
        sortConfig={sortConfig}
        renderSortHeader={renderSortHeader}
        onViewProject={onViewProject}
        onViewVendor={onViewVendor}
        onOpenQuickComment={handleOpenQuickComment}
      />

      {/* Create Project Modal */}
      <CreateProjectModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        getAuthHeaders={getAuthHeaders}
        onSuccess={fetchProjects}
        currentPm={currentPm}
        pmsList={pmsList}
        vendorsList={vendorsList}
        sedesList={sedesList}
        contactosList={contactosList}
        portfoliosList={portfoliosList}
        capexTypes={capexTypes}
      />

      {/* Quick Comment Modal */}
      <QuickCommentModal 
        isOpen={isQuickCommentOpen}
        onClose={() => {
          setIsQuickCommentOpen(false);
          setQuickCommentProjectId(null);
        }}
        projectId={quickCommentProjectId}
        getAuthHeaders={getAuthHeaders}
        onSuccess={fetchProjects}
        canSeeDireccion={canSeeDireccion}
      />

      {/* Dashboard Report Modal */}
      <DashboardReportModal 
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        projects={projects}
        getAuthHeaders={getAuthHeaders}
      />
    </div>
  );
}
