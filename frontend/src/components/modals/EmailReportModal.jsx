import React, { useState, useEffect } from 'react';
import { Mail, Users, FileText, X, Copy, Check, Eye } from 'lucide-react';
import {
  buildProjectEmailBody,
  buildProjectEmailHtml,
  copyHtmlToClipboard,
  openMailClient
} from '../../utils/emailReportBuilder';

export default function EmailReportModal({
  isOpen,
  onClose,
  project,
  committeeTitle = 'Plan de Comunicación',
  contacts = []
}) {
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [reportOptions, setReportOptions] = useState({
    resumen: true,
    hitos: true,
    riesgos: true,
    incidencias: true,
    cambios: true,
    lecciones: true,
    alcance: true,
    cierre: true
  });

  const [activeTab, setActiveTab] = useState('config'); // 'config' | 'preview_html' | 'preview_text'
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const validEmails = contacts.filter(c => c && c.email).map(c => c.email);
      setSelectedContacts(validEmails);
      setCopied(false);
      setActiveTab('config');
    }
  }, [isOpen, contacts]);

  if (!isOpen || !project) return null;

  const handleToggleContact = (email) => {
    setSelectedContacts(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const handleToggleOption = (key) => {
    setReportOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const plainTextBody = buildProjectEmailBody(project, reportOptions, committeeTitle);
  const htmlBody = buildProjectEmailHtml(project, reportOptions, committeeTitle);

  const handleCopyHtml = async () => {
    await copyHtmlToClipboard(htmlBody, plainTextBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendEmail = async () => {
    // También copiamos la versión HTML al portapapeles para facilitar pegar (Ctrl+V) en Outlook/Mail
    await copyHtmlToClipboard(htmlBody, plainTextBody);
    const subject = `[PMO Informe] ${project.nombre_proyecto || project.id_proyecto} - ${committeeTitle}`;
    openMailClient({
      recipientEmails: selectedContacts,
      subject,
      body: plainTextBody
    });
    onClose();
  };

  const sectionsList = [
    { id: 'resumen', label: 'Resumen General y KPIs' },
    { id: 'alcance', label: 'Alcance del Proyecto' },
    { id: 'cierre', label: 'Criterios de Cierre' },
    { id: 'hitos', label: 'Hitos Destacados' },
    { id: 'riesgos', label: 'Matriz de Riesgos Abiertos' },
    { id: 'incidencias', label: 'Incidencias Pendientes' },
    { id: 'cambios', label: 'Cambios de Alcance (CR)' },
    { id: 'lecciones', label: 'Lecciones Aprendidas' }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '680px', width: '92%', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mail size={20} color="var(--md-sys-color-primary)" /> Enviar Informe por Correo
          </h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Pestanas del Modal */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--md-sys-color-outline-variant)', margin: '8px 0 12px 0' }}>
          <button
            type="button"
            className={`m3-btn ${activeTab === 'config' ? 'm3-btn-primary' : 'm3-btn-text'}`}
            onClick={() => setActiveTab('config')}
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            <Users size={14} style={{ marginRight: 6 }} /> Destinatarios y Secciones
          </button>
          <button
            type="button"
            className={`m3-btn ${activeTab === 'preview_html' ? 'm3-btn-primary' : 'm3-btn-text'}`}
            onClick={() => setActiveTab('preview_html')}
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            <Eye size={14} style={{ marginRight: 6 }} /> Vista Previa Visual (HTML)
          </button>
          <button
            type="button"
            className={`m3-btn ${activeTab === 'preview_text' ? 'm3-btn-primary' : 'm3-btn-text'}`}
            onClick={() => setActiveTab('preview_text')}
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            <FileText size={14} style={{ marginRight: 6 }} /> Vista Texto Enriquecido
          </button>
        </div>

        {/* Contenido del Modal */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
          {activeTab === 'config' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Users size={16} /> Destinatarios ({committeeTitle})
                </h4>
                {contacts.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)', fontStyle: 'italic' }}>
                    No hay contactos asignados a este comité.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '130px', overflowY: 'auto' }}>
                    {contacts.map((c) => {
                      const hasEmail = Boolean(c.email);
                      const isChecked = selectedContacts.includes(c.email);
                      return (
                        <label
                          key={c.id_contacto || c.email}
                          className="m3-checkbox-label"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justify: 'space-between',
                            padding: '6px 10px',
                            backgroundColor: 'var(--md-sys-color-surface-container-low)',
                            borderRadius: 6,
                            cursor: hasEmail ? 'pointer' : 'not-allowed',
                            opacity: hasEmail ? 1 : 0.6
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                              type="checkbox"
                              disabled={!hasEmail}
                              checked={isChecked}
                              onChange={() => hasEmail && handleToggleContact(c.email)}
                              className="m3-checkbox"
                            />
                            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>
                              {c.nombre} {c.apellidos}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>
                            {c.email || 'Sin correo registrado'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={16} /> Secciones a incluir en el cuerpo del correo
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                  {sectionsList.map((sec) => (
                    <label
                      key={sec.id}
                      className="m3-checkbox-label"
                      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      <input
                        type="checkbox"
                        checked={reportOptions[sec.id]}
                        onChange={() => handleToggleOption(sec.id)}
                        className="m3-checkbox"
                      />
                      <span>{sec.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preview_html' && (
            <div style={{ background: '#ffffff', borderRadius: 8, padding: 12, border: '1px solid var(--md-sys-color-outline-variant)' }}>
              <div dangerouslySetInnerHTML={{ __html: htmlBody }} />
            </div>
          )}

          {activeTab === 'preview_text' && (
            <pre style={{
              fontFamily: 'Consolas, monospace',
              fontSize: '0.8rem',
              backgroundColor: 'var(--md-sys-color-surface-container-high)',
              padding: 14,
              borderRadius: 8,
              whiteSpace: 'pre-wrap',
              margin: 0,
              color: 'var(--md-sys-color-on-surface)'
            }}>
              {plainTextBody}
            </pre>
          )}
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--md-sys-color-outline-variant)' }}>
          <button
            type="button"
            className="m3-btn m3-btn-outline"
            onClick={handleCopyHtml}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}
            title="Copia el informe con formato HTML/Visual para pegarlo directamente (Ctrl+V) en Outlook o Mail"
          >
            {copied ? <Check size={16} color="green" /> : <Copy size={16} />}
            {copied ? '¡Informe HTML Copiado!' : 'Copiar Informe HTML'}
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="m3-btn m3-btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="button"
              className="m3-btn m3-btn-primary"
              onClick={handleSendEmail}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Mail size={16} /> Abrir en Cliente de Correo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
