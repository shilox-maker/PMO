import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, Star, Edit2, Trash2, Filter, Lock } from 'lucide-react';
import RichTextEditor from '../../../components/RichTextEditor';
import { useAuth } from '../../../context/AuthContext';

export default function ProjectDirectionWall({
  comments,
  commentsLoading,
  newCommentText,
  setNewCommentText,
  newCommentImportant,
  setNewCommentImportant,
  handleAddComment,
  handleDeleteComment,
  editingCommentId,
  setEditingCommentId,
  editingCommentText,
  setEditingCommentText,
  editingCommentImportant,
  setEditingCommentImportant,
  handleUpdateComment,
  formatDateTime
}) {
  const { t } = useTranslation();
  const { canWrite } = useAuth();
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'IMPORTANT'

  const filteredComments = useMemo(() => {
    if (!Array.isArray(comments)) return [];
    if (filterType === 'IMPORTANT') {
      return comments.filter(c => c.es_importante);
    }
    return comments;
  }, [comments, filterType]);

  const counts = useMemo(() => {
    if (!Array.isArray(comments)) return { all: 0, important: 0 };
    return {
      all: comments.length,
      important: comments.filter(c => c.es_importante).length
    };
  }, [comments]);

  const handleDeleteWithConfirm = (commentId) => {
    if (window.confirm(t('projectDetail.directionWall.deleteConfirm', '¿Seguro que deseas eliminar esta nota de dirección?'))) {
      handleDeleteComment(commentId);
    }
  };

  return (
    <div 
      className="m3-card glass-panel" 
      style={{ 
        marginTop: 20, 
        border: '1px solid rgba(0, 122, 255, 0.25)', 
        background: 'linear-gradient(180deg, rgba(10, 132, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)' 
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
        <h3 style={{ fontWeight: 600, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 8, color: '#007aff' }}>
          <ShieldAlert size={22} color="#007aff" /> {t('projectDetail.directionWall.title', 'Muro de Dirección (Canal Confidencial)')}
        </h3>
        <span style={{ 
          fontSize: '0.72rem', 
          fontWeight: 700, 
          padding: '3px 8px', 
          borderRadius: 8, 
          background: 'rgba(0, 122, 255, 0.12)', 
          color: '#007aff',
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}>
          <Lock size={12} /> {t('projectDetail.directionWall.badge', 'SOLO DIRECCIÓN')}
        </span>
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)', marginBottom: 20 }}>
        {t('projectDetail.directionWall.subtitle', 'Anotaciones estratégicas y acuerdos reservados del Comité de Dirección. No visible para el Project Manager.')}
      </p>

      {/* Input area */}
      {canWrite && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, padding: 16, backgroundColor: 'rgba(0, 122, 255, 0.04)', border: '1px solid rgba(0, 122, 255, 0.15)', borderRadius: 16 }}>
          <RichTextEditor 
            value={newCommentText}
            onChange={setNewCommentText}
            placeholder={t('projectDetail.directionWall.placeholder', 'Escriba un apunte estratégico o decisión de dirección...')}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 20 }}>
              <label className="m3-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={newCommentImportant} 
                  onChange={(e) => setNewCommentImportant(e.target.checked)}
                  className="m3-checkbox"
                />
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#007aff', fontWeight: 600 }}>
                  <Star size={14} fill={newCommentImportant ? '#007aff' : 'none'} color="#007aff" /> {t('projectDetail.directionWall.markImportant', 'Marcar como clave para informe de Dirección')}
                </span>
              </label>
            </div>
            <button 
              className="m3-btn m3-btn-primary" 
              onClick={handleAddComment} 
              style={{ height: '36px', background: '#007aff', borderColor: '#007aff' }}
            >
              {t('projectDetail.directionWall.publishBtn', 'Publicar Nota de Dirección')}
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      {comments && comments.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap', paddingBottom: 12, borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={15} /> {t('projectDetail.directionWall.filterLabel', 'Filtrar notas:')}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`m3-btn ${filterType === 'ALL' ? 'm3-btn-primary' : 'm3-btn-outline'}`}
              onClick={() => setFilterType('ALL')}
              style={{ 
                height: '30px', 
                fontSize: '0.78rem', 
                padding: '0 12px',
                background: filterType === 'ALL' ? '#007aff' : undefined,
                borderColor: '#007aff',
                color: filterType === 'ALL' ? '#fff' : '#007aff'
              }}
            >
              {t('projectDetail.directionWall.filterAll', { count: counts.all, defaultValue: `Todas (${counts.all})` })}
            </button>
            <button
              type="button"
              className={`m3-btn ${filterType === 'IMPORTANT' ? 'm3-btn-primary' : 'm3-btn-outline'}`}
              onClick={() => setFilterType('IMPORTANT')}
              style={{
                height: '30px',
                fontSize: '0.78rem',
                padding: '0 12px',
                background: filterType === 'IMPORTANT' ? '#f59e0b' : undefined,
                borderColor: '#f59e0b',
                color: filterType === 'IMPORTANT' ? '#fff' : '#d97706'
              }}
            >
              {t('projectDetail.directionWall.filterImportant', { count: counts.important, defaultValue: `⭐ Claves (${counts.important})` })}
            </button>
          </div>
        </div>
      )}

      {/* Comments List */}
      {commentsLoading ? (
        <span>{t('projectDetail.directionWall.loading', 'Cargando notas de dirección...')}</span>
      ) : comments.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--md-sys-color-outline)', padding: '24px 0', fontStyle: 'italic' }}>
          {t('projectDetail.directionWall.noComments', 'No hay notas de dirección registradas para este proyecto.')}
        </p>
      ) : filteredComments.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--md-sys-color-outline)', padding: '24px 0', fontStyle: 'italic' }}>
          {t('projectDetail.directionWall.noFilterComments', 'No hay notas que coincidan con el filtro seleccionado.')}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredComments.map(c => {
            const isEditing = editingCommentId === c.id_comentario;

            return (
              <div 
                key={c.id_comentario} 
                style={{ 
                  padding: 16, 
                  backgroundColor: 'rgba(0, 122, 255, 0.05)', 
                  borderLeft: '4px solid #007aff',
                  borderRadius: '0 16px 16px 0',
                  border: '1px solid rgba(0, 122, 255, 0.15)',
                  borderLeftWidth: '4px',
                  borderLeftColor: '#007aff',
                  transition: 'var(--transition-smooth)'
                }}
              >
                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <RichTextEditor 
                      value={editingCommentText}
                      onChange={setEditingCommentText}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <label className="m3-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={editingCommentImportant} 
                            onChange={(e) => setEditingCommentImportant(e.target.checked)}
                            className="m3-checkbox"
                          />
                          <span style={{ color: '#007aff', fontWeight: 600 }}>{t('common.important', 'Clave / Importante')}</span>
                        </label>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="m3-btn m3-btn-outline" onClick={() => setEditingCommentId(null)} style={{ height: '32px', fontSize: '0.8rem' }}>
                          {t('common.cancel', 'Cancelar')}
                        </button>
                        <button className="m3-btn m3-btn-primary" onClick={() => handleUpdateComment(c.id_comentario)} style={{ height: '32px', fontSize: '0.8rem', background: '#007aff', borderColor: '#007aff' }}>
                          {t('common.save', 'Guardar')}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface)' }}>{c.Autor?.nombre} {c.Autor?.apellidos}</strong>
                        <span style={{ fontSize: '0.68rem', backgroundColor: 'rgba(0, 122, 255, 0.12)', color: '#007aff', padding: '2px 7px', borderRadius: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <ShieldAlert size={10} /> {t('projectDetail.directionWall.directionBadge', 'DIRECCIÓN')}
                        </span>
                        {c.es_importante && (
                          <span style={{ fontSize: '0.68rem', backgroundColor: '#ffe0b2', color: '#e65100', padding: '2px 7px', borderRadius: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Star size={10} fill="#e65100" /> {t('projectDetail.directionWall.importantBadge', 'CLAVE')}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>
                        {formatDateTime(c.fecha_registro)}
                      </span>
                    </div>

                    <div className="wysiwyg-content" dangerouslySetInnerHTML={{ __html: c.texto_comentario }} style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--md-sys-color-on-surface)' }} />

                    {c.editado && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-outline)', marginTop: 8, fontStyle: 'italic' }}>
                        {t('projectDetail.directionWall.editedBy', {
                          name: `${c.Editor?.nombre || ''} ${c.Editor?.apellidos || ''}`,
                          date: formatDateTime(c.fecha_modificacion),
                          defaultValue: `Editado por ${c.Editor?.nombre} ${c.Editor?.apellidos} el ${formatDateTime(c.fecha_modificacion)}`
                        })}
                      </div>
                    )}

                    {canWrite && (
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12, borderTop: '1px solid rgba(0, 122, 255, 0.08)', paddingTop: 8 }}>
                        <button 
                          className="icon-btn" 
                          onClick={() => {
                            setEditingCommentId(c.id_comentario);
                            setEditingCommentText(c.texto_comentario);
                            setEditingCommentImportant(c.es_importante);
                          }}
                          title={t('common.edit', 'Editar nota')}
                        >
                          <Edit2 size={12} /> <span style={{ fontSize: '0.75rem', marginLeft: 4 }}>{t('common.edit', 'Editar')}</span>
                        </button>
                        <button 
                          className="icon-btn" 
                          onClick={() => handleDeleteWithConfirm(c.id_comentario)}
                          title={t('common.delete', 'Eliminar nota')}
                          style={{ color: 'var(--color-rag-red)' }}
                        >
                          <Trash2 size={12} /> <span style={{ fontSize: '0.75rem', marginLeft: 4 }}>{t('common.delete', 'Eliminar')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
