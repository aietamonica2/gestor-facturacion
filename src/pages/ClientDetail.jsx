import { useParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { StatusBadge, LicenseBadge } from '../components/ui/Badge.jsx';
import InvoiceActions from '../components/invoices/InvoiceActions.jsx';
import { formatCurrency } from '../utils/currency.js';
import { formatDate, getEffectiveBillingDate } from '../utils/dates.js';

export default function ClientDetail() {
  const { clientId } = useParams();
  const { getClientById, getInvoicesByClient, getContractsByClient, getLicensesByClient, getScopeChangesByClient } = useApp();

  const client = getClientById(clientId);
  if (!client) return <div className="empty-state"><div className="empty-state-title">Cliente no encontrado</div></div>;

  const clientInvoices = getInvoicesByClient(clientId);
  const contracts = getContractsByClient(clientId);
  const licenses = getLicensesByClient(clientId);
  const scopeChanges = getScopeChangesByClient(clientId);

  const pending = clientInvoices.filter((i) => !['cobrada', 'cancelada'].includes(i.estado));
  const overdue = clientInvoices.filter((i) => i.estado === 'vencida');

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/clientes" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>← Clientes</Link>
          <div className="page-title" style={{ marginTop: 4 }}>{client.nombre}</div>
          <div className="page-subtitle">{client.razonSocial} · {client.cuit}</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>Información general</div>
          {[
            ['Contacto', client.contactoAdministrativo],
            ['Email facturación', client.emailFacturacion],
            ['Moneda preferida', client.monedaPreferida],
            ['Condiciones pago', client.condicionesPagoDefault],
            ['Líder de proyecto', client.liderProyectoNombre],
            ['Email líder', client.liderProyectoEmail],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
              <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
              <span>{val}</span>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>Resumen financiero</div>
          <div className="kpi-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Total facturas', clientInvoices.length, undefined],
              ['Pendientes', pending.length, 'var(--color-primary)'],
              ['Vencidas', overdue.length, 'var(--status-vencida)'],
              ['Cobradas', clientInvoices.filter((i) => i.estado === 'cobrada').length, 'var(--status-cobrada)'],
            ].map(([label, val, color]) => (
              <div key={label} className="kpi-card" style={{ padding: 14 }}>
                <div className="kpi-label">{label}</div>
                <div className="kpi-value" style={{ fontSize: 20, color }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contratos */}
      <div className="section">
        <div className="section-header"><div className="section-title">Contratos ({contracts.length})</div></div>
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Contrato</th><th>Modalidad</th><th>Monto total</th><th>Período</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.nombreContrato}</td>
                    <td style={{ fontSize: 13 }}>{c.modalidadFacturacion}</td>
                    <td className="font-mono">{formatCurrency(c.montoTotal, c.moneda)}</td>
                    <td style={{ fontSize: 12 }}>{c.fechaInicio} → {c.fechaFin}</td>
                    <td><span className={`badge badge-${c.estado === 'activo' ? 'cobrada' : 'cancelada'}`}>{c.estado}</span></td>
                    <td><Link to={`/contratos/${c.id}`} className="btn btn-secondary btn-sm">Ver</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Licencias */}
      {licenses.length > 0 && (
        <div className="section">
          <div className="section-header"><div className="section-title">Licencias ({licenses.length})</div></div>
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Licencia</th><th>Tipo</th><th>Usuarios</th><th>Monto anual</th><th>Renovación</th><th>Estado</th></tr></thead>
                <tbody>
                  {licenses.map((l) => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 600 }}>{l.nombreLicencia}</td>
                      <td>{l.tipoLicencia}</td>
                      <td>{l.cantidadUsuarios}</td>
                      <td className="font-mono">{formatCurrency(l.montoAnual, l.moneda)}</td>
                      <td>{formatDate(l.fechaRenovacion)}</td>
                      <td><LicenseBadge estado={l.estado} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Facturas */}
      <div className="section">
        <div className="section-header"><div className="section-title">Facturas ({clientInvoices.length})</div></div>
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Descripción</th><th>Monto</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {clientInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontSize: 13 }}>{inv.descripcion}</td>
                    <td className="font-mono">{formatCurrency(inv.monto, inv.moneda)}</td>
                    <td style={{ fontSize: 13 }}>{formatDate(getEffectiveBillingDate(inv))}</td>
                    <td><StatusBadge estado={inv.estado} /></td>
                    <td><InvoiceActions invoice={inv} compact /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
