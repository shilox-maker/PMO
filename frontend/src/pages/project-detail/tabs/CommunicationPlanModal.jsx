import React, { useState, useEffect } from 'react';
import { Users, X, Check, MessageSquare } from 'lucide-react';

export default function CommunicationPlanModal({
  isOpen,
  onClose,
  plan,
  raciContacts = [],
  onSave
}) {
  const [titulo, setTitulo] = useState('');
  const [finalidad, setFinalidad] = useState('');
  const [periodicidad, setPeriodicidad] = useState('SEMANAL');
  const [intervalo, setIntervalo] = useState(1);
  const [diaSemana, setDiaSemana] = useState(5);
  const [diaMes, setDiaMes] = useState(15);
  const [activo, setActivo] = useState(true);
  const [selectedContacts, setSelectedContacts] = useState([]);

  useEffect(() => {
    if (plan) {
      setTitulo(plan.titulo || '');
      setFinalidad(plan.finalidad || '');
      setPeriodicidad(plan.periodicidad || 'SEMANAL');
      setIntervalo(plan.intervalo || 1);
      setDiaSemana(plan.dia_semana || 5);
      setDiaMes(plan.dia_mes || 15);
      setActivo(plan.activo !== false);
      setSelectedContacts(plan.Contactos?.map(c => c.id_contacto) || []);
    } else {
      setTitulo('');
      setFinalidad('');
      setPeriodicidad('SEMANAL');
      setIntervalo(1);
      setDiaSemana(5);
      setDiaMes(15);
      setActivo(true);
      setSelectedContacts([]);
    }
  }, [plan, isOpen]);

  if (!isOpen) return null;

  const handleToggleContact = (id) => {
    setSelectedContacts(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    onSave({
      id: plan?.id,
      titulo: titulo.trim(),
      finalidad: finalidad.trim(),
      periodicidad,
      intervalo: Number(intervalo) || 1,
      dia_semana: periodicidad === 'SEMANAL' ? Number(diaSemana) : null,
      dia_mes: periodicidad === 'MENSUAL' ? Number(diaMes) : null,
      activo,
      contactosIds: selectedContacts
    });
    onClose();
  };

  const diasSemana = [
    { val: 1, label: 'Lunes' },
    { val: 2, label: 'Martes' },
    { val: 3, label: 'Miércoles' },
    { val: 4, label: 'Jueves' },
    { val: 5, label: 'Viernes' }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '580px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem' }}>
            <MessageSquare size={18} color="var(--md-sys-color-primary)" />
            {plan ? 'Editar Plan de Comunicación' : 'Nuevo Plan de Comunicación'}
          </h3>
          <button className="icon-btn" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Título del Plan de Comunicación *</label>
            <input
              type="text"
              required
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ej. Comité de Seguimiento Operativo"
              className="m3-input"
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Finalidad / Enfoque</label>
            <textarea
              rows={2}
              value={finalidad}
              onChange={e => setFinalidad(e.target.value)}
              placeholder="Describa los objetivos, temas a tratar y periodicidad de la reunión..."
              className="m3-input"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Periodicidad</label>
              <select
                value={periodicidad}
                onChange={e => setPeriodicidad(e.target.value)}
                className="m3-input"
              >
                <option value="SEMANAL">Semanal</option>
                <option value="MENSUAL">Mensual</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Intervalo (Frecuencia)</label>
              <select
                value={intervalo}
                onChange={e => setIntervalo(e.target.value)}
                className="m3-input"
              >
                <option value={1}>Cada 1 {periodicidad === 'SEMANAL' ? 'semana' : 'mes'}</option>
                <option value={2}>Cada 2 {periodicidad === 'SEMANAL' ? 'semanas (Quincenal)' : 'meses (Bimensual)'}</option>
                <option value={3}>Cada 3 {periodicidad === 'SEMANAL' ? 'semanas' : 'meses (Trimestral)'}</option>
                <option value={6}>Cada 6 meses (Semestral)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {periodicidad === 'SEMANAL' ? (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Día Preferente de la Semana</label>
                <select
                  value={diaSemana}
                  onChange={e => setDiaSemana(e.target.value)}
                  className="m3-input"
                >
                  {diasSemana.map(d => (
                    <option key={d.val} value={d.val}>{d.label}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Día Preferente del Mes</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={diaMes}
                  onChange={e => setDiaMes(e.target.value)}
                  className="m3-input"
                />
              </div>
            )}

            <div className="form-group" style={{ margin: 0, display: 'flex', alignItems: 'center', marginTop: 24 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={e => setActivo(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                Plan Activo
              </label>
            </div>
          </div>

          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontWeight: 600 }}>
              <Users size={15} color="var(--md-sys-color-primary)" /> Contactos Asignados (Exclusivo Matriz RACI del Proyecto)
            </label>
            {raciContacts.length === 0 ? (
              <div style={{ padding: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', fontSize: '0.85rem' }}>
                ⚠️ No hay contactos en la matriz RACI de este proyecto. Debes añadirlos en la Ficha General para vinculados a un plan de comunicación.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '180px', overflowY: 'auto', padding: '10px 12px', backgroundColor: 'var(--md-sys-color-surface-container-high)', borderRadius: 10, border: '1px solid var(--md-sys-color-outline-variant)' }}>
                {raciContacts.map(c => {
                  const companyName = c.Proveedore?.nombre_razon_social || c.Proveedor?.nombre_razon_social;
                  const roleStr = c.Proyecto_Contactos?.rol || c.puesto || '';
                  const raciStr = c.Proyecto_Contactos?.raci ? `[${c.Proyecto_Contactos.raci}]` : '';
                  return (
                    <label key={c.id_contacto} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', cursor: 'pointer', padding: '4px 0' }}>
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(c.id_contacto)}
                        onChange={() => handleToggleContact(c.id_contacto)}
                        style={{ width: 15, height: 15 }}
                      />
                      <div>
                        <strong>{c.nombre} {c.apellidos}</strong>
                        <span style={{ opacity: 0.75, marginLeft: 6, fontSize: '0.78rem' }}>
                          {companyName ? `(${companyName}${roleStr ? ` - ${roleStr}` : ''})` : roleStr}
                        </span>
                        {raciStr && <span style={{ color: 'var(--md-sys-color-primary)', fontWeight: 'bold', marginLeft: 6 }}>{raciStr}</span>}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="button" className="m3-btn m3-btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="m3-btn m3-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Check size={16} /> {plan ? 'Guardar Cambios' : 'Crear Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
