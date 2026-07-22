import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building, Plus, Edit2, Trash2, Search, Eye, RefreshCw, Phone, Mail,
  ArrowUp, ArrowDown, ArrowUpDown
} from 'lucide-react';
import { getSortedData } from '../utils/sorting';
import VendorModal from '../components/modals/VendorModal';

export default function VendorDirectory({ onViewVendor }) {
  const { getAuthHeaders } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'id_proveedor', direction: 'asc' });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

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

  const openCreateModal = () => {
    setEditingVendor(null);
    setIsModalOpen(true);
  };

  const openEditModal = (vendor) => {
    setEditingVendor(vendor);
    setIsModalOpen(true);
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: 16 }}>
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
                      {vendor.es_grupo_dacsa && <span style={{ marginLeft: 8, fontSize: '0.65rem', backgroundColor: 'var(--md-sys-color-primary)', color: '#fff', padding: '2px 6px', borderRadius: 100 }}>Dacsa</span>}
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

      {/* Unified Create / Edit Vendor Modal */}
      <VendorModal 
        isOpen={isModalOpen}
        vendor={editingVendor}
        getAuthHeaders={getAuthHeaders}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchVendors}
      />
    </div>
  );
}
