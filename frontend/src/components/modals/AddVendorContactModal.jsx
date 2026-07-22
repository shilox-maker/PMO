import React, { useState, useEffect } from 'react';

export default function AddVendorContactModal({ isOpen, vendorId, getAuthHeaders, onClose, onSuccess }) {
  const [newContact, setNewContact] = useState({
    nombre: '',
    apellidos: '',
    puesto: '',
    telefono: '',
    email: ''
  });
  const [contactError, setContactError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNewContact({ nombre: '', apellidos: '', puesto: '', telefono: '', email: '' });
      setContactError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddContact = (e) => {
    e.preventDefault();
    setContactError('');

    if (!newContact.nombre || !newContact.apellidos || !newContact.puesto || !newContact.telefono || !newContact.email) {
      setContactError('Todos los campos son obligatorios.');
      return;
    }

    const payload = {
      ...newContact,
      id_proveedor: parseInt(vendorId, 10)
    };

    fetch(`${import.meta.env.VITE_API_URL}/contacts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Error al agregar contacto');
        return d;
      })
      .then(() => {
        onSuccess();
        onClose();
      })
      .catch(err => {
        setContactError(err.message);
      });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Agregar Contacto de Partner</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {contactError && (
          <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>
            {contactError}
          </div>
        )}

        <form onSubmit={handleAddContact}>
          <div className="form-group">
            <label className="form-label">Nombre *</label>
            <input 
              type="text" 
              value={newContact.nombre}
              onChange={(e) => setNewContact({ ...newContact, nombre: e.target.value })}
              placeholder="Carlos"
              required
              className="m3-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Apellidos *</label>
            <input 
              type="text" 
              value={newContact.apellidos}
              onChange={(e) => setNewContact({ ...newContact, apellidos: e.target.value })}
              placeholder="Pérez"
              required
              className="m3-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Puesto / Cargo *</label>
            <input 
              type="text" 
              value={newContact.puesto}
              onChange={(e) => setNewContact({ ...newContact, puesto: e.target.value })}
              placeholder="Director de Delivery"
              required
              className="m3-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Teléfono Técnico *</label>
            <input 
              type="text" 
              value={newContact.telefono}
              onChange={(e) => setNewContact({ ...newContact, telefono: e.target.value })}
              placeholder="600123456"
              required
              className="m3-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Oficial *</label>
            <input 
              type="email" 
              value={newContact.email}
              onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
              placeholder="cperez@partner.com"
              required
              className="m3-input"
            />
          </div>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="m3-btn m3-btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="m3-btn m3-btn-primary">
              Agregar Contacto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
