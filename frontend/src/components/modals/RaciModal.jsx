import React, { useState, useEffect } from 'react';
import SearchableContactSelect from '../SearchableContactSelect';

export default function RaciModal({ 
  isOpen, onClose, projectId, editingParticipant, getAuthHeaders, onSuccess, contactosList 
}) {
  const [form, setForm] = useState({
    id_contacto: '',
    rol: 'Usuario funcional',
    r: false,
    a: false,
    c: false,
    i: false
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingParticipant) {
      const raciString = editingParticipant.Proyecto_Contactos?.raci || '';
      setForm({
        id_contacto: editingParticipant.id_contacto,
        rol: editingParticipant.Proyecto_Contactos?.rol || 'Usuario funcional',
        r: raciString.includes('R'),
        a: raciString.includes('A'),
        c: raciString.includes('C'),
        i: raciString.includes('I')
      });
    } else {
      setForm({
        id_contacto: '',
        rol: 'Usuario funcional',
        r: false,
        a: false,
        c: false,
        i: true
      });
    }
    setError('');
  }, [editingParticipant, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    let raciVal = '';
    if (form.r) raciVal += 'R';
    if (form.a) raciVal += 'A';
    if (form.c) raciVal += 'C';
    if (form.i) raciVal += 'I';

    if (!form.id_contacto) {
      setError('Debe seleccionar un contacto.');
      return;
    }

    if (!raciVal) {
      setError('Debe marcar al menos un nivel de responsabilidad RACI.');
      return;
    }

    const payload = {
      id_contacto: Number(form.id_contacto),
      rol: form.rol,
      raci: raciVal
    };

    fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}/participants`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const isJson = res.headers.get('content-type')?.includes('application/json');
        const d = isJson ? await res.json() : null;
        if (!res.ok) throw new Error(d?.error || `Error ${res.status}: ${res.statusText}`);
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
          <h3 className="modal-title">{editingParticipant ? 'Editar Participante' : 'Asignar Participante (RACI)'}</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {editingParticipant ? (
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Participante seleccionado</label>
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--md-sys-color-surface-container)', borderRadius: '8px', fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface)' }}>
                {(() => {
                  const companyName = editingParticipant.Proveedore?.nombre_razon_social || editingParticipant.Proveedor?.nombre_razon_social;
                  const compStr = companyName ? ` (${companyName})` : '';
                  return `${editingParticipant.nombre} ${editingParticipant.apellidos}${compStr}`;
                })()}
              </div>
            </div>
          ) : (
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Contacto *</label>
              <SearchableContactSelect 
                contacts={contactosList}
                selected={form.id_contacto}
                onChange={(val) => setForm({ ...form, id_contacto: val })}
                multiple={false}
                placeholder="Seleccione un contacto..."
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Rol en el Proyecto *</label>
            <input
              type="text"
              value={form.rol}
              onChange={(e) => setForm({ ...form, rol: e.target.value })}
              placeholder="Ej. Desarrollador, Validador, etc."
              required
              className="m3-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Responsabilidades RACI *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
              <label className="m3-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.r}
                  onChange={(e) => setForm({ ...form, r: e.target.checked })}
                  className="m3-checkbox"
                />
                <span>R (Responsible)</span>
              </label>

              <label className="m3-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.a}
                  onChange={(e) => setForm({ ...form, a: e.target.checked })}
                  className="m3-checkbox"
                />
                <span>A (Accountable)</span>
              </label>

              <label className="m3-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.c}
                  onChange={(e) => setForm({ ...form, c: e.target.checked })}
                  className="m3-checkbox"
                />
                <span>C (Consulted)</span>
              </label>

              <label className="m3-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.i}
                  onChange={(e) => setForm({ ...form, i: e.target.checked })}
                  className="m3-checkbox"
                />
                <span>I (Informed)</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="m3-btn m3-btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="m3-btn m3-btn-primary">
              {editingParticipant ? 'Guardar Cambios' : 'Asignar Participante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
