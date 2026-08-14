import React from 'react';

export default function CapexFieldsGroup({ 
  newProject, 
  form,
  projectData = form || newProject, 
  handleInputChange, 
  setNewProject, 
  setForm,
  setProjectData = setForm || setNewProject, 
  capexTypes = [] 
}) {
  const data = projectData || {};

  return (
    <>
      {/* Solo CAPEX switch */}
      <div className="form-group" style={{ gridColumn: 'span 2', display: 'flex', gap: 24, alignItems: 'center', margin: '8px 0 4px' }}>
        <label className="m3-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            name="es_capex"
            checked={!!data.es_capex}
            onChange={handleInputChange}
            className="m3-checkbox"
          />
          <span>¿Es Proyecto CAPEX?</span>
        </label>
      </div>

      {/* CAPEX Code */}
      {data.es_capex && (
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="form-label">Código CAPEX *</label>
          <input 
            type="text" 
            name="codigo_capex"
            value={data.codigo_capex || ''}
            onChange={handleInputChange}
            placeholder="CPX-XXXXXX"
            required={data.es_capex}
            className="m3-input"
          />
        </div>
      )}

      {/* CAPEX Type & Subtype selectors */}
      {data.es_capex && (
        <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Tipo CAPEX *</label>
            <select
              name="id_tipo_capex"
              value={data.id_tipo_capex || ''}
              onChange={(e) => {
                const val = e.target.value;
                setProjectData(prev => ({ ...prev, id_tipo_capex: val, id_subtipo_capex: '' }));
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
            const sel = capexTypes.find(t => t.id === parseInt(data.id_tipo_capex, 10));
            return sel?.Subtipos?.length > 0 ? (
              <div className="form-group">
                <label className="form-label">Subtipo CAPEX *</label>
                <select
                  name="id_subtipo_capex"
                  value={data.id_subtipo_capex || ''}
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
      
      {/* Proyecto Estratégico */}
      <div className="form-group" style={{ gridColumn: 'span 2', margin: '4px 0 8px' }}>
        <label className="m3-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--md-sys-color-primary)', fontWeight: 600 }}>
          <input 
            type="checkbox" 
            name="es_estrategico"
            checked={!!data.es_estrategico}
            onChange={handleInputChange}
            className="m3-checkbox"
          />
          <span>¿Es Proyecto Estratégico?</span>
        </label>
      </div>
    </>
  );
}
