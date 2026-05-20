// EditContractModal.jsx — Editar un contrato existente

import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { useApp } from '../../context/AppContext.jsx';

export default function EditContractModal({ contract, onClose }) {
  var appCtx = useApp();
  var clients = appCtx.clients;
  var users = appCtx.users;
  var updateContract = appCtx.updateContract;

  var lideres = users.filter(function(u) {
    return u.rol === 'lider_proyecto' || u.rol === 'director_proyecto';
  });

  var [form, setForm] = useState({
    nombreContrato:       contract.nombreContrato || '',
    clienteId:            contract.clienteId || '',
    liderProyectoId:      contract.liderProyectoId || '',
    fechaInicio:          contract.fechaInicio || '',
    fechaFin:             contract.fechaFin || '',
    moneda:               contract.moneda || 'USD',
    montoTotal:           contract.montoTotal != null ? String(contract.montoTotal) : '',
    modalidadFacturacion: contract.modalidadFacturacion || 'cuotas',
    condicionesPago:      contract.condicionesPago || '',
    estado:               contract.estado || 'activo',
  });

  var [saved, setSaved] = useState(false);

  function handleChange(field, value) {
    setForm(function(prev) { return Object.assign({}, prev, { [field]: value }); });
  }

  function handleSubmit(e) {
    e.preventDefault();
    var lider = users.find(function(u) { return u.id === form.liderProyectoId; });
    updateContract(contract.id, {
      nombreContrato:       form.nombreContrato,
      clienteId:            form.clienteId,
      liderProyectoId:      form.liderProyectoId,
      liderProyectoNombre:  lider ? lider.nombre : contract.liderProyectoNombre,
      fechaInicio:          form.fechaInicio,
      fechaFin:             form.fechaFin,
      moneda:               form.moneda,
      montoTotal:           parseFloat(form.montoTotal) || 0,
      modalidadFacturacion: form.modalidadFacturacion,
      condicionesPago:      form.condicionesPago,
      estado:               form.estado,
    });
    setSaved(true);
    setTimeout(onClose, 800);
  }

  return (
    <Modal title={'Editar contrato'} onClose={onClose} maxWidth={580}>
      {saved && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--status-cobrada)' }}>
          ✓ Cambios guardados
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="upload-field-grid">
          <Field label="Nombre del contrato *" span={2}>
            <input className="form-input" value={form.nombreContrato} onChange={function(e) { handleChange('nombreContrato', e.target.value); }} required />
          </Field>
          <Field label="Cliente *">
            <select className="form-select" value={form.clienteId} onChange={function(e) { handleChange('clienteId', e.target.value); }} required>
              {clients.map(function(c) { return <option key={c.id} value={c.id}>{c.nombre}</option>; })}
            </select>
          </Field>
          <Field label="Lider de proyecto">
            <select className="form-select" value={form.liderProyectoId} onChange={function(e) { handleChange('liderProyectoId', e.target.value); }}>
              <option value="">Sin asignar</option>
              {lideres.map(function(u) { return <option key={u.id} value={u.id}>{u.nombre}</option>; })}
            </select>
          </Field>
          <Field label="Fecha inicio">
            <input type="date" className="form-input" value={form.fechaInicio} onChange={function(e) { handleChange('fechaInicio', e.target.value); }} />
          </Field>
          <Field label="Fecha fin">
            <input type="date" className="form-input" value={form.fechaFin} onChange={function(e) { handleChange('fechaFin', e.target.value); }} />
          </Field>
          <Field label="Moneda">
            <select className="form-select" value={form.moneda} onChange={function(e) { handleChange('moneda', e.target.value); }}>
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
            </select>
          </Field>
          <Field label="Monto total">
            <input type="number" className="form-input" value={form.montoTotal} onChange={function(e) { handleChange('montoTotal', e.target.value); }} min="0" />
          </Field>
          <Field label="Modalidad facturacion">
            <select className="form-select" value={form.modalidadFacturacion} onChange={function(e) { handleChange('modalidadFacturacion', e.target.value); }}>
              <option value="cuotas">Cuotas</option>
              <option value="hitos">Hitos / Entregables</option>
              <option value="mensual">Mensual</option>
              <option value="trimestral">Trimestral</option>
              <option value="anual">Anual</option>
              <option value="unica">Pago unico</option>
            </select>
          </Field>
          <Field label="Condiciones de pago" span={2}>
            <input className="form-input" value={form.condicionesPago} onChange={function(e) { handleChange('condicionesPago', e.target.value); }} placeholder="Ej: 30 dias fecha factura" />
          </Field>
          <Field label="Estado">
            <select className="form-select" value={form.estado} onChange={function(e) { handleChange('estado', e.target.value); }}>
              <option value="activo">Activo</option>
              <option value="finalizado">Finalizado</option>
              <option value="suspendido">Suspendido</option>
              <option value="cancelado">Cancelado</option>
            </select>
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
