import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { formatCurrency } from '../utils/currency.js';
import ClientFormModal from '../components/edit/ClientFormModal.jsx';

// Calcula estado de salud de un cliente segun sus facturas
function clientHealth(clientInvoices) {
  var vencidas = clientInvoices.filter(function(i) { return i.estado === 'vencida'; }).length;
  var revision = clientInvoices.filter(function(i) { return i.estado === 'requiere_revision'; }).length;
  var pendLider = clientInvoices.filter(function(i) { return i.estado === 'pendiente_validacion_lider'; }).length;
  if (vencidas > 0) return { level: 'critico', label: 'Critico', color: 'var(--status-vencida)', icon: 'X' };
  if (revision > 0) return { level: 'revision', label: 'Revision', color: 'var(--status-revision)', icon: '!' };
  if (pendLider > 0) return { level: 'atencion', label: 'Atencion', color: 'var(--status-reprogramada)', icon: '~' };
  return { level: 'ok', label: 'OK', color: 'var(--status-cobrada)', icon: 'OK' };
}

export default function Clients() {
  var app = useApp();
  var clients = app.clients;
  var invoices = app.invoices;
  var licenses = app.licenses;
  var deleteClient = app.deleteClient;

  var [search, setSearch]           = useState('');
  var [filterHealth, setFilterHealth] = useState('');
  var [showCreate, setShowCreate]   = useState(false);
  var [editingClient, setEditingClient] = useState(null);
  var [confirmDelete, setConfirmDelete] = useState(null);

  // KPIs globales
  var kpis = useMemo(function() {
    var active = invoices.filter(function(i) { return !['cobrada','cancelada'].includes(i.estado); });
    var usdPending = active.filter(function(i) { return i.moneda === 'USD'; }).reduce(function(a,i) { return a + i.monto; }, 0);
    var arsPending = active.filter(function(i) { return i.moneda === 'ARS'; }).reduce(function(a,i) { return a + i.monto; }, 0);
    var usdCollected = invoices.filter(function(i) { return i.estado === 'cobrada' && i.moneda === 'USD'; }).reduce(function(a,i) { return a + i.monto; }, 0);
    var withOverdue = new Set(invoices.filter(function(i) { return i.estado === 'vencida'; }).map(function(i) { return i.clienteId; })).size;
    var withPendLider = new Set(invoices.filter(function(i) { return i.estado === 'pendiente_validacion_lider'; }).map(function(i) { return i.clienteId; })).size;
    return { usdPending, arsPending, usdCollected, withOverdue, withPendLider };
  }, [invoices]);

  var filtered = useMemo(function() {
    return clients.filter(function(c) {
      if (search && !c.nombre.toLowerCase().includes(search.toLowerCase()) && !(c.cuit || '').includes(search)) return false;
      if (filterHealth) {
        var ci = invoices.filter(function(i) { return i.clienteId === c.id; });
        var h = clientHealth(ci);
        if (h.level !== filterHealth) return false;
      }
      return true;
    });
  }, [clients, invoices, search, filterHealth]);

  function handleDelete(client) {
    var activeInvoices = invoices.filter(function(i) {
      return i.clienteId === client.id && !['cobrada','cancelada'].includes(i.estado);
    });
    if (activeInvoices.length > 0) {
      setConfirmDelete({ client: client, blocked: true, count: activeInvoices.length });
    } else {
      setConfirmDelete({ client: client, blocked: false });
    }
  }

  function confirmAndDelete() {
    deleteClient(confirmDelete.client.id);
    setConfirmDelete(null);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Clientes</div>
          <div className="page-subtitle">{clients.length} clientes</div>
        </div>
        <button className="btn btn-primary" onClick={function() { setShowCreate(true); }}>
          + Nuevo cliente
        </button>
      </div>

      {showCreate && (
        <ClientFormModal onClose={function() { setShowCreate(false); }} />
      )}
      {editingClient && (
        <ClientFormModal client={editingClient} onClose={function() { setEditingClient(null); }} />
      )}

      {/* Dialogo de confirmacion para eliminar */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={function() { setConfirmDelete(null); }}>
          <div className="modal-box" style={{ maxWidth: 420 }} onClick={function(e) { e.stopPropagation(); }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>
              {confirmDelete.blocked ? 'No se puede eliminar' : 'Confirmar eliminacion'}
            </div>
            {confirmDelete.blocked ? (
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>
                <strong>{confirmDelete.client.nombre}</strong> tiene {confirmDelete.count} factura(s) activa(s).
                No es posible eliminar un cliente con facturas pendientes.
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>
                Vas a eliminar a <strong>{confirmDelete.client.nombre}</strong>. Esta accion no se puede deshacer.
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn btn-secondary" onClick={function() { setConfirmDelete(null); }}>
                {confirmDelete.blocked ? 'Entendido' : 'Cancelar'}
              </button>
              {!confirmDelete.blocked && (
                <button
                  className="btn btn-primary"
                  style={{ background: 'var(--status-vencida)', borderColor: 'var(--status-vencida)' }}
                  onClick={confirmAndDelete}
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-card">
          <div className="kpi-label">Pendiente USD</div>
          <div className="kpi-value" style={{ color: 'var(--color-primary)', fontSize: 17 }}>{formatCurrency(kpis.usdPending, 'USD')}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Pendiente ARS</div>
          <div className="kpi-value" style={{ fontSize: 15 }}>{formatCurrency(kpis.arsPending, 'ARS')}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Cobrado USD</div>
          <div className="kpi-value" style={{ color: 'var(--status-cobrada)', fontSize: 17 }}>{formatCurrency(kpis.usdCollected, 'USD')}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Clientes con vencidas</div>
          <div className="kpi-value" style={{ color: kpis.withOverdue > 0 ? 'var(--status-vencida)' : 'var(--status-cobrada)', fontSize: 22 }}>
            {kpis.withOverdue}
          </div>
          <div className="kpi-sub">de {clients.length} clientes</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Pend. validacion lider</div>
          <div className="kpi-value" style={{ color: kpis.withPendLider > 0 ? 'var(--status-pendiente-lider)' : 'var(--color-text-muted)', fontSize: 22 }}>
            {kpis.withPendLider}
          </div>
          <div className="kpi-sub">clientes afectados</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total licencias</div>
          <div className="kpi-value" style={{ fontSize: 22 }}>{licenses.length}</div>
          <div className="kpi-sub">{licenses.filter(function(l) { return l.estado === 'proxima_a_vencer'; }).length} proximas a vencer</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-bar">
        <input
          className="form-input"
          placeholder="Buscar por nombre o CUIT..."
          value={search}
          onChange={function(e) { setSearch(e.target.value); }}
        />
        <select className="form-select" value={filterHealth} onChange={function(e) { setFilterHealth(e.target.value); }} style={{ maxWidth: 200 }}>
          <option value="">Todos los estados</option>
          <option value="critico">Critico (vencidas)</option>
          <option value="revision">Requiere revision</option>
          <option value="atencion">Atencion (validar)</option>
          <option value="ok">OK</option>
        </select>
        {(search || filterHealth) && (
          <button className="btn btn-secondary btn-sm" onClick={function() { setSearch(''); setFilterHealth(''); }}>Limpiar</button>
        )}
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Salud</th>
                <th>Cliente</th>
                <th>CUIT</th>
                <th>Moneda</th>
                <th>Lider</th>
                <th>Facturas activas</th>
                <th>Pendiente USD</th>
                <th>Vencidas</th>
                <th>Licencias</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)' }}>Sin resultados</td></tr>
              )}
              {filtered.map(function(client) {
                var ci = invoices.filter(function(i) { return i.clienteId === client.id; });
                var active = ci.filter(function(i) { return !['cobrada','cancelada'].includes(i.estado); });
                var vencidas = ci.filter(function(i) { return i.estado === 'vencida'; }).length;
                var usdPending = active.filter(function(i) { return i.moneda === 'USD'; }).reduce(function(a,i) { return a + i.monto; }, 0);
                var clientLicenses = licenses.filter(function(l) { return l.clienteId === client.id; });
                var health = clientHealth(ci);
                return (
                  <tr key={client.id} style={{ background: health.level === 'critico' ? 'rgba(239,68,68,0.04)' : undefined }}>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 5px', borderRadius: 4,
                          background: health.level === 'critico' ? 'rgba(239,68,68,0.15)' :
                                      health.level === 'revision' ? 'rgba(245,158,11,0.15)' :
                                      health.level === 'atencion' ? 'rgba(251,146,60,0.15)' : 'rgba(16,185,129,0.12)',
                          color: health.color,
                        }}
                        title={health.label}
                      >
                        {health.icon}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{client.nombre}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{client.razonSocial}</div>
                    </td>
                    <td className="font-mono" style={{ fontSize: 12 }}>{client.cuit}</td>
                    <td>{client.monedaPreferida}</td>
                    <td style={{ fontSize: 13 }}>{client.liderProyectoNombre}</td>
                    <td style={{ fontWeight: 600 }}>{active.length}</td>
                    <td className="font-mono">{usdPending > 0 ? formatCurrency(usdPending, 'USD') : '-'}</td>
                    <td>
                      {vencidas > 0
                        ? <span style={{ color: 'var(--status-vencida)', fontWeight: 700 }}>{vencidas}</span>
                        : <span style={{ color: 'var(--color-text-muted)' }}>-</span>}
                    </td>
                    <td>{clientLicenses.length || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={function() { setEditingClient(client); }}
                          title="Editar cliente"
                        >
                          Editar
                        </button>
                        <Link to={'/clientes/' + client.id} className="btn btn-secondary btn-sm">
                          Ver
                        </Link>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--status-vencida)', borderColor: 'rgba(239,68,68,0.3)' }}
                          onClick={function() { handleDelete(client); }}
                          title="Eliminar cliente"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
