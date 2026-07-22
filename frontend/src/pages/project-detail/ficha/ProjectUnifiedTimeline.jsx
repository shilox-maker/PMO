import React from 'react';
import { Edit2, Check } from 'lucide-react';

export default function ProjectUnifiedTimeline({ project, handleOpenEditLifecycle, formatDate }) {
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
          {datedEvents.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', paddingLeft: '16px', borderLeft: '2px solid var(--md-sys-color-outline-variant)', marginLeft: '8px' }}>
              {datedEvents.map((ev, index) => (
                <div key={index} style={{ position: 'relative', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
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
                      {ev.type === 'lifecycle' ? 'Ciclo' : 'Tareas'}
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
}
