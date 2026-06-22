import React from 'react';
import { 
  Building, User, MapPin, Calendar, Plus, Trash2, Edit2, Check, MessageSquare, Star 
} from 'lucide-react';
import RichTextEditor from '../../../components/RichTextEditor';
import SearchableContactSelect from '../../../components/SearchableContactSelect';

export default function ProjectFichaTab({
  project, comments, commentsLoading, newCommentText, setNewCommentText,
  newCommentImportant, setNewCommentImportant, newCommentDireccion, setNewCommentDireccion,
  handleAddComment, handleDeleteComment,
  editingCommentId, setEditingCommentId, editingCommentText, setEditingCommentText,
  editingCommentImportant, setEditingCommentImportant, editingCommentDireccion, setEditingCommentDireccion,
  handleUpdateComment, isEditingLifecycle, handleOpenEditLifecycle, handleDeleteParticipant,
  handleOpenAddRaci, handleOpenEditRaci, onViewVendor, contactosList,
  canSeeDireccion
}) {
  const calc = project.calculations;

  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} a las ${hours}:${minutes}`;
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth()+1).padStart(2, '0')}/${dt.getFullYear()}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="detail-grid-split" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {project.Estado && (
              <div style={{ 
                backgroundColor: 'var(--md-sys-color-primary-container)', 
                color: 'var(--md-sys-color-on-primary-container)', 
                padding: '16px 20px', 
                borderRadius: '12px', 
                borderLeft: '4px solid var(--md-sys-color-primary)' 
              }}>
                <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>📘</span> Descripción del Estado ({project.Estado.nombre_estado})
                </h3>
                <div className="wysiwyg-content" dangerouslySetInnerHTML={{ __html: project.Estado.pasos || '<p style="font-style: italic; opacity: 0.8;">Sin descripción de estado detallada.</p>' }} style={{ fontSize: '0.9rem', lineHeight: '1.5' }} />
              </div>
            )}

            <div>
              <h3 style={{ fontWeight: 600, fontSize: '1.15rem', marginBottom: 8 }}>Descripción</h3>
              <p style={{ color: 'var(--md-sys-color-on-surface)', whiteSpace: 'pre-line' }}>{project.descripcion}</p>
            </div>

            <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 20 }}>
              <h3 style={{ fontWeight: 600, fontSize: '1.15rem', marginBottom: 12 }}>Atributos de Gobernanza</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <MapPin size={18} style={{ color: 'var(--md-sys-color-outline)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>Sede</div>
                    <div style={{ fontWeight: 500 }}>{project.Sede?.nombre_sede}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Building size={18} style={{ color: 'var(--md-sys-color-outline)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>Partner Adjudicatario</div>
                    <span 
                      style={{ fontWeight: 500, textDecoration: 'underline', cursor: 'pointer', color: 'var(--md-sys-color-primary)' }}
                      onClick={() => onViewVendor(project.id_proveedor)}
                    >
                      {project.Proveedor?.nombre_razon_social}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <User size={18} style={{ color: 'var(--md-sys-color-outline)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>Gestor Interno PM</div>
                    <div style={{ fontWeight: 500 }}>{project.PM?.nombre} {project.PM?.apellidos}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <User size={18} style={{ color: 'var(--md-sys-color-outline)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>Sponsor / Key User Líder</div>
                    <div style={{ fontWeight: 500 }}>{project.Sponsor?.nombre} {project.Sponsor?.apellidos}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Calendar size={18} style={{ color: 'var(--md-sys-color-outline)' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>Fechas de Proyecto</div>
                    <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>
                      Inicio: {project.fecha_inicio} <br />
                      Fin Base: {project.fecha_fin_inicial} <br />
                      Fin Est.: <span style={{ color: 'var(--md-sys-color-primary)', fontWeight: 'bold' }}>{calc?.fecha_fin_estimada}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Matriz RACI */}
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

            {(!project.InvolvedContacts || project.InvolvedContacts.length === 0) ? (
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
                    {project.InvolvedContacts.map(ku => (
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
        </div>

        {/* Right Column: Unified Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {(() => {
            const lifecycleList = [
              { label: 'Hito: Petición', val: project.fecha_peticion, icon: '📩', key: 'fecha_peticion' },
              { label: 'Hito: Alcance Definido', val: project.fecha_alcance_definido, icon: '📐', key: 'fecha_alcance_definido' },
              { label: 'Hito: Aprobación', val: project.fecha_aprobacion, icon: '⏳', key: 'fecha_aprobacion' },
              { label: 'Hito: Planificación', val: project.fecha_planificacion, icon: '📅', key: 'fecha_planificacion' },
              { label: 'Hito: Kickoff', val: project.fecha_kickoff, icon: '🚀', key: 'fecha_kickoff' },
              { label: 'Hito: Go-Live', val: project.fecha_go_live, icon: '📦', key: 'fecha_go_live' },
              { label: 'Hito: Cierre', val: project.fecha_cierre, icon: '🏁', key: 'fecha_cierre' }
            ];

            const datedEvents = [];

            lifecycleList.forEach(item => {
              if (item.val) {
                datedEvents.push({
                  title: item.label,
                  date: item.val,
                  type: 'lifecycle',
                  icon: item.icon,
                  completed: true
                });
              }
            });

            (project.Tareas || []).forEach(t => {
              if (t.fecha_limite) {
                const isOverdue = t.estado === 'PENDIENTE' && new Date(t.fecha_limite) < new Date();
                datedEvents.push({
                  title: t.titulo_tarea,
                  desc: t.descripcion,
                  date: t.fecha_limite,
                  type: 'checklist',
                  icon: t.es_hito ? '🏁' : '📋',
                  completed: t.estado === 'COMPLETADA',
                  isOverdue
                });
              }
            });

            datedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
            const pendingLifecycle = lifecycleList.filter(item => !item.val);

            return (
              <div className="m3-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontWeight: 600, fontSize: '1.15rem' }}>Línea de Tiempo del Proyecto</h3>
                  <button 
                    className="m3-btn m3-btn-outline" 
                    onClick={handleOpenEditLifecycle} 
                    style={{ padding: '4px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Edit2 size={14} /> Hitos
                  </button>
                </div>

                {datedEvents.length === 0 && pendingLifecycle.length === 0 ? (
                  <p style={{ color: 'var(--md-sys-color-outline)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                    Sin hitos ni tareas planificadas.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Chronological Timeline */}
                    {datedEvents.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', paddingLeft: '16px', borderLeft: '2px solid var(--md-sys-color-outline-variant)', marginLeft: '8px' }}>
                        {datedEvents.map((ev, index) => (
                          <div key={index} style={{ position: 'relative', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {/* Timeline dot */}
                            <div style={{
                              position: 'absolute',
                              left: '-25px',
                              top: '2px',
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              backgroundColor: ev.completed ? 'var(--color-rag-green)' : 'var(--md-sys-color-surface-container-high)',
                              border: ev.completed ? 'none' : '2px solid var(--md-sys-color-outline)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 2
                            }}>
                              {ev.completed && <Check size={10} style={{ color: '#fff' }} />}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 4 }}>
                              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--md-sys-color-on-surface)' }}>
                                {ev.icon} {ev.title}
                              </span>
                              <span className="badge" style={{ fontSize: '0.7rem', padding: '2px 6px', backgroundColor: ev.type === 'lifecycle' ? 'var(--md-sys-color-primary-container)' : 'var(--md-sys-color-surface-container-highest)', color: ev.type === 'lifecycle' ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)' }}>
                                {ev.type === 'lifecycle' ? 'Ciclo' : 'Checklist'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>
                              <span>{formatDate(ev.date)}</span>
                              {ev.isOverdue && (
                                <span className="badge badge-red" style={{ fontSize: '0.65rem', padding: '1px 4px' }}>RETRASADA</span>
                              )}
                            </div>

                            {ev.desc && (
                              <p style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)', marginTop: 2, fontStyle: 'italic' }}>
                                {ev.desc}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pending Lifecycle Milestones */}
                    {pendingLifecycle.length > 0 && (
                      <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', paddingTop: 16 }}>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--md-sys-color-outline)', textTransform: 'uppercase', marginBottom: 12 }}>
                          Hitos del Ciclo Pendientes
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {pendingLifecycle.map((item, idx) => (
                            <span 
                              key={idx} 
                              className="badge" 
                              style={{ 
                                fontSize: '0.75rem', 
                                padding: '6px 12px', 
                                backgroundColor: 'var(--md-sys-color-surface-container-high)', 
                                color: 'var(--md-sys-color-outline)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                              }}
                              title="Hito sin planificar / fecha sin asignar"
                            >
                              <span>{item.icon}</span>
                              <span>{item.label.replace('Hito: ', '')}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Muro Ejecutivo (Comentarios) */}
      <div className="m3-card glass-panel" style={{ marginTop: 12 }}>
        <h3 style={{ fontWeight: 600, fontSize: '1.25rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={20} /> Muro Ejecutivo (Minutas / Hitos clave)
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)', marginBottom: 20 }}>
          Registro cronológico de comentarios importantes de gobernanza y acuerdos de comités.
        </p>

        {/* Input area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, padding: 16, backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 16 }}>
          <RichTextEditor 
            value={newCommentText}
            onChange={setNewCommentText}
            placeholder="Añada un comentario o acuerdo ejecutivo aquí..."
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 20 }}>
              <label className="m3-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={newCommentImportant} 
                  onChange={(e) => setNewCommentImportant(e.target.checked)}
                  className="m3-checkbox"
                />
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--priority-alta)', fontWeight: 600 }}>
                  <Star size={14} fill={newCommentImportant ? 'var(--priority-alta)' : 'none'} /> Marcar como importante / ejecutivo (PDF)
                </span>
              </label>
              {canSeeDireccion && (
                <label className="m3-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={newCommentDireccion} 
                    onChange={(e) => setNewCommentDireccion(e.target.checked)}
                    className="m3-checkbox"
                  />
                  <span style={{ color: 'var(--md-sys-color-primary)', fontWeight: 600 }}>
                    📢 Para dirección
                  </span>
                </label>
              )}
            </div>
            <button className="m3-btn m3-btn-primary" onClick={handleAddComment} style={{ height: '36px' }}>
              Publicar Comentario
            </button>
          </div>
        </div>

        {/* Comments List */}
        {commentsLoading ? (
          <span>Cargando comentarios...</span>
        ) : comments.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--md-sys-color-outline)', padding: '24px 0', fontStyle: 'italic' }}>
            No hay comentarios registrados en este proyecto.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {comments.map(c => {
              const isEditing = editingCommentId === c.id_comentario;

              return (
                <div 
                  key={c.id_comentario} 
                  style={{ 
                    padding: 16, 
                    backgroundColor: c.para_direccion 
                      ? 'rgba(10, 132, 255, 0.08)' 
                      : (c.es_importante ? 'rgba(245, 158, 11, 0.08)' : 'var(--md-sys-color-surface-container)'), 
                    borderLeft: c.para_direccion 
                      ? '4px solid #007aff' 
                      : (c.es_importante ? '4px solid #f59e0b' : '4px solid var(--md-sys-color-outline-variant)'),
                    borderRadius: '0 16px 16px 0',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <RichTextEditor 
                        value={editingCommentText}
                        onChange={setEditingCommentText}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 16 }}>
                          <label className="m3-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={editingCommentImportant}
                              onChange={(e) => setEditingCommentImportant(e.target.checked)}
                              className="m3-checkbox"
                            />
                            <span style={{ color: '#f59e0b', fontWeight: 600 }}>Importante</span>
                          </label>
                          {canSeeDireccion && (
                            <label className="m3-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={editingCommentDireccion}
                                onChange={(e) => setEditingCommentDireccion(e.target.checked)}
                                className="m3-checkbox"
                              />
                              <span style={{ color: 'var(--md-sys-color-primary)', fontWeight: 600 }}>Para dirección</span>
                            </label>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="m3-btn m3-btn-outline" onClick={() => setEditingCommentId(null)} style={{ height: '32px', fontSize: '0.8rem' }}>
                            Cancelar
                          </button>
                          <button className="m3-btn m3-btn-primary" onClick={() => handleUpdateComment(c.id_comentario)} style={{ height: '32px', fontSize: '0.8rem' }}>
                            Guardar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '0.9rem' }}>{c.Autor?.nombre} {c.Autor?.apellidos}</strong>
                          {c.es_importante && (
                            <span style={{ fontSize: '0.7rem', backgroundColor: '#ffe0b2', color: '#e65100', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Star size={10} fill="#e65100" /> IMPORTANTE
                            </span>
                          )}
                          {c.para_direccion && (
                            <span style={{ fontSize: '0.7rem', backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Star size={10} fill="var(--md-sys-color-primary)" /> DIRECCIÓN
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--md-sys-color-outline)' }}>
                          {formatDateTime(c.fecha_registro)}
                        </span>
                      </div>

                      <div className="wysiwyg-content" dangerouslySetInnerHTML={{ __html: c.texto_comentario }} style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--md-sys-color-on-surface)' }} />

                      {c.editado && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--md-sys-color-outline)', marginTop: 8, fontStyle: 'italic' }}>
                          Editado por {c.Editor?.nombre} {c.Editor?.apellidos} el {formatDateTime(c.fecha_modificacion)}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12, borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: 8 }}>
                        <button 
                          className="icon-btn" 
                          onClick={() => {
                            setEditingCommentId(c.id_comentario);
                            setEditingCommentText(c.texto_comentario);
                            setEditingCommentImportant(c.es_importante);
                            setEditingCommentDireccion(c.para_direccion || false);
                          }}
                          title="Editar comentario"
                        >
                          <Edit2 size={12} /> <span style={{ fontSize: '0.75rem', marginLeft: 4 }}>Editar</span>
                        </button>
                        <button 
                          className="icon-btn" 
                          onClick={() => handleDeleteComment(c.id_comentario)}
                          title="Eliminar comentario"
                          style={{ color: 'var(--color-rag-red)' }}
                        >
                          <Trash2 size={12} /> <span style={{ fontSize: '0.75rem', marginLeft: 4 }}>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
