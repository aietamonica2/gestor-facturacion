import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { useApp } from '../context/AppContext.jsx';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge.jsx';
import InvoiceActions from '../components/invoices/InvoiceActions.jsx';
import { formatCurrency } from '../utils/currency.js';
import { formatDate, formatMonthYear, daysUntil, getEffectiveBillingDate, nextMonths, toMonthKey } from '../utils/dates.js';
import {
  getInvoicesDueSoon,
  getOverdueInvoices,
  getUpcomingLicenseRenewals,
  getInvoicesPendingLeaderValidation,
} from '../services/projectionService.js';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--color-text)' }}>{label}</div>
      {payload.map(function(p) {
        return (
          <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
            {p.name}: {typeof p.value === 'number' ? '$' + p.value.toLocaleString() : p.value}
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  var app = useApp();
  var invoices = app.invoices;
  var allInvoices = app.allInvoices;
  var licenses = app.licenses;
  var alerts = app.alerts;
  var getClientById = app.getClientById;

  var thisMonth = new Date().toISOString().slice(0, 7);

  var toInvoiceThisMonth = invoices.filter(function(i) {
    var date = i.fechaReprogramada || i.fechaPrevistaFacturacion || '';
    return date.startsWith(thisMonth) && !['cobrada','cancelada','emitida','enviada_al_cliente'].includes(i.estado);
  });

  var collected = (allInvoices || invoices).filter(function(i) { return i.estado === 'cobrada'; });
  var overdue = getOverdueInvoices(invoices);
  var rescheduled = invoices.filter(function(i) { return i.estado === 'reprogramada'; });
  var pendingLeader = getInvoicesPendingLeaderValidation(invoices);
  var upcomingRenewals = getUpcomingLicenseRenewals(licenses, 90);
  var dueSoon = getInvoicesDueSoon(invoices, 15);

  var totalUSDToInvoice = toInvoiceThisMonth.filter(function(i) { return i.moneda === 'USD'; }).reduce(function(a,i) { return a + i.monto; }, 0);
  var totalARSToInvoice = toInvoiceThisMonth.filter(function(i) { return i.moneda === 'ARS'; }).reduce(function(a,i) { return a + i.monto; }, 0);

  var pendingAlerts = alerts.filter(function(a) { return a.estado === 'pendiente'; });
  var criticalAlerts = pendingAlerts.filter(function(a) { return a.prioridad === 'critica' || a.prioridad === 'alta'; });

  // Panel "Hoy": vencidas + lider vence hoy + renovaciones <= 7 dias
  var todayItems = useMemo(function() {
    var items = [];
    overdue.forEach(function(inv) {
      var client = getClientById(inv.clienteId);
      items.push({ type: 'vencida', label: 'Factura vencida', color: 'var(--status-vencida)', invoice: inv, client: client, urgency: 0 });
    });
    pendingLeader.forEach(function(inv) {
      var days = daysUntil(getEffectiveBillingDate(inv));
      if (days !== null && days <= 1) {
        var client = getClientById(inv.clienteId);
        items.push({ type: 'validar', label: days === 0 ? 'Validar HOY' : 'Validar manana', color: 'var(--status-pendiente-lider)', invoice: inv, client: client, days: days, urgency: 1 });
      }
    });
    upcomingRenewals.filter(function(l) { return daysUntil(l.fechaRenovacion) <= 7; }).forEach(function(lic) {
      var client = getClientById(lic.clienteId);
      var days = daysUntil(lic.fechaRenovacion);
      items.push({ type: 'renovacion', label: 'Renovar licencia', color: 'var(--status-reprogramada)', license: lic, client: client, days: days, urgency: 2 });
    });
    return items.sort(function(a, b) { return a.urgency - b.urgency; });
  }, [overdue, pendingLeader, upcomingRenewals, getClientById]);

  var projectionChartData = useMemo(function() {
    var months = nextMonths(6);
    var REAL   = ['cobrada'];
    var PROJ   = ['planificada','pendiente_validacion_lider','pendiente_de_emitir','emitida','enviada_al_cliente','reprogramada'];
    var RISK   = ['vencida','requiere_revision'];
    return months.map(function(key) {
      var mi = invoices.filter(function(i) { return toMonthKey(getEffectiveBillingDate(i)) === key; });
      return {
        mes: formatMonthYear(key + '-01'),
        Cobrado:    mi.filter(function(i) { return REAL.includes(i.estado) && i.moneda === 'USD'; }).reduce(function(a,i) { return a+i.monto; }, 0),
        Proyectado: mi.filter(function(i) { return PROJ.includes(i.estado) && i.moneda === 'USD'; }).reduce(function(a,i) { return a+i.monto; }, 0),
        Riesgo:     mi.filter(function(i) { return RISK.includes(i.estado) && i.moneda === 'USD'; }).reduce(function(a,i) { return a+i.monto; }, 0),
      };
    });
  }, [invoices]);

  var statusChartData = useMemo(function() {
    var STATE_COLORS = {
      planificada:               'var(--status-planificada)',
      pendiente_validacion_lider:'var(--status-pendiente-lider)',
      pendiente_de_emitir:       'var(--status-pendiente-emitir)',
      emitida:                   'var(--status-emitida)',
      enviada_al_cliente:        'var(--status-enviada)',
      vencida:                   'var(--status-vencida)',
      cobrada:                   'var(--status-cobrada)',
      reprogramada:              'var(--status-reprogramada)',
      requiere_revision:         'var(--status-revision)',
    };
    var STATE_LABELS = {
      planificada:               'Planificada',
      pendiente_validacion_lider:'Pend. lider',
      pendiente_de_emitir:       'Pend. emitir',
      emitida:                   'Emitida',
      enviada_al_cliente:        'Enviada',
      vencida:                   'Vencida',
      cobrada:                   'Cobrada',
      reprogramada:              'Reprogramada',
      requiere_revision:         'En revision',
    };
    var counts = {};
    invoices.forEach(function(i) {
      counts[i.estado] = (counts[i.estado] || 0) + 1;
    });
    return Object.keys(STATE_LABELS)
      .filter(function(k) { return counts[k] > 0; })
      .map(function(k) { return { name: STATE_LABELS[k], value: counts[k], color: STATE_COLORS[k] || '#888' }; });
  }, [invoices]);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Vision general del portfolio</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-label">Facturar este mes</div>
          <div className="kpi-value" style={{ color: 'var(--color-primary)', fontSize: 18 }}>
            {totalUSDToInvoice > 0 ? formatCurrency(totalUSDToInvoice, 'USD') : formatCurrency(totalARSToInvoice, 'ARS')}
          </div>
          <div className="kpi-sub">{toInvoiceThisMonth.length} facturas pendientes</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total cobrado</div>
          <div className="kpi-value" style={{ color: 'var(--status-cobrada)', fontSize: 18 }}>
            {formatCurrency(collected.filter(function(i) { return i.moneda === 'USD'; }).reduce(function(a,i) { return a+i.monto; }, 0), 'USD')}
          </div>
          <div className="kpi-sub">{collected.length} facturas cobradas</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Facturas vencidas</div>
          <div className="kpi-value" style={{ color: overdue.length > 0 ? 'var(--status-vencida)' : 'var(--status-cobrada)', fontSize: 24 }}>
            {overdue.length}
          </div>
          <div className="kpi-sub">requieren atencion urgente</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Pendiente validacion lider</div>
          <div className="kpi-value" style={{ color: pendingLeader.length > 0 ? 'var(--status-pendiente-lider)' : 'var(--color-text-muted)', fontSize: 24 }}>
            {pendingLeader.length}
          </div>
          <div className="kpi-sub">por confirmar</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Reprogramadas</div>
          <div className="kpi-value" style={{ color: 'var(--status-reprogramada)', fontSize: 24 }}>{rescheduled.length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Alertas criticas</div>
          <div className="kpi-value" style={{ color: criticalAlerts.length > 0 ? 'var(--priority-critica)' : 'var(--status-cobrada)', fontSize: 24 }}>
            {criticalAlerts.length}
          </div>
          <div className="kpi-sub">{pendingAlerts.length} alertas pendientes total</div>
        </div>
      </div>

      {/* Panel "LO QUE NECESITAS HACER HOY" */}
      {todayItems.length > 0 && (
        <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid var(--priority-critica)' }}>
          <div className="card-header" style={{ marginBottom: 12 }}>
            <div className="card-title" style={{ color: 'var(--priority-critica)' }}>Lo que necesitas hacer hoy</div>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{todayItems.length} accion(es) urgente(s)</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {todayItems.map(function(item, idx) {
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--color-surface-2)', borderRadius: 8, borderLeft: '3px solid ' + item.color }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: item.color, fontWeight: 700, marginBottom: 2 }}>
                      {item.label}
                      {item.days !== undefined && item.days > 0 ? ' (en ' + item.days + 'd)' : ''}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {item.client ? item.client.nombre : ''}
                      {item.invoice ? ' — ' + item.invoice.descripcion.slice(0, 50) : ''}
                      {item.license ? ' — ' + item.license.nombreLicencia : ''}
                    </div>
                    {item.invoice && (
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                        {formatCurrency(item.invoice.monto, item.invoice.moneda)}
                      </div>
                    )}
                  </div>
                  {item.invoice && (
                    <div onClick={function(e) { e.stopPropagation(); }}>
                      <InvoiceActions invoice={item.invoice} compact={true} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Facturas pendientes de validacion lider */}
      {pendingLeader.length > 0 && (
        <div className="section" style={{ marginBottom: 24 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">Pendiente validacion lider ({pendingLeader.length})</div>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th><th>Descripcion</th><th>Monto</th><th>Fecha</th><th>Dias</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingLeader.map(function(inv) {
                    var client = getClientById(inv.clienteId);
                    var effectiveDate = getEffectiveBillingDate(inv);
                    var days = daysUntil(effectiveDate);
                    return (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: 600 }}>{client ? client.nombre : inv.clienteId}</td>
                        <td style={{ maxWidth: 200, fontSize: 13 }}>{inv.descripcion}</td>
                        <td className="font-mono">{formatCurrency(inv.monto, inv.moneda)}</td>
                        <td>{formatDate(effectiveDate)}</td>
                        <td>
                          <span style={{ fontWeight: 700, color: days === 0 ? 'var(--priority-critica)' : 'var(--priority-alta)' }}>
                            {days === 0 ? 'HOY' : days < 0 ? Math.abs(days) + 'd atras' : days + 'd'}
                          </span>
                        </td>
                        <td><InvoiceActions invoice={inv} compact={true} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Graficos */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Proyeccion mensual (USD)</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={projectionChartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
              <XAxis dataKey="mes" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={function(v) { return v >= 1000 ? '$' + (v/1000).toFixed(0) + 'k' : '$' + v; }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--color-text-muted)' }} />
              <Bar dataKey="Cobrado"    fill="var(--status-cobrada)"  radius={[3,3,0,0]} />
              <Bar dataKey="Proyectado" fill="var(--color-primary)"   radius={[3,3,0,0]} />
              <Bar dataKey="Riesgo"     fill="var(--status-vencida)"  radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Estado de las facturas</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusChartData} layout="vertical" margin={{ top: 4, right: 24, left: 60, bottom: 0 }}>
              <XAxis type="number" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} width={58} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0,3,3,0]} name="Facturas">
                {statusChartData.map(function(entry, index) {
                  return <Cell key={'cell-' + index} fill={entry.color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alertas criticas + Renovaciones */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Alertas activas</div>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{criticalAlerts.length} altas/criticas</span>
          </div>
          {criticalAlerts.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>Sin alertas criticas</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {criticalAlerts.slice(0, 5).map(function(alert) {
                return (
                  <div key={alert.id} style={{ padding: '10px 12px', borderRadius: 8, background: 'var(--color-surface-2)', borderLeft: '3px solid ' + (alert.prioridad === 'critica' ? 'var(--priority-critica)' : 'var(--priority-alta)') }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <PriorityBadge prioridad={alert.prioridad} />
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{formatDate(alert.fechaAlerta)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text)' }}>{alert.mensaje}</div>
                  </div>
                );
              })}
              {criticalAlerts.length > 5 && (
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', padding: '4px 0' }}>
                  +{criticalAlerts.length - 5} mas en Alertas
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Renovaciones proximas</div>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>proximos 90 dias</span>
          </div>
          {upcomingRenewals.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>Sin renovaciones proximas</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Licencia</th><th>Cliente</th><th>Monto</th><th>Renovacion</th><th>Dias</th></tr>
                </thead>
                <tbody>
                  {upcomingRenewals.slice(0, 6).map(function(lic) {
                    var client = getClientById(lic.clienteId);
                    var days = daysUntil(lic.fechaRenovacion);
                    return (
                      <tr key={lic.id}>
                        <td style={{ fontWeight: 600, fontSize: 13 }}>{lic.nombreLicencia}</td>
                        <td style={{ fontSize: 12 }}>{client ? client.nombre : ''}</td>
                        <td className="font-mono" style={{ fontSize: 12 }}>{formatCurrency(lic.montoAnual, lic.moneda)}</td>
                        <td style={{ fontSize: 12 }}>{formatDate(lic.fechaRenovacion)}</td>
                        <td>
                          <span style={{ fontWeight: 700, color: days <= 30 ? 'var(--priority-critica)' : days <= 60 ? 'var(--priority-alta)' : 'var(--color-text-muted)' }}>
                            {days}d
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Facturas proximas (15 dias) */}
      {dueSoon.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div className="card-title">Por facturar en los proximos 15 dias ({dueSoon.length})</div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Cliente</th><th>Descripcion</th><th>Monto</th><th>Fecha</th><th>Dias</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {dueSoon.slice(0, 8).map(function(inv) {
                  var client = getClientById(inv.clienteId);
                  var effectiveDate = getEffectiveBillingDate(inv);
                  var days = daysUntil(effectiveDate);
                  return (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{client ? client.nombre : inv.clienteId}</td>
                      <td style={{ fontSize: 12, maxWidth: 200 }}>{inv.descripcion}</td>
                      <td className="font-mono" style={{ fontSize: 12 }}>{formatCurrency(inv.monto, inv.moneda)}</td>
                      <td style={{ fontSize: 12 }}>{formatDate(effectiveDate)}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: days <= 3 ? 'var(--priority-alta)' : 'var(--color-text-muted)' }}>
                          {days}d
                        </span>
                      </td>
                      <td><StatusBadge estado={inv.estado} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
