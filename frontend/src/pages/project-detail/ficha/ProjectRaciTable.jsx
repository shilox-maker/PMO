import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import SearchableContactSelect from '../../../components/SearchableContactSelect';

export default function ProjectRaciTable({
  sortedInvolvedContacts,
  contactosList,
  handleOpenAddRaci,
  handleOpenEditRaci,
  handleDeleteParticipant
}) {
  return (
    <div className="m3-card glass-panel" style={{ overflow: 'visible', zIndex: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontWeight: 600, fontSize: '1.15rem' }}>Participantes (RACI)</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>Gestión de responsabilidades internas y externas del proyecto</p>
        </div>
        <div style={{ display: 'flex', gap: 8, width: '280px', position: 'relative' }}>
          <SearchableContactSelect 
            contacts={contactosList}
            selected={null}
            onChange={(val) => {
              if (val) {
                handleOpenAddRaci(val);
              }
            }}
            placeholder="+ Añadir Participante"
          />
        </div>
      </div>

      {(!sortedInvolvedContacts || sortedInvolvedContacts.length === 0) ? (
        <p style={{ color: 'var(--md-sys-color-outline)', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
          No hay participantes RACI asignados a este proyecto.
        </p>
      ) : (
        <div className="m3-table-wrapper" style={{ border: '1px solid var(--md-sys-color-outline-variant)', borderRadius: 12 }}>
          <table className="m3-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Rol en Proyecto</th>
                <th>RACI</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedInvolvedContacts.map(ku => (
                <tr key={ku.id_contacto}>
                  <td style={{ fontWeight: 600 }}>{ku.nombre} {ku.apellidos}</td>
                  <td>{ku.Proyecto_Contactos?.rol}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['R', 'A', 'C', 'I'].map(char => {
                        const active = ku.Proyecto_Contactos?.raci.includes(char);
                        let bg = 'var(--md-sys-color-surface-container-high)';
                        let color = 'var(--md-sys-color-outline)';
                        if (active) {
                          if (char === 'R') { bg = 'rgba(255, 59, 48, 0.15)'; color = '#ff3b30'; }
                          else if (char === 'A') { bg = 'rgba(0, 122, 255, 0.15)'; color = '#007aff'; }
                          else if (char === 'C') { bg = 'rgba(52, 199, 89, 0.15)'; color = '#34c759'; }
                          else if (char === 'I') { bg = 'rgba(255, 204, 0, 0.25)'; color = '#ffcc00'; }
                        }
                        return (
                          <span 
                            key={char} 
                            style={{
                              display: 'inline-block',
                              width: 20,
                              height: 20,
                              lineHeight: '20px',
                              borderRadius: '50%',
                              textAlign: 'center',
                              fontSize: '0.7rem',
                              fontWeight: 'bold',
                              backgroundColor: bg,
                              color: color
                            }}
                            title={char === 'R' ? 'Responsible' : char === 'A' ? 'Accountable' : char === 'C' ? 'Consulted' : 'Informed'}
                          >
                            {char}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="icon-btn" onClick={() => handleOpenEditRaci(ku)} title="Editar rol RACI">
                        <Edit2 size={14} />
                      </button>
                      <button className="icon-btn" onClick={() => handleDeleteParticipant(ku.id_contacto)} title="Eliminar del proyecto" style={{ color: 'var(--color-rag-red)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
