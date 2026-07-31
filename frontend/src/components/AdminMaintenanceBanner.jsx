import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function AdminMaintenanceBanner() {
  return (
    <div style={{
      background: 'linear-gradient(90deg, #ef4444, #dc2626)',
      color: '#ffffff',
      padding: '8px 16px',
      fontSize: '0.88rem',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
      zIndex: 9999,
      position: 'relative'
    }}>
      <ShieldAlert size={18} />
      <span>
        MODO MANTENIMIENTO ACTIVO: La plataforma se encuentra actualmente bloqueada para usuarios no administradores.
      </span>
    </div>
  );
}
