import React, { useState, useEffect } from 'react';
import SearchableContactSelect from '../SearchableContactSelect';

export default function ProjectEditModal({
  isOpen, onClose, project, getAuthHeaders, onSuccess,
  sedes, vendors, contactosList, pms, workflowStates, portfolios = [], capexTypes = []
}) {
  const [form, setForm] = useState({
    nombre_proyecto: '',
    descripcion: '',
    id_pm: '',
    id_proveedor: '',
    id_sede: '',
    id_sede_distribuir: '',
    id_sponsor: '',
    es_capex: false,
    codigo_capex: '',
    id_tipo_capex: '',
    id_subtipo_capex: '',
    es_estrategico: false,
    budget_inicial: '',
    budget_notas: '',
    portfolio_id: '',
    involvedKus: []
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (project) {
      setForm({
        nombre_proyecto: project.nombre_proyecto || '',
        descripcion: project.descripcion || '',
        id_pm: project.id_pm ? project.id_pm.toString() : '',
        id_proveedor: project.id_proveedor ? project.id_proveedor.toString() : '',
        id_sede: project.id_sede ? project.id_sede.toString() : '',
        id_sede_distribuir: project.id_sede_distribuir ? project.id_sede_distribuir.toString() : '',
        id_sponsor: project.id_sponsor ? project.id_sponsor.toString() : '',
        es_capex: !!project.es_capex,
        codigo_capex: project.codigo_capex || '',
        id_tipo_capex: project.id_tipo_capex ? project.id_tipo_capex.toString() : '',
        id_subtipo_capex: project.id_subtipo_capex ? project.id_subtipo_capex.toString() : '',
        es_estrategico: !!project.es_estrategico,
        budget_inicial: project.budget_inicial || '',
        budget_notas: project.budget_notas || '',
        portfolio_id: project.portfolio_id ? project.portfolio_id.toString() : '',
        involvedKus: project.InvolvedContacts?.map(k => k.id_contacto) || []
      });
    }
    setError('');
  }, [project, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      if (name === 'es_capex' && !checked) {
        updated.id_tipo_capex = '';
        updated.id_subtipo_capex = '';
        updated.codigo_capex = '';
      }
      return updated;
    });
  };

  const handleKeyUserToggle = (listName, kuId) => {
    setForm(prev => {
      const list = prev[listName] || [];
      const updated = list.includes(kuId) 
        ? list.filter(id => id !== kuId) 
        : [...list, kuId];
      return { ...prev, [listName]: updated };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (form.es_capex && (!form.codigo_capex || form.codigo_capex.trim() === '')) {
      setError('El código CAPEX es obligatorio para proyectos CAPEX.');
      return;
    }
    if (form.es_capex && !form.id_tipo_capex) {
      setError('El tipo de CAPEX es obligatorio para proyectos CAPEX.');
      return;
    }
    const selectedTipo = capexTypes.find(t => t.id === parseInt(form.id_tipo_capex, 10));
    if (form.es_capex && selectedTipo?.Subtipos?.length > 0 && !form.id_subtipo_capex) {
      setError('El subtipo de CAPEX es obligatorio para el tipo seleccionado.');
      return;
    }

    const payload = {
      ...form,
      budget_inicial: parseFloat(form.budget_inicial),
      id_pm: form.id_pm ? parseInt(form.id_pm, 10) : null,
      id_proveedor: form.id_proveedor ? parseInt(form.id_proveedor, 10) : null,
      id_sede: form.id_sede ? parseInt(form.id_sede, 10) : null,
      id_sede_distribuir: form.id_sede_distribuir ? parseInt(form.id_sede_distribuir, 10) : null,
      id_sponsor: form.id_sponsor ? parseInt(form.id_sponsor, 10) : null,
      portfolio_id: form.portfolio_id ? parseInt(form.portfolio_id, 10) : null,
      id_tipo_capex: form.es_capex && form.id_tipo_capex ? parseInt(form.id_tipo_capex, 10) : null,
      id_subtipo_capex: form.es_capex && form.id_subtipo_capex ? parseInt(form.id_subtipo_capex, 10) : null
    };

    fetch(`${import.meta.env.VITE_API_URL}/projects/${project.id_proyecto}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Error al actualizar el proyecto');
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
      <div className="modal-content glass-panel" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h3 className="modal-title">Editar Ficha Básica del Proyecto</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Nombre del Proyecto *</label>
              <input 
                type="text" 
                name="nombre_proyecto"
                value={form.nombre_proyecto}
                onChange={handleInputChange}
                required
                className="m3-input"
              />
            </div>

            {/* Sede y A Distribuir */}
            <div className="form-group" style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label">Sede *</label>
                <select 
                  name="id_sede"
                  value={form.id_sede}
                  onChange={handleInputChange}
                  required
                  className="user-select"
                >
                  <option value="">Seleccione Sede</option>
                  {sedes.map(s => (
                    <option key={s.id_sede} value={s.id_sede}>{s.nombre_sede}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">A distribuir</label>
                <select 
                  name="id_sede_distribuir"
                  value={form.id_sede_distribuir}
                  onChange={handleInputChange}
                  className="user-select"
                >
                  <option value="">Seleccione Sede</option>
                  {sedes.map(s => (
                    <option key={s.id_sede} value={s.id_sede}>{s.nombre_sede}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Socio Tecnológico *</label>
              <select 
                name="id_proveedor"
                value={form.id_proveedor}
                onChange={handleInputChange}
                required
                className="user-select"
              >
                <option value="">Seleccione Socio</option>
                {vendors.map(v => (
                  <option key={v.id_proveedor} value={v.id_proveedor}>{v.nombre_razon_social}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">PM Asignado *</label>
              <select 
                name="id_pm"
                value={form.id_pm}
                onChange={handleInputChange}
                required
                className="user-select"
              >
                <option value="">Seleccione PM</option>
                {pms.map(p => (
                  <option key={p.id_usuario} value={p.id_pm || p.id_usuario}>{p.nombre} {p.apellidos}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Portfolio</label>
              <select 
                name="portfolio_id"
                value={form.portfolio_id}
                onChange={handleInputChange}
                className="user-select"
              >
                <option value="">Sin asignar</option>
                {portfolios.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Sponsor / Key User Líder *</label>
              <SearchableContactSelect 
                contacts={project?.InvolvedContacts || []}
                selected={form.id_sponsor}
                onChange={(val) => setForm(prev => ({ ...prev, id_sponsor: val }))}
                multiple={false}
                placeholder="Seleccione Sponsor..."
              />
            </div>

            {/* Presupuesto Inicial + Notas — fila completa */}
            <div className="form-group" style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label">Presupuesto Inicial (€) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  name="budget_inicial"
                  value={form.budget_inicial}
                  onChange={handleInputChange}
                  required
                  className="m3-input"
                />
              </div>
              <div>
                <label className="form-label">Notas sobre el presupuesto</label>
                <input
                  type="text"
                  name="budget_notas"
                  value={form.budget_notas || ''}
                  onChange={handleInputChange}
                  placeholder="Ej: Incluye licencias + implantación, excluye hardware"
                  className="m3-input"
                />
              </div>
            </div>
          </div>

          {/* Solo CAPEX switch + código */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '16px 0' }}>
            <label className="m3-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                name="es_capex"
                checked={form.es_capex}
                onChange={handleInputChange}
                className="m3-checkbox"
              />
              <span>¿Es CAPEX?</span>
            </label>

            {form.es_capex && (
              <div className="form-group" style={{ margin: 0 }}>
                <input 
                  type="text" 
                  name="codigo_capex"
                  value={form.codigo_capex}
                  onChange={handleInputChange}
                  placeholder="Código CAPEX *"
                  required={form.es_capex}
                  className="m3-input"
                />
              </div>
            )}
          </div>

          {form.es_capex && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '0 0 16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Tipo CAPEX *</label>
                <select
                  name="id_tipo_capex"
                  value={form.id_tipo_capex}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm(prev => ({ ...prev, id_tipo_capex: val, id_subtipo_capex: '' }));
                  }}
                  required
                  className="user-select"
                >
                  <option value="">Seleccionar tipo...</option>
                  {capexTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>
              {(() => {
                const sel = capexTypes.find(t => t.id === parseInt(form.id_tipo_capex, 10));
                return sel?.Subtipos?.length > 0 ? (
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Subtipo CAPEX *</label>
                    <select
                      name="id_subtipo_capex"
                      value={form.id_subtipo_capex}
                      onChange={handleInputChange}
                      required
                      className="user-select"
                    >
                      <option value="">Seleccionar subtipo...</option>
                      {sel.Subtipos.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {/* Proyecto Estratégico — debajo de Tipo CAPEX */}
          <div className="form-group" style={{ margin: '0 0 16px' }}>
            <label className="m3-checkbox-label" style={{ color: 'var(--md-sys-color-primary)', fontWeight: 600 }}>
              <input 
                type="checkbox" 
                name="es_estrategico"
                checked={form.es_estrategico}
                onChange={handleInputChange}
                className="m3-checkbox"
              />
              <span>¿Es Proyecto Estratégico?</span>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción Detallada *</label>
            <textarea 
              name="descripcion"
              value={form.descripcion}
              onChange={handleInputChange}
              required
              rows={3}
              className="m3-input"
            />
          </div>



          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="m3-btn m3-btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="m3-btn m3-btn-primary">
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
