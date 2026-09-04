import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { 
  Building, Plus, Trash2, Search, Eye, RefreshCw, Phone, Mail,
  ArrowUp, ArrowDown, ArrowUpDown, RotateCcw
} from 'lucide-react';
import { getSortedData } from '../utils/sorting';
import VendorModal from '../components/modals/VendorModal';
import usePersistentFilters from '../hooks/usePersistentFilters';

const DEFAULT_VENDOR_FILTERS = {
  searchTerm: '',
  sortConfig: { key: 'id_proveedor', direction: 'asc' }
};

export default function VendorDirectory({ onViewVendor }) {
  const { t } = useTranslation();
  const { getAuthHeaders, canWrite } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Persistent Filters
  const {
    filters,
    setFilters,
    updateFilter,
    resetFilters,
    activeFiltersCount
  } = usePersistentFilters('vendors', DEFAULT_VENDOR_FILTERS);

  const searchTerm = filters.searchTerm || '';
  const sortConfig = filters.sortConfig || { key: 'id_proveedor', direction: 'asc' };

  const setSearchTerm = (val) => updateFilter('searchTerm', val);

  // Modal state (for registering new vendor)
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSort = (key) => {
    setFilters(prev => ({
      ...prev,
      sortConfig: {
        key,
        direction: prev.sortConfig?.key === key && prev.sortConfig?.direction === 'asc' ? 'desc' : 'asc'
      }
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

  const handleDeleteVendor = (id, name) => {
    if (window.confirm(t('vendorDirectory.deleteConfirm', { name }))) {
      fetch(`${import.meta.env.VITE_API_URL}/vendors/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
        .then(async res => {
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Error al eliminar el proveedor');
          }
          fetchVendors();
        })
        .catch(err => alert(err.message));
    }
  };

  const openCreateModal = () => {
    setIsModalOpen(true);
  };

  // Filter vendors in search client side
  const filteredVendors = vendors.filter(v => 
    v.nombre_razon_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.cif_nif?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.telefono_general?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.email_general?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header filter actions bar */}
      <div className="filter-panel glass-panel" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--md-sys-color-outline)' }}>
          <Building size={18} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t('vendorDirectory.techPartners')}</span>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flexGrow: 1, minWidth: '220px' }}>
          <input 
            type="text" 
            placeholder={t('vendorDirectory.searchPlaceholder')} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="m3-input"
            style={{ paddingLeft: '40px', height: '40px' }}
          />
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '11px', color: 'var(--md-sys-color-outline)' }} />
        </div>

        {activeFiltersCount > 0 && (
          <button 
            type="button" 
            onClick={resetFilters} 
            className="m3-btn m3-btn-tonal"
            style={{ 
              height: '40px', 
              padding: '0 12px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6, 
              fontSize: '0.8rem',
              color: 'var(--md-sys-color-error)',
              backgroundColor: 'var(--md-sys-color-error-container)'
            }}
          >
            <RotateCcw size={14} />
            <span>{t('common.cleanFilters')}</span>
          </button>
        )}

        {canWrite && (
          <button className="m3-btn m3-btn-primary" onClick={openCreateModal} style={{ height: '40px' }}>
            <Plus size={18} />
            {t('vendorDirectory.registerPartner')}
          </button>
        )}
      </div>

      {/* Main Directory Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: 16 }}>
          <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--md-sys-color-primary)' }} />
          <span>{t('vendorDirectory.loading')}</span>
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="m3-card" style={{ textAlign: 'center', padding: '48px', color: 'var(--md-sys-color-outline)' }}>
          {t('vendorDirectory.noVendors')}
        </div>
      ) : (
        <div className="m3-table-wrapper glass-panel">
          <table className="m3-table">
            <thead>
              <tr>
                {renderSortHeader(t('projectsTable.code'), 'id_proveedor', { width: '120px' })}
                {renderSortHeader(t('vendorDirectory.companyName'), 'nombre_razon_social')}
                {renderSortHeader(t('vendorDirectory.generalPhone'), 'telefono_general')}
                {renderSortHeader(t('vendorDirectory.email'), 'email_general')}
                <th style={{ width: '220px', textAlign: 'right' }}>{t('projectsTable.actions')}</th>
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
                      <span style={{ color: 'var(--md-sys-color-outline)', fontSize: '0.8rem' }}>—</span>
                    )}
                  </td>
                  <td>
                    {vendor.email_general ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Mail size={14} style={{ color: 'var(--md-sys-color-outline)' }} />
                        <span>{vendor.email_general}</span>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--md-sys-color-outline)', fontSize: '0.8rem' }}>—</span>
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
                        {canWrite ? t('vendorDirectory.viewEditFicha') : t('vendorDirectory.viewFicha', 'Ver Ficha')}
                      </button>

                      {canWrite && (
                        <button 
                          className="icon-btn" 
                          onClick={() => handleDeleteVendor(vendor.id_proveedor, vendor.nombre_razon_social)}
                          style={{ color: 'var(--color-rag-red)', width: 32, height: 32 }}
                          title={t('common.delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Register New Vendor Modal */}
      <VendorModal 
        isOpen={isModalOpen}
        vendor={null}
        getAuthHeaders={getAuthHeaders}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchVendors}
      />
    </div>
  );
}
