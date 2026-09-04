import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Building, Phone, Mail, User, Plus, Trash2, Edit2, Check, X, Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function VendorContactCard({ 
  vendor, 
  contacts, 
  onAddContact, 
  onEditContact, 
  onDeleteContact,
  onSaveVendor 
}) {
  const { t } = useTranslation();
  const { canWrite } = useAuth();
  
  // Inline general info editing state
  const [isEditingGeneral, setIsEditingGeneral] = useState(false);
  const [generalForm, setGeneralForm] = useState({
    nombre_razon_social: '',
    telefono_general: '',
    email_general: '',
    es_grupo_dacsa: false
  });
  const [generalError, setGeneralError] = useState('');
  const [savingGeneral, setSavingGeneral] = useState(false);

  useEffect(() => {
    if (vendor) {
      setGeneralForm({
        nombre_razon_social: vendor.nombre_razon_social || '',
        telefono_general: vendor.telefono_general || '',
        email_general: vendor.email_general || '',
        es_grupo_dacsa: !!vendor.es_grupo_dacsa
      });
      setIsEditingGeneral(false);
      setGeneralError('');
    }
  }, [vendor]);

  const handleStartEdit = () => {
    setGeneralForm({
      nombre_razon_social: vendor.nombre_razon_social || '',
      telefono_general: vendor.telefono_general || '',
      email_general: vendor.email_general || '',
      es_grupo_dacsa: !!vendor.es_grupo_dacsa
    });
    setGeneralError('');
    setIsEditingGeneral(true);
  };

  const handleCancelEdit = () => {
    setIsEditingGeneral(false);
    setGeneralError('');
  };

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!generalForm.nombre_razon_social.trim()) {
      setGeneralError(t('vendor360.nameRequired'));
      return;
    }

    try {
      setSavingGeneral(true);
      await onSaveVendor(generalForm);
      setIsEditingGeneral(false);
    } catch (err) {
      setGeneralError(err.message || 'Error al guardar');
    } finally {
      setSavingGeneral(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Vendor profile details */}
      <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="metric-icon-wrapper" style={{ width: 44, height: 44 }}>
              <Building size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>{t('vendorDirectory.generalInfo')}</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>#{vendor.id_proveedor}</span>
            </div>
          </div>
          
          {!isEditingGeneral && canWrite && (
            <button 
              className="icon-btn"
              onClick={handleStartEdit}
              title={t('vendor360.editGeneralInfo')}
              style={{ color: 'var(--md-sys-color-primary)', width: 36, height: 36 }}
            >
              <Edit2 size={16} />
            </button>
          )}
        </div>

        {generalError && (
          <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 10, borderRadius: 8, fontSize: '0.85rem' }}>
            {generalError}
          </div>
        )}

        {isEditingGeneral ? (
          <form onSubmit={handleSaveGeneral} style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>{t('vendor360.companyName')} *</label>
              <input 
                type="text" 
                value={generalForm.nombre_razon_social}
                onChange={(e) => setGeneralForm({ ...generalForm, nombre_razon_social: e.target.value })}
                required
                className="m3-input"
                style={{ height: '36px', fontSize: '0.85rem' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>{t('vendorDirectory.generalPhone')}</label>
              <input 
                type="text" 
                value={generalForm.telefono_general}
                onChange={(e) => setGeneralForm({ ...generalForm, telefono_general: e.target.value })}
                placeholder="Ej: 960000000"
                className="m3-input"
                style={{ height: '36px', fontSize: '0.85rem' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>{t('vendorDirectory.email')}</label>
              <input 
                type="email" 
                value={generalForm.email_general}
                onChange={(e) => setGeneralForm({ ...generalForm, email_general: e.target.value })}
                placeholder="contacto@partner.com"
                className="m3-input"
                style={{ height: '36px', fontSize: '0.85rem' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="m3-checkbox-label" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={generalForm.es_grupo_dacsa}
                  onChange={(e) => setGeneralForm({ ...generalForm, es_grupo_dacsa: e.target.checked })}
                  className="m3-checkbox"
                />
                <span style={{ fontWeight: 500 }}>{t('vendor360.isDacsaGroup')}</span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button 
                type="button" 
                className="m3-btn m3-btn-outline" 
                onClick={handleCancelEdit}
                disabled={savingGeneral}
                style={{ height: '32px', fontSize: '0.8rem', padding: '0 12px' }}
              >
                <X size={14} style={{ marginRight: 4 }} />
                {t('common.cancel')}
              </button>
              <button 
                type="submit" 
                className="m3-btn m3-btn-primary" 
                disabled={savingGeneral}
                style={{ height: '32px', fontSize: '0.8rem', padding: '0 12px' }}
              >
                <Check size={14} style={{ marginRight: 4 }} />
                {savingGeneral ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.9rem' }}>
              <Phone size={16} style={{ color: 'var(--md-sys-color-outline)' }} />
              <span>{t('vendorDirectory.phone')} {vendor.telefono_general || t('vendorDirectory.notRegistered')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.9rem' }}>
              <Mail size={16} style={{ color: 'var(--md-sys-color-outline)' }} />
              <span>{t('vendorDirectory.email')} {vendor.email_general || t('vendorDirectory.notRegistered')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              {vendor.es_grupo_dacsa ? (
                <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--md-sys-color-primary)', color: '#fff', padding: '3px 8px', borderRadius: 100, fontWeight: 600 }}>
                  Dacsa Group
                </span>
              ) : (
                <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>
                  {t('vendor360.partnerFile')}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Contact Sub-table (Proveedores.Contactos_Proveedor) */}
      <div className="m3-card glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <User style={{ color: 'var(--md-sys-color-primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{t('vendorDirectory.contactsCount', { count: contacts?.length || 0 })}</h3>
          </div>
          {canWrite && (
            <button 
              className="icon-btn" 
              onClick={onAddContact}
              title={t('vendor360.addContact')}
              style={{ color: 'var(--md-sys-color-primary)' }}
            >
              <Plus size={20} />
            </button>
          )}
        </div>

        {contacts?.length === 0 ? (
          <p style={{ color: 'var(--md-sys-color-outline)', fontSize: '0.85rem' }}>{t('vendorDirectory.noContacts')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {contacts.map(c => (
              <div key={c.id_contacto} style={{ padding: 12, backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: '12px', border: '1px solid var(--md-sys-color-outline-variant)', position: 'relative' }}>
                {canWrite && (
                  <div style={{ position: 'absolute', right: 8, top: 8, display: 'flex', gap: 4 }}>
                    <button 
                      className="icon-btn" 
                      onClick={() => onEditContact(c)}
                      title={t('vendor360.editContact')}
                      style={{ width: 28, height: 28, color: 'var(--md-sys-color-primary)' }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button 
                      className="icon-btn" 
                      onClick={() => onDeleteContact(c.id_contacto)}
                      title={t('common.delete')}
                      style={{ width: 28, height: 28, color: 'var(--color-rag-red)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
                <div style={{ fontWeight: 600, fontSize: '0.9rem', width: '75%' }}>{c.nombre} {c.apellidos}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-primary)', fontWeight: 500, marginBottom: 8 }}>{c.puesto}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={10} /> {c.telefono}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={10} /> {c.email}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

