import React from 'react';
import { Users } from 'lucide-react';

export default function CommitteeEditForm({
  committeeKey,
  activo,
  setActivo,
  finalidad,
  setFinalidad,
  selectedKus,
  handleToggleKu,
  raciContacts,
  onCancel,
  onSave
}) {
  const labelText = committeeKey === 'semanal' 
    ? 'Comité Semanal' 
    : committeeKey === 'mensual' 
      ? 'Comité Mensual' 
      : 'Comité SteerCo';

  const placeholderText = committeeKey === 'semanal' 
    ? 'Ej. Sprints, bloqueos y daily...' 
    : committeeKey === 'mensual' 
      ? 'Ej. Hitos tácticos y facturación...' 
      : 'Ej. Dirección estratégica trimestral...';

  return (
    <div 
      className="m3-card glass-panel" 
      style={{ 
        border: '2px solid var(--md-sys-color-primary)',
        boxShadow: 'var(--md-sys-elevation-2)',
        opacity: 1
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Configurar {labelText}</h4>
        <label className="m3-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.9rem' }}>
          <input 
            type="checkbox" 
            checked={activo} 
            onChange={(e) => setActivo(e.target.checked)}
            className="m3-checkbox"
          />
          <span style={{ fontWeight: 600 }}>Activo</span>
        </label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--md-sys-color-outline)', textTransform: 'uppercase' }}>
            Finalidad / Enfoque
          </label>
          <input 
            type="text" 
            value={finalidad} 
            onChange={(e) => setFinalidad(e.target.value)}
            placeholder={placeholderText}
            className="m3-input"
            style={{ marginTop: 4 }}
          />
        </div>

        <div>
          <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--md-sys-color-outline)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Users size={14} /> Participantes de Matriz RACI
          </label>
          {raciContacts.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--color-rag-red)', fontStyle: 'italic', margin: '8px 0 0 0' }}>
              ⚠️ No hay personas en la matriz RACI de este proyecto. Agrégalas primero en la pestaña "Ficha General".
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '180px', overflowY: 'auto', padding: '8px 12px', backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: '12px', border: '1px solid var(--md-sys-color-outline-variant)' }}>
              {raciContacts.map(ku => {
                const companyName = ku.Proveedore?.nombre_razon_social || ku.Proveedor?.nombre_razon_social;
                const roleParts = [companyName, ku.Proyecto_Contactos?.rol].filter(Boolean).join(' - ');
                const displayRole = roleParts ? `(${roleParts})` : '';
                const raciStr = ku.Proyecto_Contactos?.raci ? `[${ku.Proyecto_Contactos.raci}]` : '';
                return (
                  <label key={ku.id_contacto} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer', padding: '4px 0' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedKus.includes(ku.id_contacto)}
                      onChange={() => handleToggleKu(ku.id_contacto)}
                      style={{ width: 14, height: 14 }}
                    />
                    <span style={{ fontSize: '0.8rem' }}>
                      <strong>{ku.nombre} {ku.apellidos}</strong> <span style={{ opacity: 0.8 }}>{displayRole}</span> <span style={{ color: 'var(--md-sys-color-primary)', fontWeight: 'bold' }}>{raciStr}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
          <button 
            className="m3-btn m3-btn-outline" 
            onClick={onCancel}
            style={{ padding: '6px 12px', fontSize: '0.8rem', height: '32px' }}
          >
            Cancelar
          </button>
          <button 
            className="m3-btn m3-btn-primary" 
            onClick={onSave}
            style={{ padding: '6px 12px', fontSize: '0.8rem', height: '32px' }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
