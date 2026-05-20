import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { formatCurrency } from '../utils/currency.js';
import { formatMonthYear } from '../utils/dates.js';
import {
  calculateCollectionProjection,
  calculateRescheduledImpact,
} from '../services/projectionService.js';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';

// Tooltip personalizado para el grafico mensual
function CustomTooltip({ active, payload, label, currency }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 12,
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--color-text)' }}>{label}</div>
      {payload.map(function(entry) {
        return (
          <div key={entry.dataKey} style={{ color: entry.color, marginBottom: 2 }}>
            {entry.name}: {formatCurrency(entry.value, currency || 'USD')}
          </div>
        );
      })}
    </div>
  );
}

// Tooltip para el grafico por cliente
function ClientTooltip({ active, payload, label, currency }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: 'var(--color-bg-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 12,
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--color-text)' }}>{label}</div>
      {payload.map(function(entry) {
        return (
          <div key={entry.dataKey} style={{ color: entry.color, marginBottom: 2 }}>
            {entry.name}: {formatCurrency(entry.value, currency || 'USD')}
          </div>
        );
      })}
    </div>
  );
}

export default function CollectionsProjection() {
  var appCtx = useApp();
  var invoices = appCtx.invoices;
  var getClientById = appCtx.getClientById;

  var [currency, setCurrency] = useState('USD');

  var projection = useMemo(function() {
    return calculateCollectionProjection(invoices);
  }, [invoices]);

  var rescheduledImpact = useMemo(function() {
    return calculateRescheduledImpact(invoices);
  }, [invoices]);

  var months = Object.entries(projection.byMonth).slice(0, 12);

  // Datos para el grafico mensual segun moneda seleccionada
  var chartData = useMemo(function() {
    return months.map(function(entry) {
      var key = entry[0];
      var data = entry[1];
      var obj = {};
      obj.mes = formatMonthYear(key + '-01');
      obj.Cobrado = data.real[currency] || 0;
      obj.Proyectado = data.projected[currency] || 0;
      obj.Riesgo = data.risk[currency] || 0;
      return obj;
    });
  }, [months, currency]);

  // Datos para el grafico por cliente segun moneda seleccionada
  var clientChartData = useMemo(function() {
    var sorted = projection.byClient
      .slice()
      .sort(function(a, b) {
        var bTotal = (b.projected[currency] || 0) + (b.real[currency] || 0);
        var aTotal = (a.projected[currency] || 0) + (a.real[currency] || 0);
        return bTotal - aTotal;
      })
      .slice(0, 8); // top 8 clientes

    return sorted.map(function(item) {
      var client = getClientById(item.clienteId);
      var obj = {};
      obj.name = client ? client.nombre : item.clienteId;
      obj.Cobrado = item.real[currency] || 0;
      obj.Proyectado = item.projected[currency] || 0;
      obj.Riesgo = item.risk[currency] || 0;
      return obj;
    });
  }, [projection.byClient, currency, getClientById]);

  // Formatter para el eje de valores del grafico mensual
  function tickFormatterY(v) {
    if (currency === 'ARS') {
      return v >= 1000000 ? '$' + (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? '$' + (v / 1000).toFixed(0) + 'k' : '$' + v;
    }
    return v >= 1000 ? '$' + (v / 1000).toFixed(0) + 'k' : '$' + v;
  }

  // Formatter para el eje de valores del grafico por cliente (horizontal)
  function tickFormatterX(v) {
    if (currency === 'ARS') {
      return v >= 1000000 ? '$' + (v / 1000000).toFixed(1) + 'M' : v >= 1000 ? '$' + (v / 1000).toFixed(0) + 'k' : '$' + v;
    }
    return v >= 1000 ? '$' + (v / 1000).toFixed(0) + 'k' : '$' + v;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Proyeccion de Cobranzas</div>
          <div className="page-subtitle">Proximos 12 meses</div>
        </div>
      </div>

      {/* KPIs de proyeccion */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card">
          <div className="kpi-label">Cobrado real (USD)</div>
          <div className="kpi-value" style={{ color: 'var(--status-cobrada)', fontSize: 18 }}>
            {formatCurrency(projection.totalReal.USD || 0, 'USD')}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Proyectado (USD)</div>
          <div className="kpi-value" style={{ fontSize: 18 }}>
            {formatCurrency(projection.totalProjected.USD || 0, 'USD')}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">En riesgo (USD)</div>
          <div className="kpi-value" style={{ color: 'var(--status-vencida)', fontSize: 18 }}>
            {formatCurrency(projection.totalRisk.USD || 0, 'USD')}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Cobrado real (ARS)</div>
          <div className="kpi-value" style={{ color: 'var(--status-cobrada)', fontSize: 16 }}>
            {formatCurrency(projection.totalReal.ARS || 0, 'ARS')}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Proyectado (ARS)</div>
          <div className="kpi-value" style={{ fontSize: 16 }}>
            {formatCurrency(projection.totalProjected.ARS || 0, 'ARS')}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Reprogramadas</div>
          <div className="kpi-value" style={{ color: 'var(--status-reprogramada)', fontSize: 18 }}>
            {rescheduledImpact.length}
          </div>
          <div className="kpi-sub">facturas desplazadas</div>
        </div>
      </div>

      {/* Grafico mensual con toggle de moneda */}
      <div className="section">
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="card-title">Proyeccion mensual</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={function() { setCurrency('USD'); }}
                style={{
                  padding: '4px 14px',
                  borderRadius: 20,
                  border: '1px solid ' + (currency === 'USD' ? 'var(--color-primary)' : 'var(--color-border)'),
                  background: currency === 'USD' ? 'var(--color-primary)' : 'transparent',
                  color: currency === 'USD' ? '#fff' : 'var(--color-text-muted)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >USD</button>
              <button
                onClick={function() { setCurrency('ARS'); }}
                style={{
                  padding: '4px 14px',
                  borderRadius: 20,
                  border: '1px solid ' + (currency === 'ARS' ? 'var(--color-primary)' : 'var(--color-border)'),
                  background: currency === 'ARS' ? 'var(--color-primary)' : 'transparent',
                  color: currency === 'ARS' ? '#fff' : 'var(--color-text-muted)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >ARS</button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={tickFormatterY}
                width={52}
              />
              <Tooltip content={function(props) { return <CustomTooltip active={props.active} payload={props.payload} label={props.label} currency={currency} />; }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--color-text-muted)', paddingTop: 8 }} />
              <Bar dataKey="Cobrado" fill="var(--status-cobrada)" radius={[3, 3, 0, 0]} maxBarSize={28} />
              <Bar dataKey="Proyectado" fill="var(--color-primary)" radius={[3, 3, 0, 0]} maxBarSize={28} />
              <Bar dataKey="Riesgo" fill="var(--status-vencida)" radius={[3, 3, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2">
        {/* Grafico por cliente (horizontal) */}
        <div className="section">
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">Por cliente ({currency})</div>
            </div>
            {clientChartData.length === 0 ? (
              <div style={{ color: 'var(--color-text-muted)', fontSize: 13, padding: '12px 0' }}>Sin datos.</div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(160, clientChartData.length * 44)}>
                <BarChart
                  layout="vertical"
                  data={clientChartData}
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={tickFormatterX}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: 'var(--color-text)' }}
                    axisLine={false}
                    tickLine={false}
                    width={110}
                  />
                  <Tooltip content={function(props) { return <ClientTooltip active={props.active} payload={props.payload} label={props.label} currency={currency} />; }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Legend wrapperStyle={{ fontSize: 11, color: 'var(--color-text-muted)', paddingTop: 8 }} />
                  <Bar dataKey="Cobrado" fill="var(--status-cobrada)" radius={[0, 3, 3, 0]} maxBarSize={14} />
                  <Bar dataKey="Proyectado" fill="var(--color-primary)" radius={[0, 3, 3, 0]} maxBarSize={14} />
                  <Bar dataKey="Riesgo" fill="var(--status-vencida)" radius={[0, 3, 3, 0]} maxBarSize={14} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Impacto de reprogramaciones */}
        <div className="section">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Impacto de reprogramaciones</div>
            </div>
            {rescheduledImpact.length === 0 ? (
              <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Sin reprogramaciones.</div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Factura</th><th>Monto</th><th>Mes original</th><th>Mes nuevo</th></tr>
                  </thead>
                  <tbody>
                    {rescheduledImpact.map(function(r) {
                      var client = getClientById(r.clienteId);
                      return (
                        <tr key={r.facturaId}>
                          <td style={{ fontSize: 12 }}>
                            <div style={{ fontWeight: 600 }}>{client ? client.nombre : r.clienteId}</div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>{r.descripcion.slice(0, 40)}</div>
                          </td>
                          <td className="font-mono" style={{ fontSize: 12 }}>{formatCurrency(r.monto, r.moneda)}</td>
                          <td style={{ fontSize: 12, color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>
                            {formatMonthYear(r.fechaOriginal)}
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--status-reprogramada)', fontWeight: 600 }}>
                            {formatMonthYear(r.fechaReprogramada)}
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
      </div>
    </div>
  );
}
