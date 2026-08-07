import React from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, MessageSquare } from 'lucide-react';
import { getSortedData } from '../../utils/sorting';
import SkeletonLoader from '../SkeletonLoader';
import ProjectTableHeader from '../ProjectTableHeader';

export default function ProjectsTable({
  projects,
  loading,
  density = 'standard',
  visibleColumnsMap,
  columnWidths = {},
  sortConfig,
  handleSort,
  handleMouseDown,
  onViewProject,
  onViewVendor,
  onOpenQuickComment
}) {
  const { t } = useTranslation();

  const getProgressColor = (percent) => {
    if (percent > 90) return 'var(--color-rag-red)';
    if (percent > 75) return 'var(--color-rag-yellow)';
    return 'var(--md-sys-color-primary)';
  };

  const renderTH = (label, sortKey, extraStyle = {}, colId = sortKey) => (
    <ProjectTableHeader
      label={label}
      sortKey={sortKey}
      sortConfig={sortConfig}
      onSort={handleSort}
      colId={colId}
      columnWidths={columnWidths}
      onMouseDown={handleMouseDown}
      extraStyle={extraStyle}
    />
  );

  if (loading) {
    return <SkeletonLoader variant="table" rows={6} columns={8} />;
  }

  if (projects.length === 0) {
    return (
      <div className="m3-card" style={{ textAlign: 'center', padding: '48px', color: 'var(--md-sys-color-outline)' }}>
        {t('projectsTable.noProjects')}
      </div>
    );
  }

  return (
    <div className="m3-table-wrapper glass-panel" data-density={density}>
      <table className="m3-table">
        <thead>
          <tr>
            {visibleColumnsMap.id_proyecto && renderTH(t('projectsTable.code'), 'id_proyecto')}
            {visibleColumnsMap.nombre_proyecto && renderTH(t('projectsTable.name'), 'nombre_proyecto')}
            {visibleColumnsMap.estado_proyecto && renderTH(t('projectsTable.status'), 'estado_proyecto')}
            {visibleColumnsMap.indicador_rag && renderTH('RAG', 'indicador_rag')}
            {visibleColumnsMap.proveedor && renderTH(t('projectsTable.partner'), 'Proveedor.nombre_razon_social', {}, 'proveedor')}
            {visibleColumnsMap.pm && renderTH(t('projectsTable.pm'), 'PM.nombre', {}, 'pm')}
            {visibleColumnsMap.sede && renderTH(t('projectsTable.sede'), 'Sede.nombre_sede', {}, 'sede')}
            {visibleColumnsMap.fecha_inicio && renderTH(t('projectsTable.startDate'), 'fecha_inicio')}
            {visibleColumnsMap.fecha_fin_inicial && renderTH(t('projectsTable.endDate'), 'fecha_fin_inicial')}
            {visibleColumnsMap.fecha_fin_estimada && renderTH(t('projectsTable.estimatedEndDate'), 'calculations.fecha_fin_estimada', {}, 'fecha_fin_estimada')}
            {visibleColumnsMap.budget && renderTH(t('projectsTable.budget'), 'calculations.budget_actualizado', {}, 'budget')}
            {visibleColumnsMap.progreso && renderTH(t('projectsTable.spentProgress'), 'calculations.consumo_real', {}, 'progreso')}
            {visibleColumnsMap.proximo_hito && renderTH(t('projectsTable.nextMilestone'), 'nextMilestone.fecha_limite', {}, 'proximo_hito')}
            {visibleColumnsMap.ultimo_comentario && renderTH(t('projectsTable.lastComment'), 'ultimo_comentario')}
            {visibleColumnsMap.accion && renderTH(t('projectsTable.actions'), null, {}, 'accion')}
          </tr>
        </thead>
        <tbody>
          {getSortedData(projects, sortConfig).map((project) => {
            const calc = project.calculations;
            const budgetAct = calc?.budget_actualizado || 0;
            const consumptionPercent = (calc && budgetAct > 0) ? Math.min(((calc.consumo_real || 0) / budgetAct) * 100, 100) : 0;
            const displayedPercent = (calc && budgetAct > 0) ? Math.round(((calc.consumo_real || 0) / budgetAct) * 100) : 0;

            const todayStr = new Date().toISOString().split('T')[0];
            const isClosed = ['CERRADO', 'CANCELADO', 'FINALIZADO', 'COMPLETADO', 'PARKING'].includes(project.estado_proyecto?.toUpperCase());
            const isProjectOverdue = !isClosed && calc?.fecha_fin_estimada && calc.fecha_fin_estimada < todayStr;
            const isMilestoneOverdue = project.nextMilestone && project.nextMilestone.fecha_limite && project.nextMilestone.fecha_limite < todayStr;

            const statusCode = project.EstadoProyecto?.code || project.estado_proyecto?.toUpperCase().replace(/\s+/g, '_');
            const statusLabel = statusCode && t(`status.${statusCode}`) !== `status.${statusCode}` ? t(`status.${statusCode}`) : project.estado_proyecto;

            const sedeCode = project.Sede?.code || project.Sede?.nombre_sede?.toUpperCase().replace(/\s+/g, '_');
            const sedeLabel = sedeCode && t(`sede.${sedeCode}`) !== `sede.${sedeCode}` ? t(`sede.${sedeCode}`) : project.Sede?.nombre_sede;

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
                  {project.es_iniciativa_ligera ? (
                    <div style={{ fontSize: '0.7rem', color: '#e0a025', fontWeight: 600, marginTop: 2 }}>
                      ⚡ Iniciativa Ligera
                    </div>
                  ) : project.es_capex ? (
                    <div style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-primary)', fontWeight: 600, marginTop: 2 }}>
                      CAPEX • {project.codigo_capex}
                    </div>
                  ) : null}
                </td>}

                {/* Estado */}
                {visibleColumnsMap.estado_proyecto && <td>
                  <span
                    className="badge"
                    style={{ backgroundColor: 'var(--md-sys-color-surface-container-highest)', color: 'var(--md-sys-color-on-surface)', fontWeight: 600, cursor: project.estado_descripcion ? 'help' : 'default' }}
                    title={project.estado_descripcion || undefined}
                  >
                    {statusLabel}
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
                  {project.es_iniciativa_ligera || !project.Proveedor ? (
                    <span style={{ color: 'var(--md-sys-color-outline)' }}>—</span>
                  ) : (
                    <span 
                      style={{ textDecoration: 'underline', cursor: 'pointer', color: 'var(--md-sys-color-primary)', fontWeight: 500 }}
                      onClick={() => onViewVendor(project.id_proveedor)}
                    >
                      {project.Proveedor.nombre_razon_social}
                    </span>
                  )}
                </td>}

                {/* PM */}
                {visibleColumnsMap.pm && <td>{project.PM?.nombre} {project.PM?.apellidos}</td>}

                {/* Sede */}
                {visibleColumnsMap.sede && <td>{sedeLabel}</td>}

                {/* Dates */}
                {visibleColumnsMap.fecha_inicio && <td>{project.fecha_inicio ? new Date(project.fecha_inicio).toLocaleDateString() : '—'}</td>}
                {visibleColumnsMap.fecha_fin_inicial && <td>{project.fecha_fin_inicial ? new Date(project.fecha_fin_inicial).toLocaleDateString() : '—'}</td>}
                {visibleColumnsMap.fecha_fin_estimada && <td>{calc?.fecha_fin_estimada ? new Date(calc.fecha_fin_estimada).toLocaleDateString() : '—'}</td>}

                {/* Budget */}
                {visibleColumnsMap.budget && <td>
                  {project.es_iniciativa_ligera ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>N/A</span>
                  ) : (
                    <>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                        Act: {calc?.budget_actualizado.toLocaleString()} €
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: calc?.presupuesto_disponible < 0 ? 'var(--color-rag-red)' : 'var(--md-sys-color-outline)' 
                      }}>
                        Disp: {calc?.presupuesto_disponible.toLocaleString()} €
                      </div>
                    </>
                  )}
                </td>}

                {/* Progress Bar */}
                {visibleColumnsMap.progreso && <td style={{ minWidth: '120px' }}>
                  {project.es_iniciativa_ligera ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>N/A</span>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, marginBottom: 4 }}>
                        <span>{calc?.consumo_real.toLocaleString(undefined, { maximumFractionDigits: 0 })} €</span>
                        <span style={{ opacity: 0.6 }}>/</span>
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
                    </>
                  )}
                </td>}

                {/* Milestone */}
                {visibleColumnsMap.proximo_hito && <td style={{ fontSize: '0.8rem', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isMilestoneOverdue ? 'var(--color-rag-red)' : 'inherit' }}>
                  {project.nextMilestone ? (
                    <div title={`${project.nextMilestone.titulo_tarea} (${project.nextMilestone.fecha_limite})`}>
                      <strong>{project.nextMilestone.titulo_tarea}</strong>
                      <div style={{ color: isMilestoneOverdue ? 'var(--color-rag-red)' : 'var(--md-sys-color-outline)', fontSize: '0.75rem' }}>{project.nextMilestone.fecha_limite}</div>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--md-sys-color-outline)' }}>—</span>
                  )}
                </td>}

                {/* Último Comentario */}
                {visibleColumnsMap.ultimo_comentario && (
                  <td style={{ fontSize: '0.8rem', minWidth: '180px', maxWidth: '300px', whiteSpace: 'normal', wordBreak: 'break-word', color: 'var(--md-sys-color-outline)' }}>
                    {project.ultimo_comentario ? (
                      <span>{project.ultimo_comentario}</span>
                    ) : (
                      <span style={{ opacity: 0.5 }}>—</span>
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
                      {t('projectsTable.viewFicha')}
                    </button>
                    <button 
                      className="m3-btn m3-btn-tonal"
                      onClick={() => onOpenQuickComment(project.id_proyecto)}
                      style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 4 }}
                      title={t('projectsTable.quickComment')}
                    >
                      <MessageSquare size={14} />
                      <span>{t('projectsTable.quickComment')}</span>
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
