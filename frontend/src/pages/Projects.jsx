import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import QuickCommentModal from '../components/modals/QuickCommentModal';
import DashboardReportModal from '../components/modals/DashboardReportModal';
import CreateProjectModal from '../components/modals/CreateProjectModal';
import ProjectsFilterPanel from '../components/projects/ProjectsFilterPanel';
import ProjectsTable from '../components/projects/ProjectsTable';
import { useTableColumns } from '../hooks/useTableColumns';
import usePersistentFilters from '../hooks/usePersistentFilters';

const DEFAULT_PROJECT_COLUMNS = [
  { id: 'id_proyecto', label: 'Código', fixed: true, visible: true, width: 140 },
  { id: 'nombre_proyecto', label: 'Nombre del Proyecto', fixed: true, visible: true },
  { id: 'estado_proyecto', label: 'Estado/Fase', fixed: false, visible: true },
  { id: 'indicador_rag', label: 'RAG', fixed: false, visible: true },
  { id: 'proveedor', label: 'Socio Tecnológico', fixed: false, visible: false },
  { id: 'pm', label: 'Gestor PM', fixed: false, visible: true },
  { id: 'sede', label: 'Sede', fixed: false, visible: false },
  { id: 'fecha_inicio', label: 'Fecha de Inicio', fixed: false, visible: false },
  { id: 'fecha_fin_inicial', label: 'Fecha Fin Base', fixed: false, visible: false },
  { id: 'fecha_fin_estimada', label: 'Fecha Fin Estimada', fixed: false, visible: true },
  { id: 'budget', label: 'Presupuesto', fixed: false, visible: false },
  { id: 'progreso', label: 'Progreso Gasto', fixed: false, visible: false },
  { id: 'proximo_hito', label: 'Próximo Hito', fixed: false, visible: true },
  { id: 'ultimo_comentario', label: 'Último Comentario', fixed: false, visible: true },
  { id: 'accion', label: 'Acción', fixed: true, visible: true }
];

const DEFAULT_PROJECT_FILTERS = {
  filterPm: '',
  filterVendor: '',
  filterRag: '',
  filterEstrategico: '',
  filterIniciativa: '',
  filterPortfolio: '',
  filterWorkflow: '',
  filterTag: '',
  filterStates: [],
  searchTerm: '',
  isStatesOpen: false,
  sortConfig: { key: 'id_proyecto', direction: 'asc' }
};

