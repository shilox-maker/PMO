import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

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

// Import Tabs & Header
import ProjectDetailHeader from './project-detail/ProjectDetailHeader';
import ProjectDetailTabsNav from './project-detail/ProjectDetailTabsNav';
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
  const [portfoliosList, setPortfoliosList] = useState([]);
  const [capexTypes, setCapexTypes] = useState([]);

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

  const fetchProjectData = (showLoadingState = false) => {
    if (showLoadingState) setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}`, { headers: getAuthHeaders() })
      .then(res => res.json())
      .then(data => {
        setProject(data);
        if (showLoadingState) setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching project detail:', err);
        if (showLoadingState) setLoading(false);
      });
  };

  const fetchComments = () => {
    setCommentsLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}/comments`, { headers: getAuthHeaders() })
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
    fetch(`${import.meta.env.VITE_API_URL}/portfolios`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setPortfoliosList(data));
    fetch(`${import.meta.env.VITE_API_URL}/capex-types`, { headers: getAuthHeaders() }).then(res => res.json()).then(data => setCapexTypes(data));
  };

  useEffect(() => {
    if (projectId) {
      fetchProjectData(true);
      fetchMetadata();
      fetchComments();
    }
  }, [projectId]);

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
      .then(() => fetchProjectData());
  };

  const handleDeleteProject = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este proyecto de forma permanente?')) {
      fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
        .then(async (res) => {
          const d = await res.json();
          if (!res.ok) throw new Error(d.error || 'Error al eliminar el proyecto');
          alert('Proyecto eliminado con éxito');
          if (onBack) onBack();
        })
        .catch(err => alert(err.message));
    }
  };

  const handleOpenAddRaci = (val) => {
    setEditingParticipant({ id_contacto: val });
    setShowRaciModal(true);
  };

  const handleOpenEditRaci = (ku) => {
    setEditingParticipant(ku);
    setShowRaciModal(true);
  };

  const handleDeleteParticipant = (contactId) => {
    if (window.confirm('¿Eliminar participante RACI del proyecto?')) {
      fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}/raci/${contactId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
        .then(() => fetchProjectData());
    }
  };

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

  const handleAddComment = () => {
    if (!newCommentText || !newCommentText.trim()) return;
    fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        texto_comentario: newCommentText,
        es_importante: newCommentImportant,
        para_direccion: newCommentDireccion
      })
    })
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Error al publicar comentario');
        return d;
      })
      .then(() => {
        setNewCommentText('');
        setNewCommentImportant(false);
        setNewCommentDireccion(false);
        fetchComments();
      })
      .catch(err => alert(err.message));
  };

  const handleUpdateComment = (commentId) => {
    fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}/comments/${commentId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        texto_comentario: editingCommentText,
        es_importante: editingCommentImportant,
        para_direccion: editingCommentDireccion
      })
    })
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Error al actualizar comentario');
        return d;
      })
      .then(() => {
        setEditingCommentId(null);
        fetchComments();
      })
      .catch(err => alert(err.message));
  };

  const handleDeleteComment = (commentId) => {
    if (window.confirm('¿Seguro que deseas eliminar este comentario?')) {
      fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
        .then(() => fetchComments());
    }
  };

  if (loading || !project) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--md-sys-color-primary)' }} />
      </div>
    );
  }

  const calc = project.calculations;

  return (
    <div>
      {/* Header */}
      <ProjectDetailHeader 
        project={project}
        onBack={onBack}
        setShowEditProjectModal={setShowEditProjectModal}
        setShowReportModal={setShowReportModal}
        handleDeleteProject={handleDeleteProject}
        workflowStates={workflowStates}
        handleUpdateProject={handleUpdateProject}
        currentPm={currentPm}
        calc={calc}
      />

      {/* Tabs Navigation */}
      <ProjectDetailTabsNav 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        project={project}
      />

      {/* Active Tab Content */}
      {activeTab === 'ficha' && (
        <ProjectFichaTab 
          project={project}
          comments={comments}
          commentsLoading={commentsLoading}
          newCommentText={newCommentText}
          setNewCommentText={setNewCommentText}
          newCommentImportant={newCommentImportant}
          setNewCommentImportant={setNewCommentImportant}
          newCommentDireccion={newCommentDireccion}
          setNewCommentDireccion={setNewCommentDireccion}
          handleAddComment={handleAddComment}
          handleDeleteComment={handleDeleteComment}
          editingCommentId={editingCommentId}
          setEditingCommentId={setEditingCommentId}
          editingCommentText={editingCommentText}
          setEditingCommentText={setEditingCommentText}
          editingCommentImportant={editingCommentImportant}
          setEditingCommentImportant={setEditingCommentImportant}
          editingCommentDireccion={editingCommentDireccion}
          setEditingCommentDireccion={setEditingCommentDireccion}
          handleUpdateComment={handleUpdateComment}
          isEditingLifecycle={isEditingLifecycle}
          handleOpenEditLifecycle={handleOpenEditLifecycle}
          handleDeleteParticipant={handleDeleteParticipant}
          handleOpenAddRaci={handleOpenAddRaci}
          handleOpenEditRaci={handleOpenEditRaci}
          onViewVendor={onViewVendor}
          contactosList={contactosList}
          canSeeDireccion={canSeeDireccion}
          getAuthHeaders={getAuthHeaders}
          handleUpdateProject={handleUpdateProject}
        />
      )}

      {activeTab === 'alcance' && (
        <ProjectAlcanceTab 
          project={project}
          editingBlock={editingBlock}
          setEditingBlock={setEditingBlock}
          blockValue={blockValue}
          setBlockValue={setBlockValue}
          handleSaveBlock={(fn) => {
            fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}`, {
              method: 'PUT',
              headers: getAuthHeaders(),
              body: JSON.stringify({ [fn]: blockValue })
            }).then(() => { setEditingBlock(null); fetchProjectData(); });
          }}
        />
      )}

      {activeTab === 'finanzas' && (
        <ProjectFinanzasTab 
          project={project}
          invoicesSort={invoicesSort}
          setInvoicesSort={setInvoicesSort}
          renderSortHeader={renderSortHeader}
          setShowInvoiceModal={setShowInvoiceModal}
          setEditingInvoice={setEditingInvoice}
          fetchProjectData={fetchProjectData}
          getAuthHeaders={getAuthHeaders}
        />
      )}

      {activeTab === 'cambios' && (
        <ProjectCambiosTab 
          project={project}
          crSort={crSort}
          setCrSort={setCrSort}
          renderSortHeader={renderSortHeader}
          setShowCrModal={setShowCrModal}
          setEditingCr={setEditingCr}
          fetchProjectData={fetchProjectData}
          getAuthHeaders={getAuthHeaders}
        />
      )}

      {activeTab === 'riesgos' && (
        <ProjectRiesgosTab 
          project={project}
          risksSort={risksSort}
          setRisksSort={setRisksSort}
          issuesSort={issuesSort}
          setIssuesSort={setIssuesSort}
          renderSortHeader={renderSortHeader}
          setShowRiskModal={setShowRiskModal}
          setEditingRisk={setEditingRisk}
          setShowIssueModal={setShowIssueModal}
          setEditingIssue={setEditingIssue}
          fetchProjectData={fetchProjectData}
          getAuthHeaders={getAuthHeaders}
        />
      )}

      {activeTab === 'comunicaciones' && (
        <ProjectComunicacionesTab 
          project={project}
          contactosList={contactosList}
          getAuthHeaders={getAuthHeaders}
          handleUpdateProject={handleUpdateProject}
        />
      )}

      {activeTab === 'checklist' && (
        <ProjectChecklistTab 
          project={project}
          tasksSort={tasksSort}
          setTasksSort={setTasksSort}
          renderSortHeader={renderSortHeader}
          setShowTaskModal={setShowTaskModal}
          setEditingTask={setEditingTask}
          fetchProjectData={fetchProjectData}
          getAuthHeaders={getAuthHeaders}
        />
      )}

      {activeTab === 'lecciones' && (
        <ProjectLeccionesTab 
          project={project}
          lessonsSort={lessonsSort}
          setLessonsSort={setLessonsSort}
          renderSortHeader={renderSortHeader}
          setShowLessonModal={setShowLessonModal}
          setEditingLesson={setEditingLesson}
          fetchProjectData={fetchProjectData}
          getAuthHeaders={getAuthHeaders}
        />
      )}

      {/* Modals */}
      {showEditProjectModal && (
        <ProjectEditModal 
          isOpen={showEditProjectModal}
          onClose={() => setShowEditProjectModal(false)}
          project={project}
          sedes={sedes}
          vendors={vendors}
          contactosList={contactosList}
          pms={pms}
          workflowStates={workflowStates}
          portfoliosList={portfoliosList}
          capexTypes={capexTypes}
          getAuthHeaders={getAuthHeaders}
          onSuccess={fetchProjectData}
        />
      )}

      {showRaciModal && (
        <RaciModal 
          isOpen={showRaciModal}
          onClose={() => setShowRaciModal(false)}
          projectId={projectId}
          participant={editingParticipant}
          contactosList={contactosList}
          getAuthHeaders={getAuthHeaders}
          onSuccess={fetchProjectData}
        />
      )}

      {showInvoiceModal && (
        <InvoiceModal 
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          projectId={projectId}
          invoice={editingInvoice}
          vendors={vendors}
          getAuthHeaders={getAuthHeaders}
          onSuccess={fetchProjectData}
        />
      )}

      {showCrModal && (
        <CrModal 
          isOpen={showCrModal}
          onClose={() => setShowCrModal(false)}
          projectId={projectId}
          cr={editingCr}
          getAuthHeaders={getAuthHeaders}
          onSuccess={fetchProjectData}
        />
      )}

      {showRiskModal && (
        <RiskModal 
          isOpen={showRiskModal}
          onClose={() => setShowRiskModal(false)}
          projectId={projectId}
          risk={editingRisk}
          getAuthHeaders={getAuthHeaders}
          onSuccess={fetchProjectData}
        />
      )}

      {showIssueModal && (
        <IssueModal 
          isOpen={showIssueModal}
          onClose={() => setShowIssueModal(false)}
          projectId={projectId}
          issue={editingIssue}
          getAuthHeaders={getAuthHeaders}
          onSuccess={fetchProjectData}
        />
      )}

      {showTaskModal && (
        <TaskModal 
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          projectId={projectId}
          task={editingTask}
          getAuthHeaders={getAuthHeaders}
          onSuccess={fetchProjectData}
        />
      )}

      {showLessonModal && (
        <LessonModal 
          isOpen={showLessonModal}
          onClose={() => setShowLessonModal(false)}
          projectId={projectId}
          lesson={editingLesson}
          getAuthHeaders={getAuthHeaders}
          onSuccess={fetchProjectData}
        />
      )}

      {showReportModal && (
        <ReportModal 
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          project={project}
          comments={comments}
          getAuthHeaders={getAuthHeaders}
        />
      )}
    </div>
  );
}
