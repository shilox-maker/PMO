import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Circle, Mail, Calendar, AlertTriangle, ChevronDown, ChevronUp, RefreshCw, Edit2 } from 'lucide-react';
import { API_URL } from '../../config/api';

export default function PendingAssistantDrawer({ 
  isOpen, 
  onClose, 
  daysFilter, 
  setDaysFilter, 
  t, 
  getAuthHeaders,
  onOpenReportModal,
  onEditTask,
  refreshTrigger,
  onDataChanged
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ totalPendingCount: 0, projects: [] });
  const [expandedProjects, setExpandedProjects] = useState({});
  const [completingTaskId, setCompletingTaskId] = useState(null);

  const fetchPendingData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/assistant/pending?days=${daysFilter}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        const expandedMap = {};
        (json.projects || []).forEach(p => { expandedMap[p.id_proyecto] = true; });
        setExpandedProjects(expandedMap);
      }
    } catch (err) {
      console.error('Error loading pending assistant data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPendingData();
    }
  }, [isOpen, daysFilter, refreshTrigger]);

  const toggleProjectExpand = (id_proyecto) => {
    setExpandedProjects(prev => ({ ...prev, [id_proyecto]: !prev[id_proyecto] }));
  };

  const handleMarkTaskComplete = async (task) => {
    setCompletingTaskId(task.id_tarea);
    try {
      const res = await fetch(`${API_URL}/tasks/${task.id_tarea}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ estado: 'COMPLETADA' })
      });

      if (res.ok) {
        setData(prev => {
          const updatedProjects = prev.projects.map(proj => {
            const updatedTareas = proj.tareas.filter(tItem => tItem.id_tarea !== task.id_tarea);
            return { ...proj, tareas: updatedTareas };
          }).filter(proj => proj.tareas.length > 0 || proj.planesComunicacion.length > 0);

          return {
            totalPendingCount: Math.max(0, prev.totalPendingCount - 1),
            projects: updatedProjects
          };
        });
        if (onDataChanged) onDataChanged();
      }
    } catch (err) {
      console.error('Error completing task:', err);
    } finally {
      setCompletingTaskId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="assistant-rail">
      {/* Header */}
      <div className="assistant-drawer-header">
        <h2>
          <Calendar size={18} style={{ color: 'var(--md-sys-color-primary)' }} />
          <span>{t('assistant.title', 'Asistente de Pendientes')}</span>
          {data.totalPendingCount > 0 && (
            <span className="pending-assistant-badge-count">
              {data.totalPendingCount}
            </span>
          )}
        </h2>
        <button
          onClick={onClose}
          className="assistant-close-btn"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Days Filter Selector */}
      <div className="assistant-filter-bar">
        <span>Ventana de tiempo:</span>
        <div className="assistant-segmented-tabs">
          {[7, 15, 30].map(d => (
            <button
              key={d}
              onClick={() => setDaysFilter(d)}
              className={`assistant-segmented-tab ${daysFilter === d ? 'active' : ''}`}
            >
              {d}d
            </button>
          ))}
        </div>
        <button 
          onClick={fetchPendingData} 
          title="Refrescar"
          className="assistant-close-btn"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Content Body */}
      <div className="assistant-drawer-body">
        {loading && (
          <div className="assistant-empty-state">
            <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--md-sys-color-primary)' }} />
            <span>{t('assistant.loading', 'Cargando pendientes...')}</span>
          </div>
        )}

        {!loading && data.projects.length === 0 && (
          <div className="assistant-empty-state">
            <CheckCircle2 size={40} style={{ color: 'var(--color-rag-green)' }} />
            <span>{t('assistant.noPending', '¡Todo al día! No hay tareas ni comunicaciones pendientes en este período.')}</span>
          </div>
        )}

        {!loading && data.projects.map(proj => {
          const isExpanded = expandedProjects[proj.id_proyecto] !== false;
          const projectPendingCount = (proj.tareas?.length || 0) + (proj.planesComunicacion?.length || 0);

          return (
            <div key={proj.id_proyecto} className="assistant-project-card">
              {/* Project Header Accordion */}
              <button
                onClick={() => toggleProjectExpand(proj.id_proyecto)}
                className="assistant-project-header"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--md-sys-color-primary)' }}>{proj.nombre_proyecto}</span>
                  <span className="pending-assistant-badge-count" style={{ backgroundColor: 'var(--md-sys-color-surface-container-highest)', color: 'var(--md-sys-color-on-surface)' }}>
                    {projectPendingCount}
                  </span>
                </div>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {/* Accordion Content */}
              {isExpanded && (
                <div className="assistant-project-content">
                  {/* Tareas del Proyecto */}
                  {proj.tareas && proj.tareas.length > 0 && (
                    <div>
                      <div className="assistant-section-title">
                        <Calendar size={12} style={{ color: 'var(--md-sys-color-tertiary)' }} />
                        <span>{t('assistant.tasksHeader', 'Tareas del Proyecto')}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {proj.tareas.map(task => (
                          <div 
                            key={task.id_tarea}
                            className={`assistant-item-card ${task.isOverdue ? 'overdue' : ''}`}
                          >
                            <button
                              onClick={() => handleMarkTaskComplete(task)}
                              disabled={completingTaskId === task.id_tarea}
                              className="assistant-close-btn"
                              style={{ padding: 0, flexShrink: 0, marginTop: 2 }}
                              title={t('assistant.markComplete', 'Marcar como completada')}
                            >
                              {completingTaskId === task.id_tarea ? (
                                <RefreshCw size={16} className="animate-spin" />
                              ) : (
                                <Circle size={16} />
                              )}
                            </button>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                                <div className="assistant-item-title">{task.titulo_tarea}</div>
                                <span 
                                  className={`badge ${task.estado === 'EN CURSO' ? 'badge-orange' : 'badge-gray'}`}
                                  style={{ fontSize: '0.65rem', padding: '1px 6px', flexShrink: 0 }}
                                >
                                  {task.estado === 'EN CURSO' ? '🟡 EN CURSO' : '⚪ SIN INICIAR'}
                                </span>
                              </div>
                              <div className={`assistant-item-meta ${task.isOverdue ? 'overdue' : ''}`}>
                                {task.isOverdue && <AlertTriangle size={12} />}
                                <span>
                                  {task.isOverdue ? t('assistant.overdue', 'Vencida') : 'Límite'}: {task.fecha_limite ? new Date(task.fecha_limite + 'T12:00:00').toLocaleDateString() : ''}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => onEditTask && onEditTask(task, proj)}
                              className="assistant-close-btn"
                              style={{ padding: 4, flexShrink: 0, alignSelf: 'center', color: 'var(--md-sys-color-primary)' }}
                              title={t('assistant.editTask', 'Editar tarea')}
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Planes de Comunicación */}
                  {proj.planesComunicacion && proj.planesComunicacion.length > 0 && (
                    <div>
                      <div className="assistant-section-title">
                        <Mail size={12} style={{ color: 'var(--md-sys-color-secondary)' }} />
                        <span>{t('assistant.commPlansHeader', 'Planes de Comunicación')}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {proj.planesComunicacion.map(plan => (
                          <div key={plan.id} className="assistant-item-card" style={{ justifyContent: 'space-between' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="assistant-item-title">{plan.titulo}</div>
                              <div className="assistant-item-meta">{plan.periodicidad || 'Periódico'}</div>
                            </div>
                            <button
                              onClick={() => onOpenReportModal && onOpenReportModal(proj, plan)}
                              className="assistant-action-btn"
                            >
                              <Mail size={12} />
                              <span>{t('assistant.openReport', 'Crear informe')}</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
