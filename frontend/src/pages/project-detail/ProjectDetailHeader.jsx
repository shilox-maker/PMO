import React from 'react';
import { ArrowLeft, Edit2, Printer, Trash2 } from 'lucide-react';

export default function ProjectDetailHeader({
  project,
  onBack,
  setShowEditProjectModal,
  setShowReportModal,
  handleDeleteProject,
  calc
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {onBack && (
          <button className="icon-btn" onClick={onBack} title="Volver a la lista">
            <ArrowLeft size={20} />
          </button>
        )}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.5rem', margin: 0 }}>
              {project.nombre_proyecto}
            </h2>
            <div className={`project-rag-dot ${project.indicador_rag}`} title={`RAG: ${project.indicador_rag}`}></div>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)', marginTop: 4, display: 'flex', gap: 12 }}>
            <span>ID: <strong>{project.id_proyecto}</strong></span>
            <span>•</span>
            <span>Estado: <strong>{project.estado_proyecto}</strong></span>
            {project.es_capex && (
              <>
                <span>•</span>
                <span style={{ color: 'var(--md-sys-color-primary)', fontWeight: 600 }}>CAPEX: {project.codigo_capex}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button 
          className="m3-btn m3-btn-tonal" 
          onClick={() => setShowReportModal(true)}
          style={{ height: '40px', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Printer size={18} />
          <span>Informe PDF</span>
        </button>

        <button 
          className="m3-btn m3-btn-primary" 
          onClick={() => setShowEditProjectModal(true)}
          style={{ height: '40px', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Edit2 size={18} />
          <span>Editar Proyecto</span>
        </button>

        <button 
          className="m3-btn m3-btn-outline" 
          onClick={handleDeleteProject}
          style={{ height: '40px', color: 'var(--color-rag-red)', borderColor: 'var(--color-rag-red)', display: 'flex', alignItems: 'center', gap: 8 }}
          title="Eliminar proyecto"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
