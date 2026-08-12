import React from 'react';
import { createPortal } from 'react-dom';
import { Bell, ChevronLeft } from 'lucide-react';

export default function PendingAssistantTrigger({ isOpen, toggleOpen, totalPendingCount, t }) {
  if (isOpen) return null;

  return createPortal(
    <button
      id="btn-pending-assistant-trigger"
      onClick={toggleOpen}
      title={t('assistant.tooltip', 'Tareas y comunicaciones pendientes')}
      aria-label={t('assistant.title', 'Asistente de Pendientes')}
      className="pending-assistant-trigger-btn"
    >
      <Bell size={18} style={{ color: 'var(--md-sys-color-primary)' }} />
      <span>{t('assistant.title', 'Pendientes')}</span>
      {totalPendingCount > 0 && (
        <span className="pending-assistant-badge-count">
          {totalPendingCount > 99 ? '99+' : totalPendingCount}
        </span>
      )}
      <ChevronLeft size={16} style={{ opacity: 0.7 }} />
    </button>,
    document.body
  );
}
