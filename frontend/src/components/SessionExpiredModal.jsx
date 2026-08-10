import React from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { LogOut, AlertTriangle } from 'lucide-react';

const SessionExpiredModal = () => {
  const { isSessionExpired, logout } = useAuth();
  const { t } = useTranslation();

  if (!isSessionExpired) return null;

  const handleLoginClick = () => {
    logout();
    window.location.href = '/';
  };

  return createPortal(
    <div className="modal-overlay" style={{ zIndex: 999999 }}>
      <div 
        className="modal-content glass-panel" 
        style={{ maxWidth: 440, padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
      >
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 149, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-rag-amber, #ff9500)'
        }}>
          <AlertTriangle size={32} />
        </div>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 600, margin: 0, color: 'var(--md-sys-color-on-surface)' }}>
          {t('auth.sessionExpiredTitle', 'Sesión Expirada')}
        </h2>

        <p style={{ fontSize: '0.9rem', color: 'var(--md-sys-color-on-surface-variant)', lineHeight: 1.5, margin: 0 }}>
          {t('auth.sessionExpiredMessage', 'Tu sesión ha caducado o el token de acceso ya no es válido. Por favor, vuelve a iniciar sesión para continuar.')}
        </p>

        <button
          onClick={handleLoginClick}
          className="m3-btn m3-btn-primary"
          style={{
            marginTop: 8,
            width: '100%',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontWeight: 600
          }}
        >
          <LogOut size={18} />
          {t('auth.relogin', 'Iniciar Sesión')}
        </button>
      </div>
    </div>,
    document.body
  );
};

export default SessionExpiredModal;
