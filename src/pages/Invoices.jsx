import { useState, useMemo } from 'react';
import { useApp, ROLES } from '../context/AppContext.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import InvoiceActions from '../components/invoices/InvoiceActions.jsx';
import { formatCurrency } from '../utils/currency.js';
import { formatDate, getEffectiveBillingDate } from '../utils/dates.js';
import { INVOICE_STATES, INVOICE_TYPES, INVOICE_ORIGINS } from '../utils/status.js';

function getQuickTabs(invoices, role) {
  var tabs = [{ id: 'all', label: 'Todas', count: invoices.length, states: null }];

  if (role === ROLES.lider || role === ROLES.director) {
    var cv = invoices.filter(function(i) { return i.estado === 'pendiente_validacion_lider'; }).length;
    tabs.push({ id: 'validacion', label: 'Pendiente validacion', count: cv, states: ['pendiente_validacion_lider'] });
  }

  if (role === ROLES.admin || role === ROLES.director) {
    var ce = invoices.filter(function(i) { return i.estado === 'pendiente_de_emitir'; }).length;
    tabs.push({ id: 'emitir', label: 'Pendiente emitir', count: ce, states: ['pendiente_de_emitir'] });

    var cs = invoices.filter(function(i) { return i.estado === 'emitida'; }).length;
    tabs.push({ id: 'enviar', label: 'Por enviar', count: cs, states: ['emitida'] });

    var cc = invoices.filter(function(i) { return i.estado === 'enviada_al_cliente' || i.estado === 'emitida'; }).length;
    tabs.push({ id: 'cobrar', label: 'Por cobrar', count: cc, states: ['enviada_al_cliente', 'emitida'] });
  }

  var vencidas = invoices.filter(function(i) { return i.estado === 'vencida'; }).length;
  if (vencidas > 0) {
    tabs.push({ id: 'vencidas', label: 'Vencidas', count: vencidas, states: ['vencida'], urgent: true });
  }

  var revision = invoices.filter(function(i) { return i.estado === 'requiere_revision'; }).length;
  if (revision > 0) {
    tabs.push({ id: 'revision', label: 'En revision', count: revision, states: ['requiere_revision'] });
  }

  return tabs;
}

