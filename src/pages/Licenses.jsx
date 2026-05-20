import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { LicenseBadge } from '../components/ui/Badge.jsx';
import { formatCurrency } from '../utils/currency.js';
import { formatDate, daysUntil } from '../utils/dates.js';
import LicenseFormModal from '../components/edit/LicenseFormModal.jsx';

export default function Licenses() {
  var app = useApp();
  var licenses = app.licenses;
  var getClientById = app.getClientById;

  var [showCreate, setShowCreate] = useState(false);
  var [editingLicense, setEditingLicense] = useState(null);
  var [confirmDelete, setConfirmDelete] = useState(null); // license object

  var sorted = useMemo(function() {
    return licenses.slice().sort(function(a, b) {
      var dA = daysUntil(a.fechaRenovacion);
      var dB = daysUntil(b.fechaRenovacion);
      if (dA === null) dA = 9999;
      if (dB === null) dB = 9999;
      return dA - dB;
    });
  }, [licenses]);

  var kpis = useMemo(function() {
    var criticas  = licenses.filter(function(l) { var d = daysUntil(l.fechaRenovacion); return d !== null && d <= 30; }).length;
    var proximas  = licenses.filter(function(l) { var d = daysUntil(l.fechaRenovacion); return d !== null && d > 30 && d <= 60; }).length;
    var activas   = licenses.filter(function(l) { return l.estado === 'activa'; }).length;
    var totalUSD  = licenses.filter(function(l) { return l.moneda === 'USD'; }).reduce(function(a, l) { return a + l.montoAnual; }, 0);
    var totalARS  = licenses.filter(function(l) { return l.moneda === 'ARS'; }).reduce(function(a, l) { return a + l.montoAnual; }, 0);
    return { criticas, proximas, activas, totalUSD, totalARS };
  }, [licenses]);

  function handleDelete(lic) {
    setConfirmDelete(lic);
  }

  function confirmDeleteLicense() {
    if (confirmDelete) {
      app.deleteLicense(confirmDelete.id);
      setConfirmDelete(null);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Licenciamiento</div>
          <div className="page-subtitle">
            {kpis.activas} activas
            {kpis.criticas > 0 ? ' - ' + kpis.criticas + ' vencen en menos de 30 dias' : ''}
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={function() { setShowCreate(true); }}
        >
          + Nueva licencia
        </button>
      </div>

      {/* KPI cards */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-card">
          <div className="kpi-label">Activas</div>
          <div className="kpi-value" style={{ color: 'var(--status-cobrada)', fontSize: 22 }}>{kpis.activas}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Criticas (menos de 30d)</div>
          <div className="kpi-value" style={{ color: kpis.criticas > 0 ? 'var(--status-vencida)' : 'var(--color-text-muted)', fontSize: 22 }}>
            {kpis.criticas}
          </div>
          <div className="kpi-sub">vencen muy pronto</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Proximas (30-60d)</div>
          <div className="kpi-value" style={{ color: kpis.proximas > 0 ? 'var(--status-reprogramada)' : 'var(--color-text-muted)', fontSize: 22 }}>
            {kpis.proximas}
          </div>
          <div className="kpi-sub">requieren atencion</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Monto anual USD</div>
          <div className="kpi-value" style={{ color: 'var(--color-primary)', fontSize: 17 }}>
            {formatCurrency(kpis.totalUSD, 'USD')}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Monto anual ARS</div>
          <div className="kpi-value" style={{ fontSize: 15 }}>
            {formatCurrency(kpis.totalARS, 'ARS')}
          </div>
        </div>
      </div>

      {kpis.criticas > 0 && (
        <div style={{ marginBottom: 16, padding: '10px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 13, color: 'var(--status-vencida)' }}>
          Hay {kpis.criticas} licencia(s) que vencen en menos de 30 dias. Coordinar renovacion a la brevedad.
        </div>
      )}

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Urgencia</th>
                <th>Licencia</th>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Usuarios</th>
                <th>Monto anual</th>
                <th>Renovacion</th>
                <th>Dias restantes</th>
                <th>Estado</th>
                <th>Auto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(function(lic) {
                var client = getClientById(lic.clienteId);
                var days = daysUntil(lic.fechaRenovacion);
                var urgent = days !== null && days <= 30;
                var warning = days !== null && days > 30 && days <= 60;
                var rowBg = urgent ? 'rgba(239,68,68,0.05)' : warning ? 'rgba(249,115,22,0.04)' : undefined;
                var daysColor = urgent ? 'var(--status-vencida)' : warning ? 'var(--status-reprogramada)' : 'var(--color-text-muted)';

                return (
                  <tr key={lic.id} style={{ background: rowBg }}>
                    <td style={{ textAlign: 'center', fontSize: 14 }}>
                      {urgent ? '🔴' : warning ? '🟠' : '🟢'}
                    </td>
                    <td style={{ fontWeight: 600 }}>{lic.nombreLicencia}</td>
                    <td>{client ? client.nombre : lic.clienteId}</td>
                    <td>{lic.tipoLicencia}</td>
                    <td>{lic.cantidadUsuarios}</td>
                    <td className="font-mono">{formatCurrency(lic.montoAnual, lic.moneda)}</td>
                    <td style={{ fontSize: 13 }}>{formatDate(lic.fechaRenovacion)}</td>
                    <td>
                      {days !== null && (
                        <span style={{ fontWeight: 700, color: daysColor }}>
                          {days}d
                        </span>
                      )}
                    </td>
                    <td><LicenseBadge estado={lic.estado} /></td>
                    <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {lic.facturacionAutomatica ? 'Auto' : '-'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn-ghost"
                          style={{ fontSize: 12, padding: '3px 10px' }}
                          onClick={function() { setEditingLicense(lic); }}
                        >
                          Editar
                        </button>
                        <button
                          className="btn-ghost"
                          style={{ fontSize: 12, padding: '3px 10px', color: 'var(--status-vencida)' }}
                          onClick={function() { handleDelete(lic); }}
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

      {/* Modal alta */}
      {showCreate && (
        <LicenseFormModal
          onClose={function() { setShowCreate(false); }}
        />
      )}

      {/* Modal edicion */}
      {editingLicense && (
        <LicenseFormModal
          license={editingLicense}
          onClose={function() { setEditingLicense(null); }}
        />
      )}

      {/* Dialogo confirmacion eliminar */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={function() { setConfirmDelete(null); }}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={function(e) { e.stopPropagation(); }}>
            <div className="modal-header">
              <div className="modal-title">Confirmar eliminacion</div>
            </div>
            <div style={{ padding: '16px 20px', fontSize: 14, color: 'var(--color-text)' }}>
              <p style={{ marginBottom: 12 }}>
                Estas por eliminar la licencia <strong>{confirmDelete.nombreLicencia}</strong>.
                Esta accion no se puede deshacer.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-ghost" onClick={function() { setConfirmDelete(null); }}>Cancelar</button>
              <button
                className="btn-primary"
                style={{ background: 'var(--status-vencida)', borderColor: 'var(--status-vencida)' }}
                onClick={confirmDeleteLicense}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
