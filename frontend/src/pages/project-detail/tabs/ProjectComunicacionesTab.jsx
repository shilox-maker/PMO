import React, { useState } from 'react';
import { MessageSquare, Users, Edit2, Mail } from 'lucide-react';
import CommitteeEditForm from './CommitteeEditForm';
import EmailReportModal from '../../../components/modals/EmailReportModal';

export default function ProjectComunicacionesTab({ project, handleUpdateProject }) {
  const [editingKey, setEditingKey] = useState(null);
  const [activo, setActivo] = useState(false);
  const [finalidad, setFinalidad] = useState('');
  const [selectedKus, setSelectedKus] = useState([]);
  const [emailModalData, setEmailModalData] = useState({ isOpen: false, committeeTitle: '', contacts: [] });

  const handleOpenEmailModal = (committee) => {
    setEmailModalData({
      isOpen: true,
      committeeTitle: committee.title,
      contacts: committee.contacts || []
    });
  };

  const handleCloseEmailModal = () => {
    setEmailModalData({ isOpen: false, committeeTitle: '', contacts: [] });
  };

  const startEditing = (key) => {
    setEditingKey(key);
    if (key === 'semanal') {
      setActivo(!!project.com_semanal_activo);
      setFinalidad(project.com_semanal_finalidad || '');
      setSelectedKus(project.ComSemanalContactos?.map(k => k.id_contacto) || []);
    } else if (key === 'mensual') {
      setActivo(!!project.com_mensual_activo);
      setFinalidad(project.com_mensual_finalidad || '');
      setSelectedKus(project.ComMensualContactos?.map(k => k.id_contacto) || []);
    } else if (key === 'steerco') {
      setActivo(!!project.com_steerco_activo);
      setFinalidad(project.com_steerco_finalidad || '');
      setSelectedKus(project.ComSteerCoContactos?.map(k => k.id_contacto) || []);
    }
  };

  const handleSave = () => {
    const payload = {};
    if (editingKey === 'semanal') {
      payload.com_semanal_activo = activo;
      payload.com_semanal_finalidad = finalidad;
      payload.comSemanalKus = selectedKus;
    } else if (editingKey === 'mensual') {
      payload.com_mensual_activo = activo;
      payload.com_mensual_finalidad = finalidad;
      payload.comMensualKus = selectedKus;
    } else if (editingKey === 'steerco') {
      payload.com_steerco_activo = activo;
      payload.com_steerco_finalidad = finalidad;
      payload.comSteercoKus = selectedKus;
    }
    handleUpdateProject(payload);
    setEditingKey(null);
  };

  const handleToggleKu = (kuId) => {
    setSelectedKus(prev => 
      prev.includes(kuId) ? prev.filter(id => id !== kuId) : [...prev, kuId]
    );
  };

  const raciContacts = project.InvolvedContacts || [];

  const committees = [
    {
      key: 'semanal',
      title: 'Comité de Seguimiento Semanal (Operativo)',
      active: project.com_semanal_activo,
      purpose: project.com_semanal_finalidad,
      contacts: project.ComSemanalContactos || []
    },
    {
      key: 'mensual',
      title: 'Comité de Seguimiento Mensual (Táctico)',
      active: project.com_mensual_activo,
      purpose: project.com_mensual_finalidad,
      contacts: project.ComMensualContactos || []
    },
    {
      key: 'steerco',
      title: 'Comité de Dirección / SteerCo (Estratégico)',
      active: project.com_steerco_activo,
      purpose: project.com_steerco_finalidad,
      contacts: project.ComSteerCoContactos || []
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ marginBottom: 8 }}>
        <h3 style={{ fontWeight: 600, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={20} /> Estructura de Comités y Gobernanza de Comunicaciones
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)' }}>
          Canales formales configurados para reportes de avance, toma de decisiones y escalado de incidencias.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {committees.map((c) => {
          const isEditing = c.key === editingKey;

          if (isEditing) {
            return (
              <CommitteeEditForm 
                key={c.key}
                committeeKey={c.key}
                activo={activo}
                setActivo={setActivo}
                finalidad={finalidad}
                setFinalidad={setFinalidad}
                selectedKus={selectedKus}
                handleToggleKu={handleToggleKu}
                raciContacts={raciContacts}
                onCancel={() => setEditingKey(null)}
                onSave={handleSave}
              />
            );
          }

          return (
            <div 
              key={c.key} 
              className="m3-card glass-panel" 
              style={{ 
                opacity: c.active ? 1 : 0.5,
                border: c.active ? '1px solid var(--md-sys-color-primary)' : '1px solid var(--md-sys-color-outline-variant)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{c.title}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`badge ${c.active ? 'badge-green' : 'badge-red'}`}>
                    {c.active ? 'ACTIVO' : 'NO CONFIGURADO'}
                  </span>
                  <button 
                    className="icon-btn" 
                    onClick={() => startEditing(c.key)}
                    title={`Editar ${c.title}`}
                    style={{ padding: 4 }}
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              </div>

              {c.active ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)', fontWeight: 600, textTransform: 'uppercase' }}>Finalidad / Enfoque</div>
                      <p style={{ fontSize: '0.9rem', marginTop: 4 }}>{c.purpose || 'Sin especificar finalidad.'}</p>
                    </div>
                    <button
                      type="button"
                      className="m3-btn m3-btn-outline"
                      onClick={() => handleOpenEmailModal(c)}
                      title={`Enviar informe de proyecto por correo a los miembros de ${c.title}`}
                      style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
                    >
                      <Mail size={14} /> Enviar Informe por Correo
                    </button>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)', fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <Users size={14} /> Participantes Involucrados
                    </div>
                    {c.contacts.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--md-sys-color-outline)', fontStyle: 'italic' }}>Sin participantes definidos.</p>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {c.contacts.map((ku) => {
                          const companyName = ku.Proveedore?.nombre_razon_social || ku.Proveedor?.nombre_razon_social;
                          const displayCompany = companyName ? ` (${companyName})` : '';
                          return (
                            <span 
                              key={ku.id_contacto} 
                              style={{ 
                                fontSize: '0.75rem', 
                                padding: '4px 10px', 
                                backgroundColor: 'var(--md-sys-color-surface-container-high)',
                                borderRadius: '20px',
                                fontWeight: 500,
                                border: '1px solid var(--md-sys-color-outline-variant)'
                              }}
                            >
                              👤 {ku.nombre} {ku.apellidos}{displayCompany}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--md-sys-color-outline)' }}>
                  Este comité no se encuentra habilitado para la gobernanza del proyecto actual.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal de Configuración y Envío de Correo */}
      <EmailReportModal
        isOpen={emailModalData.isOpen}
        onClose={handleCloseEmailModal}
        project={project}
        committeeTitle={emailModalData.committeeTitle}
        contacts={emailModalData.contacts}
      />
    </div>
  );
}

