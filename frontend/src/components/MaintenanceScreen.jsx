import React from 'react';
import { Wrench, RefreshCw, LogOut } from 'lucide-react';

export default function MaintenanceScreen({ message, onCheckStatus, onLogout }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--md-sys-color-background, #0f172a)',
      color: 'var(--md-sys-color-on-background, #f8fafc)',
      padding: 24,
      boxSizing: 'border-box'
    }}>
      <div className="glass-panel" style={{
        maxWidth: 540,
        width: '100%',
        padding: 40,
        textAlign: 'center',
        borderRadius: 24,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
      }}>
        <div style={{
          width: 80,
          height: 80,
          margin: '0 auto 24px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(245, 158, 11, 0.2))',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#f59e0b'
        }}>
          <Wrench size={40} />
        </div>

        <h1 style={{ margin: '0 0 12px', fontSize: '1.75rem', fontWeight: 700 }}>
          Plataforma en Mantenimiento
        </h1>

        <p style={{
          fontSize: '0.95rem',
          lineHeight: 1.6,
          color: 'var(--md-sys-color-outline, #94a3b8)',
          margin: '0 0 32px',
          padding: '16px 20px',
          borderRadius: 14,
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {message || 'Estamos realizando tareas de mantenimiento programado. Por favor, vuelva a intentarlo más tarde.'}
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {onCheckStatus && (
            <button
              onClick={onCheckStatus}
              className="m3-btn m3-btn-primary"
              style={{
                padding: '12px 24px',
                borderRadius: 14
              }}
            >
              <RefreshCw size={18} />
              <span>Comprobar Estado</span>
            </button>
          )}

          {onLogout && (
            <button
              onClick={onLogout}
              className="m3-btn m3-btn-tonal"
              style={{
                padding: '12px 20px',
                borderRadius: 14
              }}
            >
              <LogOut size={18} />
              <span>Cerrar Sesión</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
