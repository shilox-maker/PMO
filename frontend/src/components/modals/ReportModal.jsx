import React, { useState } from 'react';
import { generateProjectReport } from '../../utils/reportGenerator';

export default function ReportModal({ isOpen, onClose, project, comments }) {
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
    generateProjectReport(project, comments, reportOptions);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Generar Informe de Proyecto</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: '16px 0' }}>
          <p style={{ marginBottom: 16, color: 'var(--md-sys-color-on-surface-variant)' }}>
            Selecciona qué secciones deseas incluir en el informe ejecutivo a generar:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { id: 'resumen', label: 'Resumen y KPIs de Control' },
              { id: 'alcance', label: 'Alcance del Proyecto' },
              { id: 'cierre', label: 'Criterios de Cierre' },
              { id: 'hitos', label: 'Hitos de Proyecto' },
              { id: 'timeline', label: 'Cronología del Proyecto (Timeline)' },
              { id: 'riesgos', label: 'Matriz de Riesgos' },
              { id: 'incidencias', label: 'Incidencias Técnicas o de Plazos' },
              { id: 'cambios', label: 'Cambios de Alcance (CR)' },
              { id: 'lecciones', label: 'Lecciones Aprendidas' }
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
            Cancelar
          </button>
          <button type="button" className="m3-btn m3-btn-primary" onClick={handleGenerate}>
            Generar Informe
          </button>
        </div>
      </div>
    </div>
  );
}
