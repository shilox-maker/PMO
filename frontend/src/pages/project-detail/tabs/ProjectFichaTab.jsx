import React from 'react';
import ProjectGovernanceAttributes from '../ficha/ProjectGovernanceAttributes';
import ProjectRaciTable from '../ficha/ProjectRaciTable';
import ProjectUnifiedTimeline from '../ficha/ProjectUnifiedTimeline';
import ProjectExecutiveWall from '../ficha/ProjectExecutiveWall';

export default function ProjectFichaTab({
  project, comments, commentsLoading, newCommentText, setNewCommentText,
  newCommentImportant, setNewCommentImportant, newCommentDireccion, setNewCommentDireccion,
  handleAddComment, handleDeleteComment,
  editingCommentId, setEditingCommentId, editingCommentText, setEditingCommentText,
  editingCommentImportant, setEditingCommentImportant, editingCommentDireccion, setEditingCommentDireccion,
  handleUpdateComment, isEditingLifecycle, handleOpenEditLifecycle, handleDeleteParticipant,
  handleOpenAddRaci, handleOpenEditRaci, onViewVendor, contactosList,
  canSeeDireccion, getAuthHeaders, handleUpdateProject
}) {
  const calc = project.calculations;

  const sortedInvolvedContacts = React.useMemo(() => {
    if (!project.InvolvedContacts) return [];
    return [...project.InvolvedContacts].sort((a, b) => {
      const compA = a.Proveedore || a.Proveedor;
      const compB = b.Proveedore || b.Proveedor;
      
      const isDacsaA = compA?.es_grupo_dacsa === true;
      const isDacsaB = compB?.es_grupo_dacsa === true;
      
      if (isDacsaA && !isDacsaB) return -1;
      if (!isDacsaA && isDacsaB) return 1;
      
      const companyNameA = (compA?.nombre_razon_social || '').toLowerCase();
      const companyNameB = (compB?.nombre_razon_social || '').toLowerCase();
      if (companyNameA !== companyNameB) {
        return companyNameA.localeCompare(companyNameB);
      }
      
      const nameA = `${a.nombre} ${a.apellidos}`.toLowerCase();
      const nameB = `${b.nombre} ${b.apellidos}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [project.InvolvedContacts]);

  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} a las ${hours}:${minutes}`;
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth()+1).padStart(2, '0')}/${dt.getFullYear()}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="detail-grid-split" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        
        {/* Left Column: Governance Attributes & RACI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <ProjectGovernanceAttributes 
            project={project}
            calc={calc}
            onViewVendor={onViewVendor}
            getAuthHeaders={getAuthHeaders}
            handleUpdateProject={handleUpdateProject}
          />

          <ProjectRaciTable 
            sortedInvolvedContacts={sortedInvolvedContacts}
            contactosList={contactosList}
            handleOpenAddRaci={handleOpenAddRaci}
            handleOpenEditRaci={handleOpenEditRaci}
            handleDeleteParticipant={handleDeleteParticipant}
          />
        </div>

        {/* Right Column: Unified Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <ProjectUnifiedTimeline 
            project={project}
            handleOpenEditLifecycle={handleOpenEditLifecycle}
            formatDate={formatDate}
          />
        </div>
      </div>

      {/* Muro Ejecutivo (Comentarios) */}
      <ProjectExecutiveWall 
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
        canSeeDireccion={canSeeDireccion}
        formatDateTime={formatDateTime}
      />
    </div>
  );
}
