import React, { useState } from 'react';
import { Eye, FileDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSortedData } from '../utils/sorting';
import { useTableColumns } from '../hooks/useTableColumns';
import ColumnSelector from './ColumnSelector';
import DensitySelector from './DensitySelector';
import ExportProjectsModal from './modals/ExportProjectsModal';
import { useAuth } from '../context/AuthContext';
import ProjectTableHeader from './ProjectTableHeader';

const DEFAULT_PROJECT_COLUMNS = [
  { id: 'id_proyecto', label: 'Código', fixed: true, visible: true },
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
  { id: 'proximo_hito', label: 'Próximo Hito', fixed: false, visible: true }, { id: 'ultimo_comentario', label: 'Último Comentario', fixed: false, visible: true },
  { id: 'cambios_alcance_count', label: 'Cambios Alcance', fixed: false, visible: true }, { id: 'accion', label: 'Acción', fixed: true, visible: true }
];

export default function ProjectTable({ projects, onViewProject, onViewVendor, showHeaderSelector = true }) {
  const { t } = useTranslation();
  const { getAuthHeaders } = useAuth();
  const [density, setDensity] = useState(() => localStorage.getItem('pmo_table_density') || 'standard');
  const { columns: tableCols, visibleColumnsMap, columnWidths, updateColumnWidth, toggleColumn, resetColumns } = useTableColumns('ppm-projects-columns-v2', DEFAULT_PROJECT_COLUMNS);
  const [sortConfig, setSortConfig] = useState({ key: 'id_proyecto', direction: 'asc' });
  const [isExportOpen, setIsExportOpen] = useState(false);

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

  const getProgressColor = (percent) => {
    if (percent > 90) return 'var(--color-rag-red)';
    if (percent > 75) return 'var(--color-rag-yellow)';
    return 'var(--md-sys-color-primary)';
  };

  const renderTH = (labelKey, fallbackLabel, sortKey, extraStyle = {}, colId = sortKey) => (
    <ProjectTableHeader
      label={t(labelKey) !== labelKey ? t(labelKey) : fallbackLabel}
      sortKey={sortKey}
      sortConfig={sortConfig}
      onSort={handleSort}
      colId={colId}
      columnWidths={columnWidths}
      onMouseDown={handleMouseDown}
      extraStyle={extraStyle}
    />
  );

  return (
    <div>
      {showHeaderSelector && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12, gap: 12 }}>
          <button className="m3-btn m3-btn-tonal" onClick={() => setIsExportOpen(true)} style={{ height: '40px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileDown size={18} />
            <span>Exportar Excel</span>
          </button>
          <DensitySelector density={density} onChange={setDensity} />
          <ColumnSelector columns={tableCols} toggleColumn={toggleColumn} resetColumns={resetColumns} />
        </div>
      )}
      <div className="m3-table-wrapper glass-panel" data-density={density}>
        <table className="m3-table">
          <thead>
            <tr>
              {visibleColumnsMap.id_proyecto && renderTH('projectsTable.code', 'Código', 'id_proyecto')}
              {visibleColumnsMap.nombre_proyecto && renderTH('projectsTable.name', 'Nombre del Proyecto', 'nombre_proyecto')}
              {visibleColumnsMap.estado_proyecto && renderTH('projectsTable.status', 'Estado/Fase', 'estado_proyecto')}
              {visibleColumnsMap.indicador_rag && renderTH('RAG', 'RAG', 'indicador_rag', { textAlign: 'center' })}
              {visibleColumnsMap.proveedor && renderTH('projectsTable.partner', 'Socio Tecnológico', 'Proveedor.nombre_razon_social', {}, 'proveedor')}
              {visibleColumnsMap.pm && renderTH('projectsTable.pm', 'Gestor PM', 'PM.nombre', {}, 'pm')}
              {visibleColumnsMap.sede && renderTH('projectsTable.sede', 'Sede', 'Sede.nombre_sede', {}, 'sede')}
              {visibleColumnsMap.fecha_inicio && renderTH('projectsTable.startDate', 'Fecha Inicio', 'fecha_inicio')}
              {visibleColumnsMap.fecha_fin_inicial && renderTH('projectsTable.endDate', 'Fecha Fin Base', 'fecha_fin_inicial')}
              {visibleColumnsMap.fecha_fin_estimada && renderTH('Fecha Fin Est.', 'Fecha Fin Est.', 'calculations.fecha_fin_estimada', {}, 'fecha_fin_estimada')}
              {visibleColumnsMap.budget && renderTH('projectsTable.budget', 'Presupuesto', 'calculations.budget_actualizado', {}, 'budget')}
              {visibleColumnsMap.progreso && renderTH('projectsTable.spentProgress', 'Progreso Gasto', 'calculations.consumo_real', {}, 'progreso')}
              {visibleColumnsMap.proximo_hito && renderTH('Próximo Hito', 'Próximo Hito', 'nextMilestone.fecha_limite', {}, 'proximo_hito')}
              {visibleColumnsMap.ultimo_comentario && renderTH('Último Comentario', 'Último Comentario', 'ultimo_comentario')}
              {visibleColumnsMap.cambios_alcance_count && renderTH('Cambios Alcance', 'Cambios Alcance', 'cambios_alcance_count', { textAlign: 'center' })}
              {visibleColumnsMap.accion && renderTH('projectsTable.actions', 'Acción', null, {}, 'accion')}
            </tr>
          </thead>
          <tbody>
            {getSortedData(projects, sortConfig).map((project) => {
              const calc = project.calculations || {
                budget_actualizado: project.budget_actualizado || project.budget_inicial || 0,
                consumo_real: project.gasto_total_facturas || 0,
                presupuesto_disponible: (project.budget_actualizado || project.budget_inicial || 0) - (project.gasto_total_facturas || 0),
                fecha_fin_estimada: project.fecha_fin_estimada || project.fecha_fin_inicial
              };
              const budgetAct = calc.budget_actualizado || 0;
              const consumptionPercent = budgetAct > 0 ? Math.min(((calc.consumo_real || 0) / budgetAct) * 100, 100) : 0;
              const displayedPercent = budgetAct > 0 ? Math.round(((calc.consumo_real || 0) / budgetAct) * 100) : 0;

              const todayStr = new Date().toISOString().split('T')[0];
              const isClosed = ['CERRADO', 'CANCELADO', 'FINALIZADO', 'COMPLETADO', 'PARKING'].includes(project.estado_proyecto?.toUpperCase());
              const isProjectOverdue = !isClosed && calc?.fecha_fin_estimada && calc.fecha_fin_estimada < todayStr;
              const milestone = project.nextMilestone || project.proximo_hito;
              const isMilestoneOverdue = milestone && milestone.fecha_limite && milestone.fecha_limite < todayStr;

              const statusCode = project.Estado?.code || project.estado_code || project.estado_proyecto?.toUpperCase().replace(/\s+/g, '_');
              const statusLabel = statusCode && t(`status.${statusCode}`) !== `status.${statusCode}` ? t(`status.${statusCode}`) : project.estado_proyecto;

              const sedeCode = project.Sede?.code || project.sede_code || project.Sede?.nombre_sede?.toUpperCase().replace(/\s+/g, '_');
              const sedeLabel = sedeCode && t(`sede.${sedeCode}`) !== `sede.${sedeCode}` ? t(`sede.${sedeCode}`) : (project.Sede?.nombre_sede || project.sede_nombre);

              return (
                <tr key={project.id_proyecto} style={isProjectOverdue ? { backgroundColor: 'rgba(255, 69, 58, 0.1)' } : {}}>
                  {/* ID */}
                  {visibleColumnsMap.id_proyecto && <td style={{ fontWeight: 700, fontSize: '0.85rem' }}>{project.id_proyecto}</td>}
                  
                  {/* Name */}
                  {visibleColumnsMap.nombre_proyecto && <td style={{ fontWeight: 600, minWidth: '180px' }}>
                    <span 
                      style={{ cursor: 'pointer', color: 'var(--md-sys-color-on-surface)' }}
                      onClick={() => onViewProject && onViewProject(project.id_proyecto)}
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
                        {project.TipoCapex && ` (${project.TipoCapex.nombre}${project.SubtipoCapex ? ` - ${project.SubtipoCapex.nombre}` : ''})`}
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
                        onClick={() => onViewVendor && onViewVendor(project.id_proveedor)}
                      >
                        {project.Proveedor.nombre_razon_social || project.prov_nombre || 'Sin Partner'}
                      </span>
                    )}
                  </td>}

                  {/* PM */}
                  {visibleColumnsMap.pm && <td>
                    {project.PM ? `${project.PM.nombre} ${project.PM.apellidos}` : (project.pm_nombre || 'Sin PM')}
                  </td>}

                  {/* Sede */}
                  {visibleColumnsMap.sede && <td>{sedeLabel}</td>}

                  {/* Dates */}
                  {visibleColumnsMap.fecha_inicio && <td>{project.fecha_inicio ? new Date(project.fecha_inicio).toLocaleDateString('es-ES') : '—'}</td>}
                  {visibleColumnsMap.fecha_fin_inicial && <td>{project.fecha_fin_inicial ? new Date(project.fecha_fin_inicial).toLocaleDateString('es-ES') : '—'}</td>}
                  {visibleColumnsMap.fecha_fin_estimada && <td>{calc?.fecha_fin_estimada ? new Date(calc.fecha_fin_estimada).toLocaleDateString('es-ES') : '—'}</td>}

                  {/* Budget */}
                  {visibleColumnsMap.budget && <td>
                    {project.es_iniciativa_ligera ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>N/A (Ligero)</span>
                    ) : (
                      <>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          Act: {(calc?.budget_actualizado || 0).toLocaleString('es-ES')} €
                        </div>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: (calc?.presupuesto_disponible || 0) < 0 ? 'var(--color-rag-red)' : 'var(--md-sys-color-outline)' 
                        }}>
                          Disp: {(calc?.presupuesto_disponible || 0).toLocaleString('es-ES')} €
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
                          <span>{(calc?.consumo_real || 0).toLocaleString('es-ES', { maximumFractionDigits: 0 })} €</span>
                          <span style={{ opacity: 0.6 }}>/</span>
                          <span>{isNaN(displayedPercent) ? 0 : displayedPercent}%</span>
                        </div>
                        <div className="progress-track" style={{ height: 6 }}>
                          <div 
                            className="progress-fill" 
                            style={{ 
                              width: `${isNaN(consumptionPercent) ? 0 : consumptionPercent}%`, 
                              backgroundColor: getProgressColor(displayedPercent)
                            }}
                          ></div>
                        </div>
                      </>
                    )}
                  </td>}

                  {/* Milestone */}
                  {visibleColumnsMap.proximo_hito && <td style={{ fontSize: '0.8rem', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isMilestoneOverdue ? 'var(--color-rag-red)' : 'inherit' }}>
                    {milestone ? (
                      <div title={`${milestone.titulo_tarea} (${milestone.fecha_limite})`}>
                        <strong>{milestone.titulo_tarea}</strong>
                        <div style={{ color: isMilestoneOverdue ? 'var(--color-rag-red)' : 'var(--md-sys-color-outline)', fontSize: '0.75rem' }}>{milestone.fecha_limite}</div>
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

                  {/* Cambios Alcance */}
                  {visibleColumnsMap.cambios_alcance_count && <td style={{ textAlign: 'center', fontWeight: 600 }}>
                    {project.cambios_alcance_count || 0}
                  </td>}

                  {/* Action */}
                  {visibleColumnsMap.accion && <td>
                    <button 
                      className="m3-btn m3-btn-tonal" 
                      onClick={() => onViewProject && onViewProject(project.id_proyecto)}
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
      <ExportProjectsModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} projects={projects} getAuthHeaders={getAuthHeaders} />
    </div>
  );
}
