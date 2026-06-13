import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building, Plus, Edit2, Trash2, Search, Eye, RefreshCw, Phone, Mail,
  ArrowUp, ArrowDown, ArrowUpDown
} from 'lucide-react';
import { getSortedData } from '../utils/sorting';


export default function VendorDirectory({ onViewVendor }) {
  const { getAuthHeaders } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'id_proveedor', direction: 'asc' });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const renderSortHeader = (label, key, extraStyle = {}) => {
    const isSorted = sortConfig.key === key;
    return (
      <th 
        onClick={() => handleSort(key)} 
        style={{ cursor: 'pointer', userSelect: 'none', ...extraStyle }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {label}
          {isSorted ? (
            sortConfig.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
          ) : (
            <ArrowUpDown size={14} style={{ opacity: 0.3 }} />
          )}
        </div>
      </th>
    );
  };


  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  
  const [vendorForm, setVendorForm] = useState({
    nombre_razon_social: '',
    telefono_general: '',
    email_general: ''
  });
  const [formError, setFormError] = useState('');

  const fetchVendors = () => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/vendors`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        setVendors(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching vendors list:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVendorForm(prev => ({ ...prev, [name]: value }));
  };

  const openCreateModal = () => {
    setEditingVendor(null);
    setVendorForm({
      nombre_razon_social: '',
      telefono_general: '',
      email_general: ''
    });
    setFormError('');
    setShowCreateModal(true);
  };

  const openEditModal = (vendor) => {
    setEditingVendor(vendor);
    setVendorForm({
      nombre_razon_social: vendor.nombre_razon_social,
      telefono_general: vendor.telefono_general || '',
      email_general: vendor.email_general || ''
    });
    setFormError('');
    setShowEditModal(true);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!vendorForm.nombre_razon_social.trim()) {
      setFormError('El nombre o razón social es obligatorio.');
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/vendors`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(vendorForm)
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al guardar el socio tecnológico');
        return data;
      })
      .then(() => {
        setShowCreateModal(false);
        fetchVendors();
      })
      .catch(err => setFormError(err.message));
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!vendorForm.nombre_razon_social.trim()) {
      setFormError('El nombre o razón social es obligatorio.');
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/vendors/${editingVendor.id_proveedor}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(vendorForm)
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al actualizar el socio tecnológico');
        return data;
      })
      .then(() => {
        setShowEditModal(false);
        fetchVendors();
      })
      .catch(err => setFormError(err.message));
  };

  const handleDeleteVendor = (vendorId, vendorName) => {
    if (!window.confirm(`¿Seguro que desea eliminar el socio tecnológico "${vendorName}"?`)) return;

    fetch(`${import.meta.env.VITE_API_URL}/vendors/${vendorId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al eliminar el socio tecnológico');
        return data;
      })
      .then(() => {
        fetchVendors();
      })
      .catch(err => alert(err.message));
  };

  // Filter vendors in search client side
  const filteredVendors = vendors.filter(v => 
    v.nombre_razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.email_general && v.email_general.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      {/* Header filter actions bar */}
      <div className="filter-panel glass-panel" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--md-sys-color-outline)' }}>
          <Building size={18} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Socios Tecnológicos:</span>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flexGrow: 1, minWidth: '220px' }}>
          <input 
            type="text" 
            placeholder="Buscar por razón social o correo..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="m3-input"
            style={{ paddingLeft: '40px', height: '40px' }}
          />
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '11px', color: 'var(--md-sys-color-outline)' }} />
        </div>

        <button className="m3-btn m3-btn-primary" onClick={openCreateModal} style={{ height: '40px' }}>
          <Plus size={18} />
          Registrar Socio
        </button>
      </div>

      {/* Main Directory Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justify: 'center', minHeight: '200px', gap: 16 }}>
          <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--md-sys-color-primary)' }} />
          <span>Cargando lista de socios tecnológicos...</span>
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="m3-card" style={{ textAlign: 'center', padding: '48px', color: 'var(--md-sys-color-outline)' }}>
          No se encontraron socios registrados.
        </div>
      ) : (
        <div className="m3-table-wrapper glass-panel">
          <table className="m3-table">
            <thead>
              <tr>
                {renderSortHeader('Código', 'id_proveedor', { width: '120px' })}
                {renderSortHeader('Razón Social / Nombre', 'nombre_razon_social')}
                {renderSortHeader('Teléfono General', 'telefono_general')}
                {renderSortHeader('Correo Electrónico', 'email_general')}
                <th style={{ width: '220px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {getSortedData(filteredVendors, sortConfig).map((vendor) => (
                <tr key={vendor.id_proveedor}>
                  <td style={{ fontWeight: 700, fontSize: '0.9rem' }}>#{vendor.id_proveedor}</td>
                  <td style={{ fontWeight: 600 }}>
                    <span 
                      style={{ cursor: 'pointer', color: 'var(--md-sys-color-on-surface)' }}
                      onClick={() => onViewVendor(vendor.id_proveedor)}
                    >
                      {vendor.nombre_razon_social}
                    </span>
                  </td>
                  <td>
                    {vendor.telefono_general ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Phone size={14} style={{ color: 'var(--md-sys-color-outline)' }} />
                        <span>{vendor.telefono_general}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--md-sys-color-outline)', fontSize: '0.8rem' }}>Sin teléfono</span>
                    )}
                  </td>
                  <td>
                    {vendor.email_general ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Mail size={14} style={{ color: 'var(--md-sys-color-outline)' }} />
                        <span>{vendor.email_general}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--md-sys-color-outline)', fontSize: '0.8rem' }}>Sin correo</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                      <button 
                        className="m3-btn m3-btn-tonal"
                        onClick={() => onViewVendor(vendor.id_proveedor)}
                        style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px' }}
                      >
                        <Eye size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        Ficha 360º
                      </button>

                      <button 
                        className="icon-btn" 
                        onClick={() => openEditModal(vendor)}
                        style={{ color: 'var(--md-sys-color-primary)', width: 32, height: 32 }}
                        title="Editar Socio"
                      >
                        <Edit2 size={16} />
                      </button>

                      <button 
                        className="icon-btn" 
                        onClick={() => handleDeleteVendor(vendor.id_proveedor, vendor.nombre_razon_social)}
                        style={{ color: 'var(--color-rag-red)', width: 32, height: 32 }}
                        title="Eliminar Socio"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Vendor Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Socio Tecnológico</h3>
              <button className="icon-btn" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>

            {formError && (
              <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem', fontWeight: 500 }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label className="form-label">Razón Social o Nombre del Socio *</label>
                <input 
                  type="text" 
                  name="nombre_razon_social"
                  value={vendorForm.nombre_razon_social}
                  onChange={handleInputChange}
                  placeholder="Sopra Steria S.A."
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
                  placeholder="960000000"
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
                  placeholder="contacto@partner.com"
                  className="m3-input"
                />
              </div>

              <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="m3-btn m3-btn-outline" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="m3-btn m3-btn-primary">
                  Registrar Socio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Vendor Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Socio Tecnológico</h3>
              <button className="icon-btn" onClick={() => setShowEditModal(false)}>✕</button>
            </div>

            {formError && (
              <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem', fontWeight: 500 }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label className="form-label">Razón Social o Nombre del Socio *</label>
                <input 
                  type="text" 
                  name="nombre_razon_social"
                  value={vendorForm.nombre_razon_social}
                  onChange={handleInputChange}
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
                  className="m3-input"
                />
              </div>

              <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="m3-btn m3-btn-outline" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="m3-btn m3-btn-primary">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
