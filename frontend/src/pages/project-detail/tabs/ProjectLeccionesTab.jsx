import React from 'react';
import { Plus, Edit2, Trash2, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSortedData } from '../../../utils/sorting';

export default function ProjectLeccionesTab({
  project, openAddLesson, openEditLesson, handleDeleteLesson,
  setShowLessonModal, setEditingLesson, fetchProjectData, getAuthHeaders,
  lessonsSort, setLessonsSort, renderSortHeader
}) {
  const { t } = useTranslation();
  const lessons = project.LeccionesAprendidas || [];
  const sortedLessons = getSortedData(lessons, lessonsSort);

  const handleOpenAdd = openAddLesson || (() => {
    if (setEditingLesson) setEditingLesson(null);
    if (setShowLessonModal) setShowLessonModal(true);
  });

  const handleOpenEdit = openEditLesson || ((l) => {
    if (setEditingLesson) setEditingLesson(l);
    if (setShowLessonModal) setShowLessonModal(true);
  });

  const handleDelete = handleDeleteLesson || ((lessonId) => {
    if (!window.confirm(t('lessonsTab.deleteConfirm', '¿Seguro que deseas eliminar esta lección aprendida?'))) return;
    fetch(`${import.meta.env.VITE_API_URL}/lessons/${lessonId}`, {
      method: 'DELETE',
      headers: getAuthHeaders ? getAuthHeaders() : {}
    }).then(() => fetchProjectData && fetchProjectData());
  });

  return (
    <div className="m3-card glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontWeight: 600, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={20} /> {t('lessonsTab.title', 'Lecciones Aprendidas')}
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>{t('lessonsTab.subtitle', 'Base de conocimiento técnica: aciertos, buenas prácticas y errores detectados')}</p>
        </div>
        <button className="m3-btn m3-btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> {t('lessonsTab.newLesson', 'Nueva Lección')}
        </button>
      </div>

      {(lessons.length === 0) ? (
        <p style={{ color: 'var(--md-sys-color-outline)', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
          {t('lessonsTab.noLessons', 'No hay lecciones aprendidas registradas en este proyecto.')}
        </p>
      ) : (
        <div className="m3-table-wrapper" style={{ border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 12 }}>
          <table className="m3-table">
            <thead>
              <tr>
                {renderSortHeader(t('lessonsTab.code', 'Código'), 'id_leccion', lessonsSort, setLessonsSort)}
                {renderSortHeader(t('lessonsTab.type', 'Tipo'), 'tipo_leccion', lessonsSort, setLessonsSort)}
                {renderSortHeader(t('lessonsTab.summary', 'Título / Resumen'), 'titulo', lessonsSort, setLessonsSort)}
                {renderSortHeader(t('lessonsTab.description', 'Lección Aprendida'), 'contexto', lessonsSort, setLessonsSort)}
                {renderSortHeader(t('lessonsTab.recommendation', 'Recomendación'), 'recomendacion_futura', lessonsSort, setLessonsSort)}
                <th>{t('common.actions', 'Acciones')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedLessons.map((l) => (
                <tr key={l.id_leccion}>
                  <td style={{ fontWeight: 700 }}>{l.id_leccion}</td>
                  <td>
                    <span className={`badge ${l.tipo_leccion === 'BUENA_PRACTICA' ? 'badge-green' : 'badge-red'}`}>
                      {l.tipo_leccion === 'BUENA_PRACTICA' ? t('lessonsTab.goodPractice', 'Buena Práctica') : t('lessonsTab.errorToAvoid', 'Error a Evitar')}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{l.titulo}</td>
                  <td>{l.contexto || '—'}</td>
                  <td>{l.recomendacion_futura || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="icon-btn" onClick={() => handleOpenEdit(l)} title={t('lessonsTab.editTooltip', 'Editar lección')}>
                        <Edit2 size={14} />
                      </button>
                      <button className="icon-btn" onClick={() => handleDelete(l.id_leccion || l.id)} title={t('lessonsTab.deleteTooltip', 'Eliminar lección')} style={{ color: 'var(--color-rag-red)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
