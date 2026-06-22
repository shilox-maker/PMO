import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, FileText, Target, Trophy, DollarSign, TrendingUp, ShieldAlert, MessageSquare, CheckSquare, BookOpen, Printer, Edit2, ArrowUp, ArrowDown, ArrowUpDown, RefreshCw 
} from 'lucide-react';

// Import Modals
import ProjectEditModal from '../components/modals/ProjectEditModal';
import InvoiceModal from '../components/modals/InvoiceModal';
import CrModal from '../components/modals/CrModal';
import RiskModal from '../components/modals/RiskModal';
import IssueModal from '../components/modals/IssueModal';
import TaskModal from '../components/modals/TaskModal';
import LessonModal from '../components/modals/LessonModal';
import ReportModal from '../components/modals/ReportModal';
import RaciModal from '../components/modals/RaciModal';

// Import Tabs
import ProjectFichaTab from './project-detail/tabs/ProjectFichaTab';
import ProjectAlcanceTab from './project-detail/tabs/ProjectAlcanceTab';
import ProjectFinanzasTab from './project-detail/tabs/ProjectFinanzasTab';
import ProjectCambiosTab from './project-detail/tabs/ProjectCambiosTab';
import ProjectRiesgosTab from './project-detail/tabs/ProjectRiesgosTab';
import ProjectComunicacionesTab from './project-detail/tabs/ProjectComunicacionesTab';
import ProjectChecklistTab from './project-detail/tabs/ProjectChecklistTab';
import ProjectLeccionesTab from './project-detail/tabs/ProjectLeccionesTab';

