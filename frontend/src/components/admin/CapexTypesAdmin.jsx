import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import CapexTypeForm from './CapexTypeForm';
import CapexSubtypeForm from './CapexSubtypeForm';

export default function CapexTypesAdmin({ getAuthHeaders }) {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Type form state
  const [typeForm, setTypeForm] = useState({ id: '', nombre: '', orden: '' });
  const [editingTypeId, setEditingTypeId] = useState(null);

  // Subtype form state
  const [subtypeForm, setSubtypeForm] = useState({ id: '', nombre: '', orden: '', id_tipo_capex: '' });
  const [editingSubtypeId, setEditingSubtypeId] = useState(null);
  const [addingSubtypeToId, setAddingSubtypeToId] = useState(null);

  // Expanded row state
  const [expandedTypes, setExpandedTypes] = useState({});

  const fetchTypes = () => {
    setLoading(true);
    setError('');
    fetch(`${import.meta.env.VITE_API_URL}/admin/capex-types`, { headers: getAuthHeaders() })
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar tipos CAPEX');
        return res.json();
      })
      .then(data => {
        setTypes(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const toggleExpand = (id) => {
    setExpandedTypes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // --- TYPE CRUD ---
  const handleTypeSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const url = editingTypeId 
      ? `${import.meta.env.VITE_API_URL}/admin/capex-types/${editingTypeId}`
      : `${import.meta.env.VITE_API_URL}/admin/capex-types`;
    const method = editingTypeId ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: typeForm.nombre,
        orden: typeForm.orden ? parseInt(typeForm.orden, 10) : undefined
      })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al guardar el tipo CAPEX');
        return data;
      })
      .then(() => {
        setSuccess(editingTypeId ? 'Tipo CAPEX actualizado.' : 'Tipo CAPEX creado.');
        setTypeForm({ id: '', nombre: '', orden: '' });
        setEditingTypeId(null);
        fetchTypes();
      })
      .catch(err => setError(err.message));
  };

  const startEditType = (t) => {
    setEditingTypeId(t.id);
    setTypeForm({ id: t.id, nombre: t.nombre, orden: t.orden });
  };

  const deleteType = (id) => {
    if (!window.confirm('¿Seguro que desea eliminar este tipo CAPEX?')) return;
    setError('');
    setSuccess('');

    fetch(`${import.meta.env.VITE_API_URL}/admin/capex-types/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al eliminar');
        return data;
      })
      .then(() => {
        setSuccess('Tipo CAPEX eliminado.');
        fetchTypes();
      })
      .catch(err => setError(err.message));
  };

  // --- SUBTYPE CRUD ---
  const handleSubtypeSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const url = editingSubtypeId
      ? `${import.meta.env.VITE_API_URL}/admin/capex-subtypes/${editingSubtypeId}`
      : `${import.meta.env.VITE_API_URL}/admin/capex-types/${addingSubtypeToId}/subtypes`;
    const method = editingSubtypeId ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: subtypeForm.nombre,
        orden: subtypeForm.orden ? parseInt(subtypeForm.orden, 10) : undefined
      })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al guardar subtipo');
        return data;
      })
      .then(() => {
        setSuccess(editingSubtypeId ? 'Subtipo actualizado.' : 'Subtipo añadido.');
        setSubtypeForm({ id: '', nombre: '', orden: '', id_tipo_capex: '' });
        setEditingSubtypeId(null);
        setAddingSubtypeToId(null);
        fetchTypes();
      })
      .catch(err => setError(err.message));
  };

  const startEditSubtype = (s) => {
    setEditingSubtypeId(s.id);
    setSubtypeForm({ id: s.id, nombre: s.nombre, orden: s.orden, id_tipo_capex: s.id_tipo_capex });
    setAddingSubtypeToId(null);
  };

  const deleteSubtype = (id) => {
    if (!window.confirm('¿Seguro que desea eliminar este subtipo CAPEX?')) return;
    setError('');
    setSuccess('');

    fetch(`${import.meta.env.VITE_API_URL}/admin/capex-subtypes/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al eliminar');
        return data;
      })
      .then(() => {
        setSuccess('Subtipo CAPEX eliminado.');
        fetchTypes();
      })
      .catch(err => setError(err.message));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {error && <div className="toast toast-error">{error}</div>}
      {success && <div className="toast toast-success">{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, alignItems: 'flex-start' }}>
        {/* List of Capex Types */}
        <div className="m3-card glass-panel">
          <h3 style={{ fontWeight: 600, fontSize: '1.15rem', marginBottom: 12 }}>Tipos de CAPEX</h3>
          {loading ? (
            <p>Cargando catálogo...</p>
          ) : (
            <table className="m3-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Nombre</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Orden</th>
                  <th style={{ width: '140px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {types.map(t => (
                  <React.Fragment key={t.id}>
                    <tr>
                      <td>
                        <button className="icon-btn" onClick={() => toggleExpand(t.id)}>
                          {expandedTypes[t.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                      <td style={{ fontWeight: 600 }}>{t.nombre}</td>
                      <td style={{ textAlign: 'center' }}>{t.orden}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button 
                            className="m3-btn m3-btn-outline" 
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            onClick={() => {
                              setAddingSubtypeToId(t.id);
                              setEditingSubtypeId(null);
                              setSubtypeForm({ id: '', nombre: '', orden: '', id_tipo_capex: t.id });
                            }}
                          >
                            + Subtipo
                          </button>
                          <button className="icon-btn" onClick={() => startEditType(t)}><Edit2 size={14} /></button>
                          <button className="icon-btn text-danger" onClick={() => deleteType(t.id)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                    {expandedTypes[t.id] && (
                      <tr>
                        <td colSpan={4} style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '12px 24px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--md-sys-color-outline)' }}>
                              Subtipos de {t.nombre} ({t.Subtipos?.length || 0})
                            </div>
                            {t.Subtipos && t.Subtipos.length > 0 ? (
                              <table className="m3-table" style={{ width: '100%', marginTop: 4 }}>
                                <thead>
                                  <tr>
                                    <th>Nombre del Subtipo</th>
                                    <th style={{ width: '80px', textAlign: 'center' }}>Orden</th>
                                    <th style={{ width: '100px', textAlign: 'right' }}>Acciones</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {t.Subtipos.map(s => (
                                    <tr key={s.id}>
                                      <td>{s.nombre}</td>
                                      <td style={{ textAlign: 'center' }}>{s.orden}</td>
                                      <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                          <button className="icon-btn" onClick={() => startEditSubtype(s)}><Edit2 size={12} /></button>
                                          <button className="icon-btn text-danger" onClick={() => deleteSubtype(s.id)}><Trash2 size={12} /></button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--md-sys-color-outline)' }}>
                                No hay subtipos definidos.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Action Panel (Forms) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <CapexTypeForm 
            editingTypeId={editingTypeId}
            setEditingTypeId={setEditingTypeId}
            typeForm={typeForm}
            setTypeForm={setTypeForm}
            onSubmit={handleTypeSubmit}
          />

          <CapexSubtypeForm 
            addingSubtypeToId={addingSubtypeToId}
            editingSubtypeId={editingSubtypeId}
            setEditingSubtypeId={setEditingSubtypeId}
            setAddingSubtypeToId={setAddingSubtypeToId}
            subtypeForm={subtypeForm}
            setSubtypeForm={setSubtypeForm}
            types={types}
            onSubmit={handleSubtypeSubmit}
          />
        </div>
      </div>
    </div>
  );
}
