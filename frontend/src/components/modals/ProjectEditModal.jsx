import React, { useState, useEffect } from 'react';
import SearchableContactSelect from '../SearchableContactSelect';

export default function ProjectEditModal({
  isOpen, onClose, project, getAuthHeaders, onSuccess,
  sedes, vendors, contactosList, pms, workflowStates
}) {
  const [form, setForm] = useState({
    nombre_proyecto: '',
    descripcion: '',
    id_pm: '',
    id_proveedor: '',
    id_sede: '',
    id_sponsor: '',
    es_capex: false,
    codigo_capex: '',
    es_estrategico: false,
    budget_inicial: '',
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
        id_sponsor: project.id_sponsor ? project.id_sponsor.toString() : '',
        es_capex: !!project.es_capex,
        codigo_capex: project.codigo_capex || '',
        es_estrategico: !!project.es_estrategico,
        budget_inicial: project.budget_inicial || '',
        involvedKus: project.InvolvedContacts?.map(k => k.id_contacto) || []
      });
    }
    setError('');
  }, [project, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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

    const payload = {
      ...form,
      budget_inicial: parseFloat(form.budget_inicial),
      id_pm: form.id_pm ? parseInt(form.id_pm, 10) : null,
      id_proveedor: form.id_proveedor ? parseInt(form.id_proveedor, 10) : null,
      id_sede: form.id_sede ? parseInt(form.id_sede, 10) : null,
      id_sponsor: form.id_sponsor ? parseInt(form.id_sponsor, 10) : null
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

            <div className="form-group">
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
              <label className="form-label">Sponsor / Key User Líder *</label>
              <SearchableContactSelect 
                contacts={project?.InvolvedContacts || []}
                selected={form.id_sponsor}
                onChange={(val) => setForm(prev => ({ ...prev, id_sponsor: val }))}
                multiple={false}
                placeholder="Seleccione Sponsor..."
              />
            </div>

            <div className="form-group">
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
          </div>

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

            <label className="m3-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
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
