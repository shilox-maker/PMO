import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Search, Building, AlertTriangle, TrendingUp, Calendar, 
  MapPin, User, Filter, AlertOctagon, CheckSquare, RefreshCw, Eye,
  ArrowUp, ArrowDown, ArrowUpDown, FileDown, ChevronDown, ChevronUp
} from 'lucide-react';
import { getSortedData } from '../utils/sorting';

import SearchableKeyUserSelect from '../components/SearchableKeyUserSelect';
import { useTableColumns } from '../hooks/useTableColumns';
import ColumnSelector from '../components/ColumnSelector';

const DEFAULT_PROJECT_COLUMNS = [
  { id: 'id_proyecto', label: 'Código', fixed: true, visible: true },
  { id: 'nombre_proyecto', label: 'Nombre del Proyecto', fixed: true, visible: true },
  { id: 'estado_proyecto', label: 'Estado/Fase', fixed: false, visible: true },
  { id: 'indicador_rag', label: 'RAG', fixed: false, visible: true },
  { id: 'proveedor', label: 'Socio Tecnológico', fixed: false, visible: false },
  { id: 'pm', label: 'Gestor PM', fixed: false, visible: true },
  { id: 'sede', label: 'Sede', fixed: false, visible: false },
  { id: 'fecha_inicio', label: 'Fecha de Inicio', fixed: false, visible: true },
  { id: 'fecha_fin_inicial', label: 'Fecha Fin Base', fixed: false, visible: true },
  { id: 'fecha_fin_estimada', label: 'Fecha Fin Estimada', fixed: false, visible: true },
  { id: 'budget', label: 'Presupuesto', fixed: false, visible: true },
  { id: 'progreso', label: 'Progreso Gasto', fixed: false, visible: true },
  { id: 'proximo_hito', label: 'Próximo Hito', fixed: false, visible: true },
  { id: 'accion', label: 'Acción', fixed: true, visible: true }
];

