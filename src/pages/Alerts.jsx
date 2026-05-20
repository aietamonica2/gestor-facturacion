import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { PriorityBadge } from '../components/ui/Badge.jsx';
import InvoiceActions from '../components/invoices/InvoiceActions.jsx';
import { formatDate } from '../utils/dates.js';

var PRIORITY_ORDER = { critica: 0, alta: 1, media: 2, baja: 3 };

var ALERT_TYPE_LABELS = {
  validacion_lider_2dias:        'Validacion lider',
  factura_vencida:               'Factura vencida',
  renovacion_licencia:           'Renovacion licencia',
  cambio_alcance_no_facturado:   'Cambio de alcance sin facturar',
  cambio_de_alcance_detectado:   'Cambio de alcance detectado',
  revision_contrato:             'Revision contrato',
};

function typeLabel(tipo) {
  return ALERT_TYPE_LABELS[tipo] || tipo.replace(/_/g, ' ');
}

export default function Alerts() {
  var app = useApp();
  var alerts = app.alerts;
  var invoices = app.invoices;
  var dismissAlert = app.dismissAlert;
  var seeAlert = app.seeAlert;
  var getClientById = app.getClientById;

  var [activeTab, setActiveTab] = useState('pendientes');
  var [filterType, setFilterType] = useState('');

  // Conteos para tabs
  var counts = useMemo(function() {
    var pend = alerts.filter(function(a) { return a.estado === 'pendiente'; });
    return {
      pendientes: pend.length,
      criticas:   pend.filter(function(a) { return a.prioridad === 'critica'; }).length,
      altas:      pend.filter(function(a) { return a.prioridad === 'alta'; }).length,
      resueltas:  alerts.filter(function(a) { return a.estado === 'resuelta'; }).length,
    };
  }, [alerts]);

  var alertTypes = useMemo(function() {
    return Array.from(new Set(alerts.map(function(a) { return a.tipo; }))).sort();
  }, [alerts]);

  var filtered = useMemo(function() {
    return alerts.filter(function(a) {
      if (filterType && a.tipo !== filterType) return false;
      if (activeTab === 'pendientes') return a.estado === 'pendiente';
      if (activeTab === 'criticas')   return a.estado === 'pendiente' && a.prioridad === 'critica';
      if (activeTab === 'altas')      return a.estado === 'pendiente' && a.prioridad === 'alta';
      if (activeTab === 'resueltas')  return a.estado === 'resuelta';
      if (activeTab === 'todas')      return true;
      return true;
    }).sort(function(a, b) {
      var pa = PRIORITY_ORDER[a.prioridad] !== undefined ? PRIORITY_ORDER[a.prioridad] : 9;
      var pb = PRIORITY_ORDER[b.prioridad] !== undefined ? PRIORITY_ORDER[b.prioridad] : 9;
      return pa - pb;
    });
  }, [alerts, activeTab, filterType]);

  // Agrupar por prioridad para mostrar separadores
  var groups = useMemo(function() {
    var result = {};
    filtered.forEach(function(a) {
      var key = a.prioridad || 'baja';
      if (!result[key]) result[key] = [];
      result[key].push(a);
    });
    return result;
  }, [filtered]);

  var priorityOrder = ['critica', 'alta', 'media', 'baja'];

  function resolveAll() {
    filtered.forEach(function(a) {
      if (a.estado === 'pendiente') dismissAlert(a.id);
    });
  }

  var pendingInFiltered = filtered.filter(function(a) { return a.estado === 'pendiente'; }).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Alertas</div>
          <div className="page-subtitle">
            {counts.pendientes} pendientes
            {counts.criticas > 0 ? ' - ' + counts.criticas + ' criticas' : ''}
          </div>
        </div>
        {pendingInFiltered > 1 && (
          <button className="btn btn-success btn-sm" onClick={resolveAll} title="Resolver todas las alertas visibles">
            Resolver todas ({pendingInFiltered})
          </button>
        )}
      </div>

      {/* Quick tabs */}
      <div className="invoice-quick-tabs">
        {[
          { id: 'pendientes', label: 'Pendientes',  count: counts.pendientes, urgent: false },
          { id: 'criticas',   label: 'Criticas',    count: counts.criticas,   urgent: true  },
          { id: 'altas',      label: 'Alta prioridad', count: counts.altas,   urgent: false },
          { id: 'resueltas',  label: 'Resueltas',   count: counts.resueltas,  urgent: false },
          { id: 'todas',      label: 'Todas',       count: alerts.length,     urgent: false },
        ].map(function(tab) {
          return (
            <button
              key={tab.id}
              className={'quick-tab' + (activeTab === tab.id ? ' active' : '') + (tab.urgent && tab.count > 0 ? ' urgent' : '')}
              onClick={function() { setActiveTab(tab.id); }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={'quick-tab-count' + (tab.urgent && tab.count > 0 ? ' urgent' : '')}>{tab.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filtro por tipo */}
      <div className="filters-bar">
        <select className="form-select" value={filterType} onChange={function(e) { setFilterType(e.target.value); }}>
          <option value="">Todos los tipos</option>
          {alertTypes.map(function(t) {
            return <option key={t} value={t}>{typeLabel(t)}</option>;
          })}
        </select>
        {filterType && (
          <button className="btn btn-secondary btn-sm" onClick={function() { setFilterType(''); }}>X Limpiar</button>
        )}
      </div>

      {/* Lista agrupada por prioridad */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <div className="empty-state-title">Sin alertas en esta categoria</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {priorityOrder.map(function(priority) {
            var items = groups[priority];
            if (!items || items.length === 0) return null;

            var priorColor = {
              critica: 'var(--priority-critica)',
              alta:    'var(--priority-alta)',
              media:   'var(--priority-media)',
              baja:    'var(--priority-baja)',
            }[priority] || 'var(--color-text-muted)';

            return (
              <div key={priority}>
                {/* Separador de sección */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: priorColor, letterSpacing: '0.6px' }}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)} ({items.length})
                  </div>
                  <div style={{ flex: 1, height: 1, background: priorColor + '33' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {items.map(function(alert) {
                    var client = getClientById(alert.clienteId);
                    var invoice = alert.facturaId ? invoices.find(function(i) { return i.id === alert.facturaId; }) : null;
                    var isValidation = alert.tipo === 'validacion_lider_2dias';

                    return (
                      <div
                        key={alert.id}
                        className="card"
                        style={{
                          borderLeft: '4px solid ' + priorColor,
                          opacity: alert.estado === 'resuelta' ? 0.5 : 1,
                          padding: '14px 16px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            {/* Header de la alerta */}
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                              <PriorityBadge prioridad={alert.prioridad} />
                              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', background: 'var(--color-surface-2)', padding: '2px 8px', borderRadius: 4 }}>
                                {typeLabel(alert.tipo)}
                              </span>
                              {client && (
                                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>
                                  {client.nombre}
                                </span>
                              )}
                              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
                                {formatDate(alert.fechaAlerta)}
                              </span>
                            </div>

                            {/* Mensaje */}
                            <div style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.5 }}>
                              {alert.mensaje}
                            </div>

                            {/* Acciones inline si es validacion con factura */}
                            {isValidation && invoice && alert.estado === 'pendiente' && (
                              <div style={{ marginTop: 10 }}>
                                <InvoiceActions invoice={invoice} compact={true} />
                              </div>
                            )}
                          </div>

                          {/* Botones de estado */}
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexDirection: 'column', alignItems: 'flex-end' }}>
                            {alert.estado === 'pendiente' && (
                              <>
                                <button className="btn btn-secondary btn-xs" onClick={function() { seeAlert(alert.id); }}>
                                  Ver
                                </button>
                                <button className="btn btn-success btn-xs" onClick={function() { dismissAlert(alert.id); }}>
                                  Resolver
                                </button>
                              </>
                            )}
                            {alert.estado === 'vista' && (
                              <button className="btn btn-success btn-xs" onClick={function() { dismissAlert(alert.id); }}>
                                Resolver
                              </button>
                            )}
                            {alert.estado === 'resuelta' && (
                              <span style={{ fontSize: 11, color: 'var(--status-cobrada)' }}>Resuelta</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
