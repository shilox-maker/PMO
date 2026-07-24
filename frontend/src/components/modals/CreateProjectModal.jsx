import React, { useState, useEffect } from 'react';
import CapexFieldsGroup from './CapexFieldsGroup';

export default function CreateProjectModal({
  isOpen,
  onClose,
  getAuthHeaders,
  onSuccess,
  currentPm,
  pmsList,
  vendorsList,
  sedesList,
  contactosList,
  portfoliosList,
  capexTypes
}) {
  const [newProject, setNewProject] = useState({
    id_proyecto: '',
    nombre_proyecto: '',
    descripcion: '',
    id_pm: currentPm ? currentPm.id_usuario.toString() : '',
    id_proveedor: '',
    id_sede: '',
    id_sede_distribuir: '',
    id_sponsor: '',
    portfolio_id: '',
    estado_proyecto: 'Kickoff',
    indicador_rag: 'VERDE',
    fecha_inicio: '',
    fecha_fin_inicial: '',
    es_capex: false,
    codigo_capex: '',
    id_tipo_capex: '',
    id_subtipo_capex: '',
    es_estrategico: false,
    budget_inicial: '',
    budget_notas: '',
    com_semanal_activo: false,
    com_semanal_finalidad: '',
    com_mensual_activo: false,
    com_mensual_finalidad: '',
    com_steerco_activo: false,
    com_steerco_finalidad: '',
    url_sharepoint: ''
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNewProject({
        id_proyecto: '',
        nombre_proyecto: '',
        descripcion: '',
        id_pm: currentPm ? currentPm.id_usuario.toString() : '',
        id_proveedor: '',
        id_sede: '',
        id_sede_distribuir: '',
        id_sponsor: '',
        portfolio_id: '',
        estado_proyecto: 'Kickoff',
        indicador_rag: 'VERDE',
        fecha_inicio: '',
        fecha_fin_inicial: '',
        es_capex: false,
        codigo_capex: '',
        id_tipo_capex: '',
        id_subtipo_capex: '',
        es_estrategico: false,
        budget_inicial: '',
        budget_notas: '',
        com_semanal_activo: false,
        com_semanal_finalidad: '',
        com_mensual_activo: false,
        com_mensual_finalidad: '',
        com_steerco_activo: false,
        com_steerco_finalidad: '',
        url_sharepoint: ''
      });
      setFormError('');
    }
  }, [isOpen, currentPm]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewProject(prev => {
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

  const handleCreateProject = (e) => {
    e.preventDefault();
    setFormError('');

    if (newProject.id_proyecto && newProject.id_proyecto.trim() !== '') {
      const idRegex = /^PRJ-\d{4}-\d{3}$/;
      if (!idRegex.test(newProject.id_proyecto)) {
        setFormError('El ID del proyecto debe tener el formato PRJ-YYYY-XXX o dejarse vacío.');
        return;
      }
    }

    if (newProject.es_capex && (!newProject.codigo_capex || newProject.codigo_capex.trim() === '')) {
      setFormError('El código CAPEX es obligatorio para proyectos CAPEX.');
      return;
    }
    if (newProject.es_capex && !newProject.id_tipo_capex) {
      setFormError('El tipo de CAPEX es obligatorio para proyectos CAPEX.');
      return;
    }
    const selectedTipo = capexTypes.find(t => t.id === parseInt(newProject.id_tipo_capex, 10));
    if (newProject.es_capex && selectedTipo?.Subtipos?.length > 0 && !newProject.id_subtipo_capex) {
      setFormError('El subtipo de CAPEX es obligatorio para el tipo seleccionado.');
      return;
    }

    if (!newProject.nombre_proyecto || !newProject.id_pm || !newProject.id_proveedor || !newProject.id_sede || !newProject.budget_inicial) {
      setFormError('Por favor, rellene todos los campos obligatorios.');
      return;
    }

    const payload = {
      ...newProject,
      budget_inicial: parseFloat(newProject.budget_inicial),
      id_pm: parseInt(newProject.id_pm, 10),
      id_proveedor: parseInt(newProject.id_proveedor, 10),
      id_sede: parseInt(newProject.id_sede, 10),
      id_sede_distribuir: newProject.id_sede_distribuir ? parseInt(newProject.id_sede_distribuir, 10) : null,
      id_sponsor: newProject.id_sponsor ? parseInt(newProject.id_sponsor, 10) : null,
      portfolio_id: newProject.portfolio_id ? parseInt(newProject.portfolio_id, 10) : null,
      id_tipo_capex: newProject.es_capex && newProject.id_tipo_capex ? parseInt(newProject.id_tipo_capex, 10) : null,
      id_subtipo_capex: newProject.es_capex && newProject.id_subtipo_capex ? parseInt(newProject.id_subtipo_capex, 10) : null
    };

    if (!payload.id_proyecto || payload.id_proyecto.trim() === '') {
      delete payload.id_proyecto;
    }

    fetch(`${import.meta.env.VITE_API_URL}/projects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al guardar el proyecto');
        return data;
      })
      .then(() => {
        onSuccess();
        onClose();
      })
      .catch(err => setFormError(err.message));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Registrar Nuevo Proyecto</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {formError && (
          <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem', fontWeight: 500 }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleCreateProject}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            
            {/* ID Proyecto (Opcional - Autogeneración) */}
            <div className="form-group">
              <label className="form-label">Código Proyecto (Dejar vacío para auto-asignar)</label>
              <input 
                type="text" 
                name="id_proyecto"
                value={newProject.id_proyecto}
                onChange={handleInputChange}
                placeholder="Auto-generado (Ej. PRJ-2026-007)"
                className="m3-input"
              />
            </div>

            {/* Nombre Proyecto */}
            <div className="form-group">
              <label className="form-label">Nombre del Proyecto *</label>
              <input 
                type="text" 
                name="nombre_proyecto"
                value={newProject.nombre_proyecto}
                onChange={handleInputChange}
                placeholder="Integración Plataforma..."
                required
                className="m3-input"
              />
            </div>

            {/* Sede y A Distribuir */}
            <div className="form-group" style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label">Sede de Operación *</label>
                <select 
                  name="id_sede" 
                  value={newProject.id_sede} 
                  onChange={handleInputChange}
                  required
                  className="user-select"
                >
                  <option value="">Seleccione Sede</option>
                  {sedesList.map(s => (
                    <option key={s.id_sede} value={s.id_sede}>{s.nombre_sede}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">A distribuir</label>
                <select 
                  name="id_sede_distribuir" 
                  value={newProject.id_sede_distribuir} 
                  onChange={handleInputChange}
                  className="user-select"
                >
                  <option value="">Seleccione Sede</option>
                  {sedesList.map(s => (
                    <option key={s.id_sede} value={s.id_sede}>{s.nombre_sede}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Socio Tecnológico (Proveedor) */}
            <div className="form-group">
              <label className="form-label">Socio Tecnológico *</label>
              <select 
                name="id_proveedor" 
                value={newProject.id_proveedor} 
                onChange={handleInputChange}
                required
                className="user-select"
              >
                <option value="">Seleccione Socio</option>
                {vendorsList.map(v => (
                  <option key={v.id_proveedor} value={v.id_proveedor}>{v.nombre_razon_social}</option>
                ))}
              </select>
            </div>

            {/* Gestor PM */}
            <div className="form-group">
              <label className="form-label">PM Asignado *</label>
              <select 
                name="id_pm" 
                value={newProject.id_pm} 
                onChange={handleInputChange}
                required
                className="user-select"
              >
                <option value="">Seleccione PM</option>
                {pmsList.map(p => (
                  <option key={p.id_usuario} value={p.id_usuario}>{p.nombre} {p.apellidos}</option>
                ))}
              </select>
            </div>

            {/* Portfolio */}
            <div className="form-group">
              <label className="form-label">Portfolio</label>
              <select 
                name="portfolio_id" 
                value={newProject.portfolio_id} 
                onChange={handleInputChange}
                className="user-select"
              >
                <option value="">Sin asignar</option>
                {portfoliosList.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>

            {/* SharePoint URL */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">URL Site SharePoint (Documentación)</label>
              <input 
                type="text" 
                name="url_sharepoint"
                value={newProject.url_sharepoint}
                onChange={handleInputChange}
                placeholder="https://dacsa.sharepoint.com/sites/..."
                className="m3-input"
              />
            </div>

            {/* Fecha Inicio */}
            <div className="form-group">
              <label className="form-label">Fecha de Inicio *</label>
              <input 
                type="date" 
                name="fecha_inicio"
                value={newProject.fecha_inicio}
                onChange={handleInputChange}
                required
                className="m3-input"
              />
            </div>

            {/* Fecha Fin Inicial */}
            <div className="form-group">
              <label className="form-label">Fecha Fin Inicial (Línea Base) *</label>
              <input 
                type="date" 
                name="fecha_fin_inicial"
                value={newProject.fecha_fin_inicial}
                onChange={handleInputChange}
                required
                className="m3-input"
              />
            </div>

            {/* Presupuesto Inicial + Notas */}
            <div className="form-group" style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label">Presupuesto Inicial (€) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  name="budget_inicial"
                  value={newProject.budget_inicial}
                  onChange={handleInputChange}
                  placeholder="150000.00"
                  required
                  className="m3-input"
                />
              </div>
              <div>
                <label className="form-label">Notas sobre el presupuesto</label>
                <input
                  type="text"
                  name="budget_notas"
                  value={newProject.budget_notas || ''}
                  onChange={handleInputChange}
                  placeholder="Ej: Incluye licencias + implantación, excluye hardware"
                  className="m3-input"
                />
              </div>
            </div>

            {/* RAG */}
            <div className="form-group">
              <label className="form-label">Indicador RAG inicial *</label>
              <select 
                name="indicador_rag" 
                value={newProject.indicador_rag} 
                onChange={handleInputChange}
                className="user-select"
              >
                <option value="VERDE">VERDE</option>
                <option value="AMARILLO">AMARILLO</option>
                <option value="ROJO">ROJO</option>
              </select>
            </div>

            {/* CAPEX & Estratégico Subcomponent */}
            <CapexFieldsGroup
              newProject={newProject}
              handleInputChange={handleInputChange}
              setNewProject={setNewProject}
              capexTypes={capexTypes}
            />

          </div>

          {/* Descripción */}
          <div className="form-group" style={{ marginTop: 12 }}>
            <label className="form-label">Descripción del Proyecto *</label>
            <textarea 
              name="descripcion"
              value={newProject.descripcion}
              onChange={handleInputChange}
              placeholder="Detalles sobre el alcance, objetivos..."
              required
              rows={3}
              className="m3-input"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="m3-btn m3-btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="m3-btn m3-btn-primary">
              Registrar Proyecto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
