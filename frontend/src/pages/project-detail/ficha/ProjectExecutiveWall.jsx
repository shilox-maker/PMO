import React, { useState, useMemo } from 'react';
import { MessageSquare, Star, Edit2, Trash2, Filter } from 'lucide-react';
import RichTextEditor from '../../../components/RichTextEditor';

export default function ProjectExecutiveWall({
  comments,
  commentsLoading,
  newCommentText,
  setNewCommentText,
  newCommentImportant,
  setNewCommentImportant,
  newCommentDireccion,
  setNewCommentDireccion,
  handleAddComment,
  handleDeleteComment,
  editingCommentId,
  setEditingCommentId,
  editingCommentText,
  setEditingCommentText,
  editingCommentImportant,
  setEditingCommentImportant,
  editingCommentDireccion,
  setEditingCommentDireccion,
  handleUpdateComment,
  canSeeDireccion,
  formatDateTime
}) {
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'IMPORTANT' | 'DIRECCION'

  const filteredComments = useMemo(() => {
    if (!comments) return [];
    if (filterType === 'IMPORTANT') {
      return comments.filter(c => c.es_importante);
    }
    if (filterType === 'DIRECCION' && canSeeDireccion) {
      return comments.filter(c => c.para_direccion);
    }
    return comments;
  }, [comments, filterType, canSeeDireccion]);

  const counts = useMemo(() => {
    if (!comments) return { all: 0, important: 0, direccion: 0 };
    return {
      all: comments.length,
      important: comments.filter(c => c.es_importante).length,
      direccion: comments.filter(c => c.para_direccion).length
    };
  }, [comments]);

  return (
    <div className="m3-card glass-panel" style={{ marginTop: 12 }}>
      <h3 style={{ fontWeight: 600, fontSize: '1.25rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
        <MessageSquare size={20} /> Muro Ejecutivo (Minutas / Hitos clave)
      </h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)', marginBottom: 20 }}>
        Registro cronológico de comentarios importantes de gobernanza y acuerdos de comités.
      </p>

      {/* Input area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, padding: 16, backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 16 }}>
        <RichTextEditor 
          value={newCommentText}
          onChange={setNewCommentText}
          placeholder="Añada un comentario o acuerdo ejecutivo aquí..."
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
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--priority-alta)', fontWeight: 600 }}>
                <Star size={14} fill={newCommentImportant ? 'var(--priority-alta)' : 'none'} /> Marcar como importante / ejecutivo (PDF)
              </span>
            </label>
            {canSeeDireccion && (
              <label className="m3-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={newCommentDireccion} 
                  onChange={(e) => setNewCommentDireccion(e.target.checked)}
                  className="m3-checkbox"
                />
                <span style={{ color: 'var(--md-sys-color-primary)', fontWeight: 600 }}>
                  📢 Para dirección
                </span>
              </label>
            )}
          </div>
          <button className="m3-btn m3-btn-primary" onClick={handleAddComment} style={{ height: '36px' }}>
            Publicar Comentario
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {comments && comments.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap', paddingBottom: 12, borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--md-sys-color-on-surface-variant)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={15} /> Filtrar muro:
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`m3-btn ${filterType === 'ALL' ? 'm3-btn-primary' : 'm3-btn-outline'}`}
              onClick={() => setFilterType('ALL')}
              style={{ height: '30px', fontSize: '0.78rem', padding: '0 12px' }}
            >
              Todos ({counts.all})
            </button>
            <button
              type="button"
              className={`m3-btn ${filterType === 'IMPORTANT' ? 'm3-btn-primary' : 'm3-btn-outline'}`}
              onClick={() => setFilterType('IMPORTANT')}
              style={{
                height: '30px',
                fontSize: '0.78rem',
                padding: '0 12px',
                borderColor: filterType === 'IMPORTANT' ? undefined : '#f59e0b',
                color: filterType === 'IMPORTANT' ? undefined : '#d97706'
              }}
            >
              ⭐ Importantes ({counts.important})
            </button>
            {canSeeDireccion && (
              <button
                type="button"
                className={`m3-btn ${filterType === 'DIRECCION' ? 'm3-btn-primary' : 'm3-btn-outline'}`}
                onClick={() => setFilterType('DIRECCION')}
                style={{
                  height: '30px',
                  fontSize: '0.78rem',
                  padding: '0 12px',
                  borderColor: filterType === 'DIRECCION' ? undefined : '#007aff',
                  color: filterType === 'DIRECCION' ? undefined : '#007aff'
                }}
              >
                📢 Dirección ({counts.direccion})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Comments List */}
      {commentsLoading ? (
        <span>Cargando comentarios...</span>
      ) : comments.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--md-sys-color-outline)', padding: '24px 0', fontStyle: 'italic' }}>
          No hay comentarios registrados en este proyecto.
        </p>
      ) : filteredComments.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--md-sys-color-outline)', padding: '24px 0', fontStyle: 'italic' }}>
          No hay comentarios que coincidan con el filtro seleccionado.
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
                  backgroundColor: c.para_direccion 
                    ? 'rgba(10, 132, 255, 0.08)' 
                    : (c.es_importante ? 'rgba(245, 158, 11, 0.08)' : 'var(--md-sys-color-surface-container)'), 
                  borderLeft: c.para_direccion 
                    ? '4px solid #007aff' 
                    : (c.es_importante ? '4px solid #f59e0b' : '4px solid var(--md-sys-color-outline-variant)'),
                  borderRadius: '0 16px 16px 0',
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
                          <span style={{ color: '#f59e0b', fontWeight: 600 }}>Importante</span>
                        </label>
                        {canSeeDireccion && (
                          <label className="m3-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={editingCommentDireccion}
                              onChange={(e) => setEditingCommentDireccion(e.target.checked)}
                              className="m3-checkbox"
                            />
                            <span style={{ color: 'var(--md-sys-color-primary)', fontWeight: 600 }}>Para dirección</span>
                          </label>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="m3-btn m3-btn-outline" onClick={() => setEditingCommentId(null)} style={{ height: '32px', fontSize: '0.8rem' }}>
                          Cancelar
                        </button>
                        <button className="m3-btn m3-btn-primary" onClick={() => handleUpdateComment(c.id_comentario)} style={{ height: '32px', fontSize: '0.8rem' }}>
                          Guardar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.9rem' }}>{c.Autor?.nombre} {c.Autor?.apellidos}</strong>
                        {c.es_importante && (
                          <span style={{ fontSize: '0.7rem', backgroundColor: '#ffe0b2', color: '#e65100', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Star size={10} fill="#e65100" /> IMPORTANTE
                          </span>
                        )}
                        {c.para_direccion && (
                          <span style={{ fontSize: '0.7rem', backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Star size={10} fill="var(--md-sys-color-primary)" /> DIRECCIÓN
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
                        Editado por {c.Editor?.nombre} {c.Editor?.apellidos} el {formatDateTime(c.fecha_modificacion)}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12, borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: 8 }}>
                      <button 
                        className="icon-btn" 
                        onClick={() => {
                          setEditingCommentId(c.id_comentario);
                          setEditingCommentText(c.texto_comentario);
                          setEditingCommentImportant(c.es_importante);
                          setEditingCommentDireccion(c.para_direccion || false);
                        }}
                        title="Editar comentario"
                      >
                        <Edit2 size={12} /> <span style={{ fontSize: '0.75rem', marginLeft: 4 }}>Editar</span>
                      </button>
                      <button 
                        className="icon-btn" 
                        onClick={() => handleDeleteComment(c.id_comentario)}
                        title="Eliminar comentario"
                        style={{ color: 'var(--color-rag-red)' }}
                      >
                        <Trash2 size={12} /> <span style={{ fontSize: '0.75rem', marginLeft: 4 }}>Eliminar</span>
                      </button>
                    </div>
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

