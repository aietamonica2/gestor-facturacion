// EditScopeChangeModal.jsx — Editar un cambio de alcance existente

import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { useApp } from '../../context/AppContext.jsx';

export default function EditScopeChangeModal({ scopeChange, onClose }) {
  var appCtx = useApp();
  var contracts = appCtx.contracts;
  var updateScopeChange = appCtx.updateScopeChange;

  var [form, setForm] = useState({
    contratoId:           scopeChange.contratoId || '',
    descripcion:          scopeChange.descripcion || '',
    montoAdicional:       scopeChange.montoAdicional != null ? String(scopeChange.montoAdicional) : '',
    moneda:               scopeChange.moneda || 'USD',
    impactoEnPlazo:       scopeChange.impactoEnPlazo || '',
    modalidadFacturacion: scopeChange.modalidadFacturacion || 'cuota_unica',
    estado:               scopeChange.estado || 'enviado',
    fechaSolicitud:       scopeChange.fechaSolicitud || '',
    fechaAprobacion:      scopeChange.fechaAprobacion || '',
  });

  var [saved, setSaved] = useState(false);

  function handleChange(field, value) {
    setForm(function(prev) { return Object.assign({}, prev, { [field]: value }); });
  }

  function handleSubmit(e) {
    e.preventDefault();
    updateScopeChange(scopeChange.id, {
      contratoId:           form.contratoId,
      descripcion:          form.descripcion,
      montoAdicional:       parseFloat(form.montoAdicional) || 0,
      moneda:               form.moneda,
      impactoEnPlazo:       form.impactoEnPlazo,
      modalidadFacturacion: form.modalidadFacturacion,
      estado:               form.estado,
      fechaSolicitud:       form.fechaSolicitud,
      fechaAprobacion:      form.fechaAprobacion || null,
    });
    setSaved(true);
    setTimeout(onClose, 800);
  }

  return (
    <Modal title={'Editar cambio de alcance'} onClose={onClose} maxWidth={560}>
      {saved && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--status-cobrada)' }}>
          ✓ Cambios guardados
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="upload-field-grid">
          <Field label="Contrato asociado *" span={2}>
            <select className="form-select" value={form.contratoId} onChange={function(e) { handleChange('contratoId', e.target.value); }} required>
              <option value="">Seleccionar...</option>
              {contracts.map(function(c) { return <option key={c.id} value={c.id}>{c.nombreContrato}</option>; })}
            </select>
          </Field>
          <Field label="Descripcion *" span={2}>
            <textarea className="form-input" value={form.descripcion} onChange={function(e) { handleChange('descripcion', e.target.value); }} required rows={3} style={{ resize: 'vertical' }} />
          </Field>
          <Field label="Moneda">
            <select className="form-select" value={form.moneda} onChange={function(e) { handleChange('moneda', e.target.value); }}>
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
            </select>
          </Field>
          <Field label="Monto adicional">
            <input type="number" className="form-input" value={form.montoAdicional} onChange={function(e) { handleChange('montoAdicional', e.target.value); }} min="0" />
          </Field>
          <Field label="Impacto en plazo" span={2}>
            <input className="form-input" value={form.impactoEnPlazo} onChange={function(e) { handleChange('impactoEnPlazo', e.target.value); }} placeholder="Ej: 15 dias adicionales" />
          </Field>
          <Field label="Modalidad facturacion">
            <select className="form-select" value={form.modalidadFacturacion} onChange={function(e) { handleChange('modalidadFacturacion', e.target.value); }}>
              <option value="cuota_unica">Cuota unica</option>
              <option value="cuotas">Cuotas</option>
              <option value="hitos">Hitos</option>
              <option value="mensual">Mensual</option>
            </select>
          </Field>
          <Field label="Estado">
            <select className="form-select" value={form.estado} onChange={function(e) { handleChange('estado', e.target.value); }}>
              <option value="enviado">Enviado al cliente</option>
              <option value="en_revision">En revision</option>
              <option value="aprobado">Aprobado</option>
              <option value="facturable">Facturable</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </Field>
          <Field label="Fecha solicitud">
            <input type="date" className="form-input" value={form.fechaSolicitud} onChange={function(e) { handleChange('fechaSolicitud', e.target.value); }} />
          </Field>
          <Field label="Fecha aprobacion">
            <input type="date" className="form-input" value={form.fechaAprobacion || ''} onChange={function(e) { handleChange('fechaAprobacion', e.target.value); }} />
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary">✓ Guardar cambios</button>
        </div>
      </form>
    </Modal>
  );
}

function Field({ label, children, span }) {
  return (
    <div style={{ gridColumn: span === 2 ? '1 / -1' : undefined }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 5, letterSpacing: '0.4px' }}>
        {label}
      </label>
      {children}
    </div>
  );
}
