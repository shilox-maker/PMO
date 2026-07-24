import React from 'react';
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
  const sortedTasks = getSortedData(project?.Tareas || [], tasksSort);

  const openAddTask = () => {
    if (setEditingTask) setEditingTask(null);
    if (setShowTaskModal) setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    if (setEditingTask) setEditingTask(task);
    if (setShowTaskModal) setShowTaskModal(true);
  };

  const handleToggleTask = (id_tarea, currentEstado) => {
    const newEstado = currentEstado === 'COMPLETADA' ? 'PENDIENTE' : 'COMPLETADA';
    const today = new Date().toISOString().split('T')[0];
    const taskObj = (project?.Tareas || []).find(t => t.id_tarea === id_tarea);

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

  const handleDeleteTask = (id_tarea) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta tarea/hito?')) return;

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
          <h3 style={{ fontWeight: 600, fontSize: '1.25rem' }}>Tareas del Proyecto</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>Seguimiento y control de tareas y hitos de gobernanza del proyecto</p>
        </div>
        <button className="m3-btn m3-btn-primary" onClick={openAddTask}>
          <Plus size={16} /> Crear Tarea / Hito
        </button>
      </div>

      {(!project?.Tareas || project.Tareas.length === 0) ? (
        <p style={{ color: 'var(--md-sys-color-outline)', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
          No hay tareas registradas en el proyecto.
        </p>
      ) : (
        <div className="m3-table-wrapper" style={{ border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 12 }}>
          <table className="m3-table">
            <thead>
              <tr>
                {renderSortHeader('Tarea / Entregable', 'titulo_tarea', tasksSort, setTasksSort)}
                {renderSortHeader('Descripción', 'descripcion', tasksSort, setTasksSort)}
                {renderSortHeader('Fecha Límite / Cierre', 'fecha_limite', tasksSort, setTasksSort)}
                {renderSortHeader('Hito?', 'es_hito', tasksSort, setTasksSort)}
                {renderSortHeader('Estado', 'estado', tasksSort, setTasksSort)}
                <th style={{ width: 110 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedTasks.map((t) => (
                <tr key={t.id_tarea} style={{ opacity: t.estado === 'COMPLETADA' ? 0.6 : 1 }}>
                  <td style={{ 
                    fontWeight: 600, 
                    textDecoration: t.estado === 'COMPLETADA' ? 'line-through' : 'none' 
                  }}>
                    {t.titulo_tarea}
                  </td>
                  <td>{t.descripcion || '—'}</td>
                  <td style={{ 
                    color: t.estado === 'PENDIENTE' && new Date(t.fecha_limite) < new Date() ? 'var(--color-rag-red)' : 'inherit',
                    fontWeight: t.estado === 'PENDIENTE' && new Date(t.fecha_limite) < new Date() ? 700 : 'normal'
                  }}>
                    {t.es_hito ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.8rem', lineHeight: '1.2' }}>
                        <div><span style={{ opacity: 0.65 }}>Original:</span> <span>{t.fecha_original_cierre || '—'}</span></div>
                        <div><span style={{ opacity: 0.65 }}>Actual:</span> <span style={{ fontWeight: 600 }}>{t.fecha_actual_cierre || '—'}</span></div>
                        <div><span style={{ opacity: 0.65 }}>Real:</span> <span style={{ color: t.fecha_real_cierre ? 'var(--color-rag-green)' : 'inherit' }}>{t.fecha_real_cierre || '—'}</span></div>
                      </div>
                    ) : (
                      t.fecha_limite
                    )}
                  </td>
                  <td>
                    {t.es_hito ? (
                      <span className="badge badge-orange" style={{ fontSize: '0.7rem' }}>🏁 Hito</span>
                    ) : '—'}
                  </td>
                  <td>
                    <span className={`badge ${t.estado === 'COMPLETADA' ? 'badge-green' : 'badge-orange'}`}>
                      {t.estado}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input 
                        type="checkbox" 
                        checked={t.estado === 'COMPLETADA'}
                        onChange={() => handleToggleTask(t.id_tarea, t.estado)}
                        style={{ width: 18, height: 18, cursor: 'pointer', margin: 0 }}
                        title={t.estado === 'COMPLETADA' ? "Marcar como pendiente" : "Marcar como completada"}
                      />
                      <button className="icon-btn" onClick={() => openEditTask(t)} title="Editar tarea">
                        <Edit2 size={14} />
                      </button>
                      <button className="icon-btn" onClick={() => handleDeleteTask(t.id_tarea)} title="Eliminar tarea" style={{ color: 'var(--color-rag-red)' }}>
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
