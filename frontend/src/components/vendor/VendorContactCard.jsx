import React from 'react';
import { Building, Phone, Mail, User, Plus, Trash2 } from 'lucide-react';

export default function VendorContactCard({ vendor, contacts, onAddContact, onDeleteContact }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Vendor profile details */}
      <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="metric-icon-wrapper" style={{ width: 44, height: 44 }}>
            <Building size={20} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Información General</h3>
        </div>

        <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.9rem' }}>
            <Phone size={16} style={{ color: 'var(--md-sys-color-outline)' }} />
            <span>Teléfono: {vendor.telefono_general || 'No registrado'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.9rem' }}>
            <Mail size={16} style={{ color: 'var(--md-sys-color-outline)' }} />
            <span>Email: {vendor.email_general || 'No registrado'}</span>
          </div>
        </div>
      </div>

      {/* Contact Sub-table (Proveedores.Contactos_Proveedor) */}
      <div className="m3-card glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <User style={{ color: 'var(--md-sys-color-primary)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Contactos ({contacts?.length || 0})</h3>
          </div>
          <button className="icon-btn" onClick={onAddContact}>
            <Plus size={20} />
          </button>
        </div>

        {contacts?.length === 0 ? (
          <p style={{ color: 'var(--md-sys-color-outline)', fontSize: '0.85rem' }}>No se han agregado contactos de enlace técnico.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {contacts.map(c => (
              <div key={c.id_contacto} style={{ padding: 12, backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: '12px', border: '1px solid var(--md-sys-color-outline-variant)', position: 'relative' }}>
                <button 
                  className="icon-btn" 
                  onClick={() => onDeleteContact(c.id_contacto)}
                  style={{ position: 'absolute', right: 8, top: 8, width: 28, height: 28, color: 'var(--color-rag-red)' }}
                >
                  <Trash2 size={14} />
                </button>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', width: '80%' }}>{c.nombre} {c.apellidos}</div>
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
