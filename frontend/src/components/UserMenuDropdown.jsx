import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  Globe, Moon, Building2, Key, LogOut, ChevronUp, ChevronDown, Check, User
} from 'lucide-react';

export default function UserMenuDropdown({
  currentPm,
  logout,
  theme,
  toggleTheme,
  language,
  changeLanguage,
  onChangePasswordClick,
  isCollapsed = false
}) {
  const { t } = useTranslation();
  const { selectedAmbito, changeAmbito, availableAmbitos, canSelectAll } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentPm) return null;

  const initials = `${currentPm.nombre?.[0] || ''}${currentPm.apellidos?.[0] || ''}`;

  return (
    <div className={`user-menu-dropdown-container ${isCollapsed ? 'collapsed' : ''}`} ref={dropdownRef}>
      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div className={`user-menu-popover ${isCollapsed ? 'popover-collapsed' : 'popover-expanded'}`}>
          {/* Header only shown when collapsed so user knows identity in flyout */}
          {isCollapsed && (
            <>
              <div className="user-menu-header-compact">
                <div className="user-avatar-compact">{initials}</div>
                <div className="user-menu-details-compact">
                  <div className="user-menu-name-compact">{currentPm.nombre} {currentPm.apellidos}</div>
                  <div className="user-menu-role-compact">{currentPm.perfil}</div>
                </div>
              </div>
              <div className="user-menu-divider" />
            </>
          )}

          {/* Submenu Item: Idioma / Language */}
          <div className="user-menu-section">
            <div className="user-menu-section-title">
              <Globe size={14} />
              <span>{t('user.language')}</span>
            </div>
            <div className="user-menu-lang-selector">
              <button
                type="button"
                className={`lang-pill ${language === 'es' ? 'active' : ''}`}
                onClick={() => changeLanguage('es')}
              >
                ES {language === 'es' && <Check size={12} />}
              </button>
              <button
                type="button"
                className={`lang-pill ${language === 'en' ? 'active' : ''}`}
                onClick={() => changeLanguage('en')}
              >
                EN {language === 'en' && <Check size={12} />}
              </button>
              <button
                type="button"
                className={`lang-pill ${language === 'pt' ? 'active' : ''}`}
                onClick={() => changeLanguage('pt')}
              >
                PT {language === 'pt' && <Check size={12} />}
              </button>
            </div>
          </div>

          <div className="user-menu-divider" />

          {/* Submenu Item: Ámbito Activo */}
          <div className="user-menu-section">
            <div className="user-menu-section-title">
              <Building2 size={14} />
              <span>{t('ambitos.currentScope', 'Ámbito Activo')}</span>
            </div>
            {(() => {
              const ambitosList = (availableAmbitos && availableAmbitos.length > 0)
                ? availableAmbitos
                : (currentPm?.Ambitos || []);
              return (
                <select
                  className="form-select form-select-sm mt-1 text-dark bg-white border"
                  value={String(selectedAmbito || '')}
                  onChange={(e) => changeAmbito(e.target.value)}
                  style={{
                    fontSize: '0.85rem',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    color: '#1e293b',
                    fontWeight: '600',
                    border: '1px solid #cbd5e1'
                  }}
                >
                  {canSelectAll && ['ADMINISTRADOR', 'DIRECTOR'].includes(currentPm?.perfil) && (
                    <option value="ALL" style={{ color: '#1e293b', backgroundColor: '#ffffff', fontWeight: '600' }}>🌐 {t('ambitos.allAmbitos', 'Todos los Ámbitos')}</option>
                  )}
                  {ambitosList.map(amb => (
                    <option key={amb.id_ambito} value={String(amb.id_ambito)} style={{ color: '#1e293b', backgroundColor: '#ffffff', fontWeight: '600' }}>
                      🏛️ {amb.nombre}
                    </option>
                  ))}
                </select>
              );
            })()}
          </div>

          <div className="user-menu-divider" />

          {/* Submenu Item: Tema */}
          <button
            type="button"
            className="user-menu-item"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Moon size={16} /> : <Building2 size={16} />}
            <span>{theme === 'dark' ? t('user.themeDark') : t('user.themeDacsa')}</span>
          </button>

          {/* Submenu Item: Cambiar contraseña */}
          <button
            type="button"
            className="user-menu-item"
            onClick={() => {
              setIsOpen(false);
              onChangePasswordClick();
            }}
          >
            <Key size={16} />
            <span>{t('user.changePassword')}</span>
          </button>

          <div className="user-menu-divider" />

          {/* Submenu Item: Logout */}
          <button
            type="button"
            className="user-menu-item logout-item"
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
          >
            <LogOut size={16} />
            <span>{t('user.logout')}</span>
          </button>
        </div>
      )}

      {/* Profile Trigger Button Card */}
      <button
        type="button"
        className={`user-profile-trigger-card ${isOpen ? 'open' : ''} ${isCollapsed ? 'card-collapsed' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title={`${currentPm.nombre} ${currentPm.apellidos} (${currentPm.perfil})`}
      >
        <div className="user-avatar-trigger">
          {initials}
        </div>
        {!isCollapsed && (
          <>
            <div className="user-trigger-info">
              <div className="user-trigger-name">
                {currentPm.nombre} {currentPm.apellidos}
              </div>
              <div className="user-trigger-role">
                {currentPm.perfil}
              </div>
            </div>
            <div className="user-trigger-chevron">
              {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </div>
          </>
        )}
      </button>
    </div>
  );
}
