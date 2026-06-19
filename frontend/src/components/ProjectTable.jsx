import React, { useState } from 'react';
import { Eye, ArrowUp, ArrowDown, ArrowUpDown, FileDown } from 'lucide-react';
import { getSortedData } from '../utils/sorting';
import { useTableColumns } from '../hooks/useTableColumns';
import ColumnSelector from './ColumnSelector';
import ExportProjectsModal from './modals/ExportProjectsModal';
import { useAuth } from '../context/AuthContext';

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

export default function ProjectTable({ projects, onViewProject, onViewVendor, showHeaderSelector = true }) {
  const { getAuthHeaders } = useAuth();
  const { columns: tableCols, visibleColumnsMap, toggleColumn, resetColumns } = useTableColumns('ppm-projects-columns', DEFAULT_PROJECT_COLUMNS);
  const [sortConfig, setSortConfig] = useState({ key: 'id_proyecto', direction: 'asc' });
  const [isExportOpen, setIsExportOpen] = useState(false);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getProgressColor = (percent) => {
    if (percent > 90) return 'var(--color-rag-red)';
    if (percent > 75) return 'var(--color-rag-yellow)';
    return 'var(--md-sys-color-primary)';
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

  return (
    <div>
      {showHeaderSelector && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12, gap: 12 }}>
          <button 
            className="m3-btn m3-btn-tonal"
            onClick={() => setIsExportOpen(true)}
            style={{ 
              height: '40px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8 
            }}
          >
            <FileDown size={18} />
            <span>Exportar Excel</span>
          </button>
          <ColumnSelector columns={tableCols} toggleColumn={toggleColumn} resetColumns={resetColumns} />
        </div>
      )}
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
              const calc = project.calculations || {
                budget_actualizado: project.budget_actualizado || project.budget_inicial || 0,
                consumo_real: project.gasto_total_facturas || 0,
                presupuesto_disponible: (project.budget_actualizado || project.budget_inicial || 0) - (project.gasto_total_facturas || 0),
                fecha_fin_estimada: project.fecha_fin_estimada || project.fecha_fin_inicial
              };
              const consumptionPercent = calc.budget_actualizado > 0 ? Math.min((calc.consumo_real / calc.budget_actualizado) * 100, 100) : 0;
              const displayedPercent = calc.budget_actualizado > 0 ? Math.round((calc.consumo_real / calc.budget_actualizado) * 100) : 0;

              return (
                <tr key={project.id_proyecto}>
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
                      onClick={() => onViewVendor && onViewVendor(project.id_proveedor)}
                    >
                      {project.Proveedor?.nombre_razon_social || project.prov_nombre || 'Sin Partner'}
                    </span>
                  </td>}

                  {/* PM */}
                  {visibleColumnsMap.pm && <td>
                    {project.PM ? `${project.PM.nombre} ${project.PM.apellidos}` : (project.pm_nombre || 'Sin PM')}
                  </td>}

                  {/* Sede */}
                  {visibleColumnsMap.sede && <td>{project.Sede?.nombre_sede || project.sede_nombre}</td>}

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
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, marginBottom: 4 }}>
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
      <ExportProjectsModal 
        isOpen={isExportOpen} 
        onClose={() => setIsExportOpen(false)} 
        projects={projects} 
        getAuthHeaders={getAuthHeaders} 
      />
    </div>
  );
}
