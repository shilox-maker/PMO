import React, { useState, useEffect } from 'react';

export default function VendorModal({ isOpen, vendor, getAuthHeaders, onClose, onSuccess }) {
  const isEdit = !!vendor;
  const [vendorForm, setVendorForm] = useState({
    nombre_razon_social: '',
    es_grupo_dacsa: false,
    telefono_general: '',
    email_general: ''
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (vendor) {
      setVendorForm({
        nombre_razon_social: vendor.nombre_razon_social || '',
        es_grupo_dacsa: vendor.es_grupo_dacsa || false,
        telefono_general: vendor.telefono_general || '',
        email_general: vendor.email_general || ''
      });
    } else {
      setVendorForm({
        nombre_razon_social: '',
        es_grupo_dacsa: false,
        telefono_general: '',
        email_general: ''
      });
    }
    setFormError('');
  }, [vendor, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setVendorForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!vendorForm.nombre_razon_social.trim()) {
      setFormError('El nombre o razón social es obligatorio.');
      return;
    }

    const url = isEdit 
      ? `${import.meta.env.VITE_API_URL}/vendors/${vendor.id_proveedor}`
      : `${import.meta.env.VITE_API_URL}/vendors`;
    const method = isEdit ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(vendorForm)
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Error al ${isEdit ? 'actualizar' : 'guardar'} el socio tecnológico`);
        return data;
      })
      .then(() => {
        onSuccess();
        onClose();
      })
      .catch(err => setFormError(err.message));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? 'Editar Socio Tecnológico' : 'Registrar Socio Tecnológico'}</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {formError && (
          <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem', fontWeight: 500 }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Razón Social o Nombre del Socio *</label>
            <input 
              type="text" 
              name="nombre_razon_social"
              value={vendorForm.nombre_razon_social}
              onChange={handleInputChange}
              placeholder="Ej: Sopra Steria S.A."
              required
              className="m3-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Teléfono de Contacto General</label>
            <input 
              type="text" 
              name="telefono_general"
              value={vendorForm.telefono_general}
              onChange={handleInputChange}
              placeholder="Ej: 960000000"
              className="m3-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email de Contacto General</label>
            <input 
              type="email" 
              name="email_general"
              value={vendorForm.email_general}
              onChange={handleInputChange}
              placeholder="Ej: contacto@partner.com"
              className="m3-input"
            />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <input 
              type="checkbox" 
              name="es_grupo_dacsa"
              id="es_grupo_dacsa_modal"
              checked={vendorForm.es_grupo_dacsa}
              onChange={handleInputChange}
              className="m3-checkbox"
              style={{ width: 18, height: 18 }}
            />
            <label htmlFor="es_grupo_dacsa_modal" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>Pertenece al Grupo Dacsa</label>
          </div>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
            <button type="button" className="m3-btn m3-btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="m3-btn m3-btn-primary">
              {isEdit ? 'Guardar Cambios' : 'Registrar Socio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
