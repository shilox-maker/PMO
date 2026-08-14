import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, Plus, Edit2, Trash2, Calendar, User, MessageSquare, Award } from 'lucide-react';
import SurveyModal from '../../../components/modals/SurveyModal';

export default function ProjectEncuestasTab({ project, getAuthHeaders }) {
  const { t } = useTranslation();
  const [surveys, setSurveys] = useState([]);
  const [averageScore, setAverageScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const fetchSurveys = useCallback(async () => {
    if (!project?.id_proyecto) return;
    setLoading(true);
    try {
      const authHeaders = getAuthHeaders ? getAuthHeaders() : {};
      const res = await fetch(`${API_URL}/projects/${project.id_proyecto}/surveys`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setSurveys(data.surveys || []);
        setAverageScore(data.average);
      }
    } catch (err) {
      console.error('Error cargando encuestas del proyecto:', err);
    } finally {
      setLoading(false);
    }
  }, [project?.id_proyecto]);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  const handleSaveSurvey = async (surveyData) => {
    try {
      const isEdit = !!surveyData.id;
      const url = isEdit
        ? `${API_URL}/projects/${project.id_proyecto}/surveys/${surveyData.id}`
        : `${API_URL}/projects/${project.id_proyecto}/surveys`;
      const method = isEdit ? 'PUT' : 'POST';

      const authHeaders = getAuthHeaders ? getAuthHeaders() : {};
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(surveyData)
      });

      if (res.ok) {
        await fetchSurveys();
      }
    } catch (err) {
      console.error('Error guardando encuesta:', err);
    }
  };

  const handleDeleteSurvey = async (surveyId) => {
    if (!window.confirm(t('projectDetail.surveysTab.deleteConfirm', '¿Deseas eliminar esta encuesta cualitativa?'))) return;
    try {
      const authHeaders = getAuthHeaders ? getAuthHeaders() : {};
      const res = await fetch(`${API_URL}/projects/${project.id_proyecto}/surveys/${surveyId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (res.ok) {
        await fetchSurveys();
      }
    } catch (err) {
      console.error('Error eliminando encuesta:', err);
    }
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 8) return 'badge-green';
    if (score >= 6) return 'badge-yellow';
    return 'badge-red';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Action Header & Average Card */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h3 style={{ fontWeight: 600, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={20} color="var(--md-sys-color-primary)" /> {t('projectDetail.surveysTab.title', 'Percepción Cualitativa y Encuestas de Satisfacción')}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)', marginTop: 4 }}>
            {t('projectDetail.surveysTab.subtitle', 'Evaluaciones registradas por el cliente, patrocinadores y comités de seguimiento.')}
          </p>
        </div>
        <button
          className="m3-btn m3-btn-primary"
          onClick={() => { setSelectedSurvey(null); setIsModalOpen(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} /> {t('projectDetail.surveysTab.newSurvey', 'Nueva Encuesta')}
        </button>
      </div>

      {/* Average Score Summary Card */}
      <div className="m3-card glass-panel" style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ padding: 14, borderRadius: '50%', backgroundColor: 'rgba(255, 159, 10, 0.15)', color: 'var(--priority-alta)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Star size={32} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--md-sys-color-outline)', textTransform: 'uppercase' }}>
              {t('projectDetail.surveysTab.avgScore', 'Nota Media de Satisfacción')}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--md-sys-color-on-surface)', lineHeight: 1.1 }}>
              {averageScore !== null ? `${averageScore} / 10` : t('projectDetail.surveysTab.noSurveys', 'Sin encuestas')}
            </div>
          </div>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)' }}>
          {t('projectDetail.surveysTab.totalSurveys', { count: surveys.length, defaultValue: `Total evaluaciones registradas: ${surveys.length}` })}
        </div>
      </div>

      {/* Survey List / Cards */}
      {loading ? (
        <div style={{ padding: 24, textAlign: 'center', opacity: 0.7 }}>{t('projectDetail.surveysTab.loading', 'Cargando encuestas cualitativas...')}</div>
      ) : surveys.length === 0 ? (
        <div className="m3-card glass-panel" style={{ padding: 32, textAlign: 'center', opacity: 0.7 }}>
          <Star size={28} style={{ marginBottom: 8 }} color="var(--md-sys-color-outline)" />
          <p style={{ fontSize: '0.9rem', margin: 0 }}>{t('projectDetail.surveysTab.noSurveysEmpty', 'No hay encuestas cualitativas registradas para este proyecto.')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {surveys.map(s => {
            const scoreNum = parseFloat(s.puntuacion || 0);
            return (
              <div key={s.id} className="m3-card glass-panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>{s.concepto}</h4>
                    <span className={`badge ${getScoreBadgeColor(scoreNum)}`} style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                      ⭐ {scoreNum} / {s.escala_maxima || 10}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--md-sys-color-outline)', display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12} /> {s.fecha_evaluacion}
                    </span>
                    {s.evaluador && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <User size={12} /> {t('projectDetail.surveysTab.evaluator', { name: s.evaluador, defaultValue: `Evaluador: ${s.evaluador}` })}
                      </span>
                    )}
                  </div>

                  {s.observaciones && (
                    <p style={{ fontSize: '0.83rem', color: 'var(--md-sys-color-on-surface-variant)', backgroundColor: 'var(--md-sys-color-surface-container-high)', padding: 10, borderRadius: 8, margin: '8px 0 0 0' }}>
                      "{s.observaciones}"
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14, borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 10 }}>
                  <button
                    className="icon-btn"
                    onClick={() => { setSelectedSurvey(s); setIsModalOpen(true); }}
                    title={t('common.edit', 'Editar Encuesta')}
                    style={{ padding: 4 }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => handleDeleteSurvey(s.id)}
                    title={t('common.delete', 'Eliminar Encuesta')}
                    style={{ padding: 4, color: 'var(--color-rag-red)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SurveyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        survey={selectedSurvey}
        onSave={handleSaveSurvey}
      />
    </div>
  );
}
