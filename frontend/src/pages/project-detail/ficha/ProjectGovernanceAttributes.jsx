import React from 'react';
import { Building, User, MapPin, Calendar, GitBranch, ExternalLink } from 'lucide-react';
import ProjectTagsSelect from '../../../components/ProjectTagsSelect';

export default function ProjectGovernanceAttributes({
  project,
  calc,
  onViewVendor,
  getAuthHeaders,
  handleUpdateProject
}) {
  return (
    <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20, overflow: 'visible', zIndex: 10 }}>
      {project.Estado && (
        <div style={{ 
          backgroundColor: 'var(--md-sys-color-primary-container)', 
          color: 'var(--md-sys-color-on-primary-container)', 
          padding: '16px 20px', 
          borderRadius: '12px', 
          borderLeft: '4px solid var(--md-sys-color-primary)' 
        }}>
          <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📘</span> Descripción del Estado ({project.Estado.nombre_estado})
          </h3>
          <div className="wysiwyg-content" dangerouslySetInnerHTML={{ __html: project.Estado.descripcion || project.Estado.pasos || '<p style="font-style: italic; opacity: 0.8;">Sin descripción de estado detallada.</p>' }} style={{ fontSize: '0.9rem', lineHeight: '1.5' }} />
        </div>
      )}

      <div>
        <h3 style={{ fontWeight: 600, fontSize: '1.15rem', marginBottom: 8 }}>Descripción</h3>
        <p style={{ color: 'var(--md-sys-color-on-surface)', whiteSpace: 'pre-line' }}>{project.descripcion}</p>
      </div>

      <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 20 }}>
        <h3 style={{ fontWeight: 600, fontSize: '1.15rem', marginBottom: 12 }}>Atributos de Gobernanza</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MapPin size={18} style={{ color: 'var(--md-sys-color-outline)' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>Sede</div>
              <div style={{ fontWeight: 500 }}>{project.Sede?.nombre_sede}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <GitBranch size={18} style={{ color: 'var(--md-sys-color-outline)' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>A distribuir</div>
              <div style={{ fontWeight: 500 }}>{project.SedeDistribuir?.nombre_sede || '—'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building size={18} style={{ color: 'var(--md-sys-color-outline)' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>Partner Adjudicatario</div>
              <span 
                style={{ fontWeight: 500, textDecoration: 'underline', cursor: 'pointer', color: 'var(--md-sys-color-primary)' }}
                onClick={() => onViewVendor(project.id_proveedor)}
              >
                {project.Proveedor?.nombre_razon_social}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <User size={18} style={{ color: 'var(--md-sys-color-outline)' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>Gestor Interno PM</div>
              <div style={{ fontWeight: 500 }}>{project.PM?.nombre} {project.PM?.apellidos}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <User size={18} style={{ color: 'var(--md-sys-color-outline)' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>Sponsor / Key User Líder</div>
              <div style={{ fontWeight: 500 }}>{project.Sponsor?.nombre} {project.Sponsor?.apellidos}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={18} style={{ color: 'var(--md-sys-color-outline)' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>Fechas de Proyecto</div>
              <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>
                Inicio: {project.fecha_inicio} <br />
                Fin Base: {project.fecha_fin_inicial} <br />
                Fin Est.: <span style={{ color: 'var(--md-sys-color-primary)', fontWeight: 'bold' }}>{calc?.fecha_fin_estimada}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building size={18} style={{ color: 'var(--md-sys-color-outline)' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>Portfolio</div>
              <div style={{ fontWeight: 500 }}>{project.Portfolio?.nombre || 'Sin asignar'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, gridColumn: 'span 2' }}>
            <ExternalLink size={18} style={{ color: 'var(--md-sys-color-outline)' }} />
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>Site SharePoint (Documentación)</div>
              {project.url_sharepoint ? (
                <a 
                  href={project.url_sharepoint.startsWith('http://') || project.url_sharepoint.startsWith('https://') ? project.url_sharepoint : `https://${project.url_sharepoint}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ fontWeight: 500, color: 'var(--md-sys-color-primary)', textDecoration: 'underline', wordBreak: 'break-all', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <span>{project.url_sharepoint}</span>
                  <ExternalLink size={14} style={{ flexShrink: 0 }} />
                </a>
              ) : (
                <div style={{ fontWeight: 500, color: 'var(--md-sys-color-outline)' }}>—</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 20 }}>
        <ProjectTagsSelect 
          projectId={project.id_proyecto}
          projectTags={project.Tags || []}
          getAuthHeaders={getAuthHeaders}
          onUpdateProject={handleUpdateProject}
        />
      </div>
    </div>
  );
}
