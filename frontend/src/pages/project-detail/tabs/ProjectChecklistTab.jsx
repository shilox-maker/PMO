import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { getSortedData } from '../../../utils/sorting';

export default function ProjectChecklistTab({
  project, 
  tasksSort, 
  setTasksSort, 
  renderSortHeader,
  setShowTaskModal,
  setEditingTask,
  fetchProjectData,
  getAuthHeaders
}) {
  const { t } = useTranslation();
  const sortedTasks = getSortedData(project?.Tareas || [], tasksSort);

  const openAddTask = () => {
    if (setEditingTask) setEditingTask(null);
    if (setShowTaskModal) setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    if (setEditingTask) setEditingTask(task);
    if (setShowTaskModal) setShowTaskModal(true);
  };

  const handleStatusChange = (id_tarea, newEstado) => {
    const today = new Date().toISOString().split('T')[0];
    const taskObj = (project?.Tareas || []).find(tItem => tItem.id_tarea === id_tarea);

    const payload = {
      estado: newEstado,
      ...(newEstado === 'COMPLETADA' && taskObj?.es_hito ? { fecha_real_cierre: taskObj.fecha_real_cierre || today } : {})
    };

    fetch(`${import.meta.env.VITE_API_URL}/tasks/${id_tarea}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(async res => {
        const d = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(d.error || 'Error al actualizar el estado de la tarea');
        return d;
      })
      .then(() => {
        if (fetchProjectData) fetchProjectData();
      })
      .catch(err => alert(err.message));
  };

  const getBadgeClass = (estado) => {
    switch (estado) {
      case 'COMPLETADA':
        return 'badge-green';
      case 'EN CURSO':
        return 'badge-orange';
      case 'SIN INICIAR':
      default:
        return 'badge-gray';
    }
  };

  const handleDeleteTask = (id_tarea) => {
    if (!window.confirm(t('projectDetail.tasksTab.deleteConfirm', '¿Seguro que deseas eliminar esta tarea/hito?'))) return;

    fetch(`${import.meta.env.VITE_API_URL}/tasks/${id_tarea}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then(async res => {
        const d = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(d.error || 'Error al eliminar la tarea');
        return d;
      })
      .then(() => {
        if (fetchProjectData) fetchProjectData();
      })
      .catch(err => alert(err.message));
  };

  return (
    <div className="m3-card glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontWeight: 600, fontSize: '1.25rem' }}>{t('projectDetail.tasksTab.title', 'Tareas del Proyecto')}</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>{t('projectDetail.tasksTab.subtitle', 'Seguimiento y control de tareas y hitos de gobernanza del proyecto')}</p>
        </div>
        <button className="m3-btn m3-btn-primary" onClick={openAddTask}>
          <Plus size={16} /> {t('projectDetail.tasksTab.createTask', 'Crear Tarea / Hito')}
        </button>
      </div>

      {(!project?.Tareas || project.Tareas.length === 0) ? (
        <p style={{ color: 'var(--md-sys-color-outline)', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
          {t('projectDetail.tasksTab.noTasks', 'No hay tareas registradas en el proyecto.')}
        </p>
      ) : (
        <div className="m3-table-wrapper" style={{ border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 12 }}>
          <table className="m3-table">
            <thead>
              <tr>
                {renderSortHeader(t('projectDetail.tasksTab.taskHeader', 'Tarea / Entregable'), 'titulo_tarea', tasksSort, setTasksSort)}
                {renderSortHeader(t('projectDetail.tasksTab.descHeader', 'Descripción'), 'descripcion', tasksSort, setTasksSort)}
                {renderSortHeader(t('projectDetail.tasksTab.dateHeader', 'Fecha Límite / Cierre'), 'fecha_limite', tasksSort, setTasksSort)}
                {renderSortHeader(t('projectDetail.tasksTab.milestoneHeader', 'Hito?'), 'es_hito', tasksSort, setTasksSort)}
                {renderSortHeader(t('projectDetail.tasksTab.statusHeader', 'Estado'), 'estado', tasksSort, setTasksSort)}
                <th style={{ width: 110 }}>{t('projectDetail.tasksTab.actionsHeader', 'Acciones')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedTasks.map((tItem) => (
                <tr key={tItem.id_tarea} style={{ opacity: tItem.estado === 'COMPLETADA' ? 0.6 : 1 }}>
                  <td style={{ 
                    fontWeight: 600, 
                    textDecoration: tItem.estado === 'COMPLETADA' ? 'line-through' : 'none' 
                  }}>
                    {tItem.titulo_tarea}
                  </td>
                  <td>{tItem.descripcion || '—'}</td>
                  <td style={{ 
                    color: tItem.estado !== 'COMPLETADA' && new Date(tItem.fecha_limite) < new Date() ? 'var(--color-rag-red)' : 'inherit',
                    fontWeight: tItem.estado !== 'COMPLETADA' && new Date(tItem.fecha_limite) < new Date() ? 700 : 'normal'
                  }}>
                    {tItem.es_hito ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.8rem', lineHeight: '1.2' }}>
                        <div><span style={{ opacity: 0.65 }}>{t('projectDetail.tasksTab.origDate', 'Original:')}</span> <span>{tItem.fecha_original_cierre || '—'}</span></div>
                        <div><span style={{ opacity: 0.65 }}>{t('projectDetail.tasksTab.currDate', 'Actual:')}</span> <span style={{ fontWeight: 600 }}>{tItem.fecha_actual_cierre || '—'}</span></div>
                        <div><span style={{ opacity: 0.65 }}>{t('projectDetail.tasksTab.realDate', 'Real:')}</span> <span style={{ color: tItem.fecha_real_cierre ? 'var(--color-rag-green)' : 'inherit' }}>{tItem.fecha_real_cierre || '—'}</span></div>
                      </div>
                    ) : (
                      tItem.fecha_limite
                    )}
                  </td>
                  <td>
                    {tItem.es_hito ? (
                      <span className="badge badge-orange" style={{ fontSize: '0.7rem' }}>{t('projectDetail.tasksTab.milestoneBadge', '🏁 Hito')}</span>
                    ) : '—'}
                  </td>
                  <td>
                    <select
                      value={tItem.estado || 'SIN INICIAR'}
                      onChange={(e) => handleStatusChange(tItem.id_tarea, e.target.value)}
                      className={`badge ${getBadgeClass(tItem.estado)}`}
                      style={{
                        cursor: 'pointer',
                        border: 'none',
                        outline: 'none',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        padding: '4px 8px',
                        borderRadius: '6px'
                      }}
                    >
                      <option value="SIN INICIAR">{t('projectDetail.tasksTab.statusNotStarted', '⚪ SIN INICIAR')}</option>
                      <option value="EN CURSO">{t('projectDetail.tasksTab.statusInProgress', '🟡 EN CURSO')}</option>
                      <option value="COMPLETADA">{t('projectDetail.tasksTab.statusCompleted', '🟢 COMPLETADA')}</option>
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button className="icon-btn" onClick={() => openEditTask(tItem)} title={t('common.edit', 'Editar')}>
                        <Edit2 size={14} />
                      </button>
                      <button className="icon-btn" onClick={() => handleDeleteTask(tItem.id_tarea)} title={t('common.delete', 'Eliminar')} style={{ color: 'var(--color-rag-red)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
