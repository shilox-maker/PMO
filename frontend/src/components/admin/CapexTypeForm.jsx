import React from 'react';
import { useTranslation } from 'react-i18next';

export default function CapexTypeForm({
  editingTypeId,
  setEditingTypeId,
  typeForm,
  setTypeForm,
  onSubmit
}) {
  const { t } = useTranslation();

  return (
    <div className="m3-card glass-panel" style={{ position: 'sticky', top: 24 }}>
      <h3 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 16 }}>
        {editingTypeId ? t('capexAdmin.editType') : t('capexAdmin.addType')}
      </h3>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">{t('capexAdmin.typeName')}</label>
          <input 
            type="text" 
            value={typeForm.nombre}
            onChange={e => setTypeForm(prev => ({ ...prev, nombre: e.target.value }))}
            required
            placeholder="Ej: SOFTWARE / LICENCIAS"
            className="m3-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">{t('sedesAdmin.order')}</label>
          <input 
            type="number" 
            value={typeForm.orden}
            onChange={e => setTypeForm(prev => ({ ...prev, orden: e.target.value }))}
            placeholder="0"
            className="m3-input"
          />
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          {editingTypeId && (
            <button 
              type="button" 
              className="m3-btn m3-btn-outline" 
              style={{ flexGrow: 1 }}
              onClick={() => {
                setEditingTypeId(null);
                setTypeForm({ id: '', nombre: '', orden: '' });
              }}
            >
              {t('usersAdmin.cancel')}
            </button>
          )}
          <button type="submit" className="m3-btn m3-btn-primary" style={{ flexGrow: 1 }}>
            {editingTypeId ? t('usersAdmin.saveChanges') : t('capexAdmin.addType')}
          </button>
        </div>
      </form>
    </div>
  );
}