export default function Projects({ onViewProject, onViewVendor }) {
  const { getAuthHeaders, currentPm, selectedAmbito, changeAmbito, canWrite } = useAuth();
  const canSeeDireccion = currentPm && (currentPm.perfil === 'ADMINISTRADOR' || currentPm.perfil === 'DIRECTOR');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Column visibility
  const { columns: tableCols, visibleColumnsMap, columnWidths, updateColumnWidth, toggleColumn, resetColumns } = useTableColumns('ppm-projects-columns-v2', DEFAULT_PROJECT_COLUMNS);

  // Persistent filters & sorting
  const {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    activeFiltersCount
  } = usePersistentFilters('projects', DEFAULT_PROJECT_FILTERS);

  const {
    filterPm,
    filterVendor,
    filterRag,
    filterEstrategico,
    filterIniciativa,
    filterPortfolio,
    filterWorkflow,
    filterTag,
    filterStates,
    searchTerm,
    isStatesOpen,
    sortConfig
  } = filters;

  const setFilterPm = (val) => updateFilter('filterPm', val);
  const setFilterVendor = (val) => updateFilter('filterVendor', val);
  const setFilterRag = (val) => updateFilter('filterRag', val);
  const setFilterEstrategico = (val) => updateFilter('filterEstrategico', val);
  const setFilterIniciativa = (val) => updateFilter('filterIniciativa', val);
  const setFilterPortfolio = (val) => updateFilter('filterPortfolio', val);
  const setFilterWorkflow = (val) => updateFilter('filterWorkflow', val);
  const setFilterTag = (val) => updateFilter('filterTag', val);
  const setFilterStates = (updater) => {
    setFilters(prev => ({
      ...prev,
      filterStates: typeof updater === 'function' ? updater(prev.filterStates || []) : updater
    }));
  };
  const setSearchTerm = (val) => updateFilter('searchTerm', val);
  const setIsStatesOpen = (val) => updateFilter('isStatesOpen', typeof val === 'function' ? val(isStatesOpen) : val);
  const setSortConfig = (updater) => {
    setFilters(prev => ({
      ...prev,
      sortConfig: typeof updater === 'function' ? updater(prev.sortConfig || { key: 'id_proyecto', direction: 'asc' }) : updater
    }));
  };

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

  const handleMouseDown = (e, colId) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const thElement = e.target.parentElement;
    const startWidth = thElement.getBoundingClientRect().width;

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      updateColumnWidth(colId, startWidth + deltaX);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const [isReportOpen, setIsReportOpen] = useState(false);

  // Dropdowns lists
  const [pmsList, setPmsList] = useState([]);
  const [vendorsList, setVendorsList] = useState([]);
  const [sedesList, setSedesList] = useState([]);
  const [contactosList, setContactosList] = useState([]);
  const [statesList, setStatesList] = useState([]);
  const [workflowsList, setWorkflowsList] = useState([]);
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
    if (filterIniciativa) params.append('iniciativa_ligera', filterIniciativa);
    if (filterStates && filterStates.length > 0) params.append('state', filterStates.join(','));
    if (filterPortfolio) params.append('portfolio', filterPortfolio);
    if (filterWorkflow) params.append('workflow', filterWorkflow);
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
    fetch(`${import.meta.env.VITE_API_URL}/portfolio/workflows`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setWorkflowsList(Array.isArray(data) ? data : []));
    fetch(`${import.meta.env.VITE_API_URL}/portfolios`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setPortfoliosList(data));
    fetch(`${import.meta.env.VITE_API_URL}/tags`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setTagsList(data));
    fetch(`${import.meta.env.VITE_API_URL}/capex-types`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setCapexTypes(data));
  };

  useEffect(() => {
    fetchProjects();
  }, [filterPm, filterVendor, filterRag, filterEstrategico, filterIniciativa, filterPortfolio, filterWorkflow, filterTag, filterStates, searchTerm, selectedAmbito]);

  useEffect(() => {
    fetchMetadata();
  }, [selectedAmbito]);

  const handleProjectCreated = (createdProject) => {
    if (createdProject?.id_ambito && selectedAmbito && selectedAmbito !== 'ALL' && String(createdProject.id_ambito) !== String(selectedAmbito)) {
      changeAmbito(String(createdProject.id_ambito));
    }
    resetFilters();
    fetchProjects();
    if (createdProject?.id_proyecto && onViewProject) {
      onViewProject(createdProject.id_proyecto);
    }
  };

  return (
    <div>
      {/* Filters bar */}
      <ProjectsFilterPanel 
        filterPm={filterPm} setFilterPm={setFilterPm}
        filterVendor={filterVendor} setFilterVendor={setFilterVendor}
        filterRag={filterRag} setFilterRag={setFilterRag}
        filterEstrategico={filterEstrategico} setFilterEstrategico={setFilterEstrategico}
        filterIniciativa={filterIniciativa} setFilterIniciativa={setFilterIniciativa}
        filterPortfolio={filterPortfolio} setFilterPortfolio={setFilterPortfolio}
        filterWorkflow={filterWorkflow} setFilterWorkflow={setFilterWorkflow}
        filterTag={filterTag} setFilterTag={setFilterTag}
        filterStates={filterStates} setFilterStates={setFilterStates}
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        isStatesOpen={isStatesOpen} setIsStatesOpen={setIsStatesOpen}
        pmsList={pmsList} vendorsList={vendorsList} portfoliosList={portfoliosList}
        workflowsList={workflowsList}
        tagsList={tagsList} statesList={statesList} projects={projects}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenCreate={canWrite ? () => setShowCreateModal(true) : undefined}
        activeFiltersCount={activeFiltersCount}
        onResetFilters={resetFilters}
      />

      {/* Main Grid Table */}
      <ProjectsTable 
        projects={projects}
        loading={loading}
        visibleColumnsMap={visibleColumnsMap}
        tableCols={tableCols}
        toggleColumn={toggleColumn}
        resetColumns={resetColumns}
        columnWidths={columnWidths}
        sortConfig={sortConfig}
        handleSort={handleSort}
        handleMouseDown={handleMouseDown}
        onViewProject={onViewProject}
        onViewVendor={onViewVendor}
        onOpenQuickComment={canWrite ? handleOpenQuickComment : undefined}
      />

      {/* Create Project Modal */}
      <CreateProjectModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        getAuthHeaders={getAuthHeaders}
        onSuccess={handleProjectCreated}
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
