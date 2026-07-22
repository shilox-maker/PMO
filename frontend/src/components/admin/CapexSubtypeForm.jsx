import React from 'react';

export default function CapexSubtypeForm({
  addingSubtypeToId,
  editingSubtypeId,
  setEditingSubtypeId,
  setAddingSubtypeToId,
  subtypeForm,
  setSubtypeForm,
  types,
  onSubmit
}) {
  if (!addingSubtypeToId && !editingSubtypeId) return null;

  return (
    <div className="m3-card glass-panel">
      <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 12 }}>
        {editingSubtypeId ? 'Editar Subtipo CAPEX' : `Añadir Subtipo a ${types.find(t => t.id === addingSubtypeToId)?.nombre}`}
      </h3>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Nombre del Subtipo *</label>
          <input 
            type="text" 
            value={subtypeForm.nombre}
            onChange={e => setSubtypeForm(prev => ({ ...prev, nombre: e.target.value }))}
            required
            placeholder="Ej. Dynamics"
            className="m3-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Orden (opcional)</label>
          <input 
            type="number" 
            value={subtypeForm.orden}
            onChange={e => setSubtypeForm(prev => ({ ...prev, orden: e.target.value }))}
            placeholder="Ej. 1"
            className="m3-input"
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            type="button" 
            className="m3-btn m3-btn-outline" 
            onClick={() => {
              setEditingSubtypeId(null);
              setAddingSubtypeToId(null);
              setSubtypeForm({ id: '', nombre: '', orden: '', id_tipo_capex: '' });
            }}
          >
            Cancelar
          </button>
          <button type="submit" className="m3-btn m3-btn-primary" style={{ flexGrow: 1 }} disabled={!subtypeForm.nombre}>
            {editingSubtypeId ? 'Guardar' : 'Añadir Subtipo'}
          </button>
        </div>
      </form>
    </div>
  );
}
