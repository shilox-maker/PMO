import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { generateDashboardReport } from '../../utils/dashboardReportGenerator';

export default function DashboardReportModal({ isOpen, onClose, projects, getAuthHeaders }) {
  const [loading, setLoading] = useState(false);
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

  const handleGenerate = async () => {
    if (!projects || projects.length === 0) return;
    setLoading(true);

    try {
      const detailedProjects = await Promise.all(
        projects.map(async (p) => {
          // Fetch project details
          const projRes = await fetch(`${import.meta.env.VITE_API_URL}/projects/${p.id_proyecto}`, {
            headers: getAuthHeaders()
          });
          const projData = await projRes.json();

          // Fetch project comments
          const commRes = await fetch(`${import.meta.env.VITE_API_URL}/projects/${p.id_proyecto}/comments`, {
            headers: getAuthHeaders()
          });
          const commData = await commRes.json();

          return { project: projData, comments: commData };
        })
      );

      generateDashboardReport(detailedProjects, reportOptions, highlightDate || null);
      onClose();
    } catch (err) {
      console.error('Error generating consolidated report:', err);
      alert('Error al generar el informe consolidado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Generar Informe de Cartera</h3>
          <button className="icon-btn" onClick={onClose} disabled={loading}>✕</button>
        </div>

        <div style={{ padding: '16px 0' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '180px', gap: 16 }}>
              <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--md-sys-color-primary)' }} />
              <span style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-outline)' }}>
                Recuperando información de {projects.length} proyectos...
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.85rem' }}>
                Selecciona las secciones a incluir en el informe consolidado de los proyectos filtrados:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { id: 'resumen', label: 'Resumen y KPIs de Control / Muro de Comentarios' },
                  { id: 'alcance', label: 'Alcance del Proyecto' },
                  { id: 'cierre', label: 'Criterios de Cierre' },
                  { id: 'hitos', label: 'Hitos del Proyecto' },
                  { id: 'timeline', label: 'Cronología del Proyecto (Timeline)' },
                  { id: 'riesgos', label: 'Matriz de Riesgos' },
                  { id: 'incidencias', label: 'Incidencias Técnicas o de Plazos' },
                  { id: 'cambios', label: 'Cambios de Alcance (CR)' },
                  { id: 'lecciones', label: 'Lecciones Aprendidas' }
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

              <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 16, marginTop: 8 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>
                  Remarcar a partir de:
                </label>
                <input 
                  type="date" 
                  value={highlightDate} 
                  onChange={(e) => setHighlightDate(e.target.value)}
                  className="m3-input"
                  style={{ height: '40px' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)', marginTop: 4, display: 'block' }}>
                  Los comentarios publicados desde esta fecha se marcarán con la etiqueta roja "A REVISAR".
                </span>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 12 }}>
          <button 
            type="button" 
            className="m3-btn m3-btn-outline" 
            onClick={onClose} 
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            className="m3-btn m3-btn-primary" 
            onClick={handleGenerate}
            disabled={loading || !Object.values(reportOptions).some(Boolean)}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {loading && <RefreshCw className="animate-spin" size={16} />}
            {loading ? 'Procesando...' : 'Generar Informe'}
          </button>
        </div>
      </div>
    </div>
  );
}
