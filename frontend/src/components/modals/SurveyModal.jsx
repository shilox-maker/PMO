import React, { useState, useEffect } from 'react';
import { Star, X, Check } from 'lucide-react';

export default function SurveyModal({
  isOpen,
  onClose,
  survey,
  onSave
}) {
  const [concepto, setConcepto] = useState('');
  const [puntuacion, setPuntuacion] = useState(8);
  const [fechaEvaluacion, setFechaEvaluacion] = useState(new Date().toISOString().split('T')[0]);
  const [evaluador, setEvaluador] = useState('');
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    if (survey) {
      setConcepto(survey.concepto || '');
      setPuntuacion(survey.puntuacion || 8);
      setFechaEvaluacion(survey.fecha_evaluacion || new Date().toISOString().split('T')[0]);
      setEvaluador(survey.evaluador || '');
      setObservaciones(survey.observaciones || '');
    } else {
      setConcepto('');
      setPuntuacion(8);
      setFechaEvaluacion(new Date().toISOString().split('T')[0]);
      setEvaluador('');
      setObservaciones('');
    }
  }, [survey, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!concepto.trim() || !fechaEvaluacion) return;

    onSave({
      id: survey?.id,
      concepto: concepto.trim(),
      puntuacion: Number(puntuacion),
      escala_maxima: 10,
      fecha_evaluacion: fechaEvaluacion,
      evaluador: evaluador.trim(),
      observaciones: observaciones.trim()
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '520px', width: '92%' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem' }}>
            <Star size={18} color="var(--priority-alta)" />
            {survey ? 'Editar Encuesta Cualitativa' : 'Nueva Encuesta Cualitativa'}
          </h3>
          <button className="icon-btn" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Concepto / Título de la Encuesta *</label>
            <input
              type="text"
              required
              value={concepto}
              onChange={e => setConcepto(e.target.value)}
              placeholder="Ej. Encuesta de Satisfacción SteerCo Q2"
              className="m3-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Puntuación (1 a 10): <strong>{puntuacion} / 10</strong></label>
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={puntuacion}
                onChange={e => setPuntuacion(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--md-sys-color-primary)', marginTop: 8 }}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Fecha de Evaluación *</label>
              <input
                type="date"
                required
                value={fechaEvaluacion}
                onChange={e => setFechaEvaluacion(e.target.value)}
                className="m3-input"
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Evaluador / Patrocinador</label>
            <input
              type="text"
              value={evaluador}
              onChange={e => setEvaluador(e.target.value)}
              placeholder="Ej. Dirección Operativa / Ana García (Sponsor)"
              className="m3-input"
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Observaciones / Feedback Cualitativo</label>
            <textarea
              rows={3}
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              placeholder="Comentarios sobre la percepción del cliente, calidad percibida..."
              className="m3-input"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="button" className="m3-btn m3-btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="m3-btn m3-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Check size={16} /> {survey ? 'Guardar Cambios' : 'Registrar Encuesta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
