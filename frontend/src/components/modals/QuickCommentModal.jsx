import React, { useState, useEffect } from 'react';
import { RefreshCw, Star, ShieldAlert, MessageSquare } from 'lucide-react';
import RichTextEditor from '../RichTextEditor';

export default function QuickCommentModal({ isOpen, onClose, projectId, getAuthHeaders, onSuccess, canSeeDireccion }) {
  const [targetWall, setTargetWall] = useState('OPERATIVO'); // 'OPERATIVO' | 'DIRECCION'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [esImportante, setEsImportante] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      setLoading(true);
      setTargetWall('OPERATIVO');
      const endpoint = `${import.meta.env.VITE_API_URL}/projects/${projectId}/comments`;

      fetch(endpoint, { headers: getAuthHeaders() })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            const lastImportant = data.find(c => c.es_importante);
            if (lastImportant) {
              setCommentText(lastImportant.texto_comentario || '');
              setEsImportante(true);
            } else {
              setCommentText('');
              setEsImportante(false);
            }
          } else {
            setCommentText('');
            setEsImportante(false);
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
    const postEndpoint = (canSeeDireccion && targetWall === 'DIRECCION')
      ? `${import.meta.env.VITE_API_URL}/direction-comments`
      : `${import.meta.env.VITE_API_URL}/comments`;

    fetch(postEndpoint, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        id_proyecto: projectId,
        texto_comentario: commentText,
        es_importante: esImportante
      })
    })
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Error al guardar la actualización');
        return d;
      })
      .then(() => {
        if (onSuccess) onSuccess();
        onClose();
      })
      .catch(err => alert(err.message))
      .finally(() => setSaving(false));
  };

  const isDirection = canSeeDireccion && targetWall === 'DIRECCION';

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Actualizar Estado (Seguimiento Rápido)</h3>
          <button className="icon-btn" onClick={onClose} disabled={saving}>✕</button>
        </div>

        {/* Selector de Muro Destino para Dirección */}
        {canSeeDireccion && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 4, paddingBottom: 12, borderBottom: '1px solid var(--md-sys-color-outline-variant)' }}>
            <button
              type="button"
              className={`m3-btn ${targetWall === 'OPERATIVO' ? 'm3-btn-primary' : 'm3-btn-outline'}`}
              onClick={() => setTargetWall('OPERATIVO')}
              style={{ fontSize: '0.8rem', height: '32px', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <MessageSquare size={14} /> Muro Operativo (PM)
            </button>
            <button
              type="button"
              className={`m3-btn ${targetWall === 'DIRECCION' ? 'm3-btn-primary' : 'm3-btn-outline'}`}
              onClick={() => setTargetWall('DIRECCION')}
              style={{ 
                fontSize: '0.8rem', 
                height: '32px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6,
                background: targetWall === 'DIRECCION' ? '#007aff' : undefined,
                borderColor: '#007aff',
                color: targetWall === 'DIRECCION' ? '#fff' : '#007aff'
              }}
            >
              <ShieldAlert size={14} /> Muro de Dirección (Privado)
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: 16 }}>
            <RefreshCw className="animate-spin" size={24} style={{ color: isDirection ? '#007aff' : 'var(--md-sys-color-primary)' }} />
            <span>Precargando última actualización de {isDirection ? 'Dirección' : 'Proyecto'}...</span>
          </div>
        ) : (
          <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.85rem' }}>
              Modifique la actualización del proyecto <strong>{projectId}</strong> en el <strong>{isDirection ? 'Muro de Dirección' : 'Muro Operativo'}</strong>. Se guardará como un nuevo apunte cronológico.
            </p>

            <RichTextEditor 
              value={commentText}
              onChange={setCommentText}
              placeholder={isDirection ? "Escribe la nota estratégica de dirección..." : "Escribe la actualización semanal..."}
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
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: isDirection ? '#007aff' : 'var(--priority-alta)', fontWeight: 600 }}>
                  <Star size={14} fill={esImportante ? (isDirection ? '#007aff' : 'var(--priority-alta)') : 'none'} color={isDirection ? '#007aff' : undefined} /> {isDirection ? 'Clave para informe de Dirección' : 'Importante (Muro / PDF)'}
                </span>
              </label>
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
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              background: isDirection ? '#007aff' : undefined,
              borderColor: isDirection ? '#007aff' : undefined
            }}
          >
            {saving && <RefreshCw className="animate-spin" size={16} />}
            {saving ? 'Publicando...' : (isDirection ? 'Publicar Nota de Dirección' : 'Publicar Actualización')}
          </button>
        </div>
      </div>
    </div>
  );
}

