import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { RefreshCw } from 'lucide-react';

export default function GeneralLessonsPage() {
  const { t } = useTranslation();
  const { getAuthHeaders } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [tipoFilter, setTipoFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [proyectoFilter, setProyectoFilter] = useState('');

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/lessons`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        setLessons(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching lessons:', err);
        setLoading(false);
      });
  }, []);

  // Derivar listas únicas de partners y proyectos
  const uniquePartners = Array.from(
    new Set(
      lessons
        .map(l => l.Proveedore)
        .filter(Boolean)
        .map(p => JSON.stringify({ id: p.id_proveedor, name: p.nombre_razon_social }))
    )
  ).map(str => JSON.parse(str)).sort((a, b) => a.name.localeCompare(b.name));

  const uniqueProyectos = Array.from(
    new Set(
      lessons
        .map(l => l.Proyecto)
        .filter(Boolean)
        .map(p => JSON.stringify({ id: p.id_proyecto, name: p.nombre_proyecto }))
    )
  ).map(str => JSON.parse(str)).sort((a, b) => a.name.localeCompare(b.name));

  // Filtrado local
  const filteredLessons = lessons.filter(l => {
    const matchesTipo = !tipoFilter || l.tipo_leccion === tipoFilter;
    const matchesPartner = !partnerFilter || (l.Proveedore && String(l.Proveedore.id_proveedor) === partnerFilter);
    const matchesProyecto = !proyectoFilter || (l.Proyecto && String(l.Proyecto.id_proyecto) === proyectoFilter);
    return matchesTipo && matchesPartner && matchesProyecto;
  });

  const clearFilters = () => {
    setTipoFilter('');
    setPartnerFilter('');
    setProyectoFilter('');
  };

  return (
    <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Barra de Filtros */}
      {!loading && lessons.length > 0 && (
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', borderRadius: 16, border: '1px solid var(--md-sys-color-outline-variant)' }}>
          {/* Tipo (Chips) */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)', fontWeight: 500 }}>{t('generalLessons.type')}</span>
            {['', 'BUENA_PRACTICA', 'ERROR_A_EVITAR'].map(tKey => {
              const isSelected = tipoFilter === tKey;
              const label = tKey === '' ? t('generalLessons.allTypes') : tKey === 'BUENA_PRACTICA' ? t('generalLessons.goodPractices') : t('generalLessons.errorsToAvoid');
              return (
                <button
                  key={tKey}
                  onClick={() => setTipoFilter(tKey)}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: isSelected ? 'var(--md-sys-color-primary)' : 'transparent',
                    color: isSelected ? '#ffffff' : 'var(--md-sys-color-on-surface)',
                    border: isSelected ? '1px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div style={{ width: 1, height: 24, backgroundColor: 'var(--md-sys-color-outline-variant)' }} />

          {/* Partner Select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)', fontWeight: 500 }}>{t('generalLessons.partner')}</span>
            <select
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value)}
              className="user-select"
              style={{ height: 36, padding: '0 12px', fontSize: '0.85rem', minWidth: 150 }}
            >
              <option value="">{t('generalLessons.allPartners')}</option>
              {uniquePartners.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Proyecto Select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)', fontWeight: 500 }}>{t('generalLessons.project')}</span>
            <select
              value={proyectoFilter}
              onChange={(e) => setProyectoFilter(e.target.value)}
              className="user-select"
              style={{ height: 36, padding: '0 12px', fontSize: '0.85rem', minWidth: 180 }}
            >
              <option value="">{t('generalLessons.allProjects')}</option>
              {uniqueProyectos.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Limpiar Filtros */}
          {(tipoFilter || partnerFilter || proyectoFilter) && (
            <button
              className="m3-btn m3-btn-text"
              onClick={clearFilters}
              style={{ padding: '4px 8px', fontSize: '0.8rem', marginLeft: 'auto' }}
            >
              {t('generalLessons.clearFilters')}
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RefreshCw className="animate-spin" size={18} style={{ color: 'var(--md-sys-color-primary)' }} />
          <span>{t('generalLessons.loading')}</span>
        </div>
      ) : lessons.length === 0 ? (
        <p style={{ color: 'var(--md-sys-color-outline)' }}>{t('generalLessons.noLessonsHistory')}</p>
      ) : filteredLessons.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 20px', textAlign: 'center', backgroundColor: 'var(--md-sys-color-surface-container-low)', borderRadius: 16 }}>
          <p style={{ color: 'var(--md-sys-color-outline)', fontSize: '0.95rem', margin: 0 }}>{t('generalLessons.noMatchingLessons')}</p>
          <button
            className="m3-btn m3-btn-primary"
            onClick={clearFilters}
            style={{ borderRadius: 12 }}
          >
            {t('generalLessons.resetFilters')}
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 }}>
          {filteredLessons.map(lesson => (
            <div key={lesson.id_leccion} style={{ padding: 20, backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: '16px', border: '1px solid var(--md-sys-color-outline-variant)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span className="project-id-badge">{lesson.id_leccion}</span>
                  <span className={`badge ${lesson.tipo_leccion === 'BUENA_PRACTICA' ? 'badge-green' : 'badge-red'}`}>
                    {lesson.tipo_leccion === 'BUENA_PRACTICA' ? t('generalLessons.goodPractices') : t('generalLessons.errorsToAvoid')}
                  </span>
                </div>
                <h4 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 8 }}>{lesson.titulo}</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-outline)', marginBottom: 12 }}>
                  <strong>{t('vendor360.context')}</strong> {lesson.contexto}
                </p>
                <p style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface)' }}>
                  <strong>{t('vendor360.futureRec')}</strong> {lesson.recomendacion_futura}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>
                {lesson.Proyecto && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '50%' }} title={lesson.Proyecto.nombre_proyecto}>{t('generalLessons.project')} {lesson.Proyecto.nombre_proyecto}</span>}
                {lesson.Proveedore && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '50%' }} title={lesson.Proveedore.nombre_razon_social}>{t('generalLessons.partner')} {lesson.Proveedore.nombre_razon_social}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
