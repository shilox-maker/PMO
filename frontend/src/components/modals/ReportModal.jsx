import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generateProjectReport } from '../../utils/reportGenerator';
import { useAuth } from '../../context/AuthContext';

export default function ReportModal({ isOpen, onClose, project, comments, directionComments }) {
  const { t, i18n } = useTranslation();
  const { currentPm } = useAuth();
  const canSeeDireccion = currentPm && (currentPm.perfil === 'ADMINISTRADOR' || currentPm.perfil === 'DIRECTOR');

  const [highlightDate, setHighlightDate] = useState('');
  const [reportOptions, setReportOptions] = useState({
    resumen: true,
    alcance: true,
    cierre: true,
    hitos: true,
    timeline: true,
    riesgos: true,
    incidencias: true,
    cambios: true,
    lecciones: true
  });

  if (!isOpen) return null;

  const handleGenerate = () => {
    generateProjectReport(
      project,
      comments,
      directionComments,
      reportOptions,
      highlightDate || null,
      canSeeDireccion,
      t,
      i18n.language
    );
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
          <p style={{ marginBottom: 16, color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.85rem' }}>
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
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem' }}
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

          <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 16, marginTop: 16 }}>
            <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>
              {t('reportModal.highlightFrom', 'Fecha de referencia / corte:')}
            </label>
            <input 
              type="date" 
              value={highlightDate} 
              onChange={(e) => setHighlightDate(e.target.value)}
              className="m3-input"
              style={{ height: '40px' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)', marginTop: 4, display: 'block' }}>
              {canSeeDireccion 
                ? 'Las notas posteriores a esta fecha se mostrarán en azul y las anteriores en rojo.' 
                : t('reportModal.highlightNote', 'Resalta visualmente los comentarios clave a partir de esta fecha.')}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 16 }}>
          <button type="button" className="m3-btn m3-btn-outline" onClick={onClose}>
            {t('reportModal.cancel')}
          </button>
          <button 
            type="button" 
            className="m3-btn m3-btn-primary" 
            onClick={handleGenerate}
            disabled={!Object.values(reportOptions).some(Boolean)}
          >
            {t('reportModal.generate')}
          </button>
        </div>
      </div>
    </div>
  );
}

