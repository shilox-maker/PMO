import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sliders, Users, Edit2, Briefcase, Receipt } from 'lucide-react';
import StatesAdmin from '../components/admin/StatesAdmin';
import UsersAdmin from '../components/admin/UsersAdmin';
import SedesAdmin from '../components/admin/SedesAdmin';
import PortfoliosAdmin from '../components/admin/PortfoliosAdmin';
import CapexTypesAdmin from '../components/admin/CapexTypesAdmin';
import InvoiceTypesAdmin from '../components/admin/InvoiceTypesAdmin';

export default function AdminPanel() {
  const { getAuthHeaders, refreshUsers } = useAuth();
  const [activeTab, setActiveTab] = useState('states'); // 'states', 'users', 'sedes', 'portfolios', 'capex', 'invoices'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Sub tabs switcher */}
      <div className="m3-tabs-container">
        <button className={`m3-tab ${activeTab === 'states' ? 'active' : ''}`} onClick={() => setActiveTab('states')}>
          <Sliders size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Mantenimiento de Estados
        </button>
        <button className={`m3-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <Users size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Mantenimiento de Usuarios
        </button>
        <button className={`m3-tab ${activeTab === 'sedes' ? 'active' : ''}`} onClick={() => setActiveTab('sedes')}>
          <Edit2 size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Sedes
        </button>
        <button className={`m3-tab ${activeTab === 'portfolios' ? 'active' : ''}`} onClick={() => setActiveTab('portfolios')}>
          <Briefcase size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Portfolios
        </button>
        <button className={`m3-tab ${activeTab === 'capex' ? 'active' : ''}`} onClick={() => setActiveTab('capex')}>
          <Sliders size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Tipos CAPEX
        </button>
        <button className={`m3-tab ${activeTab === 'invoices' ? 'active' : ''}`} onClick={() => setActiveTab('invoices')}>
          <Receipt size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Tipos de Factura
        </button>
      </div>

      {activeTab === 'states' && (
        <StatesAdmin getAuthHeaders={getAuthHeaders} />
      )}

      {activeTab === 'users' && (
        <UsersAdmin getAuthHeaders={getAuthHeaders} refreshUsers={refreshUsers} />
      )}

      {activeTab === 'sedes' && (
        <SedesAdmin getAuthHeaders={getAuthHeaders} />
      )}

      {activeTab === 'portfolios' && (
        <PortfoliosAdmin getAuthHeaders={getAuthHeaders} />
      )}

      {activeTab === 'capex' && (
        <CapexTypesAdmin getAuthHeaders={getAuthHeaders} />
      )}

      {activeTab === 'invoices' && (
        <InvoiceTypesAdmin getAuthHeaders={getAuthHeaders} />
      )}
    </div>
  );
}
