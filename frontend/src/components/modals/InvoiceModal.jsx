import React, { useState, useEffect } from 'react';
import { generateRecurringInvoices } from './RecurringInvoiceHelper';
import RecurringInvoicePreview from './RecurringInvoicePreview';
import InvoiceFormFields from './InvoiceFormFields';

export default function InvoiceModal({ 
  isOpen, onClose, projectId, editingInvoice, getAuthHeaders, onSuccess, vendors 
}) {
  const [form, setForm] = useState({
    id_interno_factura: '',
    id_proveedor: '',
    id_tipo_factura: '',
    numero_factura: '',
    concepto: '',
    fecha_factura: '',
    importe: '',
    estado: 'PENDIENTE_DE_RECIBIR',
    PO: ''
  });

  const [isRecurring, setIsRecurring] = useState(false);
  const [frecuencia, setFrecuencia] = useState('MENSUAL');
  const [modoTermino, setModoTermino] = useState('CUOTAS');
  const [fechaFin, setFechaFin] = useState('');
  const [numCuotas, setNumCuotas] = useState('6');
  const [step, setStep] = useState('FORM');
  const [recurringItems, setRecurringItems] = useState([]);

  const [invoiceTypes, setInvoiceTypes] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch(`${import.meta.env.VITE_API_URL}/invoice-types`, { headers: getAuthHeaders() })
        .then(res => res.json())
        .then(data => Array.isArray(data) && setInvoiceTypes(data))
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (editingInvoice) {
      setForm({
        id_interno_factura: editingInvoice.id_interno_factura,
        id_proveedor: editingInvoice.id_proveedor || '',
        id_tipo_factura: editingInvoice.id_tipo_factura || '',
        numero_factura: editingInvoice.numero_factura || '',
        concepto: editingInvoice.concepto || '',
        fecha_factura: editingInvoice.fecha_factura || '',
        importe: editingInvoice.importe || '',
        estado: editingInvoice.estado || 'PENDIENTE_DE_RECIBIR',
        PO: editingInvoice.PO || ''
      });
      setIsRecurring(false);
    } else {
      setForm({
        id_interno_factura: '',
        id_proveedor: '',
        id_tipo_factura: '',
        numero_factura: '',
        concepto: '',
        fecha_factura: new Date().toISOString().split('T')[0],
        importe: '',
        estado: 'PENDIENTE_DE_RECIBIR',
        PO: ''
      });
      setIsRecurring(false);
      setFrecuencia('MENSUAL');
      setModoTermino('CUOTAS');
      setFechaFin('');
      setNumCuotas('6');
    }
    setStep('FORM');
    setError('');
  }, [editingInvoice, isOpen]);

  if (!isOpen) return null;

  const handleGeneratePreview = (e) => {
    e.preventDefault();
    setError('');

    if (!form.concepto || !form.fecha_factura || !form.importe) {
      setError('Por favor, rellene todos los campos obligatorios.');
      return;
    }

    if (isRecurring) {
      if (modoTermino === 'FECHA' && !fechaFin) {
        setError('Por favor, especifique la Fecha Fin de la recurrencia.');
        return;
      }
      if (modoTermino === 'CUOTAS' && (!numCuotas || parseInt(numCuotas, 10) <= 0)) {
        setError('Por favor, indique un número de cuotas válido.');
        return;
      }

      const generated = generateRecurringInvoices({
        baseForm: form,
        frecuencia,
        fechaInicio: form.fecha_factura,
        modoTermino,
        fechaFin,
        numCuotas
      });

      if (generated.length === 0) {
        setError('No se ha generado ninguna cuota con los parámetros indicados. Revise las fechas.');
        return;
      }

      setRecurringItems(generated);
      setStep('PREVIEW');
    } else {
      saveSingleInvoice();
    }
  };

  const safeFetchJson = async (url, options) => {

    let res;
    try {
      res = await fetch(url, options);
    } catch (netErr) {
      throw new Error(`HAY UN ERROR DE CONEXIÓN CON EL BACKEND: ${netErr.message}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const is404 = res.status === 404;
      throw {
        status: res.status,
        message: `HAY UN ERROR EN EL BACKEND (HTTP ${res.status}): ${is404 ? 'La ruta de API solicitada no existe en esta versión del servidor.' : 'El servidor no devolvió una respuesta JSON válida.'}`
      };
    }

    const data = await res.json();
    if (!res.ok) {
      throw {
        status: res.status,
        message: data.error || `HAY UN ERROR EN EL BACKEND (HTTP ${res.status}): Error al procesar la solicitud.`
      };
    }
    return data;
  };

  const saveSingleInvoice = async () => {
    setIsSubmitting(true);
    setError('');
    const payload = { 
      ...form, 
      id_proyecto: projectId,
      importe: parseFloat(form.importe)
    };
    if (form.id_proveedor) payload.id_proveedor = parseInt(form.id_proveedor, 10); else payload.id_proveedor = null;
    if (form.id_tipo_factura) payload.id_tipo_factura = parseInt(form.id_tipo_factura, 10); else payload.id_tipo_factura = null;
    if (!payload.numero_factura || payload.numero_factura.trim() === '') payload.numero_factura = null;
    if (!payload.PO || payload.PO.trim() === '') payload.PO = null;

    const isEdit = !!editingInvoice;
    const url = isEdit 
      ? `${import.meta.env.VITE_API_URL}/invoices/${editingInvoice.id_interno_factura}` 
      : `${import.meta.env.VITE_API_URL}/invoices`;
    const method = isEdit ? 'PUT' : 'POST';

    if (!isEdit && (!payload.id_interno_factura || payload.id_interno_factura.trim() === '')) {
      delete payload.id_interno_factura;
    }

    try {
      await safeFetchJson(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'HAY UN ERROR EN EL BACKEND');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmBatch = async () => {
    setIsSubmitting(true);
    setError('');

    const itemsToCreate = recurringItems.map(item => {
      const { id_temp, ...rest } = item;
      return {
        ...rest,
        id_proyecto: projectId
      };
    });

    try {
      await safeFetchJson(`${import.meta.env.VITE_API_URL}/invoices/batch`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ items: itemsToCreate })
      });
      onSuccess();
      onClose();
    } catch (err) {
      // Fallback secuencial si el backend en producción no tiene desplegado /invoices/batch (HTTP 404)
      if (err.status === 404) {
        try {
          for (const item of itemsToCreate) {
            await safeFetchJson(`${import.meta.env.VITE_API_URL}/invoices`, {
              method: 'POST',
              headers: getAuthHeaders(),
              body: JSON.stringify(item)
            });
          }
          onSuccess();
          onClose();
          return;
        } catch (fallbackErr) {
          setError(fallbackErr.message || 'HAY UN ERROR EN EL BACKEND: Error en guardado secuencial');
        }
      } else {
        setError(err.message || 'HAY UN ERROR EN EL BACKEND');
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ maxWidth: '720px', width: '90%' }}>
        <div className="modal-header">
          <h3 className="modal-title">
            {step === 'PREVIEW' 
              ? 'Pre-visualización de Cobros Recurrentes' 
              : editingInvoice ? 'Editar Cobro Realizado / PO' : 'Registrar Cobro Realizado / PO'}
          </h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--color-rag-red)', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {step === 'PREVIEW' ? (
          <RecurringInvoicePreview 
            items={recurringItems}
            setItems={setRecurringItems}
            onBack={() => setStep('FORM')}
            onConfirm={handleConfirmBatch}
            isSubmitting={isSubmitting}
          />
        ) : (
          <form onSubmit={handleGeneratePreview}>
            <InvoiceFormFields 
              form={form}
              setForm={setForm}
              editingInvoice={editingInvoice}
              vendors={vendors}
              invoiceTypes={invoiceTypes}
              isRecurring={isRecurring}
              setIsRecurring={setIsRecurring}
              frecuencia={frecuencia}
              setFrecuencia={setFrecuencia}
              modoTermino={modoTermino}
              setModoTermino={setModoTermino}
              fechaFin={fechaFin}
              setFechaFin={setFechaFin}
              numCuotas={numCuotas}
              setNumCuotas={setNumCuotas}
            />

            <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
              <button type="button" className="m3-btn m3-btn-outline" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </button>
              <button type="submit" className="m3-btn m3-btn-primary" disabled={isSubmitting}>
                {isRecurring 
                  ? 'Ver Pre-visualización de Cuotas →' 
                  : (editingInvoice ? 'Guardar Cambios' : 'Registrar Cobro')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
