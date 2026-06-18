import React, { useState, useEffect } from 'react';

export default function TaskModal({ 
  isOpen, onClose, projectId, editingTask, getAuthHeaders, onSuccess 
}) {
  const [form, setForm] = useState({
    id_tarea: '',
    titulo_tarea: '',
    descripcion: '',
    es_hito: false,
    estado: 'PENDIENTE',
    fecha_limite: ''
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
        fecha_limite: editingTask.fecha_limite || ''
      });
    } else {
      setForm({
        id_tarea: '',
        titulo_tarea: '',
        descripcion: '',
        es_hito: false,
        estado: 'PENDIENTE',
        fecha_limite: new Date().toISOString().split('T')[0]
      });
    }
    setError('');
  }, [editingTask, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.titulo_tarea || !form.fecha_limite) {
      setError('Por favor, rellene todos los campos obligatorios.');
      return;
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
          <h3 className="modal-title">{editingTask ? 'Editar Tarea' : 'Crear Tarea Checklist PM'}</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Título de Tarea *</label>
            <input 
              type="text" 
              value={form.titulo_tarea}
              onChange={(e) => setForm({ ...form, titulo_tarea: e.target.value })}
              placeholder="Reunión técnica"
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

          <div className="form-group" style={{ margin: '12px 0' }}>
            <label className="m3-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={form.es_hito}
                onChange={(e) => setForm({ ...form, es_hito: e.target.checked })}
                className="m3-checkbox"
              />
              <span>¿Es un Hito? (Visible en Dashboard de Cartera)</span>
            </label>
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
