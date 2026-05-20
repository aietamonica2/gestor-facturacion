import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { ScopeChangeBadge } from '../components/ui/Badge.jsx';
import { formatCurrency } from '../utils/currency.js';
import { formatDate } from '../utils/dates.js';
import { extractCommercialTermsFromScopeChange } from '../services/aiService.js';
import PdfUploadModal from '../components/upload/PdfUploadModal.jsx';
import EditScopeChangeModal from '../components/edit/EditScopeChangeModal.jsx';

var TABS = [
  { id: 'all',        label: 'Todos' },
  { id: 'sinfactura', label: 'Sin facturar', urgent: true },
  { id: 'pendiente',  label: 'Pendiente aprobacion' },
  { id: 'revision',   label: 'Rev. IA' },
];

export default function ScopeChanges() {
  var app = useApp();
  var scopeChanges = app.scopeChanges;
  var getClientById = app.getClientById;

  var [activeTab, setActiveTab]       = useState('all');
  var [selectedId, setSelectedId]     = useState(null);
  var [showUpload, setShowUpload]     = useState(false);
  var [editingSc, setEditingSc]       = useState(null);

  var tabCounts = useMemo(function() {
    return {
      all:        scopeChanges.length,
      sinfactura: scopeChanges.filter(function(s) { return s.estado === 'aprobado' && s.generaFacturacion && !s.facturaGenerada; }).length,
      pendiente:  scopeChanges.filter(function(s) { return s.estado === 'enviado'; }).length,
      revision:   scopeChanges.filter(function(s) { return s.requiereRevisionHumana; }).length,
    };
  }, [scopeChanges]);

  var filtered = useMemo(function() {
    return scopeChanges.filter(function(s) {
      if (activeTab === 'sinfactura') return s.estado === 'aprobado' && s.generaFacturacion && !s.facturaGenerada;
      if (activeTab === 'pendiente')  return s.estado === 'enviado';
      if (activeTab === 'revision')   return s.requiereRevisionHumana;
      return true;
    });
  }, [scopeChanges, activeTab]);

  // Siempre obtener el sc actualizado del estado (no de la copia vieja)
  var selected = selectedId ? scopeChanges.find(function(s) { return s.id === selectedId; }) : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Cambios de Alcance</div>
          <div className="page-subtitle">
            {scopeChanges.length} registros
            {tabCounts.sinfactura > 0 ? ' - ' + tabCounts.sinfactura + ' aprobados sin facturar' : ''}
          </div>
        </div>
        <button className="btn btn-primary" onClick={function() { setShowUpload(true); }}>
          📄 Importar PDF
        </button>
      </div>

      {showUpload && (
        <PdfUploadModal tipo="cambio_alcance" onClose={function() { setShowUpload(false); }} />
      )}
      {editingSc && (
        <EditScopeChangeModal scopeChange={editingSc} onClose={function() { setEditingSc(null); }} />
      )}

      {tabCounts.sinfactura > 0 && (
        <div style={{ marginBottom: 16, padding: '10px 16px', background: 'rgba(245,158,11,0.1)', border: '1px solid #f59e0b44', borderRadius: 8, fontSize: 13, color: '#f59e0b' }}>
          Hay {tabCounts.sinfactura} cambio(s) aprobado(s) sin factura generada. Revisalos en Facturacion.
        </div>
      )}

      {/* Quick tabs */}
      <div className="invoice-quick-tabs" style={{ marginBottom: 16 }}>
        {TABS.map(function(tab) {
          var count = tabCounts[tab.id] || 0;
          return (
            <button
              key={tab.id}
              className={'quick-tab' + (activeTab === tab.id ? ' active' : '') + (tab.urgent && count > 0 ? ' urgent' : '')}
              onClick={function() { setActiveTab(tab.id); setSelectedId(null); }}
            >
              {tab.label}
              {count > 0 && (
                <span className={'quick-tab-count' + (tab.urgent ? ' urgent' : '')}>{count}</span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: selected ? 'grid' : 'block', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Descripcion</th>
                  <th>Monto adicional</th>
                  <th>Estado</th>
                  <th>Fecha solicitud</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 40 }}>
                      Sin cambios en esta categoria
                    </td>
                  </tr>
                )}
                {filtered.map(function(sc) {
                  var client = getClientById(sc.clienteId);
                  var isSelected = selected && selected.id === sc.id;
                  return (
                    <tr
                      key={sc.id}
                      style={{ cursor: 'pointer', background: isSelected ? 'rgba(79,124,255,0.08)' : undefined }}
                      onClick={function() { setSelectedId(isSelected ? null : sc.id); }}
                    >
                      <td style={{ fontWeight: 600, fontSize: 13 }}>{client ? client.nombre : sc.clienteId}</td>
                      <td style={{ maxWidth: 260 }}>
                        <div style={{ fontSize: 13 }}>{sc.descripcion}</div>
                        {sc.requiereRevisionHumana && (
                          <span className="ia-tag" style={{ marginTop: 3, display: 'inline-block' }}>⚠ Rev. IA</span>
                        )}
                      </td>
                      <td className="font-mono" style={{ fontSize: 13 }}>
                        {sc.montoAdicional ? formatCurrency(sc.montoAdicional, sc.moneda) : '—'}
                      </td>
                      <td><ScopeChangeBadge estado={sc.estado} /></td>
                      <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {formatDate(sc.fechaSolicitud)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <ScopeChangeDetail
            sc={selected}
            client={getClientById(selected.clienteId)}
            onClose={function() { setSelectedId(null); }}
            onEdit={function() { setEditingSc(selected); }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Panel de detalle ──────────────────────────────────────────────────────────

function ScopeChangeDetail({ sc, client, onClose, onEdit }) {
  var [aiResult, setAiResult] = useState(null);
  var [aiLoading, setAiLoading] = useState(false);

  function runAI() {
    setAiLoading(true);
    extractCommercialTermsFromScopeChange(sc.descripcion + ' ' + (sc.impactoEsperado || ''))
      .then(function(result) {
        setAiResult(result);
        setAiLoading(false);
      })
      .catch(function() { setAiLoading(false); });
  }

  return (
    <div className="card" style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
      {/* Header sticky */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, position: 'sticky', top: 0, background: 'var(--color-bg-card)', paddingBottom: 12, borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>Detalle del cambio</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onEdit}
            title="Editar este cambio de alcance"
          >
            ✏ Editar
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <DetailRow label="ID"           value={sc.id} mono={true} />
        <DetailRow label="Cliente"      value={client ? client.nombre : sc.clienteId} />
        <DetailRow label="Descripcion"  value={sc.descripcion} />
        {sc.impactoEnPlazo && <DetailRow label="Impacto en plazo" value={sc.impactoEnPlazo} />}
        <DetailRow label="Monto adicional" value={formatCurrency(sc.montoAdicional, sc.moneda)} mono={true} />
        <DetailRow label="Estado"       value={<ScopeChangeBadge estado={sc.estado} />} />
        <DetailRow label="Solicitado"   value={formatDate(sc.fechaSolicitud)} />
        {sc.fechaAprobacion && <DetailRow label="Aprobado"     value={formatDate(sc.fechaAprobacion)} />}
        {sc.aprobadoPor    && <DetailRow label="Aprobado por"  value={sc.aprobadoPor} />}
        {sc.facturaGenerada && <DetailRow label="Factura"      value={sc.facturaGenerada} mono={true} />}
        <DetailRow label="Genera facturacion" value={sc.generaFacturacion ? 'Si' : 'No'} />
        {sc.modalidadFacturacion && <DetailRow label="Modalidad" value={sc.modalidadFacturacion} />}
      </div>

      {/* Panel de IA */}
      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#a78bfa', marginBottom: 10 }}>Analisis IA</div>

        {!aiResult && (
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 10 }}>
              Detecta monto adicional, modalidad de facturacion y riesgos de este cambio de alcance.
            </div>
            <button
              className="btn btn-sm"
              style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid #a78bfa44' }}
              onClick={runAI}
              disabled={aiLoading}
            >
              {aiLoading ? 'Analizando...' : 'Extraer con IA'}
            </button>
          </div>
        )}

        {aiResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ padding: '6px 10px', background: 'rgba(245,158,11,0.1)', borderRadius: 6, fontSize: 12, color: '#f59e0b', marginBottom: 4 }}>
              Informacion generada por IA — revisar antes de usar
            </div>
            {aiResult.moneda && <AIField label="Moneda detectada" value={aiResult.moneda} />}
            {aiResult.montoAdicional > 0 && <AIField label="Monto adicional" value={formatCurrency(aiResult.montoAdicional, aiResult.moneda)} />}
            {aiResult.modalidadFacturacion && <AIField label="Modalidad" value={aiResult.modalidadFacturacion} />}
            {aiResult.impactoEnPlazo && <AIField label="Impacto en plazo" value={aiResult.impactoEnPlazo} />}
            {aiResult.riesgosDetectados && aiResult.riesgosDetectados.length > 0 && (
              <div>
                <div style={{ fontSize: 11, color: 'var(--priority-alta)', marginBottom: 4 }}>Riesgos</div>
                {aiResult.riesgosDetectados.map(function(r, i) {
                  return <div key={i} style={{ padding: '4px 8px', background: 'rgba(239,68,68,0.08)', borderRadius: 4, fontSize: 11, marginBottom: 3 }}>{r}</div>;
                })}
              </div>
            )}
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 6 }} onClick={function() { setAiResult(null); }}>
              Re-analizar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, fontFamily: mono ? 'monospace' : undefined, textAlign: 'right' }}>{value || '-'}</span>
    </div>
  );
}

function AIField({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
