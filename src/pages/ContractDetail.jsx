import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { formatCurrency } from '../utils/currency.js';
import { formatDate, getEffectiveBillingDate } from '../utils/dates.js';
import { StatusBadge } from '../components/ui/Badge.jsx';
import InvoiceActions from '../components/invoices/InvoiceActions.jsx';
import { extractCommercialTermsFromDocument } from '../services/aiService.js';

export default function ContractDetail() {
  var params = useParams();
  var contractId = params.contractId;
  var app = useApp();
  var contracts = app.contracts;
  var getClientById = app.getClientById;
  var invoices = app.invoices;

  var contract = contracts.find(function(c) { return c.id === contractId; });
  var [aiResult, setAiResult] = useState(contract && contract.condicionesComercialesExtraidas ? contract.condicionesComercialesExtraidas : null);
  var [aiLoading, setAiLoading] = useState(false);
  var [mockText, setMockText] = useState('');

  if (!contract) {
    return <div className="empty-state"><div className="empty-state-title">Contrato no encontrado</div></div>;
  }

  var client = getClientById(contract.clienteId);
  var contractInvoices = invoices.filter(function(i) { return i.contratoId === contractId; });

  // Calcular progreso de facturacion
  var totalContract = contract.montoTotal || 0;
  var moneda = contract.moneda || 'USD';
  var cobrado   = contractInvoices.filter(function(i) { return i.estado === 'cobrada'; }).reduce(function(a,i) { return a + (i.moneda === moneda ? i.monto : 0); }, 0);
  var emitido   = contractInvoices.filter(function(i) { return ['emitida','enviada_al_cliente'].includes(i.estado); }).reduce(function(a,i) { return a + (i.moneda === moneda ? i.monto : 0); }, 0);
  var pendiente = contractInvoices.filter(function(i) { return ['planificada','reprogramada','pendiente_validacion_lider','pendiente_de_emitir','requiere_revision'].includes(i.estado); }).reduce(function(a,i) { return a + (i.moneda === moneda ? i.monto : 0); }, 0);
  var pctCobrado   = totalContract > 0 ? Math.min(100, (cobrado   / totalContract) * 100) : 0;
  var pctEmitido   = totalContract > 0 ? Math.min(100 - pctCobrado, (emitido   / totalContract) * 100) : 0;
  var pctPendiente = totalContract > 0 ? Math.min(100 - pctCobrado - pctEmitido, (pendiente / totalContract) * 100) : 0;

  function runAiExtraction() {
    setAiLoading(true);
    extractCommercialTermsFromDocument(mockText || contract.resumenIA || contract.nombreContrato)
      .then(function(result) {
        setAiResult(result);
        setAiLoading(false);
      })
      .catch(function() { setAiLoading(false); });
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/contratos" style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Contratos</Link>
          <div className="page-title" style={{ marginTop: 4 }}>{contract.nombreContrato}</div>
          <div className="page-subtitle">{client ? client.nombre : ''} - {formatCurrency(contract.montoTotal, contract.moneda)}</div>
        </div>
      </div>

      {/* Barra de progreso de facturacion */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div className="card-title">Progreso de facturacion</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {formatCurrency(cobrado + emitido + pendiente, moneda)} de {formatCurrency(totalContract, moneda)}
          </div>
        </div>
        <div style={{ height: 20, borderRadius: 10, background: 'var(--color-surface-2)', overflow: 'hidden', display: 'flex', marginBottom: 10 }}>
          {pctCobrado > 0 && (
            <div style={{ width: pctCobrado + '%', background: 'var(--status-cobrada)', transition: 'width 0.4s' }} title={'Cobrado: ' + formatCurrency(cobrado, moneda)} />
          )}
          {pctEmitido > 0 && (
            <div style={{ width: pctEmitido + '%', background: 'var(--status-emitida)', transition: 'width 0.4s' }} title={'Emitido: ' + formatCurrency(emitido, moneda)} />
          )}
          {pctPendiente > 0 && (
            <div style={{ width: pctPendiente + '%', background: 'var(--color-primary)', opacity: 0.5, transition: 'width 0.4s' }} title={'Pendiente: ' + formatCurrency(pendiente, moneda)} />
          )}
        </div>
        <div style={{ display: 'flex', gap: 20, fontSize: 12 }}>
          <span><span style={{ color: 'var(--status-cobrada)' }}>Cobrado:</span> {formatCurrency(cobrado, moneda)} ({pctCobrado.toFixed(0)}%)</span>
          <span><span style={{ color: 'var(--status-emitida)' }}>Emitido:</span> {formatCurrency(emitido, moneda)} ({pctEmitido.toFixed(0)}%)</span>
          <span><span style={{ color: 'var(--color-primary)', opacity: 0.8 }}>Pendiente:</span> {formatCurrency(pendiente, moneda)} ({pctPendiente.toFixed(0)}%)</span>
          <span style={{ color: 'var(--color-text-muted)' }}>Sin facturar: {formatCurrency(Math.max(0, totalContract - cobrado - emitido - pendiente), moneda)}</span>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Datos del contrato */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>Datos del contrato</div>
          {[
            ['Cliente', client ? client.nombre : ''],
            ['Modalidad', contract.modalidadFacturacion],
            ['Moneda', contract.moneda],
            ['Monto total', formatCurrency(contract.montoTotal, contract.moneda)],
            ['Condiciones pago', contract.condicionesPago],
            ['Inicio', formatDate(contract.fechaInicio)],
            ['Fin', formatDate(contract.fechaFin)],
            ['Lider', contract.liderProyectoNombre],
          ].map(function(pair) {
            var label = pair[0]; var val = pair[1];
            return (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13 }}>
                <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                <span style={{ fontFamily: label === 'Monto total' ? 'monospace' : undefined }}>{val || '-'}</span>
              </div>
            );
          })}
        </div>

        {/* Panel IA */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div className="card-title">Extraccion IA de condiciones</div>
            {contract.requiereRevisionHumana && <span className="ia-tag">Requiere revision humana</span>}
          </div>

          {!aiResult && (
            <div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12 }}>
                Simula la lectura inteligente del contrato para extraer condiciones comerciales.
              </div>
              <textarea
                className="form-textarea"
                placeholder="Pega texto del contrato aqui (opcional) o deja vacio para usar demo..."
                value={mockText}
                onChange={function(e) { setMockText(e.target.value); }}
                style={{ marginBottom: 12, minHeight: 60 }}
              />
              <button className="btn btn-primary" onClick={runAiExtraction} disabled={aiLoading}>
                {aiLoading ? 'Analizando...' : 'Extraer condiciones con IA'}
              </button>
            </div>
          )}

          {aiResult && (
            <div>
              <div style={{ padding: '6px 10px', background: 'rgba(245,158,11,0.1)', borderRadius: 6, fontSize: 12, color: '#f59e0b', marginBottom: 10 }}>
                Informacion generada por IA - revisar antes de usar
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                {aiResult.clienteDetectado && <AIField label="Cliente" value={aiResult.clienteDetectado} />}
                {aiResult.moneda && <AIField label="Moneda" value={aiResult.moneda} />}
                {aiResult.montoTotal && <AIField label="Monto total" value={formatCurrency(aiResult.montoTotal, aiResult.moneda)} />}
                {aiResult.modalidadFacturacion && <AIField label="Modalidad" value={aiResult.modalidadFacturacion} />}
                {aiResult.condicionesPago && <AIField label="Condiciones pago" value={aiResult.condicionesPago} />}
                {aiResult.licenciamiento && aiResult.licenciamiento.incluido && (
                  <AIField label="Licencia" value={aiResult.licenciamiento.tipoLicencia + ' - ' + formatCurrency(aiResult.licenciamiento.montoAnual, aiResult.moneda) + '/ano - Renueva ' + formatDate(aiResult.licenciamiento.fechaRenovacion)} />
                )}
                {aiResult.riesgosDetectados && aiResult.riesgosDetectados.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--priority-alta)', textTransform: 'uppercase', marginBottom: 4 }}>Riesgos detectados</div>
                    {aiResult.riesgosDetectados.map(function(r, i) {
                      return <div key={i} style={{ padding: '4px 8px', background: 'rgba(239,68,68,0.08)', borderRadius: 4, marginBottom: 3, fontSize: 12 }}>{r}</div>;
                    })}
                  </div>
                )}
              </div>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={function() { setAiResult(null); }}>
                Re-extraer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Facturas del contrato */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">Facturas de este contrato ({contractInvoices.length})</div>
        </div>
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Descripcion</th><th>Monto</th><th>Fecha efectiva</th><th>Estado</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {contractInvoices.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-muted)' }}>Sin facturas asociadas</td></tr>
                )}
                {contractInvoices.map(function(inv) {
                  return (
                    <tr key={inv.id}>
                      <td style={{ fontSize: 13 }}>{inv.descripcion}</td>
                      <td className="font-mono">{formatCurrency(inv.monto, inv.moneda)}</td>
                      <td style={{ fontSize: 13 }}>{formatDate(getEffectiveBillingDate(inv))}</td>
                      <td><StatusBadge estado={inv.estado} /></td>
                      <td><InvoiceActions invoice={inv} compact={true} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function AIField({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px', background: 'rgba(139,92,246,0.07)', borderRadius: 6, gap: 8 }}>
      <span style={{ fontSize: 11, color: '#a78bfa', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: 12, textAlign: 'right' }}>{value}</span>
    </div>
  );
}
