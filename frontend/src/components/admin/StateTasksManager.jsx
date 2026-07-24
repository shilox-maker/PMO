import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Flag, AlertCircle } from 'lucide-react';

export default function StateTasksManager({ state, onStateUpdated, getAuthHeaders }) {
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [isMilestone, setIsMilestone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const tasks = state?.TareasPlantilla || [];

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    if (!state?.id_estado) {
      setError('Guarda el estado antes de añadir tareas preconfiguradas.');
      return;
    }

    setLoading(true);
    setError('');

    fetch(`${import.meta.env.VITE_API_URL}/admin/states/${state.id_estado}/tasks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        nombre_tarea: taskName.trim(),
        descripcion: taskDescription.trim() || null,
        es_hito: isMilestone
      })
    })
      .then(async res => {
        const text = await res.text();
        let data = {};
        try {
          data = JSON.parse(text);
        } catch (err) {
          data = { error: `Respuesta del servidor no válida (HTTP ${res.status}: ${res.statusText || 'Error de red'})` };
        }
        if (!res.ok) throw new Error(data.error || 'Error al guardar la tarea.');
        return data;
      })
      .then(() => {
        setTaskName('');
        setTaskDescription('');
        setIsMilestone(false);
        setLoading(false);
        onStateUpdated();
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  const handleDeleteTask = (idTask) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta tarea plantilla?')) return;
    setLoading(true);

    fetch(`${import.meta.env.VITE_API_URL}/admin/state-tasks/${idTask}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then(async res => {
        const text = await res.text();
        let data = {};
        try {
          data = JSON.parse(text);
        } catch (err) {
          data = { error: `Respuesta del servidor no válida (HTTP ${res.status}: ${res.statusText || 'Error de red'})` };
        }
        if (!res.ok) throw new Error(data.error || 'Error al eliminar la tarea.');
        return data;
      })
      .then(() => {
        setLoading(false);
        onStateUpdated();
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  return (
    <div className="m3-card glass-panel" style={{ marginTop: 24, padding: 24 }}>
      <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>📋</span> Gestión de Tareas Preconfiguradas (Plantilla)
      </h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)', marginBottom: 20 }}>
        Lista de tareas o hitos que se sugerirá crear automáticamente cuando un proyecto pase a este estado.
      </p>

      {error && (
        <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 12, marginBottom: 16, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Formulario Nueva Tarea */}
      <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: 12, backgroundColor: 'var(--md-sys-color-surface-container)', padding: 16, borderRadius: 12, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Nombre de la tarea preconfigurada *"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="m3-input"
            style={{ flexGrow: 1, minWidth: '200px' }}
            required
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', userSelect: 'none' }}>
            <input 
              type="checkbox" 
              checked={isMilestone} 
              onChange={(e) => setIsMilestone(e.target.checked)} 
              style={{ width: 16, height: 16 }}
            />
            <Flag size={14} style={{ color: isMilestone ? '#f59e0b' : 'inherit' }} /> Es Hito
          </label>
        </div>

        <input 
          type="text" 
          placeholder="Descripción opcional..."
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          className="m3-input"
          style={{ fontSize: '0.85rem' }}
        />

        <button 
          type="submit" 
          disabled={loading || !taskName.trim()} 
          className="m3-btn m3-btn-primary" 
          style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', fontSize: '0.85rem' }}
        >
          <Plus size={16} /> {loading ? 'Añadiendo...' : 'Añadir Tarea'}
        </button>
      </form>

      {/* Tabla de tareas */}
      <div className="m3-table-wrapper">
        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--md-sys-color-outline)', fontSize: '0.9rem' }}>
            Sin tareas preconfiguradas asociadas a este estado.
          </div>
        ) : (
          <table className="m3-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '50px', textAlign: 'center' }}>Tipo</th>
                <th>Tarea / Hito</th>
                <th>Descripción</th>
                <th style={{ width: '70px', textAlign: 'center' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(t => (
                <tr key={t.id}>
                  <td style={{ textAlign: 'center' }}>
                    {t.es_hito ? (
                      <Flag size={16} style={{ color: '#f59e0b' }} title="Hito" />
                    ) : (
                      <CheckCircle2 size={16} style={{ color: 'var(--md-sys-color-primary)' }} title="Tarea" />
                    )}
                  </td>
                  <td style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.nombre_tarea}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>{t.descripcion || '—'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      type="button"
                      className="icon-btn"
                      onClick={() => handleDeleteTask(t.id)}
                      style={{ color: 'var(--color-rag-red)' }}
                      title="Eliminar tarea"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
