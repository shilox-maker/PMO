import React from 'react';

export default function CapexTypeForm({
  editingTypeId,
  setEditingTypeId,
  typeForm,
  setTypeForm,
  onSubmit
}) {
  return (
    <div className="m3-card glass-panel">
      <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 12 }}>
        {editingTypeId ? 'Editar Tipo CAPEX' : 'Nuevo Tipo CAPEX'}
      </h3>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Nombre del Tipo *</label>
          <input 
            type="text" 
            value={typeForm.nombre}
            onChange={e => setTypeForm(prev => ({ ...prev, nombre: e.target.value }))}
            required
            placeholder="Ej. Growth"
            className="m3-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Orden (opcional)</label>
          <input 
            type="number" 
            value={typeForm.orden}
            onChange={e => setTypeForm(prev => ({ ...prev, orden: e.target.value }))}
            placeholder="Ej. 1"
            className="m3-input"
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {editingTypeId && (
            <button 
              type="button" 
              className="m3-btn m3-btn-outline" 
              onClick={() => {
                setEditingTypeId(null);
                setTypeForm({ id: '', nombre: '', orden: '' });
              }}
            >
              Cancelar
            </button>
          )}
          <button type="submit" className="m3-btn m3-btn-primary" style={{ flexGrow: 1 }} disabled={!typeForm.nombre}>
            {editingTypeId ? 'Guardar' : 'Añadir Tipo'}
          </button>
        </div>
      </form>
    </div>
  );
}
