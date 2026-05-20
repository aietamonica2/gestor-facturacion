import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { useApp } from '../../context/AppContext.jsx';

var TIPOS = ['enterprise', 'pyme', 'startup'];
var MONEDAS = ['USD', 'ARS'];

function genId() {
  return 'cli-' + Date.now().toString(36);
}

export default function ClientFormModal({ client, onClose }) {
  var app = useApp();
  var users = app.users;
  var isEdit = !!client;

  var [form, setForm] = useState(function() {
    if (client) {
      return {
        nombre:                client.nombre || '',
        razonSocial:           client.razonSocial || '',
        cuit:                  client.cuit || '',
        contactoAdministrativo: client.contactoAdministrativo || '',
        emailFacturacion:      client.emailFacturacion || '',
        tipoCliente:           client.tipoCliente || 'pyme',
        monedaPreferida:       client.monedaPreferida || 'USD',
        condicionesPagoDefault: client.condicionesPagoDefault || '',
        liderProyectoId:       client.liderProyectoId || '',
        estado:                client.estado || 'activo',
      };
    }
    return {
      nombre:                '',
      razonSocial:           '',
      cuit:                  '',
      contactoAdministrativo: '',
      emailFacturacion:      '',
      tipoCliente:           'pyme',
      monedaPreferida:       'USD',
      condicionesPagoDefault: '30 dias fecha factura',
      liderProyectoId:       '',
      estado:                'activo',
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
    if (!form.nombre.trim()) errs.nombre = 'Requerido';
    if (!form.cuit.trim()) errs.cuit = 'Requerido';
    if (form.emailFacturacion && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.emailFacturacion)) {
      errs.emailFacturacion = 'Email invalido';
    }
    return errs;
  }

  function handleSave() {
    var errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    var lider = users.find(function(u) { return u.id === form.liderProyectoId; });

    var data = Object.assign({}, form, {
      liderProyectoNombre: lider ? lider.nombre : '',
      liderProyectoEmail:  lider ? lider.email : '',
    });

    if (isEdit) {
      app.updateClient(client.id, data);
    } else {
      app.addClient(Object.assign({ id: genId() }, data));
    }

    setSaved(true);
    setTimeout(function() { onClose(); }, 800);
  }

  var liderUsers = users.filter(function(u) {
    return u.rol === 'lider_proyecto' || u.rol === 'director_proyecto';
  });

  return (
    <Modal
      title={isEdit ? 'Editar cliente' : 'Nuevo cliente'}
      onClose={onClose}
      maxWidth={520}
    >
      {saved && (
        <div style={{ marginBottom: 14, padding: '8px 12px', background: 'rgba(16,185,129,0.12)', border: '1px solid #10b98144', borderRadius: 6, fontSize: 13, color: '#10b981' }}>
          {isEdit ? 'Cliente actualizado correctamente.' : 'Cliente creado correctamente.'}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', marginBottom: 18 }}>
        <Field label="Nombre *" error={errors.nombre} span={2}>
          <input
            className="form-input"
            value={form.nombre}
            onChange={function(e) { set('nombre', e.target.value); }}
            placeholder="Nombre comercial"
          />
        </Field>

        <Field label="Razon Social" span={2}>
          <input
            className="form-input"
            value={form.razonSocial}
            onChange={function(e) { set('razonSocial', e.target.value); }}
            placeholder="Razon social completa"
          />
        </Field>

        <Field label="CUIT *" error={errors.cuit}>
          <input
            className="form-input"
            value={form.cuit}
            onChange={function(e) { set('cuit', e.target.value); }}
            placeholder="30-12345678-9"
          />
        </Field>

        <Field label="Tipo de cliente">
          <select className="form-select" value={form.tipoCliente} onChange={function(e) { set('tipoCliente', e.target.value); }}>
            {TIPOS.map(function(t) { return <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>; })}
          </select>
        </Field>

        <Field label="Contacto administrativo" span={2}>
          <input
            className="form-input"
            value={form.contactoAdministrativo}
            onChange={function(e) { set('contactoAdministrativo', e.target.value); }}
            placeholder="Nombre del contacto"
          />
        </Field>

        <Field label="Email de facturacion" error={errors.emailFacturacion} span={2}>
          <input
            className="form-input"
            type="email"
            value={form.emailFacturacion}
            onChange={function(e) { set('emailFacturacion', e.target.value); }}
            placeholder="facturacion@empresa.com"
          />
        </Field>

        <Field label="Moneda preferida">
          <select className="form-select" value={form.monedaPreferida} onChange={function(e) { set('monedaPreferida', e.target.value); }}>
            {MONEDAS.map(function(m) { return <option key={m} value={m}>{m}</option>; })}
          </select>
        </Field>

        <Field label="Condiciones de pago">
          <input
            className="form-input"
            value={form.condicionesPagoDefault}
            onChange={function(e) { set('condicionesPagoDefault', e.target.value); }}
            placeholder="30 dias fecha factura"
          />
        </Field>

        <Field label="Lider de proyecto" span={2}>
          <select className="form-select" value={form.liderProyectoId} onChange={function(e) { set('liderProyectoId', e.target.value); }}>
            <option value="">-- Sin asignar --</option>
            {liderUsers.map(function(u) { return <option key={u.id} value={u.id}>{u.nombre}</option>; })}
          </select>
        </Field>

        {isEdit && (
          <Field label="Estado">
            <select className="form-select" value={form.estado} onChange={function(e) { set('estado', e.target.value); }}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </Field>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
        <button className="btn btn-secondary" onClick={onClose} disabled={saved}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saved}>
          {isEdit ? 'Guardar cambios' : 'Crear cliente'}
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
