import React, { useState, useEffect } from 'react';
import { RefreshCw, Star } from 'lucide-react';
import RichTextEditor from '../RichTextEditor';

export default function QuickCommentModal({ isOpen, onClose, projectId, getAuthHeaders, onSuccess, canSeeDireccion }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [esImportante, setEsImportante] = useState(false);
  const [paraDireccion, setParaDireccion] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      setLoading(true);
      fetch(`${import.meta.env.VITE_API_URL}/projects/${projectId}/comments`, {
        headers: getAuthHeaders()
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            // Pre-load the last chronological comment
            const last = data[0];
            setCommentText(last.texto_comentario || '');
            setEsImportante(last.es_importante || false);
            setParaDireccion(last.para_direccion || false);
          } else {
            setCommentText('');
            setEsImportante(false);
            setParaDireccion(false);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching last comment:', err);
          setLoading(false);
        });
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!commentText || commentText.trim() === '' || commentText === '<br>') {
      alert('El comentario no puede estar vacío.');
      return;
    }
    setSaving(true);
    fetch(`${import.meta.env.VITE_API_URL}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        id_proyecto: projectId,
        texto_comentario: commentText,
        es_importante: esImportante,
        para_direccion: canSeeDireccion ? paraDireccion : false
      })
    })
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Error al guardar el comentario');
        return d;
      })
      .then(() => {
        if (onSuccess) onSuccess();
        onClose();
      })
      .catch(err => alert(err.message))
      .finally(() => setSaving(false));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Actualizar Estado (Seguimiento Rápido)</h3>
          <button className="icon-btn" onClick={onClose} disabled={saving}>✕</button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: 16 }}>
            <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--md-sys-color-primary)' }} />
            <span>Precargando última actualización...</span>
          </div>
        ) : (
          <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.85rem' }}>
              Modifique la actualización del proyecto <strong>{projectId}</strong>. Se guardará como un nuevo comentario cronológico en el muro.
            </p>

            <RichTextEditor 
              value={commentText}
              onChange={setCommentText}
              placeholder="Escribe la actualización semanal..."
            />

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 8 }}>
              <label className="m3-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={esImportante} 
                  onChange={(e) => setEsImportante(e.target.checked)}
                  disabled={saving}
                  className="m3-checkbox"
                />
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--priority-alta)', fontWeight: 600 }}>
                  <Star size={14} fill={esImportante ? 'var(--priority-alta)' : 'none'} /> Importante (Muro / PDF)
                </span>
              </label>

              {canSeeDireccion && (
                <label className="m3-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={paraDireccion} 
                    onChange={(e) => setParaDireccion(e.target.checked)}
                    disabled={saving}
                    className="m3-checkbox"
                  />
                  <span style={{ color: 'var(--md-sys-color-primary)', fontWeight: 600 }}>
                    📢 Para dirección
                  </span>
                </label>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
          <button 
            type="button" 
            className="m3-btn m3-btn-outline" 
            onClick={onClose} 
            disabled={saving}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            className="m3-btn m3-btn-primary" 
            onClick={handleSave}
            disabled={loading || saving}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {saving && <RefreshCw className="animate-spin" size={16} />}
            {saving ? 'Publicando...' : 'Publicar Actualización'}
          </button>
        </div>
      </div>
    </div>
  );
}
