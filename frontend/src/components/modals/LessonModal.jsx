import React, { useState, useEffect } from 'react';

export default function LessonModal({ 
  isOpen, onClose, projectId, editingLesson, getAuthHeaders, onSuccess 
}) {
  const [form, setForm] = useState({
    titulo: '',
    tipo_leccion: 'BUENA_PRACTICA',
    contexto: '',
    recomendacion_futura: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingLesson) {
      setForm({
        titulo: editingLesson.titulo || '',
        tipo_leccion: editingLesson.tipo_leccion || 'BUENA_PRACTICA',
        contexto: editingLesson.contexto || '',
        recomendacion_futura: editingLesson.recomendacion_futura || ''
      });
    } else {
      setForm({
        titulo: '',
        tipo_leccion: 'BUENA_PRACTICA',
        contexto: '',
        recomendacion_futura: ''
      });
    }
    setError('');
  }, [editingLesson, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!form.titulo) {
      setError('El título es obligatorio.');
      return;
    }

    const payload = { ...form, id_proyecto: projectId };
    const isEdit = !!editingLesson;
    const url = isEdit 
      ? `${import.meta.env.VITE_API_URL}/lessons/${editingLesson.id}` 
      : `${import.meta.env.VITE_API_URL}/lessons`;
    const method = isEdit ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Error al guardar la lección');
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
          <h3 className="modal-title">{editingLesson ? 'Editar Lección Aprendida' : 'Registrar Lección Aprendida'}</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Título *</label>
            <input 
              type="text" 
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ej. Realizar pruebas integradas tempranas"
              required
              className="m3-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tipo de Lección *</label>
            <select
              value={form.tipo_leccion}
              onChange={(e) => setForm({ ...form, tipo_leccion: e.target.value })}
              className="user-select"
              required
            >
              <option value="BUENA_PRACTICA">Buena Práctica</option>
              <option value="ERROR_A_EVITAR">Error a Evitar</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Contexto (Problema/Situación)</label>
            <textarea 
              value={form.contexto}
              onChange={(e) => setForm({ ...form, contexto: e.target.value })}
              placeholder="Explica qué sucedió..."
              className="m3-input"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Recomendación Futura</label>
            <textarea 
              value={form.recomendacion_futura}
              onChange={(e) => setForm({ ...form, recomendacion_futura: e.target.value })}
              placeholder="Cómo proceder en el futuro..."
              className="m3-input"
              rows={3}
            />
          </div>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="m3-btn m3-btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="m3-btn m3-btn-primary">
              {editingLesson ? 'Guardar Cambios' : 'Registrar Lección'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
