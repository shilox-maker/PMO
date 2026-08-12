import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Building2, Globe, Check, ArrowRight } from 'lucide-react';

export const AmbitoSelectionModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { availableAmbitos, selectedAmbito, changeAmbito, canSelectAll } = useAuth();

  if (!isOpen) return null;

  const handleSelect = (ambitoId) => {
    changeAmbito(ambitoId);
    if (onClose) onClose();
  };

  return createPortal(
    <div className="modal-overlay" style={{ zIndex: 99999 }}>
      <div 
        className="modal-content glass-panel animate-fade-in" 
        style={{
          maxWidth: 520,
          width: '92%',
          padding: '28px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        {/* Header con icono destacado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(0, 150, 136, 0.2), rgba(0, 200, 83, 0.2))',
            border: '1px solid rgba(0, 200, 83, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--md-sys-color-primary, #00c853)'
          }}>
            <Building2 size={26} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--md-sys-color-on-surface, #fff)' }}>
              {t('ambitos.selectTitle', 'Seleccionar Ámbito de Trabajo')}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline, #a0a0a0)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
              {t('ambitos.selectDescription', 'Selecciona el departamento u ámbito operacional sobre el que deseas trabajar en esta sesión.')}
            </p>
          </div>
        </div>

        {/* Lista de Ámbitos Opciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
          {canSelectAll && (
            <button
              type="button"
              onClick={() => handleSelect('ALL')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: 12,
                border: selectedAmbito === 'ALL'
                  ? '2px solid var(--md-sys-color-primary, #00c853)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                background: selectedAmbito === 'ALL'
                  ? 'rgba(0, 200, 83, 0.12)'
                  : 'rgba(255, 255, 255, 0.03)',
                color: 'var(--md-sys-color-on-surface, #fff)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Globe size={22} style={{ color: selectedAmbito === 'ALL' ? 'var(--md-sys-color-primary, #00c853)' : '#888' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                    {t('ambitos.allAmbitos', 'Todos los Ámbitos (Vista Global)')}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: 2 }}>
                    {t('ambitos.allDescription', 'Acceso a la cartera consolidada de todos los departamentos.')}
                  </div>
                </div>
              </div>
              {selectedAmbito === 'ALL' && (
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: 'var(--md-sys-color-primary, #00c853)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000'
                }}>
                  <Check size={14} strokeWidth={3} />
                </div>
              )}
            </button>
          )}

          {availableAmbitos.map((amb) => {
            const isSelected = String(selectedAmbito) === String(amb.id_ambito);
            return (
              <button
                key={amb.id_ambito}
                type="button"
                onClick={() => handleSelect(amb.id_ambito)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: 12,
                  border: isSelected
                    ? '2px solid var(--md-sys-color-primary, #00c853)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  background: isSelected
                    ? 'rgba(0, 200, 83, 0.12)'
                    : 'rgba(255, 255, 255, 0.03)',
                  color: 'var(--md-sys-color-on-surface, #fff)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Building2 size={22} style={{ color: isSelected ? 'var(--md-sys-color-primary, #00c853)' : '#888' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                      {amb.nombre}
                    </div>
                    {amb.descripcion && (
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: 2 }}>
                        {amb.descripcion}
                      </div>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: 'var(--md-sys-color-primary, #00c853)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000'
                  }}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Botón de Confirmación */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <button
            type="button"
            className="m3-btn m3-btn-primary"
            onClick={onClose}
            style={{
              padding: '10px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 600,
              borderRadius: 10
            }}
          >
            <span>{t('common.continue', 'Continuar')}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AmbitoSelectionModal;
