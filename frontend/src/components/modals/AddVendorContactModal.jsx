import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function AddVendorContactModal({ isOpen, vendorId, contact, getAuthHeaders, onClose, onSuccess }) {
  const { t } = useTranslation();
  const isEdit = !!contact;

  const [contactForm, setContactForm] = useState({
    nombre: '',
    apellidos: '',
    puesto: '',
    telefono: '',
    email: ''
  });
  const [contactError, setContactError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (contact) {
        setContactForm({
          nombre: contact.nombre || '',
          apellidos: contact.apellidos || '',
          puesto: contact.puesto || '',
          telefono: contact.telefono || '',
          email: contact.email || ''
        });
      } else {
        setContactForm({ nombre: '', apellidos: '', puesto: '', telefono: '', email: '' });
      }
      setContactError('');
    }
  }, [isOpen, contact]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setContactError('');

    if (!contactForm.nombre.trim() || !contactForm.apellidos.trim() || !contactForm.puesto.trim() || !contactForm.telefono.trim() || !contactForm.email.trim()) {
      setContactError(t('vendor360.allFieldsRequired'));
      return;
    }

    setSaving(true);
    const url = isEdit 
      ? `${import.meta.env.VITE_API_URL}/contacts/${contact.id_contacto}`
      : `${import.meta.env.VITE_API_URL}/contacts`;
    const method = isEdit ? 'PUT' : 'POST';

    const payload = isEdit
      ? contactForm
      : { ...contactForm, id_proveedor: parseInt(vendorId, 10) };

    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || (isEdit ? 'Error al actualizar contacto' : 'Error al agregar contacto'));
        return d;
      })
      .then(() => {
        setSaving(false);
        onSuccess();
        onClose();
      })
      .catch(err => {
        setSaving(false);
        setContactError(err.message);
      });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? t('vendor360.editContact') : t('vendor360.addContact')}</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {contactError && (
          <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>
            {contactError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('vendor360.firstName')} *</label>
            <input 
              type="text" 
              value={contactForm.nombre}
              onChange={(e) => setContactForm({ ...contactForm, nombre: e.target.value })}
              placeholder="Carlos"
              required
              className="m3-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('vendor360.lastName')} *</label>
            <input 
              type="text" 
              value={contactForm.apellidos}
              onChange={(e) => setContactForm({ ...contactForm, apellidos: e.target.value })}
              placeholder="Pérez"
              required
              className="m3-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('vendor360.position')} *</label>
            <input 
              type="text" 
              value={contactForm.puesto}
              onChange={(e) => setContactForm({ ...contactForm, puesto: e.target.value })}
              placeholder="Director de Delivery"
              required
              className="m3-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('vendor360.technicalPhone')} *</label>
            <input 
              type="text" 
              value={contactForm.telefono}
              onChange={(e) => setContactForm({ ...contactForm, telefono: e.target.value })}
              placeholder="600123456"
              required
              className="m3-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('vendor360.officialEmail')} *</label>
            <input 
              type="email" 
              value={contactForm.email}
              onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
              placeholder="cperez@partner.com"
              required
              className="m3-input"
            />
          </div>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="m3-btn m3-btn-outline" onClick={onClose} disabled={saving}>
              {t('vendor360.cancel')}
            </button>
            <button type="submit" className="m3-btn m3-btn-primary" disabled={saving}>
              {saving ? t('vendor360.saveChanges') : (isEdit ? t('vendor360.saveChanges') : t('vendor360.addContact'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

