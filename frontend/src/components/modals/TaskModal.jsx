import React, { useState, useEffect } from 'react';

export default function TaskModal({ 
  isOpen, onClose, projectId, editingTask: propEditingTask, task, getAuthHeaders, onSuccess 
}) {
  const editingTask = propEditingTask || task;

  const [form, setForm] = useState({
    id_tarea: '',
    titulo_tarea: '',
    descripcion: '',
    es_hito: false,
    estado: 'PENDIENTE',
    fecha_limite: '',
    fecha_original_cierre: '',
    fecha_actual_cierre: '',
    fecha_real_cierre: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingTask) {
      setForm({
        id_tarea: editingTask.id_tarea,
        titulo_tarea: editingTask.titulo_tarea || '',
        descripcion: editingTask.descripcion || '',
        es_hito: !!editingTask.es_hito,
        estado: editingTask.estado || 'PENDIENTE',
        fecha_limite: editingTask.fecha_limite || '',
        fecha_original_cierre: editingTask.fecha_original_cierre || '',
        fecha_actual_cierre: editingTask.fecha_actual_cierre || '',
        fecha_real_cierre: editingTask.fecha_real_cierre || ''
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setForm({
        id_tarea: '',
        titulo_tarea: '',
        descripcion: '',
        es_hito: false,
        estado: 'PENDIENTE',
        fecha_limite: today,
        fecha_original_cierre: today,
        fecha_actual_cierre: today,
        fecha_real_cierre: ''
      });
    }
    setError('');
  }, [editingTask, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!form.titulo_tarea) {
      setError('El título es obligatorio.');
      return;
    }
    if (form.es_hito) {
      if (!form.fecha_original_cierre || !form.fecha_actual_cierre) {
        setError('Las fechas original y actual de cierre son obligatorias para un hito.');
        return;
      }
    } else {
      if (!form.fecha_limite) {
        setError('La fecha límite es obligatoria.');
        return;
      }
    }

    const payload = { ...form, id_proyecto: projectId };
    const isEdit = !!editingTask;
    const url = isEdit 
      ? `${import.meta.env.VITE_API_URL}/tasks/${editingTask.id_tarea}` 
      : `${import.meta.env.VITE_API_URL}/tasks`;
    const method = isEdit ? 'PUT' : 'POST';

    if (!isEdit) {
      delete payload.id_tarea;
    }

    // Sync fecha_limite with actual completion date for milestones
    if (payload.es_hito) {
      payload.fecha_limite = payload.fecha_actual_cierre;
      if (payload.estado !== 'COMPLETADA') {
        payload.fecha_real_cierre = '';
      }
    } else {
      payload.fecha_original_cierre = '';
      payload.fecha_actual_cierre = '';
      payload.fecha_real_cierre = '';
    }

    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Error al guardar la tarea');
        return d;
      })
      .then(() => {
        onSuccess();
        onClose();
      })
      .catch(err => setError(err.message));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3 className="modal-title">{editingTask ? 'Editar Tarea / Hito' : 'Crear Tarea / Hito'}</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Título de Tarea / Hito *</label>
            <input 
              type="text" 
              value={form.titulo_tarea}
              onChange={(e) => setForm({ ...form, titulo_tarea: e.target.value })}
              placeholder="Ej. Taller de diseño técnico"
              required
              className="m3-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción</label>
            <input 
              type="text" 
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className="m3-input"
              placeholder="Detalles opcionales..."
            />
          </div>

          <div className="form-group" style={{ margin: '12px 0' }}>
            <label className="m3-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={form.es_hito}
                onChange={(e) => {
                  const checked = e.target.checked;
                  const today = new Date().toISOString().split('T')[0];
                  setForm({ 
                    ...form, 
                    es_hito: checked,
                    fecha_original_cierre: checked ? (form.fecha_original_cierre || form.fecha_limite || today) : '',
                    fecha_actual_cierre: checked ? (form.fecha_actual_cierre || form.fecha_limite || today) : ''
                  });
                }}
                className="m3-checkbox"
              />
              <span>¿Es un Hito? (Visible en Dashboard de Cartera)</span>
            </label>
          </div>

          {form.es_hito ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">F. Original Cierre *</label>
                  <input 
                    type="date" 
                    value={form.fecha_original_cierre}
                    onChange={(e) => setForm({ ...form, fecha_original_cierre: e.target.value })}
                    required
                    className="m3-input"
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">F. Actual Cierre *</label>
                  <input 
                    type="date" 
                    value={form.fecha_actual_cierre}
                    onChange={(e) => setForm({ ...form, fecha_actual_cierre: e.target.value })}
                    required
                    className="m3-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">F. Real Cierre {form.estado !== 'COMPLETADA' && '(Solo si está COMPLETADA)'}</label>
                <input 
                  type="date" 
                  value={form.fecha_real_cierre}
                  onChange={(e) => setForm({ ...form, fecha_real_cierre: e.target.value })}
                  disabled={form.estado !== 'COMPLETADA'}
                  className="m3-input"
                />
              </div>
            </>
          ) : (
            <div className="form-group">
              <label className="form-label">Fecha Límite *</label>
              <input 
                type="date" 
                value={form.fecha_limite}
                onChange={(e) => setForm({ ...form, fecha_limite: e.target.value })}
                required
                className="m3-input"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Estado</label>
            <select
              value={form.estado}
              onChange={(e) => {
                const newEstado = e.target.value;
                const today = new Date().toISOString().split('T')[0];
                setForm({ 
                  ...form, 
                  estado: newEstado,
                  fecha_real_cierre: newEstado === 'COMPLETADA' ? (form.fecha_real_cierre || today) : ''
                });
              }}
              className="m3-input"
              style={{ width: '100%' }}
            >
              <option value="PENDIENTE">PENDIENTE 🟡</option>
              <option value="COMPLETADA">COMPLETADA 🟢</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="m3-btn m3-btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="m3-btn m3-btn-primary">
              {editingTask ? 'Guardar Cambios' : 'Crear Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
