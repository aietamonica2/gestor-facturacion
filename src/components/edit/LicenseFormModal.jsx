import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { useApp } from '../../context/AppContext.jsx';

var TIPOS = ['Enterprise', 'Professional', 'Standard', 'Starter'];
var MONEDAS = ['USD', 'ARS'];
var ESTADOS = ['activa', 'proxima_a_vencer', 'vencida', 'suspendida', 'cancelada'];

function genId() {
  return 'lic-' + Date.now().toString(36);
}

export default function LicenseFormModal({ license, onClose }) {
  var app = useApp();
  var clients = app.clients;
  var isEdit = !!license;

  var [form, setForm] = useState(function() {
    if (license) {
      return {
        clienteId:                license.clienteId || '',
        nombreLicencia:           license.nombreLicencia || '',
        tipoLicencia:             license.tipoLicencia || 'Standard',
        cantidadUsuarios:         license.cantidadUsuarios || '',
        montoAnual:               license.montoAnual || '',
        moneda:                   license.moneda || 'USD',
        fechaInicio:              license.fechaInicio || '',
        fechaRenovacion:          license.fechaRenovacion || '',
        estado:                   license.estado || 'activa',
        facturacionAutomatica:    license.facturacionAutomatica || false,
        diasAlertaAntesRenovacion: license.diasAlertaAntesRenovacion || 30,
        requiereValidacionLider:  license.requiereValidacionLider || false,
        // Campos extra
        modulosIncluidos:         license.modulosIncluidos || '',
        contactoTecnico:          license.contactoTecnico || '',
        emailContactoTecnico:     license.emailContactoTecnico || '',
        notas:                    license.notas || '',
      };
    }
    return {
      clienteId: '',
      nombreLicencia: '',
      tipoLicencia: 'Standard',
      cantidadUsuarios: '',
      montoAnual: '',
      moneda: 'USD',
      fechaInicio: '',
      fechaRenovacion: '',
      estado: 'activa',
      facturacionAutomatica: false,
      diasAlertaAntesRenovacion: 30,
      requiereValidacionLider: false,
      modulosIncluidos: '',
      contactoTecnico: '',
      emailContactoTecnico: '',
      notas: '',
    };
  });

  var [saved, setSaved] = useState(false);
  var [errors, setErrors] = useState({});

  function set(field, value) {
    setForm(function(prev) { return Object.assign({}, prev, { [field]: value }); });
    setErrors(function(prev) { return Object.assign({}, prev, { [field]: null }); });
  }

  function validate() {
    var errs = {};
    if (!form.clienteId) errs.clienteId = 'Requerido';
    if (!form.nombreLicencia.trim()) errs.nombreLicencia = 'Requerido';
    if (!form.montoAnual || isNaN(Number(form.montoAnual))) errs.montoAnual = 'Debe ser un numero';
    if (!form.fechaInicio) errs.fechaInicio = 'Requerido';
    if (!form.fechaRenovacion) errs.fechaRenovacion = 'Requerido';
    if (form.emailContactoTecnico && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailContactoTecnico)) {
      errs.emailContactoTecnico = 'Email invalido';
    }
    return errs;
  }

  function handleSave() {
    var errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    var data = Object.assign({}, form, {
      montoAnual:               Number(form.montoAnual),
      cantidadUsuarios:         Number(form.cantidadUsuarios) || 0,
      diasAlertaAntesRenovacion: Number(form.diasAlertaAntesRenovacion) || 30,
    });

    if (isEdit) {
      app.updateLicense(license.id, data);
    } else {
      app.addLicense(Object.assign({ id: genId(), ultimaFacturaId: null }, data));
    }

    setSaved(true);
    setTimeout(function() { onClose(); }, 800);
  }

  return (
    <Modal
      title={isEdit ? 'Editar licencia' : 'Nueva licencia'}
      onClose={onClose}
      maxWidth={560}
    >
      {saved && (
        <div style={{ marginBottom: 14, padding: '8px 12px', background: 'rgba(16,185,129,0.12)', border: '1px solid #10b98144', borderRadius: 6, fontSize: 13, color: '#10b981' }}>
          {isEdit ? 'Licencia actualizada correctamente.' : 'Licencia creada correctamente.'}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 8 }}>

        <Field label="Cliente *" error={errors.clienteId} span={2}>
          <select className="form-select" value={form.clienteId} onChange={function(e) { set('clienteId', e.target.value); }}>
            <option value="">-- Seleccionar cliente --</option>
            {clients.map(function(c) { return <option key={c.id} value={c.id}>{c.nombre}</option>; })}
          </select>
        </Field>

        <Field label="Nombre de la licencia *" error={errors.nombreLicencia} span={2}>
          <input className="form-input" value={form.nombreLicencia} onChange={function(e) { set('nombreLicencia', e.target.value); }} placeholder="ej: ERP Enterprise — 200 usuarios" />
        </Field>

        <Field label="Tipo">
          <select className="form-select" value={form.tipoLicencia} onChange={function(e) { set('tipoLicencia', e.target.value); }}>
            {TIPOS.map(function(t) { return <option key={t} value={t}>{t}</option>; })}
          </select>
        </Field>

        <Field label="Cantidad de usuarios">
          <input className="form-input" type="number" min="0" value={form.cantidadUsuarios} onChange={function(e) { set('cantidadUsuarios', e.target.value); }} placeholder="0" />
        </Field>

        <Field label="Monto anual *" error={errors.montoAnual}>
          <input className="form-input" type="number" min="0" value={form.montoAnual} onChange={function(e) { set('montoAnual', e.target.value); }} placeholder="0" />
        </Field>

        <Field label="Moneda">
          <select className="form-select" value={form.moneda} onChange={function(e) { set('moneda', e.target.value); }}>
            {MONEDAS.map(function(m) { return <option key={m} value={m}>{m}</option>; })}
          </select>
        </Field>

        <Field label="Fecha inicio *" error={errors.fechaInicio}>
          <input className="form-input" type="date" value={form.fechaInicio} onChange={function(e) { set('fechaInicio', e.target.value); }} />
        </Field>

        <Field label="Fecha renovacion *" error={errors.fechaRenovacion}>
          <input className="form-input" type="date" value={form.fechaRenovacion} onChange={function(e) { set('fechaRenovacion', e.target.value); }} />
        </Field>

        <Field label="Estado">
          <select className="form-select" value={form.estado} onChange={function(e) { set('estado', e.target.value); }}>
            {ESTADOS.map(function(s) { return <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>; })}
          </select>
        </Field>

        <Field label="Dias alerta antes de renovar">
          <input className="form-input" type="number" min="0" value={form.diasAlertaAntesRenovacion} onChange={function(e) { set('diasAlertaAntesRenovacion', e.target.value); }} />
        </Field>

        <Field label="Facturacion automatica">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.facturacionAutomatica} onChange={function(e) { set('facturacionAutomatica', e.target.checked); }} />
            <span style={{ fontSize: 13 }}>Generar factura automaticamente al renovar</span>
          </label>
        </Field>

        <Field label="Requiere validacion lider">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.requiereValidacionLider} onChange={function(e) { set('requiereValidacionLider', e.target.checked); }} />
            <span style={{ fontSize: 13 }}>Si antes de facturar</span>
          </label>
        </Field>

      </div>

      {/* Campos extra */}
      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Informacion adicional</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>

          <Field label="Modulos incluidos" span={2}>
            <input className="form-input" value={form.modulosIncluidos} onChange={function(e) { set('modulosIncluidos', e.target.value); }} placeholder="ej: Core, Analytics, Reportes" />
          </Field>

          <Field label="Contacto tecnico">
            <input className="form-input" value={form.contactoTecnico} onChange={function(e) { set('contactoTecnico', e.target.value); }} placeholder="Nombre del contacto" />
          </Field>

          <Field label="Email contacto tecnico" error={errors.emailContactoTecnico}>
            <input className="form-input" type="email" value={form.emailContactoTecnico} onChange={function(e) { set('emailContactoTecnico', e.target.value); }} placeholder="tecnico@empresa.com" />
          </Field>

          <Field label="Notas internas" span={2}>
            <textarea
              className="form-input"
              value={form.notas}
              onChange={function(e) { set('notas', e.target.value); }}
              placeholder="Observaciones, condiciones especiales, historial de negociacion..."
              rows={3}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
          </Field>

        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
        <button className="btn btn-secondary" onClick={onClose} disabled={saved}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saved}>
          {isEdit ? 'Guardar cambios' : 'Crear licencia'}
        </button>
      </div>
    </Modal>
  );
}

function Field({ label, children, error, span }) {
  var style = span ? { gridColumn: 'span ' + span } : {};
  return (
    <div style={style}>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
        {label}
      </label>
      {children}
      {error && <div style={{ fontSize: 11, color: 'var(--status-vencida)', marginTop: 3 }}>{error}</div>}
    </div>
  );
}
