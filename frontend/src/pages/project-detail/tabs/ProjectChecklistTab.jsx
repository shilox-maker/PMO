import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { getSortedData } from '../../../utils/sorting';

export default function ProjectChecklistTab({
  project, openAddTask, openEditTask, handleToggleTask, handleDeleteTask,
  tasksSort, setTasksSort, renderSortHeader
}) {
  const sortedTasks = getSortedData(project.Tareas || [], tasksSort);

  return (
    <div className="m3-card glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontWeight: 600, fontSize: '1.25rem' }}>Checklist Interno y Tareas del Gestor (PM)</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>Lista de control interna para el seguimiento de hitos de entrega y gobernanza</p>
        </div>
        <button className="m3-btn m3-btn-primary" onClick={openAddTask}>
          <Plus size={16} /> Crear Tarea / Hito
        </button>
      </div>

      {(!project.Tareas || project.Tareas.length === 0) ? (
        <p style={{ color: 'var(--md-sys-color-outline)', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
          No hay tareas registradas en el checklist del proyecto.
        </p>
      ) : (
        <div className="m3-table-wrapper" style={{ border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 12 }}>
          <table className="m3-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>Check</th>
                {renderSortHeader('Tarea / Entregable', 'titulo_tarea', tasksSort, setTasksSort)}
                {renderSortHeader('Descripción', 'descripcion', tasksSort, setTasksSort)}
                {renderSortHeader('Fecha Límite', 'fecha_limite', tasksSort, setTasksSort)}
                {renderSortHeader('Hito?', 'es_hito', tasksSort, setTasksSort)}
                {renderSortHeader('Estado', 'estado', tasksSort, setTasksSort)}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedTasks.map((t) => (
                <tr key={t.id_tarea} style={{ opacity: t.estado === 'COMPLETADA' ? 0.6 : 1 }}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={t.estado === 'COMPLETADA'}
                      onChange={() => handleToggleTask(t.id_tarea, t.estado)}
                      style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                  </td>
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
                    {t.fecha_limite}
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
                    <div style={{ display: 'flex', gap: 8 }}>
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
