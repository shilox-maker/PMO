import React from 'react';
import { CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react';

export default function AutoSaveStatus({ status, lastSavedTime }) {
  if (!status || status === 'idle') return null;

  const formatTime = (time) => {
    if (!time) return '';
    if (typeof time === 'string') return time;
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          color: 'var(--md-sys-color-primary, #0a84ff)',
          bg: 'rgba(10, 132, 255, 0.12)',
          icon: <RefreshCw size={12} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />,
          text: 'Guardando...'
        };
      case 'unsaved':
        return {
          color: 'var(--md-sys-color-warning, #ff9f0a)',
          bg: 'rgba(255, 159, 10, 0.12)',
          icon: <Clock size={12} />,
          text: 'Cambios sin guardar'
        };
      case 'saved':
        return {
          color: 'var(--md-sys-color-success, #30d158)',
          bg: 'rgba(48, 209, 88, 0.12)',
          icon: <CheckCircle2 size={12} />,
          text: lastSavedTime ? `Último guardado: ${formatTime(lastSavedTime)}` : 'Guardado'
        };
      case 'error':
        return {
          color: 'var(--md-sys-color-error, #ff453a)',
          bg: 'rgba(255, 69, 58, 0.12)',
          icon: <AlertCircle size={12} />,
          text: 'Error al guardar'
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '3px 8px',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: 500,
      color: config.color,
      backgroundColor: config.bg,
      border: `1px solid ${config.color}33`,
      transition: 'all 0.2s ease-in-out',
      whiteSpace: 'nowrap'
    }}>
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
}
