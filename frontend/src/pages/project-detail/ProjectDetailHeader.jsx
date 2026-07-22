import React from 'react';
import { ArrowLeft, Edit2, Printer, Trash2 } from 'lucide-react';

export default function ProjectDetailHeader({
  project,
  onBack,
  setShowEditProjectModal,
  setShowReportModal,
  handleDeleteProject,
  workflowStates,
  handleUpdateProject,
  currentPm
}) {
  const canDelete = currentPm && (currentPm.perfil === 'ADMINISTRADOR' || currentPm.perfil === 'DIRECTOR' || project?.id_pm === currentPm.id_usuario);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {onBack && (
          <button className="icon-btn" onClick={onBack} title="Volver">
            <ArrowLeft size={22} />
          </button>
        )}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="project-id-badge">{project.id_proyecto}</span>
            {project.es_capex ? (
              <span className="badge badge-blue">
                CAPEX: {project.codigo_capex || 'Pendiente'}
                {project.TipoCapex && ` (${project.TipoCapex.nombre}${project.SubtipoCapex ? ` - ${project.SubtipoCapex.nombre}` : ''})`}
              </span>
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

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
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
          <span>Editar Proyecto</span>
        </button>

        {canDelete && (
          <button 
            className="m3-btn" 
            onClick={handleDeleteProject}
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
            title="Eliminar Proyecto permanentemente"
          >
            <Trash2 size={16} />
            <span>Eliminar Proyecto</span>
          </button>
        )}

        {/* RAG select quick control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--md-sys-color-outline)' }}>RAG:</span>
          <select 
            value={project.indicador_rag || 'VERDE'}
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
        {workflowStates && workflowStates.length > 0 && (
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
        )}
      </div>
    </div>
  );
}
