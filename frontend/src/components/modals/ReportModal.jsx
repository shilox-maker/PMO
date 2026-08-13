import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generateProjectReport } from '../../utils/reportGenerator';

export default function ReportModal({ isOpen, onClose, project, comments }) {
  const { t, i18n } = useTranslation();
  const [reportOptions, setReportOptions] = useState({
    resumen: true,
    hitos: true,
    riesgos: true,
    incidencias: true,
    cambios: true,
    lecciones: true,
    timeline: true,
    alcance: true,
    cierre: true
  });

  if (!isOpen) return null;

  const handleGenerate = () => {
    generateProjectReport(project, comments, reportOptions, t, i18n.language);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3 className="modal-title">{t('reportModal.title')}</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: '16px 0' }}>
          <p style={{ marginBottom: 16, color: 'var(--md-sys-color-on-surface-variant)' }}>
            {t('reportModal.subtitle')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { id: 'resumen', label: t('reportModal.optResumen') },
              { id: 'alcance', label: t('reportModal.optAlcance') },
              { id: 'cierre', label: t('reportModal.optCierre') },
              { id: 'hitos', label: t('reportModal.optHitos') },
              { id: 'timeline', label: t('reportModal.optTimeline') },
              { id: 'riesgos', label: t('reportModal.optRiesgos') },
              { id: 'incidencias', label: t('reportModal.optIncidencias') },
              { id: 'cambios', label: t('reportModal.optCambios') },
              { id: 'lecciones', label: t('reportModal.optLecciones') }
            ].map((opt) => (
              <label 
                key={opt.id} 
                className="m3-checkbox-label" 
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={reportOptions[opt.id]}
                  onChange={(e) => setReportOptions({ ...reportOptions, [opt.id]: e.target.checked })}
                  className="m3-checkbox"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
          <button type="button" className="m3-btn m3-btn-outline" onClick={onClose}>
            {t('reportModal.cancel')}
          </button>
          <button type="button" className="m3-btn m3-btn-primary" onClick={handleGenerate}>
            {t('reportModal.generate')}
          </button>
        </div>
      </div>
    </div>
  );
}
