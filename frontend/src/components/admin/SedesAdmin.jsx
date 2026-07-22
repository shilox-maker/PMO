import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, RefreshCw, XCircle, CheckCircle } from 'lucide-react';

export default function SedesAdmin({ getAuthHeaders }) {
  const [sedes, setSedes] = useState([]);
  const [sedesLoading, setSedesLoading] = useState(false);
  const [sedeForm, setSedeForm] = useState({ id_sede: '', nombre_sede: '' });
  const [editingSedeId, setEditingSedeId] = useState(null);
  const [sedeError, setSedeError] = useState('');
  const [sedeSuccess, setSedeSuccess] = useState('');

  const fetchSedes = () => {
    setSedesLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/sedes`, {
      headers: getAuthHeaders()
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar sedes');
        return res.json();
      })
      .then(data => {
        setSedes(data);
        setSedesLoading(false);
      })
      .catch(err => {
        setSedeError(err.message);
        setSedesLoading(false);
      });
  };

  useEffect(() => {
    fetchSedes();
  }, []);

  const handleSedeSubmit = (e) => {
    e.preventDefault();
    setSedeError('');
    setSedeSuccess('');

    if (!sedeForm.nombre_sede) {
      setSedeError('El nombre de la sede es obligatorio.');
      return;
    }

    const isEdit = editingSedeId !== null;
    const url = isEdit 
      ? `${import.meta.env.VITE_API_URL}/admin/sedes/${editingSedeId}` 
      : `${import.meta.env.VITE_API_URL}/admin/sedes`;
    const method = isEdit ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify({ nombre_sede: sedeForm.nombre_sede })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al guardar la sede.');
        return data;
      })
      .then(() => {
        setSedeSuccess(isEdit ? 'Sede actualizada correctamente.' : 'Sede creada correctamente.');
        setSedeForm({ id_sede: '', nombre_sede: '' });
        setEditingSedeId(null);
        fetchSedes();
      })
      .catch(err => setSedeError(err.message));
  };

  const handleEditSedeClick = (s) => {
    setSedeForm({ id_sede: s.id_sede, nombre_sede: s.nombre_sede });
    setEditingSedeId(s.id_sede);
    setSedeError('');
    setSedeSuccess('');
  };

  const handleDeleteSedeClick = (id) => {
    if (!window.confirm('¿Seguro que desea eliminar esta sede?')) return;
    setSedeError('');
    setSedeSuccess('');

    fetch(`${import.meta.env.VITE_API_URL}/admin/sedes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al eliminar la sede.');
        return data;
      })
      .then(() => {
        setSedeSuccess('Sede eliminada del sistema.');
        fetchSedes();
      })
      .catch(err => setSedeError(err.message));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, alignItems: 'flex-start' }}>
      <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h3 style={{ fontWeight: 600, fontSize: '1.15rem' }}>Sedes ({sedes.length})</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>Listado de oficinas y sedes corporativas.</p>
        </div>

        {sedesLoading ? (
          <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--md-sys-color-primary)', alignSelf: 'center' }} />
        ) : sedes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--md-sys-color-outline)' }}>No hay sedes creadas.</div>
        ) : (
          <div className="m3-table-wrapper">
            <table className="m3-table">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>ID</th>
                  <th>Nombre de Sede</th>
                  <th style={{ width: '90px' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {sedes.map(s => (
                  <tr key={s.id_sede}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{s.id_sede}</td>
                    <td style={{ fontWeight: 500 }}>{s.nombre_sede}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="icon-btn" onClick={() => handleEditSedeClick(s)} title="Editar Sede">
                          <Edit2 size={16} />
                        </button>
                        <button className="icon-btn danger" onClick={() => handleDeleteSedeClick(s.id_sede)} title="Eliminar Sede">
                          <Trash2 size={16} />
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

      <div className="m3-card glass-panel" style={{ position: 'sticky', top: 24 }}>
        <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 16 }}>
          {editingSedeId ? 'Editar Sede' : 'Añadir Nueva Sede'}
        </h3>
        
        {sedeError && (
          <div className="status-alert alert-error" style={{ marginBottom: 16 }}>
            <XCircle size={18} />
            <span>{sedeError}</span>
          </div>
        )}

        {sedeSuccess && (
          <div className="status-alert alert-success" style={{ marginBottom: 16 }}>
            <CheckCircle size={18} />
            <span>{sedeSuccess}</span>
          </div>
        )}

        <form onSubmit={handleSedeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Nombre de Sede *</label>
            <input 
              type="text" 
              value={sedeForm.nombre_sede}
              onChange={(e) => setSedeForm(prev => ({ ...prev, nombre_sede: e.target.value }))}
              className="m3-input"
              placeholder="Ej: Oficinas Centrales"
              autoComplete="off"
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            {editingSedeId && (
              <button 
                type="button" 
                className="m3-btn m3-btn-outline" 
                style={{ flexGrow: 1 }}
                onClick={() => {
                  setEditingSedeId(null);
                  setSedeForm({ id_sede: '', nombre_sede: '' });
                }}
              >
                Cancelar
              </button>
            )}
            <button type="submit" className="m3-btn m3-btn-primary" style={{ flexGrow: 1 }} disabled={!sedeForm.nombre_sede}>
              {editingSedeId ? 'Guardar Cambios' : 'Registrar Sede'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