export default function Dashboard({ onViewProject, onViewVendor }) {
  const { getAuthHeaders, currentPm } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Column visibility
  const { columns: tableCols, visibleColumnsMap, toggleColumn, resetColumns } = useTableColumns('ppm-projects-columns', DEFAULT_PROJECT_COLUMNS);

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

  const handleExportExcel = () => {
    const params = new URLSearchParams();
    if (filterPm) params.append('pm', filterPm);
    if (filterVendor) params.append('vendor', filterVendor);
    if (filterRag) params.append('rag', filterRag);
    if (filterState) params.append('state', filterState);
    if (searchTerm) params.append('search', searchTerm);
    
    // Add visible columns
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
        a.download = 'Reporte_Proyectos.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(err => {
        console.error('Error al descargar el Excel:', err);
        alert(err.message);
      });
  };


  
  // Technical List Filters
  const [filterPm, setFilterPm] = useState('');
  const [filterVendor, setFilterVendor] = useState('');
  const [filterRag, setFilterRag] = useState('');
  const [filterStates, setFilterStates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isStatesOpen, setIsStatesOpen] = useState(false);

  // Dropdowns lists
  const [pmsList, setPmsList] = useState([]);
  const [vendorsList, setVendorsList] = useState([]);
  const [sedesList, setSedesList] = useState([]);
  const [keyUsersList, setKeyUsersList] = useState([]);
  const [statesList, setStatesList] = useState([]);

  // Modal creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({
    id_proyecto: '', // Empty triggers auto-generation
    nombre_proyecto: '',
    descripcion: '',
    id_pm: '',
    id_proveedor: '',
    id_sede: '',
    id_sponsor_ku: '',
    estado_proyecto: 'Kickoff',
    indicador_rag: 'VERDE',
    fecha_inicio: '',
    fecha_fin_inicial: '',
    es_capex: false,
    codigo_capex: '',
    budget_inicial: '',
    com_semanal_activo: false,
    com_semanal_finalidad: '',
    com_mensual_activo: false,
    com_mensual_finalidad: '',
    com_steerco_activo: false,
    com_steerco_finalidad: ''
  });
  const [formError, setFormError] = useState('');

  const fetchProjects = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterPm) params.append('pm', filterPm);
    if (filterVendor) params.append('vendor', filterVendor);
    if (filterRag) params.append('rag', filterRag);
    if (filterStates.length > 0) params.append('state', filterStates.join(','));
    if (searchTerm) params.append('search', searchTerm);

    fetch(`${import.meta.env.VITE_API_URL}/projects?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching technical projects list:', err);
        setLoading(false);
      });
  };

  const fetchMetadata = () => {
    fetch(`${import.meta.env.VITE_API_URL}/pms`).then(res => res.json()).then(data => setPmsList(data));
    fetch(`${import.meta.env.VITE_API_URL}/vendors`).then(res => res.json()).then(data => setVendorsList(data));
    fetch(`${import.meta.env.VITE_API_URL}/sedes`).then(res => res.json()).then(data => setSedesList(data));
    fetch(`${import.meta.env.VITE_API_URL}/key-users`).then(res => res.json()).then(data => setKeyUsersList(data));
    fetch(`${import.meta.env.VITE_API_URL}/portfolio/states`).then(res => res.json()).then(data => setStatesList(data));
  };

  useEffect(() => {
    fetchProjects();
  }, [filterPm, filterVendor, filterRag, filterStates, searchTerm]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (currentPm) {
      setNewProject(prev => ({ ...prev, id_pm: currentPm.id_usuario.toString() }));
    }
  }, [currentPm]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewProject(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCreateProject = (e) => {
    e.preventDefault();
    setFormError('');

    if (newProject.id_proyecto && newProject.id_proyecto.trim() !== '') {
      const idRegex = /^PRJ-\d{4}-\d{3}$/;
      if (!idRegex.test(newProject.id_proyecto)) {
        setFormError('El ID del proyecto debe tener el formato PRJ-YYYY-XXX o dejarse vacío.');
        return;
      }
    }

    if (newProject.es_capex && (!newProject.codigo_capex || newProject.codigo_capex.trim() === '')) {
      setFormError('El código CAPEX es obligatorio para proyectos CAPEX.');
      return;
    }

    if (!newProject.nombre_proyecto || !newProject.id_pm || !newProject.id_proveedor || !newProject.id_sede || !newProject.id_sponsor_ku || !newProject.budget_inicial) {
      setFormError('Por favor, rellene todos los campos obligatorios.');
      return;
    }

    const payload = {
      ...newProject,
      budget_inicial: parseFloat(newProject.budget_inicial),
      id_pm: parseInt(newProject.id_pm, 10),
      id_proveedor: parseInt(newProject.id_proveedor, 10),
      id_sede: parseInt(newProject.id_sede, 10),
      id_sponsor_ku: parseInt(newProject.id_sponsor_ku, 10)
    };

    if (!payload.id_proyecto || payload.id_proyecto.trim() === '') {
      delete payload.id_proyecto;
    }

    fetch(`${import.meta.env.VITE_API_URL}/projects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al guardar el proyecto');
        return data;
      })
      .then(() => {
        setShowCreateModal(false);
        fetchProjects();
        setNewProject({
          id_proyecto: '',
          nombre_proyecto: '',
          descripcion: '',
          id_pm: currentPm ? currentPm.id_usuario.toString() : '',
          id_proveedor: '',
          id_sede: '',
          id_sponsor_ku: '',
          estado_proyecto: 'Kickoff',
          indicador_rag: 'VERDE',
          fecha_inicio: '',
          fecha_fin_inicial: '',
          es_capex: false,
          codigo_capex: '',
          budget_inicial: '',
          com_semanal_activo: false,
          com_semanal_finalidad: '',
          com_mensual_activo: false,
          com_mensual_finalidad: '',
          com_steerco_activo: false,
          com_steerco_finalidad: ''
        });
      })
      .catch(err => setFormError(err.message));
  };

  const getProgressColor = (percent) => {
    if (percent > 90) return 'var(--color-rag-red)';
    if (percent > 75) return 'var(--color-rag-yellow)';
    return 'var(--md-sys-color-primary)';
  };

  return (
    <div>
      {/* Filters bar */}
      <div className="m3-card glass-panel" style={{ padding: '20px 24px', marginBottom: 24, position: 'relative', zIndex: 10, overflow: 'visible' }}>
        {/* Row 1: Search & Master Dropdowns */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--md-sys-color-outline)' }}>
            <Filter size={18} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Filtros:</span>
          </div>
        
        {/* Search */}
        <div style={{ position: 'relative', flexGrow: 1, minWidth: '180px' }}>
          <input 
            type="text" 
            placeholder="Buscar por nombre..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="m3-input"
            style={{ paddingLeft: '40px', height: '40px' }}
          />
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '11px', color: 'var(--md-sys-color-outline)' }} />
        </div>

        {/* PM filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select 
            value={filterPm} 
            onChange={(e) => setFilterPm(e.target.value)}
            className="user-select"
            style={{ width: 'auto', minWidth: '140px', height: '40px', paddingTop: 0, paddingBottom: 0 }}
          >
            <option value="">Todos los PM</option>
            {pmsList.map(p => (
              <option key={p.id_usuario} value={p.id_usuario}>{p.nombre} {p.apellidos}</option>
            ))}
          </select>
        </div>

        {/* Vendor Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select 
            value={filterVendor} 
            onChange={(e) => setFilterVendor(e.target.value)}
            className="user-select"
            style={{ width: 'auto', minWidth: '140px', height: '40px', paddingTop: 0, paddingBottom: 0 }}
          >
            <option value="">Todos los Partners</option>
            {vendorsList.map(v => (
              <option key={v.id_proveedor} value={v.id_proveedor}>{v.nombre_razon_social}</option>
            ))}
          </select>
        </div>

        {/* RAG Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select 
            value={filterRag} 
            onChange={(e) => setFilterRag(e.target.value)}
            className="user-select"
            style={{ width: 'auto', minWidth: '130px', height: '40px', paddingTop: 0, paddingBottom: 0 }}
          >
            <option value="">Todos los RAG</option>
            <option value="VERDE">VERDE 🟢</option>
            <option value="AMARILLO">AMARILLO 🟡</option>
            <option value="ROJO">ROJO 🔴</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginLeft: 'auto', position: 'relative', zIndex: 50 }}>
          <ColumnSelector columns={tableCols} toggleColumn={toggleColumn} resetColumns={resetColumns} />
          
          <button className="m3-btn m3-btn-tonal" onClick={handleExportExcel} style={{ height: '40px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileDown size={18} />
            Exportar a Excel
          </button>

          <button className="m3-btn m3-btn-primary" onClick={() => setShowCreateModal(true)} style={{ height: '40px' }}>
            <Plus size={18} />
            Crear Proyecto
          </button>
        </div>
        </div>

        {/* Separator Line */}
        <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', margin: '16px 0' }}></div>

        {/* Row 2: State Segmentation Buttons */}
        <div>
          <div 
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setIsStatesOpen(!isStatesOpen)}
          >
            <h4 style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Filtro por Estados del Proyecto
            </h4>
            {isStatesOpen ? <ChevronUp size={18} color="var(--md-sys-color-outline)" /> : <ChevronDown size={18} color="var(--md-sys-color-outline)" />}
          </div>
          
          {isStatesOpen && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    const openStates = statesList
                      .filter(s => !s.proyecto_cerrado)
                      .map(s => s.nombre_estado);
                    setFilterStates(openStates);
                  }}
                  style={{
                    borderRadius: '20px',
                    padding: '8px 16px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: '1px solid var(--md-sys-color-primary)',
                    color: 'var(--md-sys-color-primary)',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(168, 199, 250, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  📂 Proyectos abiertos
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStates([])}
                  style={{
                    borderRadius: '20px',
                    padding: '8px 16px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: 'none',
                    color: 'var(--md-sys-color-outline)',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--md-sys-color-on-surface)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--md-sys-color-outline)'}
                >
                  🧹 Limpiar selección
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {statesList.map(state => {
                  const st = state.nombre_estado;
                  const isSelected = filterStates.includes(st);
                  
                  return (
                    <div 
                      key={state.id_estado}
                      onClick={() => {
                        const newStates = isSelected 
                          ? filterStates.filter(x => x !== st) 
                          : [...filterStates, st];
                        setFilterStates(newStates);
                      }}
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
                        {projects.filter(p => p.Estado && p.Estado.nombre_estado === st).length}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Spreadsheet grid technical table (full width) */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: 16 }}>
          <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--md-sys-color-primary)' }} />
          <span>Cargando listado de proyectos...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="m3-card" style={{ textAlign: 'center', padding: '48px', color: 'var(--md-sys-color-outline)' }}>
          No se encontraron proyectos registrados.
        </div>
      ) : (
        <div className="m3-table-wrapper glass-panel">
          <table className="m3-table">
            <thead>
              <tr>
                {visibleColumnsMap.id_proyecto && renderSortHeader('Código', 'id_proyecto')}
                {visibleColumnsMap.nombre_proyecto && renderSortHeader('Nombre del Proyecto', 'nombre_proyecto')}
                {visibleColumnsMap.estado_proyecto && renderSortHeader('Estado/Fase', 'estado_proyecto')}
                {visibleColumnsMap.indicador_rag && renderSortHeader('RAG', 'indicador_rag')}
                {visibleColumnsMap.proveedor && renderSortHeader('Socio Tecnológico', 'Proveedor.nombre_razon_social')}
                {visibleColumnsMap.pm && renderSortHeader('Gestor PM', 'PM.nombre')}
                {visibleColumnsMap.sede && renderSortHeader('Sede', 'Sede.nombre_sede')}
                {visibleColumnsMap.fecha_inicio && renderSortHeader('Fecha Inicio', 'fecha_inicio')}
                {visibleColumnsMap.fecha_fin_inicial && renderSortHeader('Fecha Fin Base', 'fecha_fin_inicial')}
                {visibleColumnsMap.fecha_fin_estimada && renderSortHeader('Fecha Fin Est.', 'calculations.fecha_fin_estimada')}
                {visibleColumnsMap.budget && renderSortHeader('Presupuesto (Act. / Disp.)', 'calculations.budget_actualizado')}
                {visibleColumnsMap.progreso && renderSortHeader('Progreso Gasto', 'calculations.consumo_real')}
                {visibleColumnsMap.proximo_hito && renderSortHeader('Próximo Hito', 'nextMilestone.fecha_limite')}
                {visibleColumnsMap.accion && <th>Acción</th>}
              </tr>
            </thead>
            <tbody>
              {getSortedData(projects, sortConfig).map((project) => {
                const calc = project.calculations;
                const consumptionPercent = calc ? Math.min((calc.consumo_real / calc.budget_actualizado) * 100, 100) : 0;
                const displayedPercent = calc ? Math.round((calc.consumo_real / calc.budget_actualizado) * 100) : 0;

                return (
                  <tr key={project.id_proyecto}>
                    {/* ID */}
                    {visibleColumnsMap.id_proyecto && <td style={{ fontWeight: 700, fontSize: '0.85rem' }}>{project.id_proyecto}</td>}
                    
                    {/* Name */}
                    {visibleColumnsMap.nombre_proyecto && <td style={{ fontWeight: 600, minWidth: '180px' }}>
                      <span 
                        style={{ cursor: 'pointer', color: 'var(--md-sys-color-on-surface)' }}
                        onClick={() => onViewProject(project.id_proyecto)}
                      >
                        {project.nombre_proyecto}
                      </span>
                      {project.es_capex && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-primary)', fontWeight: 600, marginTop: 2 }}>
                          CAPEX • {project.codigo_capex}
                        </div>
                      )}
                    </td>}

                    {/* Estado */}
                    {visibleColumnsMap.estado_proyecto && <td>
                      <span className="badge" style={{ backgroundColor: 'var(--md-sys-color-surface-container-highest)', color: 'var(--md-sys-color-on-surface)', fontWeight: 600 }}>
                        {project.estado_proyecto}
                      </span>
                    </td>}

                    {/* RAG */}
                    {visibleColumnsMap.indicador_rag && <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className={`project-rag-dot ${project.indicador_rag}`} style={{ width: 10, height: 10 }}></div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{project.indicador_rag}</span>
                      </div>
                    </td>}

                    {/* Vendor */}
                    {visibleColumnsMap.proveedor && <td>
                      <span 
                        style={{ textDecoration: 'underline', cursor: 'pointer', color: 'var(--md-sys-color-primary)', fontWeight: 500 }}
                        onClick={() => onViewVendor(project.id_proveedor)}
                      >
                        {project.Proveedor?.nombre_razon_social}
                      </span>
                    </td>}

                    {/* PM */}
                    {visibleColumnsMap.pm && <td>{project.PM?.nombre} {project.PM?.apellidos}</td>}

                    {/* Sede */}
                    {visibleColumnsMap.sede && <td>{project.Sede?.nombre_sede}</td>}

                    {/* Dates */}
                    {visibleColumnsMap.fecha_inicio && <td>{project.fecha_inicio ? new Date(project.fecha_inicio).toLocaleDateString('es-ES') : '—'}</td>}
                    {visibleColumnsMap.fecha_fin_inicial && <td>{project.fecha_fin_inicial ? new Date(project.fecha_fin_inicial).toLocaleDateString('es-ES') : '—'}</td>}
                    {visibleColumnsMap.fecha_fin_estimada && <td>{calc?.fecha_fin_estimada ? new Date(calc.fecha_fin_estimada).toLocaleDateString('es-ES') : '—'}</td>}

                    {/* Budget */}
                    {visibleColumnsMap.budget && <td>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        Act: {calc?.budget_actualizado.toLocaleString('es-ES')} €
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: calc?.presupuesto_disponible < 0 ? 'var(--color-rag-red)' : 'var(--md-sys-color-outline)' 
                      }}>
                        Disp: {calc?.presupuesto_disponible.toLocaleString('es-ES')} €
                      </div>
                    </td>}

                    {/* Progress Bar */}
                    {visibleColumnsMap.progreso && <td style={{ minWidth: '120px' }}>
                      <div style={{ display: 'flex', justify: 'space-between', fontSize: '0.75rem', fontWeight: 600, marginBottom: 4 }}>
                        <span>{calc?.consumo_real.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €</span>
                        <span>{displayedPercent}%</span>
                      </div>
                      <div className="progress-track" style={{ height: 6 }}>
                        <div 
                          className="progress-fill" 
                          style={{ 
                            width: `${consumptionPercent}%`, 
                            backgroundColor: getProgressColor(displayedPercent)
                          }}
                        ></div>
                      </div>
                    </td>}

                    {/* Milestone */}
                    {visibleColumnsMap.proximo_hito && <td style={{ fontSize: '0.8rem', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {project.nextMilestone ? (
                        <div title={`${project.nextMilestone.titulo_tarea} (${project.nextMilestone.fecha_limite})`}>
                          <strong>{project.nextMilestone.titulo_tarea}</strong>
                          <div style={{ color: 'var(--md-sys-color-outline)', fontSize: '0.75rem' }}>{project.nextMilestone.fecha_limite}</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--md-sys-color-outline)' }}>Ninguno</span>
                      )}
                    </td>}

                    {/* Action */}
                    {visibleColumnsMap.accion && <td>
                      <button 
                        className="m3-btn m3-btn-tonal" 
                        onClick={() => onViewProject(project.id_proyecto)}
                        style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px' }}
                      >
                        <Eye size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        Ficha
                      </button>
                    </td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Nuevo Proyecto</h3>
              <button className="icon-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            {formError && (
              <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem', fontWeight: 500 }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateProject}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                
                {/* ID Proyecto (Opcional - Autogeneración) */}
                <div className="form-group">
                  <label className="form-label">Código Proyecto (Dejar vacío para auto-asignar)</label>
                  <input 
                    type="text" 
                    name="id_proyecto"
                    value={newProject.id_proyecto}
                    onChange={handleInputChange}
                    placeholder="Auto-generado (Ej. PRJ-2026-007)"
                    className="m3-input"
                  />
                </div>

                {/* Nombre Proyecto */}
                <div className="form-group">
                  <label className="form-label">Nombre del Proyecto *</label>
                  <input 
                    type="text" 
                    name="nombre_proyecto"
                    value={newProject.nombre_proyecto}
                    onChange={handleInputChange}
                    placeholder="Integración Plataforma..."
                    required
                    className="m3-input"
                  />
                </div>

                {/* Sede */}
                <div className="form-group">
                  <label className="form-label">Sede de Operación *</label>
                  <select 
                    name="id_sede" 
                    value={newProject.id_sede} 
                    onChange={handleInputChange}
                    required
                    className="user-select"
                  >
                    <option value="">Seleccione Sede</option>
                    {sedesList.map(s => (
                      <option key={s.id_sede} value={s.id_sede}>{s.nombre_sede}</option>
                    ))}
                  </select>
                </div>

                {/* Socio Tecnológico (Proveedor) */}
                <div className="form-group">
                  <label className="form-label">Socio Tecnológico *</label>
                  <select 
                    name="id_proveedor" 
                    value={newProject.id_proveedor} 
                    onChange={handleInputChange}
                    required
                    className="user-select"
                  >
                    <option value="">Seleccione Socio</option>
                    {vendorsList.map(v => (
                      <option key={v.id_proveedor} value={v.id_proveedor}>{v.nombre_razon_social}</option>
                    ))}
                  </select>
                </div>

                {/* Sponsor Key User */}
                <div className="form-group">
                  <label className="form-label">Sponsor / Key User Líder *</label>
                  <SearchableKeyUserSelect 
                    keyUsers={keyUsersList}
                    selected={newProject.id_sponsor_ku}
                    onChange={(val) => setNewProject(prev => ({ ...prev, id_sponsor_ku: val }))}
                    multiple={false}
                    placeholder="Seleccione Sponsor / Key User Líder..."
                  />
                </div>

                {/* Gestor PM */}
                <div className="form-group">
                  <label className="form-label">PM Asignado *</label>
                  <select 
                    name="id_pm" 
                    value={newProject.id_pm} 
                    onChange={handleInputChange}
                    required
                    className="user-select"
                  >
                    <option value="">Seleccione PM</option>
                    {pmsList.map(p => (
                      <option key={p.id_usuario} value={p.id_usuario}>{p.nombre} {p.apellidos}</option>
                    ))}
                  </select>
                </div>

                {/* Fecha Inicio */}
                <div className="form-group">
                  <label className="form-label">Fecha de Inicio *</label>
                  <input 
                    type="date" 
                    name="fecha_inicio"
                    value={newProject.fecha_inicio}
                    onChange={handleInputChange}
                    required
                    className="m3-input"
                  />
                </div>

                {/* Fecha Fin Inicial */}
                <div className="form-group">
                  <label className="form-label">Fecha Fin Inicial (Línea Base) *</label>
                  <input 
                    type="date" 
                    name="fecha_fin_inicial"
                    value={newProject.fecha_fin_inicial}
                    onChange={handleInputChange}
                    required
                    className="m3-input"
                  />
                </div>

                {/* Presupuesto Inicial */}
                <div className="form-group">
                  <label className="form-label">Presupuesto Inicial (€) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    name="budget_inicial"
                    value={newProject.budget_inicial}
                    onChange={handleInputChange}
                    placeholder="150000.00"
                    required
                    className="m3-input"
                  />
                </div>

                {/* RAG */}
                <div className="form-group">
                  <label className="form-label">Indicador RAG inicial *</label>
                  <select 
                    name="indicador_rag" 
                    value={newProject.indicador_rag} 
                    onChange={handleInputChange}
                    className="user-select"
                  >
                    <option value="VERDE">VERDE</option>
                    <option value="AMARILLO">AMARILLO</option>
                    <option value="ROJO">ROJO</option>
                  </select>
                </div>

                {/* CAPEX switches */}
                <div className="form-group" style={{ gridColumn: 'span 2', justifyContent: 'center' }}>
                  <label className="m3-checkbox-label">
                    <input 
                      type="checkbox" 
                      name="es_capex"
                      checked={newProject.es_capex}
                      onChange={handleInputChange}
                      className="m3-checkbox"
                    />
                    <span>¿Es Proyecto CAPEX?</span>
                  </label>
                </div>

                {/* CAPEX Code */}
                {newProject.es_capex && (
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Código CAPEX *</label>
                    <input 
                      type="text" 
                      name="codigo_capex"
                      value={newProject.codigo_capex}
                      onChange={handleInputChange}
                      placeholder="CPX-XXXXXX"
                      required={newProject.es_capex}
                      className="m3-input"
                    />
                  </div>
                )}
              </div>

              {/* Descripción */}
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Descripción del Proyecto *</label>
                <textarea 
                  name="descripcion"
                  value={newProject.descripcion}
                  onChange={handleInputChange}
                  placeholder="Detalles sobre el alcance, objetivos..."
                  required
                  rows={3}
                  className="m3-input"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="m3-btn m3-btn-outline" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="m3-btn m3-btn-primary">
                  Registrar Proyecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
