import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import SearchableContactSelect from '../SearchableContactSelect';
import CapexFieldsGroup from './CapexFieldsGroup';

export default function ProjectEditModal({
  isOpen, onClose, project, getAuthHeaders, onSuccess,
  sedes, vendors, contactosList, pms, workflowStates, workflowsList = [], portfolios = [], portfoliosList = [], capexTypes = []
}) {
  const { t } = useTranslation();
  const { availableAmbitos, selectedAmbito, currentPm } = useAuth();
  const portfoliosData = portfolios.length > 0 ? portfolios : portfoliosList;
  const ambitosList = (availableAmbitos && availableAmbitos.length > 0)
    ? availableAmbitos
    : (currentPm?.Ambitos || []);

  const [form, setForm] = useState({
    nombre_proyecto: '',
    descripcion: '',
    id_pm: '',
    id_proveedor: '',
    id_sede: '',
    id_sede_distribuir: '',
    id_sponsor: '',
    id_ambito: '',
    id_workflow: '',
    id_estado: '',
    es_capex: false,
    codigo_capex: '',
    id_tipo_capex: '',
    id_subtipo_capex: '',
    es_estrategico: false,
    budget_inicial: '',
    budget_notas: '',
    portfolio_id: '',
    url_sharepoint: '',
    avance_porcentaje: 0,
    involvedKus: []
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (project) {
      const defaultAmbito = project.id_ambito 
        ? project.id_ambito.toString() 
        : ((selectedAmbito && selectedAmbito !== 'ALL') ? String(selectedAmbito) : (ambitosList[0]?.id_ambito ? String(ambitosList[0].id_ambito) : ''));

      setForm({
        nombre_proyecto: project.nombre_proyecto || '',
        descripcion: project.descripcion || '',
        id_pm: project.id_pm ? project.id_pm.toString() : '',
        id_proveedor: project.id_proveedor ? project.id_proveedor.toString() : '',
        id_sede: project.id_sede ? project.id_sede.toString() : '',
        id_sede_distribuir: project.id_sede_distribuir ? project.id_sede_distribuir.toString() : '',
        id_sponsor: project.id_sponsor ? project.id_sponsor.toString() : '',
        id_ambito: defaultAmbito,
        id_workflow: project.id_workflow ? project.id_workflow.toString() : '',
        id_estado: project.id_estado ? project.id_estado.toString() : '',
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
        avance_porcentaje: project.avance_porcentaje !== undefined && project.avance_porcentaje !== null ? project.avance_porcentaje : 0,
        involvedKus: project.InvolvedContacts?.map(k => k.id_contacto) || []
      });
    }
    setError('');
  }, [project, isOpen, selectedAmbito, availableAmbitos]);

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
      if (name === 'id_workflow') {
        const targetWf = workflowsList.find(w => String(w.id) === String(value));
        if (targetWf?.Estados?.length > 0) {
          const hasCurrentState = targetWf.Estados.some(st => String(st.id_estado) === String(prev.id_estado));
          if (!hasCurrentState) {
            updated.id_estado = String(targetWf.Estados[0].id_estado);
          }
        }
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

    const payload = {
      ...form,
      id_ambito: form.id_ambito ? parseInt(form.id_ambito, 10) : null,
      es_iniciativa_ligera: !!form.es_iniciativa_ligera,
      budget_inicial: form.es_iniciativa_ligera 
        ? 0 
        : (form.budget_inicial !== '' && form.budget_inicial !== null && form.budget_inicial !== undefined && !isNaN(Number(form.budget_inicial))
            ? parseFloat(form.budget_inicial) 
            : null),
      budget_notas: form.es_iniciativa_ligera || !form.budget_notas?.trim() ? null : form.budget_notas.trim(),
      id_pm: form.id_pm ? parseInt(form.id_pm, 10) : null,
      id_proveedor: !form.es_iniciativa_ligera && form.id_proveedor ? parseInt(form.id_proveedor, 10) : null,
      id_sede: form.id_sede ? parseInt(form.id_sede, 10) : null,
      id_sede_distribuir: form.id_sede_distribuir ? parseInt(form.id_sede_distribuir, 10) : null,
      id_sponsor: form.id_sponsor ? parseInt(form.id_sponsor, 10) : null,
      id_workflow: form.id_workflow ? parseInt(form.id_workflow, 10) : null,
      id_estado: form.id_estado ? parseInt(form.id_estado, 10) : undefined,
      portfolio_id: form.portfolio_id ? parseInt(form.portfolio_id, 10) : null,
      es_capex: form.es_iniciativa_ligera ? false : !!form.es_capex,
      codigo_capex: form.es_iniciativa_ligera || !form.es_capex || !form.codigo_capex?.trim() ? null : form.codigo_capex.trim(),
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

            {/* Ámbito de Trabajo */}
            <div className="form-group">
              <label className="form-label">{t('ambitos.scopeLabel', 'Ámbito *')}</label>
              <select 
                name="id_ambito"
                value={form.id_ambito || ''}
                onChange={handleInputChange}
                required
                className="user-select"
              >
                <option value="">{t('ambitos.selectScope', 'Seleccione Ámbito')}</option>
                {project?.Ambito && !ambitosList.some(a => String(a.id_ambito) === String(project.id_ambito)) && (
                  <option key={project.Ambito.id_ambito} value={String(project.Ambito.id_ambito)}>
                    {project.Ambito.nombre} {project.Ambito.code ? `(${project.Ambito.code})` : ''}
                  </option>
                )}
                {ambitosList.map(a => (
                  <option key={a.id_ambito} value={String(a.id_ambito)}>
                    {a.nombre} {a.code ? `(${a.code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Flujo de Trabajo (Workflow) */}
            <div className="form-group">
              <label className="form-label">{t('adminPanel.workflows', 'Flujo de Trabajo *')}</label>
              <select 
                name="id_workflow"
                value={form.id_workflow || ''}
                onChange={handleInputChange}
                required
                className="user-select"
              >
                <option value="">{t('workflowsAdmin.selectWorkflow', 'Seleccione Flujo de Trabajo')}</option>
                {workflowsList.map(w => (
                  <option key={w.id} value={String(w.id)}>
                    {w.is_default ? '⭐ ' : ''}{w.nombre} {w.Ambito ? `(${w.Ambito.nombre})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado del Proyecto dentro del Flujo */}
            {(() => {
              const currentWf = workflowsList.find(w => String(w.id) === String(form.id_workflow));
              const availableStates = currentWf?.Estados && currentWf.Estados.length > 0 
                ? currentWf.Estados 
                : (workflowStates || []);
              return (
                <div className="form-group">
                  <label className="form-label">{t('workflowsAdmin.stateInWorkflow', 'Fase / Estado *')}</label>
                  <select 
                    name="id_estado" 
                    value={form.id_estado || ''} 
                    onChange={handleInputChange}
                    required
                    className="user-select"
                  >
                    {availableStates.map(st => (
                      <option key={st.id_estado} value={String(st.id_estado)}>
                        {st.icono || '•'} {st.nombre_estado}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })()}

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

            {/* SharePoint URL & Avance Porcentual */}
            <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
              <div className="form-group">
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
              <div className="form-group">
                <label className="form-label">% de Avance del Proyecto (0 - 100%)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    name="avance_porcentaje"
                    value={form.avance_porcentaje}
                    onChange={handleInputChange}
                    className="m3-input"
                    style={{ fontWeight: 'bold', color: 'var(--md-sys-color-primary)' }}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--md-sys-color-outline)' }}>%</span>
                </div>
              </div>
            </div>

            {/* Presupuesto Inicial + Notas — fila completa */}
            <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Presupuesto Inicial (€)</label>
                <input 
                  type="number" 
                  step="0.01"
                  name="budget_inicial"
                  value={form.budget_inicial}
                  onChange={handleInputChange}
                  placeholder="150000.00 (Opcional)"
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
