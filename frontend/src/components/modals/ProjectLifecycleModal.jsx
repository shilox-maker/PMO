import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, CheckCircle2, RotateCcw } from 'lucide-react';

export default function ProjectLifecycleModal({
  isOpen, onClose, project, getAuthHeaders, onSuccess
}) {
  const { t } = useTranslation();

  const [form, setForm] = useState({
    fecha_peticion: '',
    fecha_alcance_definido: '',
    fecha_aprobacion: '',
    fecha_planificacion: '',
    fecha_kickoff: '',
    fecha_go_live: '',
    fecha_cierre: ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project && isOpen) {
      setForm({
        fecha_peticion: project.fecha_peticion ? project.fecha_peticion.substring(0, 10) : '',
        fecha_alcance_definido: project.fecha_alcance_definido ? project.fecha_alcance_definido.substring(0, 10) : '',
        fecha_aprobacion: project.fecha_aprobacion ? project.fecha_aprobacion.substring(0, 10) : '',
        fecha_planificacion: project.fecha_planificacion ? project.fecha_planificacion.substring(0, 10) : '',
        fecha_kickoff: project.fecha_kickoff ? project.fecha_kickoff.substring(0, 10) : '',
        fecha_go_live: project.fecha_go_live ? project.fecha_go_live.substring(0, 10) : '',
        fecha_cierre: project.fecha_cierre ? project.fecha_cierre.substring(0, 10) : ''
      });
      setError('');
    }
  }, [project, isOpen]);

  if (!isOpen) return null;

  const milestonesConfig = [
    { key: 'fecha_peticion', label: t('projectDetail.timeline.milestonePetition', 'Petición'), icon: '📩' },
    { key: 'fecha_alcance_definido', label: t('projectDetail.timeline.milestoneScope', 'Alcance Definido'), icon: '📐' },
    { key: 'fecha_aprobacion', label: t('projectDetail.timeline.milestoneApproval', 'Aprobación'), icon: '⏳' },
    { key: 'fecha_planificacion', label: t('projectDetail.timeline.milestonePlanning', 'Planificación'), icon: '📅' },
    { key: 'fecha_kickoff', label: t('projectDetail.timeline.milestoneKickoff', 'Kickoff'), icon: '🚀' },
    { key: 'fecha_go_live', label: t('projectDetail.timeline.milestoneGoLive', 'Go-Live'), icon: '📦' },
    { key: 'fecha_cierre', label: t('projectDetail.timeline.milestoneClose', 'Cierre'), icon: '🏁' }
  ];

  const handleDateChange = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
  };

  const handleClearField = (key) => {
    setForm(prev => ({ ...prev, [key]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      fecha_peticion: form.fecha_peticion ? form.fecha_peticion : null,
      fecha_alcance_definido: form.fecha_alcance_definido ? form.fecha_alcance_definido : null,
      fecha_aprobacion: form.fecha_aprobacion ? form.fecha_aprobacion : null,
      fecha_planificacion: form.fecha_planificacion ? form.fecha_planificacion : null,
      fecha_kickoff: form.fecha_kickoff ? form.fecha_kickoff : null,
      fecha_go_live: form.fecha_go_live ? form.fecha_go_live : null,
      fecha_cierre: form.fecha_cierre ? form.fecha_cierre : null
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/projects/${project.id_proyecto}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar los hitos del proyecto');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Calendar size={22} style={{ color: 'var(--md-sys-color-primary)' }} />
            <div>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.2rem' }}>
                {t('projectDetail.timeline.modalTitle', 'Editar Hitos del Ciclo de Vida')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>
                {t('projectDetail.timeline.modalSubtitle', 'Establece las fechas estimadas o reales para cada fase del proyecto.')}
              </p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} disabled={saving}>✕</button>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {milestonesConfig.map(m => {
              const isSet = !!form[m.key];
              return (
                <div 
                  key={m.key} 
                  className="form-group" 
                  style={{
                    backgroundColor: isSet ? 'var(--md-sys-color-surface-container)' : 'var(--md-sys-color-surface-container-low)',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: isSet ? '1px solid var(--md-sys-color-primary-container)' : '1px dashed var(--md-sys-color-outline-variant)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.85rem' }}>
                      <span style={{ fontSize: '1.05rem' }}>{m.icon}</span>
                      <span>{m.label}</span>
                    </label>
                    {isSet && (
                      <button
                        type="button"
                        onClick={() => handleClearField(m.key)}
                        title={t('projectDetail.timeline.clearDate', 'Limpiar fecha')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--md-sys-color-outline)',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          padding: '2px 6px',
                          borderRadius: 6
                        }}
                      >
                        <RotateCcw size={11} /> {t('common.clear', 'Limpiar')}
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    value={form[m.key]}
                    onChange={(e) => handleDateChange(m.key, e.target.value)}
                    className="m3-input"
                    style={{
                      fontSize: '0.85rem',
                      backgroundColor: 'var(--md-sys-color-surface)'
                    }}
                  />
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
            <button 
              type="button" 
              className="m3-btn m3-btn-outline" 
              onClick={onClose} 
              disabled={saving}
              style={{ height: '36px', fontSize: '0.85rem' }}
            >
              {t('common.cancel', 'Cancelar')}
            </button>
            <button 
              type="submit" 
              className="m3-btn m3-btn-primary" 
              disabled={saving}
              style={{ height: '36px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <CheckCircle2 size={15} />
              {saving ? t('common.saving', 'Guardando...') : t('common.save', 'Guardar Hitos')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
