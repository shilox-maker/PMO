import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import SearchableContactSelect from '../SearchableContactSelect';
import CapexFieldsGroup from './CapexFieldsGroup';

export default function ProjectEditModal({
  isOpen, onClose, project, getAuthHeaders, onSuccess,
  sedes, vendors, contactosList, pms, workflowStates, portfolios = [], portfoliosList = [], capexTypes = []
}) {
  const { t } = useTranslation();
  const portfoliosData = portfolios.length > 0 ? portfolios : portfoliosList;

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
    url_sharepoint: '',
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
        es_iniciativa_ligera: !!project.es_iniciativa_ligera,
        es_capex: !!project.es_capex,
        codigo_capex: project.codigo_capex || '',
        id_tipo_capex: project.id_tipo_capex ? project.id_tipo_capex.toString() : '',
        id_subtipo_capex: project.id_subtipo_capex ? project.id_subtipo_capex.toString() : '',
        es_estrategico: !!project.es_estrategico,
        budget_inicial: project.budget_inicial || '',
        budget_notas: project.budget_notas || '',
        portfolio_id: project.portfolio_id ? project.portfolio_id.toString() : '',
        url_sharepoint: project.url_sharepoint || '',
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

    if (!form.es_iniciativa_ligera) {
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
    }

    const payload = {
      ...form,
      es_iniciativa_ligera: !!form.es_iniciativa_ligera,
      budget_inicial: form.es_iniciativa_ligera ? 0 : parseFloat(form.budget_inicial),
      id_pm: form.id_pm ? parseInt(form.id_pm, 10) : null,
      id_proveedor: !form.es_iniciativa_ligera && form.id_proveedor ? parseInt(form.id_proveedor, 10) : null,
      id_sede: form.id_sede ? parseInt(form.id_sede, 10) : null,
      id_sede_distribuir: form.id_sede_distribuir ? parseInt(form.id_sede_distribuir, 10) : null,
      id_sponsor: form.id_sponsor ? parseInt(form.id_sponsor, 10) : null,
      portfolio_id: form.portfolio_id ? parseInt(form.portfolio_id, 10) : null,
      es_capex: form.es_iniciativa_ligera ? false : form.es_capex,
      codigo_capex: form.es_iniciativa_ligera ? null : form.codigo_capex,
      id_tipo_capex: !form.es_iniciativa_ligera && form.es_capex && form.id_tipo_capex ? parseInt(form.id_tipo_capex, 10) : null,
      id_subtipo_capex: !form.es_iniciativa_ligera && form.es_capex && form.id_subtipo_capex ? parseInt(form.id_subtipo_capex, 10) : null
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
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
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

            {/* Descripción Detallada */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
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

            {/* Sede y A Distribuir */}
            <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                  {sedes.map(s => {
                    const code = s.code || s.nombre_sede?.toUpperCase().replace(/\s+/g, '_');
                    const label = code && t(`sede.${code}`) !== `sede.${code}` ? t(`sede.${code}`) : s.nombre_sede;
                    return <option key={s.id_sede} value={s.id_sede}>{label}</option>;
                  })}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">A distribuir</label>
                <select 
                  name="id_sede_distribuir"
                  value={form.id_sede_distribuir}
                  onChange={handleInputChange}
                  className="user-select"
                >
                  <option value="">Seleccione Sede</option>
                  {sedes.map(s => {
                    const code = s.code || s.nombre_sede?.toUpperCase().replace(/\s+/g, '_');
                    const label = code && t(`sede.${code}`) !== `sede.${code}` ? t(`sede.${code}`) : s.nombre_sede;
                    return <option key={s.id_sede} value={s.id_sede}>{label}</option>;
                  })}
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
                {portfoliosData.map(p => (
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

            {/* SharePoint URL */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">URL Site SharePoint (Documentación)</label>
              <input 
                type="text" 
                name="url_sharepoint"
                value={form.url_sharepoint}
                onChange={handleInputChange}
                placeholder="https://dacsa.sharepoint.com/sites/..."
                className="m3-input"
              />
            </div>

            {/* Presupuesto Inicial + Notas — fila completa */}
            <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
              <div className="form-group">
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

            {/* Grupo CAPEX & Proyecto Estratégico */}
            <CapexFieldsGroup
              form={form}
              setForm={setForm}
              handleInputChange={handleInputChange}
              capexTypes={capexTypes}
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