export default function ProjectDetail({ projectId, onBack, onViewVendor }) {
  const { getAuthHeaders, currentPm } = useAuth();
  const canSeeDireccion = currentPm && (currentPm.perfil === 'ADMINISTRADOR' || currentPm.perfil === 'DIRECTOR');
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ficha');

  // Sorting configs
  const [invoicesSort, setInvoicesSort] = useState({ key: 'id_interno_factura', direction: 'desc' });
  const [crSort, setCrSort] = useState({ key: 'id_cambio', direction: 'desc' });
  const [issuesSort, setIssuesSort] = useState({ key: 'id_incidencia', direction: 'desc' });
  const [risksSort, setRisksSort] = useState({ key: 'id_riesgo', direction: 'desc' });
  const [tasksSort, setTasksSort] = useState({ key: 'fecha_limite', direction: 'asc' });
  const [lessonsSort, setLessonsSort] = useState({ key: 'fecha_registro', direction: 'desc' });

  // Metadata list for dropdowns
  const [sedes, setSedes] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [contactosList, setContactosList] = useState([]);
  const [pms, setPms] = useState([]);
  const [workflowStates, setWorkflowStates] = useState([]);

  // Comments states
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [newCommentImportant, setNewCommentImportant] = useState(false);
  const [newCommentDireccion, setNewCommentDireccion] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [editingCommentImportant, setEditingCommentImportant] = useState(false);
  const [editingCommentDireccion, setEditingCommentDireccion] = useState(false);

  // Modals Visibility
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showCrModal, setShowCrModal] = useState(false);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showRaciModal, setShowRaciModal] = useState(false);

  // Modals Editing Selection
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editingCr, setEditingCr] = useState(null);
  const [editingRisk, setEditingRisk] = useState(null);
  const [editingIssue, setEditingIssue] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [editingParticipant, setEditingParticipant] = useState(null);

  // Inline editing for Alcance/Cierre blocks
  const [editingBlock, setEditingBlock] = useState(null);
  const [blockValue, setBlockValue] = useState('');

  // Lifecycle Dates Editing State
  const [isEditingLifecycle, setIsEditingLifecycle] = useState(false);
  const [lifecycleForm, setLifecycleForm] = useState({
    fecha_peticion: '', fecha_alcance_definido: '', fecha_aprobacion: '',
    fecha_planificacion: '', fecha_kickoff: '', fecha_go_live: '', fecha_cierre: ''
  });

  const renderSortHeader = (label, key, sortConfig, setSortConfig, extraStyle = {}) => {
    const isSorted = sortConfig.key === key;
    return (
      <th 
        onClick={() => setSortConfig(prev => ({
          key,
          direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }))} 
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

  const fetchProjectData = () => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        setProject(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching project detail:', err);
        setLoading(false);
      });
  };

  const fetchComments = () => {
    setCommentsLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}/comments`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        setComments(data);
        setCommentsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching comments:', err);
        setCommentsLoading(false);
      });
  };

  const fetchMetadata = () => {
    fetch(`${import.meta.env.VITE_API_URL}/sedes`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setSedes(data));
    fetch(`${import.meta.env.VITE_API_URL}/vendors`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setVendors(data));
    fetch(`${import.meta.env.VITE_API_URL}/contactos`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setContactosList(data));
    fetch(`${import.meta.env.VITE_API_URL}/pms`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setPms(data));
    fetch(`${import.meta.env.VITE_API_URL}/portfolio/states`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setWorkflowStates(data));
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
      fetchMetadata();
      fetchComments();
    }
  }, [projectId]);

  // General Updates
  const handleUpdateProject = (fieldsToUpdate) => {
    fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(fieldsToUpdate)
    })
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Error al actualizar el proyecto');
        return d;
      })
      .then(() => fetchProjectData())
      .catch(err => alert(err.message));
  };

  // Block Saving
  const handleSaveBlock = (fieldName) => {
    fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ [fieldName]: blockValue })
    })
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Error al guardar el bloque');
        return d;
      })
      .then(() => {
        setEditingBlock(null);
        fetchProjectData();
      })
      .catch(err => alert(err.message));
  };

  // Lifecycle save
  const handleOpenEditLifecycle = () => {
    setLifecycleForm({
      fecha_peticion: project.fecha_peticion || '',
      fecha_alcance_definido: project.fecha_alcance_definido || '',
      fecha_aprobacion: project.fecha_aprobacion || '',
      fecha_planificacion: project.fecha_planificacion || '',
      fecha_kickoff: project.fecha_kickoff || '',
      fecha_go_live: project.fecha_go_live || '',
      fecha_cierre: project.fecha_cierre || ''
    });
    setIsEditingLifecycle(true);
  };

  const handleSaveLifecycle = (e) => {
    if (e) e.preventDefault();
    fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(lifecycleForm)
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Error al guardar hitos del ciclo de vida');
        return res.json();
      })
      .then(() => {
        setIsEditingLifecycle(false);
        fetchProjectData();
      })
      .catch(err => alert(err.message));
  };

  // RACI triggers
  const handleOpenAddRaci = (kuId) => {
    const contact = contactosList.find(k => Number(k.id_contacto) === Number(kuId));
    if (!contact) return;
    setEditingParticipant(null);
    setEditingParticipant(contact);
    setShowRaciModal(true);
  };

  const handleOpenEditRaci = (ku) => {
    setEditingParticipant(ku);
    setShowRaciModal(true);
  };

  const handleDeleteParticipant = (kuId) => {
    if (!window.confirm('¿Seguro que desea retirar a este participante del proyecto?')) return;
    fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}/participants/${kuId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Error al eliminar participante');
        return res.json();
      })
      .then(() => fetchProjectData())
      .catch(err => alert(err.message));
  };

  // Comments triggers
  const handleAddComment = () => {
    if (!newCommentText || newCommentText.trim() === '' || newCommentText === '<br>') return;
    fetch(`${import.meta.env.VITE_API_URL}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        id_proyecto: projectId,
        texto_comentario: newCommentText,
        es_importante: newCommentImportant,
        para_direccion: newCommentDireccion
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al publicar comentario');
        return res.json();
      })
      .then(() => {
        setNewCommentText('');
        setNewCommentImportant(false);
        setNewCommentDireccion(false);
        fetchComments();
      })
      .catch(err => alert(err.message));
  };

  const handleUpdateComment = (id) => {
    if (!editingCommentText || editingCommentText.trim() === '' || editingCommentText === '<br>') return;
    fetch(`${import.meta.env.VITE_API_URL}/comments/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        texto_comentario: editingCommentText,
        es_importante: editingCommentImportant,
        para_direccion: editingCommentDireccion
      })
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al actualizar comentario');
        return res.json();
      })
      .then(() => {
        setEditingCommentId(null);
        setEditingCommentText('');
        setEditingCommentImportant(false);
        setEditingCommentDireccion(false);
        fetchComments();
      })
      .catch(err => alert(err.message));
  };

  const handleDeleteComment = (id) => {
    if (!window.confirm('¿Seguro que desea eliminar este comentario?')) return;
    fetch(`${import.meta.env.VITE_API_URL}/comments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al eliminar comentario');
        return res.json();
      })
      .then(() => fetchComments())
      .catch(err => alert(err.message));
  };

  // Invoices triggers
  const openAddInvoice = () => {
    setEditingInvoice(null);
    setShowInvoiceModal(true);
  };
  const openEditInvoice = (fac) => {
    setEditingInvoice(fac);
    setShowInvoiceModal(true);
  };
  const handleDeleteInvoice = (facId) => {
    if (!window.confirm('¿Seguro que desea eliminar este cobro/factura?')) return;
    fetch(`${import.meta.env.VITE_API_URL}/invoices/${facId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then(() => fetchProjectData())
      .catch(err => console.error(err));
  };

  // CR triggers
  const openAddCr = () => {
    setEditingCr(null);
    setShowCrModal(true);
  };
  const openEditCr = (cr) => {
    setEditingCr(cr);
    setShowCrModal(true);
  };

  // Risks triggers
  const openAddRisk = () => {
    setEditingRisk(null);
    setShowRiskModal(true);
  };
  const openEditRisk = (rsg) => {
    setEditingRisk(rsg);
    setShowRiskModal(true);
  };
  const handleToggleRiskState = (riskId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVO' ? 'CERRADO' : 'ACTIVO';
    fetch(`${import.meta.env.VITE_API_URL}/risks/${riskId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ estado_riesgo: nextStatus })
    })
      .then(() => fetchProjectData())
      .catch(err => console.error(err));
  };

  // Issues triggers
  const openAddIssue = () => {
    setEditingIssue(null);
    setShowIssueModal(true);
  };
  const openEditIssue = (inc) => {
    setEditingIssue(inc);
    setShowIssueModal(true);
  };

  // Tasks triggers
  const openAddTask = () => {
    setEditingTask(null);
    setShowTaskModal(true);
  };
  const openEditTask = (task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };
  const handleToggleTask = (taskId, currentState) => {
    const nextState = currentState === 'PENDIENTE' ? 'COMPLETADA' : 'PENDIENTE';
    fetch(`${import.meta.env.VITE_API_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ estado: nextState })
    })
      .then(() => fetchProjectData())
      .catch(err => console.error(err));
  };
  const handleDeleteTask = (taskId) => {
    if (!window.confirm('¿Seguro que desea eliminar esta tarea checklist?')) return;
    fetch(`${import.meta.env.VITE_API_URL}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then(() => fetchProjectData())
      .catch(err => console.error(err));
  };

  // Lessons triggers
  const openAddLesson = () => {
    setEditingLesson(null);
    setShowLessonModal(true);
  };
  const openEditLesson = (les) => {
    setEditingLesson(les);
    setShowLessonModal(true);
  };
  const handleDeleteLesson = (lessonId) => {
    if (!window.confirm('¿Seguro que desea eliminar esta lección?')) return;
    fetch(`${import.meta.env.VITE_API_URL}/lessons/${lessonId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then(() => fetchProjectData())
      .catch(err => console.error(err));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: 16 }}>
        <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--md-sys-color-primary)' }} />
        <span>Cargando ficha de gobernanza de proyecto...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="m3-card" style={{ textAlign: 'center', padding: 32 }}>
        No se pudo recuperar la ficha del proyecto.
        <button className="m3-btn m3-btn-primary" onClick={onBack} style={{ marginTop: 16 }}>
          <ArrowLeft size={16} /> Volver
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header with actions & switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="icon-btn" onClick={onBack}>
            <ArrowLeft size={22} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="project-id-badge">{project.id_proyecto}</span>
              {project.es_capex ? (
                <span className="badge badge-blue">CAPEX: {project.codigo_capex || 'Pendiente'}</span>
              ) : (
                <span className="badge badge-orange">OPEX</span>
              )}
              {project.Estado && (
                <span className="badge" style={{ backgroundColor: 'var(--md-sys-color-surface-container-highest)', color: 'var(--md-sys-color-on-surface)', fontWeight: 600 }}>
                  {project.Estado.icono || ''} {project.Estado.nombre_estado}
                </span>
              )}
            </div>
            <h2 className="page-title" style={{ marginTop: 4 }}>{project.nombre_proyecto}</h2>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <button 
            className="m3-btn" 
            onClick={() => setShowReportModal(true)}
            style={{ 
              background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
              color: '#fff', 
              border: 'none',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
            title="Generar informe ejecutivo del proyecto"
          >
            <Printer size={16} />
            <span>Informe</span>
          </button>

          <button className="m3-btn m3-btn-primary" onClick={() => setShowEditProjectModal(true)}>
            <Edit2 size={16} />
            Editar Proyecto
          </button>

          {/* RAG select quick control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--md-sys-color-outline)' }}>RAG:</span>
            <select 
              value={project.indicador_rag}
              onChange={(e) => handleUpdateProject({ indicador_rag: e.target.value })}
              className="user-select"
              style={{ width: 'auto', padding: '6px 12px', height: '36px' }}
            >
              <option value="VERDE">VERDE 🟢</option>
              <option value="AMARILLO">AMARILLO 🟡</option>
              <option value="ROJO">ROJO 🔴</option>
            </select>
          </div>

          {/* Estado Workflow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--md-sys-color-outline)' }}>Fase:</span>
            <select 
              value={project.id_estado || ''}
              onChange={(e) => handleUpdateProject({ id_estado: parseInt(e.target.value, 10) })}
              className="user-select"
              style={{ width: 'auto', padding: '6px 12px', height: '36px' }}
            >
              {workflowStates.map(state => (
                <option key={state.id_estado} value={state.id_estado}>
                  {state.icono} {state.nombre_estado}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs list */}
      <div className="m3-tabs-container">
        <button className={`m3-tab ${activeTab === 'ficha' ? 'active' : ''}`} onClick={() => setActiveTab('ficha')}>
          <FileText size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Ficha General
        </button>
        <button className={`m3-tab ${activeTab === 'alcance' ? 'active' : ''}`} onClick={() => setActiveTab('alcance')}>
          <Target size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Alcance y Cierre
        </button>
        <button className={`m3-tab ${activeTab === 'finanzas' ? 'active' : ''}`} onClick={() => setActiveTab('finanzas')}>
          <DollarSign size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Control Financiero
        </button>
        <button className={`m3-tab ${activeTab === 'cambios' ? 'active' : ''}`} onClick={() => setActiveTab('cambios')}>
          <TrendingUp size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Cambios de Alcance (CR)
        </button>
        <button className={`m3-tab ${activeTab === 'riesgos' ? 'active' : ''}`} onClick={() => setActiveTab('riesgos')}>
          <ShieldAlert size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Riesgos e Incidencias
        </button>
        <button className={`m3-tab ${activeTab === 'comunicaciones' ? 'active' : ''}`} onClick={() => setActiveTab('comunicaciones')}>
          <MessageSquare size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Comunicaciones
        </button>
        <button className={`m3-tab ${activeTab === 'checklist' ? 'active' : ''}`} onClick={() => setActiveTab('checklist')}>
          <CheckSquare size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Checklist PM
        </button>
        <button className={`m3-tab ${activeTab === 'lecciones' ? 'active' : ''}`} onClick={() => setActiveTab('lecciones')}>
          <BookOpen size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Lecciones Aprendidas
        </button>
      </div>

      {/* Tab Panels */}
      <div className="content-panel" style={{ marginTop: 8 }}>
        {activeTab === 'ficha' && (
          <ProjectFichaTab 
            project={project} comments={comments} commentsLoading={commentsLoading}
            newCommentText={newCommentText} setNewCommentText={setNewCommentText}
            newCommentImportant={newCommentImportant} setNewCommentImportant={setNewCommentImportant}
            newCommentDireccion={newCommentDireccion} setNewCommentDireccion={setNewCommentDireccion}
            handleAddComment={handleAddComment} handleDeleteComment={handleDeleteComment}
            editingCommentId={editingCommentId} setEditingCommentId={setEditingCommentId}
            editingCommentText={editingCommentText} setEditingCommentText={setEditingCommentText}
            editingCommentImportant={editingCommentImportant} setEditingCommentImportant={setEditingCommentImportant}
            editingCommentDireccion={editingCommentDireccion} setEditingCommentDireccion={setEditingCommentDireccion}
            handleUpdateComment={handleUpdateComment} isEditingLifecycle={isEditingLifecycle}
            handleOpenEditLifecycle={handleOpenEditLifecycle} handleDeleteParticipant={handleDeleteParticipant}
            handleOpenAddRaci={handleOpenAddRaci} handleOpenEditRaci={handleOpenEditRaci}
            onViewVendor={onViewVendor} contactosList={contactosList}
            canSeeDireccion={canSeeDireccion}
          />
        )}

        {activeTab === 'alcance' && (
          <ProjectAlcanceTab 
            project={project} editingBlock={editingBlock} setEditingBlock={setEditingBlock}
            blockValue={blockValue} setBlockValue={setBlockValue} handleSaveBlock={handleSaveBlock}
          />
        )}

        {activeTab === 'finanzas' && (
          <ProjectFinanzasTab 
            project={project} openAddInvoice={openAddInvoice} openEditInvoice={openEditInvoice}
            handleDeleteInvoice={handleDeleteInvoice} invoicesSort={invoicesSort}
            setInvoicesSort={setInvoicesSort} renderSortHeader={renderSortHeader}
          />
        )}

        {activeTab === 'cambios' && (
          <ProjectCambiosTab 
            project={project} openAddCr={openAddCr} openEditCr={openEditCr}
            crSort={crSort} setCrSort={setCrSort} renderSortHeader={renderSortHeader}
          />
        )}

        {activeTab === 'riesgos' && (
          <ProjectRiesgosTab 
            project={project} openAddRisk={openAddRisk} openEditRisk={openEditRisk}
            handleToggleRiskState={handleToggleRiskState} openAddIssue={openAddIssue}
            openEditIssue={openEditIssue} risksSort={risksSort} setRisksSort={setRisksSort}
            issuesSort={issuesSort} setIssuesSort={setIssuesSort} renderSortHeader={renderSortHeader}
          />
        )}

        {activeTab === 'comunicaciones' && (
          <ProjectComunicacionesTab 
            project={project} 
            handleUpdateProject={handleUpdateProject} 
          />
        )}

        {activeTab === 'checklist' && (
          <ProjectChecklistTab 
            project={project} openAddTask={openAddTask} openEditTask={openEditTask}
            handleToggleTask={handleToggleTask} handleDeleteTask={handleDeleteTask}
            tasksSort={tasksSort} setTasksSort={setTasksSort} renderSortHeader={renderSortHeader}
          />
        )}

        {activeTab === 'lecciones' && (
          <ProjectLeccionesTab 
            project={project} openAddLesson={openAddLesson} openEditLesson={openEditLesson}
            handleDeleteLesson={handleDeleteLesson} lessonsSort={lessonsSort}
            setLessonsSort={setLessonsSort} renderSortHeader={renderSortHeader}
          />
        )}
      </div>

      {/* Modals Mounting */}
      <ProjectEditModal 
        isOpen={showEditProjectModal} onClose={() => setShowEditProjectModal(false)}
        project={project} getAuthHeaders={getAuthHeaders} onSuccess={fetchProjectData}
        sedes={sedes} vendors={vendors} contactosList={contactosList} pms={pms} workflowStates={workflowStates}
      />

      <InvoiceModal 
        isOpen={showInvoiceModal} onClose={() => setShowInvoiceModal(false)}
        projectId={projectId} editingInvoice={editingInvoice} getAuthHeaders={getAuthHeaders}
        onSuccess={fetchProjectData} vendors={vendors}
      />

      <CrModal 
        isOpen={showCrModal} onClose={() => setShowCrModal(false)}
        projectId={projectId} editingCr={editingCr} getAuthHeaders={getAuthHeaders}
        onSuccess={fetchProjectData} contactosList={contactosList}
      />

      <RiskModal 
        isOpen={showRiskModal} onClose={() => setShowRiskModal(false)}
        projectId={projectId} editingRisk={editingRisk} getAuthHeaders={getAuthHeaders}
        onSuccess={fetchProjectData}
      />

      <IssueModal 
        isOpen={showIssueModal} onClose={() => setShowIssueModal(false)}
        projectId={projectId} editingIssue={editingIssue} getAuthHeaders={getAuthHeaders}
        onSuccess={fetchProjectData}
      />

      <TaskModal 
        isOpen={showTaskModal} onClose={() => setShowTaskModal(false)}
        projectId={projectId} editingTask={editingTask} getAuthHeaders={getAuthHeaders}
        onSuccess={fetchProjectData}
      />

      <LessonModal 
        isOpen={showLessonModal} onClose={() => setShowLessonModal(false)}
        projectId={projectId} editingLesson={editingLesson} getAuthHeaders={getAuthHeaders}
        onSuccess={fetchProjectData}
      />

      <ReportModal 
        isOpen={showReportModal} onClose={() => setShowReportModal(false)}
        project={project} comments={comments}
      />

      <RaciModal 
        isOpen={showRaciModal} onClose={() => setShowRaciModal(false)}
        projectId={projectId} editingParticipant={editingParticipant} getAuthHeaders={getAuthHeaders}
        onSuccess={fetchProjectData} contactosList={contactosList}
      />

      {/* Lifecycle Modal Inline Edit */}
      {isEditingLifecycle && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Hitos del Ciclo de Vida</h3>
              <button className="icon-btn" onClick={() => setIsEditingLifecycle(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveLifecycle}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '16px 0' }}>
                <div className="form-group">
                  <label className="form-label">Fecha de Petición</label>
                  <input type="date" value={lifecycleForm.fecha_peticion} onChange={(e) => setLifecycleForm({ ...lifecycleForm, fecha_peticion: e.target.value })} className="m3-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha de Alcance Definido</label>
                  <input type="date" value={lifecycleForm.fecha_alcance_definido} onChange={(e) => setLifecycleForm({ ...lifecycleForm, fecha_alcance_definido: e.target.value })} className="m3-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha de Aprobación</label>
                  <input type="date" value={lifecycleForm.fecha_aprobacion} onChange={(e) => setLifecycleForm({ ...lifecycleForm, fecha_aprobacion: e.target.value })} className="m3-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha de Planificación</label>
                  <input type="date" value={lifecycleForm.fecha_planificacion} onChange={(e) => setLifecycleForm({ ...lifecycleForm, fecha_planificacion: e.target.value })} className="m3-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha de Kickoff</label>
                  <input type="date" value={lifecycleForm.fecha_kickoff} onChange={(e) => setLifecycleForm({ ...lifecycleForm, fecha_kickoff: e.target.value })} className="m3-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha de Go-Live</label>
                  <input type="date" value={lifecycleForm.fecha_go_live} onChange={(e) => setLifecycleForm({ ...lifecycleForm, fecha_go_live: e.target.value })} className="m3-input" />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Fecha de Cierre</label>
                  <input type="date" value={lifecycleForm.fecha_cierre} onChange={(e) => setLifecycleForm({ ...lifecycleForm, fecha_cierre: e.target.value })} className="m3-input" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="m3-btn m3-btn-outline" onClick={() => setIsEditingLifecycle(false)}>Cancelar</button>
                <button type="submit" className="m3-btn m3-btn-primary">Guardar Hitos</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
