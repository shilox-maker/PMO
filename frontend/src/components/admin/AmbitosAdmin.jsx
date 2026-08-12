import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Edit2, RefreshCw, XCircle, CheckCircle, Building2 } from 'lucide-react';

export default function AmbitosAdmin() {
  const { t } = useTranslation();
  const { getAuthHeaders, refreshAmbitos } = useAuth();
  const [ambitos, setAmbitos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ id_ambito: '', nombre: '', code: '', descripcion: '', activo: true });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAmbitos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/ambitos/admin`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Error al cargar la lista de ámbitos');
      const data = await res.json();
      setAmbitos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAmbitos(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.nombre || !form.code) {
      setError('Nombre y código son obligatorios.');
      return;
    }

    const isEdit = editingId !== null;
    const url = isEdit
      ? `${import.meta.env.VITE_API_URL}/ambitos/${editingId}`
      : `${import.meta.env.VITE_API_URL}/ambitos`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar el ámbito.');

      setSuccess(isEdit ? 'Ámbito actualizado correctamente.' : 'Ámbito creado correctamente.');
      setForm({ id_ambito: '', nombre: '', code: '', descripcion: '', activo: true });
      setEditingId(null);
      fetchAmbitos();
      refreshAmbitos();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditClick = (amb) => {
    setForm({
      id_ambito: amb.id_ambito,
      nombre: amb.nombre,
      code: amb.code,
      descripcion: amb.descripcion || '',
      activo: amb.activo
    });
    setEditingId(amb.id_ambito);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ id_ambito: '', nombre: '', code: '', descripcion: '', activo: true });
    setError('');
    setSuccess('');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, alignItems: 'flex-start' }}>
      {/* Lista de Ámbitos */}
      <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h3 style={{ fontWeight: 600, fontSize: '1.15rem' }}>
            {t('ambitos.ambitosAdmin', 'Gestión de Ámbitos / Unidades')} ({ambitos.length})
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>
            Configura los departamentos y unidades de negocio segregadas en la plataforma.
          </p>
        </div>

        {loading ? (
          <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--md-sys-color-primary)', alignSelf: 'center' }} />
        ) : ambitos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--md-sys-color-outline)' }}>
            No hay ámbitos registrados.
          </div>
        ) : (
          <div className="m3-table-wrapper">
            <table className="m3-table">
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>ID</th>
                  <th>{t('ambitos.name', 'Nombre')}</th>
                  <th>{t('ambitos.code', 'Código')}</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>{t('ambitos.active', 'Estado')}</th>
                  <th style={{ width: '70px', textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {ambitos.map(amb => (
                  <tr key={amb.id_ambito}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{amb.id_ambito}</td>
                    <td style={{ fontWeight: 500 }}>{amb.nombre}</td>
                    <td>
                      <code style={{ fontSize: '0.8rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.08)' }}>
                        {amb.code}
                      </code>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 12,
                        backgroundColor: amb.activo ? 'rgba(0,200,83,0.15)' : 'rgba(255,82,82,0.15)',
                        color: amb.activo ? '#00c853' : '#ff5252'
                      }}>
                        {amb.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="icon-btn" onClick={() => handleEditClick(amb)} title={t('common.edit')}>
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Formulario Lateral Alta/Edición */}
      <div className="m3-card glass-panel" style={{ position: 'sticky', top: 24 }}>
        <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Building2 size={20} style={{ color: 'var(--md-sys-color-primary)' }} />
          {editingId ? t('ambitos.editAmbito', 'Editar Ámbito') : t('ambitos.newAmbito', 'Añadir Ámbito')}
        </h3>

        {error && (
          <div className="status-alert alert-error" style={{ marginBottom: 16 }}>
            <XCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="status-alert alert-success" style={{ marginBottom: 16 }}>
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">{t('ambitos.name', 'Nombre del Ámbito')} *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={e => setForm(prev => ({ ...prev, nombre: e.target.value }))}
              className="m3-input"
              placeholder="Ej: IT Corporate, Operaciones"
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('ambitos.code', 'Código Unívoco')} *</label>
            <input
              type="text"
              value={form.code}
              onChange={e => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase().replace(/\s+/g, '_') }))}
              className="m3-input"
              placeholder="Ej: IT_CORP, OPERACIONES"
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('ambitos.description', 'Descripción')}</label>
            <textarea
              rows={2}
              value={form.descripcion}
              onChange={e => setForm(prev => ({ ...prev, descripcion: e.target.value }))}
              className="m3-input"
              placeholder="Descripción breve del ámbito..."
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="checkbox"
              id="ambitoActivoCheck"
              checked={form.activo}
              onChange={e => setForm(prev => ({ ...prev, activo: e.target.checked }))}
              style={{ accentColor: 'var(--md-sys-color-primary)', width: 16, height: 16 }}
            />
            <label htmlFor="ambitoActivoCheck" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
              {t('ambitos.active', 'Ámbito Activo')}
            </label>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            {editingId && (
              <button
                type="button"
                className="m3-btn m3-btn-outline"
                style={{ flexGrow: 1 }}
                onClick={handleCancel}
              >
                Cancelar
              </button>
            )}
            <button type="submit" className="m3-btn m3-btn-primary" style={{ flexGrow: 1 }} disabled={!form.nombre || !form.code}>
              {editingId ? 'Guardar Cambios' : 'Añadir Ámbito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