export default function Invoices() {
  const { invoices, clients, contracts, getClientById, getContractById, currentRole } = useApp();
  const [search, setSearch] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCurrency, setFilterCurrency] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedId, setSelectedId] = useState(null);

  const quickTabs = useMemo(() => getQuickTabs(invoices, currentRole), [invoices, currentRole]);
  const activeTabDef = quickTabs.find(function(t) { return t.id === activeTab; }) || quickTabs[0];

  const filtered = useMemo(() => {
    return invoices.filter(function(inv) {
      if (activeTabDef && activeTabDef.states && !activeTabDef.states.includes(inv.estado)) return false;
      if (search) {
        var desc = inv.descripcion.toLowerCase();
        var cliente = (getClientById(inv.clienteId) || {}).nombre || '';
        if (!desc.includes(search.toLowerCase()) && !cliente.toLowerCase().includes(search.toLowerCase())) return false;
      }
      if (filterClient && inv.clienteId !== filterClient) return false;
      if (filterState && inv.estado !== filterState) return false;
      if (filterType && inv.tipoFacturacion !== filterType) return false;
      if (filterCurrency && inv.moneda !== filterCurrency) return false;
      return true;
    });
  }, [invoices, search, filterClient, filterState, filterType, filterCurrency, activeTabDef, getClientById]);

  const totals = useMemo(() => ({
    USD: filtered.filter(function(i) { return i.moneda === 'USD'; }).reduce(function(a, i) { return a + i.monto; }, 0),
    ARS: filtered.filter(function(i) { return i.moneda === 'ARS'; }).reduce(function(a, i) { return a + i.monto; }, 0),
  }), [filtered]);

  function handleTabChange(tabId) {
    setActiveTab(tabId);
    setFilterState('');
    setSelectedId(null);
  }

  function clearFilters() {
    setSearch(''); setFilterClient(''); setFilterState(''); setFilterType(''); setFilterCurrency('');
  }

  var currentSelected = selectedId ? invoices.find(function(i) { return i.id === selectedId; }) || null : null;
  var hasFilters = search || filterClient || filterState || filterType || filterCurrency;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Facturacion</div>
          <div className="page-subtitle">
            {filtered.length} facturas
            {totals.USD > 0 ? ' - ' + formatCurrency(totals.USD, 'USD') : ''}
            {totals.ARS > 0 ? ' - ' + formatCurrency(totals.ARS, 'ARS') : ''}
          </div>
        </div>
      </div>

      <div className="invoice-quick-tabs">
        {quickTabs.map(function(tab) {
          return (
            <button
              key={tab.id}
              className={'quick-tab' + (activeTab === tab.id ? ' active' : '') + (tab.urgent ? ' urgent' : '')}
              onClick={function() { handleTabChange(tab.id); }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={'quick-tab-count' + (tab.urgent ? ' urgent' : '')}>{tab.count}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="filters-bar">
        <input
          className="form-input"
          placeholder="Buscar por descripcion o cliente..."
          value={search}
          onChange={function(e) { setSearch(e.target.value); }}
          style={{ minWidth: 220 }}
        />
        <select className="form-select" value={filterClient} onChange={function(e) { setFilterClient(e.target.value); }}>
          <option value="">Todos los clientes</option>
          {clients.map(function(c) { return <option key={c.id} value={c.id}>{c.nombre}</option>; })}
        </select>
        {activeTab === 'all' && (
          <select className="form-select" value={filterState} onChange={function(e) { setFilterState(e.target.value); }}>
            <option value="">Todos los estados</option>
            {Object.entries(INVOICE_STATES).map(function(entry) {
              return <option key={entry[0]} value={entry[0]}>{entry[1]}</option>;
            })}
          </select>
        )}
        <select className="form-select" value={filterType} onChange={function(e) { setFilterType(e.target.value); }}>
          <option value="">Todos los tipos</option>
          {Object.entries(INVOICE_TYPES).map(function(entry) {
            return <option key={entry[0]} value={entry[0]}>{entry[1]}</option>;
          })}
        </select>
        <select className="form-select" value={filterCurrency} onChange={function(e) { setFilterCurrency(e.target.value); }} style={{ maxWidth: 120 }}>
          <option value="">Moneda</option>
          <option value="USD">USD</option>
          <option value="ARS">ARS</option>
        </select>
        {hasFilters && (
          <button className="btn btn-secondary btn-sm" onClick={clearFilters}>X Limpiar</button>
        )}
      </div>

      <div style={{ display: currentSelected ? 'grid' : 'block', gridTemplateColumns: '1fr 400px', gap: 20 }}>
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Descripcion</th>
                  <th>Monto</th>
                  <th>Fecha efectiva</th>
                  <th>Estado</th>
                  <th>Origen</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 40 }}>
                      Sin facturas en esta categoria
                    </td>
                  </tr>
                )}
                {filtered.map(function(inv) {
                  var client = getClientById(inv.clienteId);
                  var effectiveDate = getEffectiveBillingDate(inv);
                  var isSelected = currentSelected && currentSelected.id === inv.id;
                  return (
                    <tr
                      key={inv.id}
                      style={{ cursor: 'pointer', background: isSelected ? 'rgba(79,124,255,0.08)' : undefined }}
                      onClick={function() { setSelectedId(isSelected ? null : inv.id); }}
                    >
                      <td style={{ fontWeight: 600 }}>{client ? client.nombre : inv.clienteId}</td>
                      <td>
                        <div style={{ maxWidth: 220 }}>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{inv.descripcion}</div>
                          {inv.cuotaNumero && (
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                              Cuota {inv.cuotaNumero}/{inv.totalCuotas}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="font-mono">{formatCurrency(inv.monto, inv.moneda)}</td>
                      <td>
                        <div style={{ fontSize: 13 }}>{formatDate(effectiveDate)}</div>
                        {inv.fechaReprogramada && (
                          <div style={{ fontSize: 11, color: 'var(--status-reprogramada)' }}>
                            Rep: {formatDate(inv.fechaReprogramada)}
                          </div>
                        )}
                      </td>
                      <td onClick={function(e) { e.stopPropagation(); }}>
                        <StatusBadge estado={inv.estado} />
                      </td>
                      <td>
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          {INVOICE_ORIGINS[inv.origen] || inv.origen}
                        </span>
                      </td>
                      <td onClick={function(e) { e.stopPropagation(); }}>
                        <InvoiceActions invoice={inv} compact={true} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {currentSelected && (
          <InvoiceDetail
            invoice={currentSelected}
            onClose={function() { setSelectedId(null); }}
            getClientById={getClientById}
            getContractById={getContractById}
          />
        )}
      </div>
    </div>
  );
}

function InvoiceDetail({ invoice, onClose, getClientById, getContractById }) {
  var client = getClientById(invoice.clienteId);
  var contract = getContractById(invoice.contratoId);

  return (
    <div className="card" style={{ height: 'fit-content', maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, position: 'sticky', top: 0, background: 'var(--color-bg-card)', paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ fontWeight: 700, fontSize: 15 }}>Detalle de factura</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>x</button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Acciones</div>
        <InvoiceActions invoice={invoice} compact={false} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
        <Row label="ID" value={invoice.id} />
        <Row label="Cliente" value={client ? client.nombre : null} />
        <Row label="Contrato" value={contract ? contract.nombreContrato : null} />
        <Row label="Descripcion" value={invoice.descripcion} />
        <Row label="Monto" value={formatCurrency(invoice.monto, invoice.moneda)} mono={true} />
        <Row label="Estado" value={<StatusBadge estado={invoice.estado} />} />
        <Row label="Fecha prevista" value={formatDate(invoice.fechaPrevistaFacturacion)} />
        {invoice.fechaReprogramada ? <Row label="Reprogramada" value={formatDate(invoice.fechaReprogramada)} warn={true} /> : null}
        {invoice.fechaEmision ? <Row label="Fecha emision" value={formatDate(invoice.fechaEmision)} /> : null}
        {invoice.fechaVencimiento ? <Row label="Vencimiento" value={formatDate(invoice.fechaVencimiento)} /> : null}
        {invoice.fechaCobro ? <Row label="Fecha cobro" value={formatDate(invoice.fechaCobro)} /> : null}
        {invoice.numeroFactura ? <Row label="Nro. factura" value={invoice.numeroFactura} mono={true} /> : null}
        {invoice.canalEnvio ? <Row label="Canal envio" value={invoice.canalEnvio} /> : null}
        {invoice.destinatarioEnvio ? <Row label="Destinatario" value={invoice.destinatarioEnvio} /> : null}
        <Row label="Condicion pago" value={invoice.condicionPago} />
        {invoice.motivoReprogramacion ? <Row label="Motivo rep." value={invoice.motivoReprogramacion} /> : null}
        <Row label="Lider" value={invoice.liderProyectoNombre} />
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Historial</div>
        <div className="timeline">
          {invoice.historialEstados.slice().reverse().map(function(h, i) {
            return (
              <div key={i} className="timeline-item">
                <div className="timeline-date">{formatDate(h.fecha)} - {h.usuario}</div>
                <div className="timeline-text">{h.comentario}</div>
                {h.estadoNuevo ? <StatusBadge estado={h.estadoNuevo} /> : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono, warn }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, fontFamily: mono ? 'monospace' : undefined, color: warn ? 'var(--status-reprogramada)' : undefined, textAlign: 'right' }}>
        {value || '-'}
      </span>
    </div>
  );
}
