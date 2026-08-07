import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, Trash2, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import CapexTypeForm from './CapexTypeForm';
import CapexSubtypeForm from './CapexSubtypeForm';

export default function CapexTypesAdmin({ getAuthHeaders }) {
  const { t } = useTranslation();
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

  const startEditType = (tObj) => {
    setEditingTypeId(tObj.id);
    setTypeForm({ id: tObj.id, nombre: tObj.nombre, orden: tObj.orden });
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

  const startAddSubtype = (typeId) => {
    setAddingSubtypeToId(typeId);
    setSubtypeForm({ id: '', nombre: '', orden: '', id_tipo_capex: typeId });
    setEditingSubtypeId(null);
    setExpandedTypes(prev => ({ ...prev, [typeId]: true }));
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
        if (!res.ok) throw new Error(data.error || 'Error al eliminar subtipo');
        return data;
      })
      .then(() => {
        setSuccess('Subtipo CAPEX eliminado.');
        fetchTypes();
      })
      .catch(err => setError(err.message));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, alignItems: 'flex-start' }}>
      <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h3 style={{ fontWeight: 600, fontSize: '1.15rem' }}>{t('capexAdmin.title', { count: types.length })}</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>{t('capexAdmin.subtitle')}</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 12, fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ backgroundColor: 'rgba(52, 199, 89, 0.1)', color: 'var(--color-rag-green)', padding: 12, borderRadius: 12, fontSize: '0.85rem' }}>
            {success}
          </div>
        )}

        {types.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--md-sys-color-outline)' }}>{t('capexAdmin.noTypes')}</div>
        ) : (
          <div className="m3-table-wrapper">
            <table className="m3-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th style={{ width: '60px', textAlign: 'center' }}>ID</th>
                  <th style={{ width: '70px', textAlign: 'center' }}>{t('sedesAdmin.order')}</th>
                  <th>{t('capexAdmin.typeName')}</th>
                  <th style={{ width: '130px', textAlign: 'center' }}>{t('usersAdmin.action')}</th>
                </tr>
              </thead>
              <tbody>
                {types.map(tObj => {
                  const isExpanded = !!expandedTypes[tObj.id];
                  const subtypes = tObj.Subtipos || tObj.subtipos || [];
                  return (
                    <React.Fragment key={tObj.id}>
                      <tr>
                        <td style={{ textAlign: 'center' }}>
                          <button className="icon-btn" onClick={() => toggleExpand(tObj.id)}>
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{tObj.id}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{tObj.orden ?? 0}</td>
                        <td style={{ fontWeight: 600 }}>
                          {tObj.nombre}
                          <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>({subtypes.length})</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <button className="icon-btn" onClick={() => startAddSubtype(tObj.id)} title={t('capexAdmin.addSubtype')}>
                              <Plus size={15} />
                            </button>
                            <button className="icon-btn" onClick={() => startEditType(tObj)} title={t('common.edit')}>
                              <Edit2 size={15} />
                            </button>
                            <button className="icon-btn danger" onClick={() => deleteType(tObj.id)} title={t('common.delete')}>
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan="5" style={{ backgroundColor: 'var(--md-sys-color-surface-container-low)', padding: '12px 16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {subtypes.length === 0 ? (
                                <span style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)', fontStyle: 'italic' }}>Sin subtipos</span>
                              ) : (
                                subtypes.map(s => (
                                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 8, fontSize: '0.85rem' }}>
                                    <span><strong>#{s.orden ?? 0}</strong> - {s.nombre}</span>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                      <button className="icon-btn" onClick={() => startEditSubtype(s)} title={t('common.edit')}>
                                        <Edit2 size={14} />
                                      </button>
                                      <button className="icon-btn danger" onClick={() => deleteSubtype(s.id)} title={t('common.delete')}>
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
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
  );
}
