import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldAlert, BookOpen, Layers, ArrowLeft, RefreshCw,
  ArrowUp, ArrowDown, ArrowUpDown
} from 'lucide-react';
import { getSortedData } from '../utils/sorting';
import AddVendorContactModal from '../components/modals/AddVendorContactModal';
import VendorContactCard from '../components/vendor/VendorContactCard';

export default function Vendor360({ vendorId, onBack, onViewProject }) {
  const { getAuthHeaders } = useAuth();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sorting states
  const [projectsSort, setProjectsSort] = useState({ key: 'id_proyecto', direction: 'asc' });
  const [incidentsSort, setIncidentsSort] = useState({ key: 'id_incidencia', direction: 'desc' });

  // Modal state
  const [showContactModal, setShowContactModal] = useState(false);

  const handleProjectsSort = (key) => {
    setProjectsSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleIncidentsSort = (key) => {
    setIncidentsSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const renderSortHeader = (label, key, sortConfig, onSort, extraStyle = {}) => {
    const isSorted = sortConfig.key === key;
    return (
      <th 
        onClick={() => onSort(key)} 
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

  const fetchVendorData = () => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/vendors/${vendorId}`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(result => {
        setData(result);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching vendor 360 view:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (vendorId) {
      fetchVendorData();
    }
  }, [vendorId]);

  const handleDeleteContact = (contactId) => {
    if (!window.confirm('¿Seguro que desea eliminar este contacto técnico?')) return;

    fetch(`${import.meta.env.VITE_API_URL}/contacts/${contactId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(() => {
        fetchVendorData();
      })
      .catch(err => console.error('Error deleting contact:', err));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: 16 }}>
        <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--md-sys-color-primary)' }} />
        <span>Cargando perfil técnico de Partner...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="m3-card" style={{ textAlign: 'center', padding: 32 }}>
        No se pudieron cargar los datos del proveedor.
        <button className="m3-btn m3-btn-primary" onClick={onBack} style={{ marginTop: 16 }}>
          <ArrowLeft size={16} /> Volver
        </button>
      </div>
    );
  }

  const { vendor, projects, incidents, lessons } = data;

  return (
    <div>
      {/* Header section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button className="icon-btn" onClick={onBack}>
          <ArrowLeft size={22} />
        </button>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)', fontWeight: 600, uppercase: 'true' }}>
            Ficha de Socio Estratégico
          </span>
          <h2 className="page-title" style={{ marginTop: -4 }}>{vendor.nombre_razon_social}</h2>
        </div>
      </div>

      {/* Main Vendor 360 Split */}
      <div className="detail-grid-split">
        {/* Left wider column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          
          {/* Section 1: Associated Projects */}
          <div className="m3-card glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <Layers style={{ color: 'var(--md-sys-color-primary)' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Proyectos Administrados ({projects.length})</h3>
            </div>

            {projects.length === 0 ? (
              <p style={{ color: 'var(--md-sys-color-outline)' }}>Este partner no tiene proyectos asignados actualmente.</p>
            ) : (
              <div className="m3-table-wrapper">
                <table className="m3-table">
                  <thead>
                    <tr>
                      {renderSortHeader('Código', 'id_proyecto', projectsSort, handleProjectsSort)}
                      {renderSortHeader('Nombre Proyecto', 'nombre_proyecto', projectsSort, handleProjectsSort)}
                      {renderSortHeader('PM Interno', 'PM.nombre', projectsSort, handleProjectsSort)}
                      {renderSortHeader('RAG', 'indicador_rag', projectsSort, handleProjectsSort)}
                      {renderSortHeader('Presupuesto', 'calculations.budget_actualizado', projectsSort, handleProjectsSort)}
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedData(projects, projectsSort).map(p => (
                      <tr key={p.id_proyecto}>
                        <td style={{ fontWeight: 700 }}>{p.id_proyecto}</td>
                        <td style={{ fontWeight: 500 }}>{p.nombre_proyecto}</td>
                        <td>{p.PM?.nombre} {p.PM?.apellidos}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className={`project-rag-dot ${p.indicador_rag}`} style={{ width: 10, height: 10 }}></div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{p.indicador_rag}</span>
                          </div>
                        </td>
                        <td>{p.calculations?.budget_actualizado.toLocaleString('es-ES')} €</td>
                        <td>
                          <button className="m3-btn m3-btn-outline" onClick={() => onViewProject(p.id_proyecto)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                            Ver Ficha
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Historical Incidents */}
          <div className="m3-card glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <ShieldAlert style={{ color: 'var(--color-rag-red)' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Historial de Incidencias ({incidents.length})</h3>
            </div>

            {incidents.length === 0 ? (
              <p style={{ color: 'var(--md-sys-color-outline)' }}>No se registran incidencias técnicas ni de plazos para este socio.</p>
            ) : (
              <div className="m3-table-wrapper">
                <table className="m3-table">
                  <thead>
                    <tr>
                      {renderSortHeader('Código', 'id_incidencia', incidentsSort, handleIncidentsSort)}
                      {renderSortHeader('Proyecto', 'Proyecto.nombre_proyecto', incidentsSort, handleIncidentsSort)}
                      {renderSortHeader('Incidencia', 'titulo', incidentsSort, handleIncidentsSort)}
                      {renderSortHeader('Criticidad', 'criticidad', incidentsSort, handleIncidentsSort)}
                      {renderSortHeader('Estado', 'estado', incidentsSort, handleIncidentsSort)}
                      {renderSortHeader('Apertura', 'fecha_apertura', incidentsSort, handleIncidentsSort)}
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedData(incidents, incidentsSort).map(inc => (
                      <tr key={inc.id_incidencia}>
                        <td style={{ fontWeight: 700 }}>{inc.id_incidencia}</td>
                        <td>{inc.Proyecto?.nombre_proyecto}</td>
                        <td style={{ fontWeight: 500 }}>
                          <div>{inc.titulo}</div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>
                            {inc.tipo_incidencias}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${
                            inc.criticidad === 'BLOQUEANTE' || inc.criticidad === 'ALTA' 
                              ? 'badge-red' 
                              : inc.criticidad === 'MEDIA' 
                                ? 'badge-orange' 
                                : 'badge-green'
                          }`}>
                            {inc.criticidad}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${inc.estado === 'RESUELTA' ? 'badge-green' : 'badge-blue'}`}>
                            {inc.estado}
                          </span>
                        </td>
                        <td>{inc.fecha_apertura}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 3: Lessons Learned */}
          <div className="m3-card glass-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <BookOpen style={{ color: 'var(--md-sys-color-tertiary)' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Lecciones Aprendidas ({lessons.length})</h3>
            </div>

            {lessons.length === 0 ? (
              <p style={{ color: 'var(--md-sys-color-outline)' }}>Aún no se han documentado lecciones aprendidas sobre este proveedor.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {lessons.map(lesson => (
                  <div key={lesson.id_leccion} style={{ padding: 16, backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: '16px', border: '1px solid var(--md-sys-color-outline-variant)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <span className="project-id-badge">{lesson.id_leccion}</span>
                      <span className={`badge ${lesson.tipo_leccion === 'BUENA_PRACTICA' ? 'badge-green' : 'badge-red'}`}>
                        {lesson.tipo_leccion.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 6 }}>{lesson.titulo}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)', marginBottom: 10 }}>
                      <strong>Contexto:</strong> {lesson.contexto}
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface)' }}>
                      <strong>Recomendación futura:</strong> {lesson.recomendacion_futura}
                    </p>
                    {lesson.Proyecto && (
                      <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>
                        Originado en: <em>{lesson.Proyecto.nombre_proyecto}</em>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right narrower column (Vendor Contact Card Subcomponent) */}
        <VendorContactCard 
          vendor={vendor}
          contacts={vendor.Contactos_Proveedors}
          onAddContact={() => setShowContactModal(true)}
          onDeleteContact={handleDeleteContact}
        />
      </div>

      {/* Add Contact Modal Subcomponent */}
      <AddVendorContactModal 
        isOpen={showContactModal}
        vendorId={vendorId}
        getAuthHeaders={getAuthHeaders}
        onClose={() => setShowContactModal(false)}
        onSuccess={fetchVendorData}
      />
    </div>
  );
}
