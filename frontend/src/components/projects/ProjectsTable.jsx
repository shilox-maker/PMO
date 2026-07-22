import React from 'react';
import { RefreshCw, Eye, MessageSquare } from 'lucide-react';
import { getSortedData } from '../../utils/sorting';

export default function ProjectsTable({
  projects,
  loading,
  visibleColumnsMap,
  sortConfig,
  renderSortHeader,
  onViewProject,
  onViewVendor,
  onOpenQuickComment
}) {
  const getProgressColor = (percent) => {
    if (percent > 90) return 'var(--color-rag-red)';
    if (percent > 75) return 'var(--color-rag-yellow)';
    return 'var(--md-sys-color-primary)';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: 16 }}>
        <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--md-sys-color-primary)' }} />
        <span>Cargando listado de proyectos...</span>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="m3-card" style={{ textAlign: 'center', padding: '48px', color: 'var(--md-sys-color-outline)' }}>
        No se encontraron proyectos registrados.
      </div>
    );
  }

  return (
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
            {visibleColumnsMap.ultimo_comentario && renderSortHeader('Último Comentario', 'ultimo_comentario')}
            {visibleColumnsMap.accion && <th>Acción</th>}
          </tr>
        </thead>
        <tbody>
          {getSortedData(projects, sortConfig).map((project) => {
            const calc = project.calculations;
            const consumptionPercent = calc ? Math.min((calc.consumo_real / calc.budget_actualizado) * 100, 100) : 0;
            const displayedPercent = calc ? Math.round((calc.consumo_real / calc.budget_actualizado) * 100) : 0;

            const todayStr = new Date().toISOString().split('T')[0];
            const isClosed = ['CERRADO', 'CANCELADO', 'FINALIZADO', 'COMPLETADO', 'PARKING'].includes(project.estado_proyecto?.toUpperCase());
            const isProjectOverdue = !isClosed && calc?.fecha_fin_estimada && calc.fecha_fin_estimada < todayStr;
            const isMilestoneOverdue = project.nextMilestone && project.nextMilestone.fecha_limite && project.nextMilestone.fecha_limite < todayStr;

            return (
              <tr key={project.id_proyecto} style={isProjectOverdue ? { backgroundColor: 'rgba(255, 69, 58, 0.1)' } : {}}>
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
                  <span
                    className="badge"
                    style={{ backgroundColor: 'var(--md-sys-color-surface-container-highest)', color: 'var(--md-sys-color-on-surface)', fontWeight: 600, cursor: project.estado_descripcion ? 'help' : 'default' }}
                    title={project.estado_descripcion || undefined}
                  >
                    {project.estado_proyecto}
                  </span>
                </td>}

                {/* RAG */}
                {visibleColumnsMap.indicador_rag && <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div 
                      className={`project-rag-dot ${project.indicador_rag}`} 
                      style={{ width: 18, height: 18 }}
                      title={project.indicador_rag}
                    ></div>
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
                {visibleColumnsMap.proximo_hito && <td style={{ fontSize: '0.8rem', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isMilestoneOverdue ? 'var(--color-rag-red)' : 'inherit' }}>
                  {project.nextMilestone ? (
                    <div title={`${project.nextMilestone.titulo_tarea} (${project.nextMilestone.fecha_limite})`}>
                      <strong>{project.nextMilestone.titulo_tarea}</strong>
                      <div style={{ color: isMilestoneOverdue ? 'var(--color-rag-red)' : 'var(--md-sys-color-outline)', fontSize: '0.75rem' }}>{project.nextMilestone.fecha_limite}</div>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--md-sys-color-outline)' }}>Ninguno</span>
                  )}
                </td>}

                {/* Último Comentario */}
                {visibleColumnsMap.ultimo_comentario && (
                  <td style={{ fontSize: '0.8rem', minWidth: '180px', maxWidth: '300px', whiteSpace: 'normal', wordBreak: 'break-word', color: 'var(--md-sys-color-outline)' }}>
                    {project.ultimo_comentario ? (
                      <span>{project.ultimo_comentario}</span>
                    ) : (
                      <span style={{ opacity: 0.5 }}>Sin comentarios</span>
                    )}
                  </td>
                )}

                {/* Action */}
                {visibleColumnsMap.accion && <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      className="m3-btn m3-btn-tonal" 
                      onClick={() => onViewProject(project.id_proyecto)}
                      style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px' }}
                    >
                      <Eye size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                      Ficha
                    </button>
                    <button 
                      className="m3-btn m3-btn-tonal"
                      onClick={() => onOpenQuickComment(project.id_proyecto)}
                      style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 4 }}
                      title="Actualizar estado / comentario rápido"
                    >
                      <MessageSquare size={14} />
                      <span>Comentar</span>
                    </button>
                  </div>
                </td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
