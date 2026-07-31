import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Save, RefreshCw, AlertTriangle, Power } from 'lucide-react';

export default function MaintenanceConfigCard({ getAuthHeaders, onStatusChange }) {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/maintenance`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setMaintenanceMode(data.maintenance_mode);
        setMaintenanceMessage(data.maintenance_message || '');
        if (onStatusChange) onStatusChange(data.maintenance_mode);
      }
    } catch (err) {
      console.error('Error al cargar configuración de mantenimiento:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/maintenance`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          maintenance_mode: maintenanceMode,
          maintenance_message: maintenanceMessage
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMaintenanceMode(data.maintenance_mode);
        setMaintenanceMessage(data.maintenance_message);
        setFeedback({ type: 'success', text: data.message });
        if (onStatusChange) onStatusChange(data.maintenance_mode);
      } else {
        setFeedback({ type: 'error', text: data.error || 'Error al guardar.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Error de conexión con el servidor.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: 32, textAlign: 'center', color: 'var(--md-sys-color-outline)' }}>
        <RefreshCw size={28} className="animate-spin" style={{ marginBottom: 12, color: 'var(--md-sys-color-primary)' }} />
        <div>Cargando estado de mantenimiento...</div>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ padding: 28, maxWidth: 840, margin: '0 auto', borderRadius: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: maintenanceMode
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(220, 38, 38, 0.15))'
            : 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.15))',
          border: `1px solid ${maintenanceMode ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: maintenanceMode ? '#ef4444' : '#10b981',
          flexShrink: 0
        }}>
          {maintenanceMode ? <ShieldAlert size={26} /> : <ShieldCheck size={26} />}
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Gestión del Modo Mantenimiento</h3>
          <p style={{ margin: '4px 0 0', color: 'var(--md-sys-color-outline)', fontSize: '0.88rem' }}>
            Control de disponibilidad global de la plataforma PMO Control Tower.
          </p>
        </div>
      </div>

      {feedback && (
        <div style={{
          padding: '14px 18px',
          borderRadius: 12,
          marginBottom: 24,
          background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: feedback.type === 'success' ? '#10b981' : '#ef4444',
          fontSize: '0.9rem',
          fontWeight: 500
        }}>
          {feedback.text}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Interactive Mode Card Selector */}
        <div style={{
          padding: 20,
          borderRadius: 16,
          background: maintenanceMode
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.03))'
            : 'var(--md-sys-color-surface-container-low, rgba(255,255,255,0.03))',
          border: `1px solid ${maintenanceMode ? 'rgba(239, 68, 68, 0.3)' : 'var(--md-sys-color-outline-variant, rgba(255,255,255,0.1))'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div>
            <div style={{
              fontWeight: 700,
              fontSize: '1.05rem',
              color: maintenanceMode ? '#ef4444' : 'var(--md-sys-color-on-surface)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <Power size={18} style={{ color: maintenanceMode ? '#ef4444' : '#10b981' }} />
              <span>{maintenanceMode ? 'Modo Mantenimiento ACTIVO' : 'Sistema Operativo (Normal)'}</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)', marginTop: 4 }}>
              {maintenanceMode
                ? 'Acceso bloqueado para usuarios estándar. Solo los administradores conservan acceso.'
                : 'Acceso habilitado para todos los usuarios autorizados de la plataforma.'}
            </div>
          </div>

          {/* Segmented Button Switcher */}
          <div style={{
            display: 'inline-flex',
            background: 'rgba(0,0,0,0.3)',
            padding: 4,
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <button
              type="button"
              onClick={() => setMaintenanceMode(false)}
              className="m3-btn"
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                fontSize: '0.85rem',
                fontWeight: 600,
                border: 'none',
                background: !maintenanceMode ? '#10b981' : 'transparent',
                color: !maintenanceMode ? '#ffffff' : 'var(--md-sys-color-outline)',
                boxShadow: !maintenanceMode ? '0 2px 8px rgba(16, 185, 129, 0.4)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <ShieldCheck size={16} />
              <span>Operativo</span>
            </button>
            <button
              type="button"
              onClick={() => setMaintenanceMode(true)}
              className="m3-btn"
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                fontSize: '0.85rem',
                fontWeight: 600,
                border: 'none',
                background: maintenanceMode ? '#ef4444' : 'transparent',
                color: maintenanceMode ? '#ffffff' : 'var(--md-sys-color-outline)',
                boxShadow: maintenanceMode ? '0 2px 8px rgba(239, 68, 68, 0.4)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <ShieldAlert size={16} />
              <span>Mantenimiento</span>
            </button>
          </div>
        </div>

        {/* Maintenance Message Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--md-sys-color-on-surface)' }}>
            Mensaje Informativo para Usuarios
          </label>
          <textarea
            value={maintenanceMessage}
            onChange={(e) => setMaintenanceMessage(e.target.value)}
            rows={4}
            placeholder="Mensaje a mostrar en la pantalla de aviso..."
            style={{
              width: '100%',
              padding: 14,
              borderRadius: 12,
              background: 'var(--md-sys-color-surface-container, rgba(255,255,255,0.04))',
              border: '1px solid var(--md-sys-color-outline-variant, rgba(255,255,255,0.12))',
              color: 'var(--md-sys-color-on-surface)',
              fontFamily: 'inherit',
              fontSize: '0.9rem',
              lineHeight: 1.5,
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Warning Note */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          borderRadius: 12,
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          color: '#f59e0b',
          fontSize: '0.85rem'
        }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>
            Al guardar con la opción Mantenimiento activa, todas las peticiones de usuarios no administradores responderán con bloqueo inmediato.
          </span>
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            type="submit"
            disabled={saving}
            className={`m3-btn ${maintenanceMode ? 'm3-btn-tonal' : 'm3-btn-primary'}`}
            style={{
              padding: '10px 28px',
              borderRadius: 12,
              fontWeight: 600,
              ...(maintenanceMode ? {
                backgroundColor: '#ef4444',
                color: '#ffffff'
              } : {})
            }}
          >
            {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
            <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
