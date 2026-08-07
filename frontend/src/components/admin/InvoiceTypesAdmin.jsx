import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, Trash2, RefreshCw, XCircle, CheckCircle } from 'lucide-react';

export default function InvoiceTypesAdmin({ getAuthHeaders }) {
  const { t } = useTranslation();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ id_tipo_factura: '', nombre: '', orden: 0 });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchTypes = () => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/admin/invoice-types`, {
      headers: getAuthHeaders()
    })
      .then(res => {
        if (!res.ok) throw new Error('Error al cargar tipos de factura');
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.nombre || !form.nombre.trim()) {
      setError('El nombre del tipo de factura es obligatorio.');
      return;
    }

    const isEdit = editingId !== null;
    const url = isEdit 
      ? `${import.meta.env.VITE_API_URL}/admin/invoice-types/${editingId}` 
      : `${import.meta.env.VITE_API_URL}/admin/invoice-types`;
    const method = isEdit ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify({ nombre: form.nombre.trim(), orden: parseInt(form.orden || 0, 10) })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al guardar el tipo de factura.');
        return data;
      })
      .then(() => {
        setSuccess(isEdit ? 'Tipo de factura actualizado correctamente.' : 'Tipo de factura creado correctamente.');
        setForm({ id_tipo_factura: '', nombre: '', orden: 0 });
        setEditingId(null);
        fetchTypes();
      })
      .catch(err => setError(err.message));
  };

  const handleEditClick = (type) => {
    setForm({ id_tipo_factura: type.id_tipo_factura, nombre: type.nombre, orden: type.orden ?? 0 });
    setEditingId(type.id_tipo_factura);
    setError('');
    setSuccess('');
  };

  const handleDeleteClick = (id) => {
    if (!window.confirm('¿Seguro que desea eliminar este tipo de factura?')) return;
    setError('');
    setSuccess('');

    fetch(`${import.meta.env.VITE_API_URL}/admin/invoice-types/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al eliminar el tipo de factura.');
        return data;
      })
      .then(() => {
        setSuccess('Tipo de factura eliminado del sistema.');
        fetchTypes();
      })
      .catch(err => setError(err.message));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, alignItems: 'flex-start' }}>
      {/* Table list */}
      <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: 600 }}>{t('invoicesAdmin.title', { count: types.length })}</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--md-sys-color-outline)' }}>
              {t('invoicesAdmin.subtitle')}
            </p>
          </div>
          <button className="icon-btn" onClick={fetchTypes} title={t('common.refresh')}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {error && (
          <div style={{ padding: 12, borderRadius: 8, backgroundColor: 'rgba(255, 69, 58, 0.15)', color: 'var(--color-rag-red)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem' }}>
            <XCircle size={16} /> {error}
          </div>
        )}

        {success && (
          <div style={{ padding: 12, borderRadius: 8, backgroundColor: 'rgba(52, 199, 89, 0.15)', color: 'var(--color-rag-green)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem' }}>
            <CheckCircle size={16} /> {success}
          </div>
        )}

        <div className="m3-table-wrapper" style={{ maxHeight: '480px', overflowY: 'auto' }}>
          <table className="m3-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>ID</th>
                <th style={{ width: 70, textAlign: 'center' }}>{t('sedesAdmin.order')}</th>
                <th>{t('invoicesAdmin.typeName')}</th>
                <th style={{ textAlign: 'right' }}>{t('usersAdmin.action')}</th>
              </tr>
            </thead>
            <tbody>
              {types.length === 0 && !loading && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: 'var(--md-sys-color-outline)', padding: 24 }}>
                    {t('invoicesAdmin.noTypes')}
                  </td>
                </tr>
              )}
              {types.map(tObj => (
                <tr key={tObj.id_tipo_factura}>
                  <td style={{ fontWeight: 'bold' }}>{tObj.id_tipo_factura}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{tObj.orden ?? 0}</td>
                  <td style={{ fontWeight: 500 }}>{tObj.nombre}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="icon-btn" onClick={() => handleEditClick(tObj)} title={t('common.edit')}>
                        <Edit2 size={16} />
                      </button>
                      <button className="icon-btn danger" onClick={() => handleDeleteClick(tObj.id_tipo_factura)} title={t('common.delete')}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Side */}
      <div className="m3-card glass-panel" style={{ position: 'sticky', top: 24 }}>
        <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 16 }}>
          {editingId ? t('invoicesAdmin.editType') : t('invoicesAdmin.addType')}
        </h3>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">{t('invoicesAdmin.typeName')}</label>
            <input 
              type="text" 
              value={form.nombre}
              onChange={(e) => setForm(prev => ({ ...prev, nombre: e.target.value }))}
              required
              placeholder="Ej: SERVICIOS IT"
              className="m3-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('sedesAdmin.order')}</label>
            <input 
              type="number" 
              value={form.orden}
              onChange={(e) => setForm(prev => ({ ...prev, orden: e.target.value }))}
              className="m3-input"
            />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            {editingId && (
              <button 
                type="button" 
                className="m3-btn m3-btn-outline" 
                style={{ flexGrow: 1 }}
                onClick={() => {
                  setEditingId(null);
                  setForm({ id_tipo_factura: '', nombre: '', orden: 0 });
                }}
              >
                {t('usersAdmin.cancel')}
              </button>
            )}
            <button type="submit" className="m3-btn m3-btn-primary" style={{ flexGrow: 1 }}>
              {editingId ? t('usersAdmin.saveChanges') : t('invoicesAdmin.addType')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
