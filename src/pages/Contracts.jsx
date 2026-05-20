import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { formatCurrency } from '../utils/currency.js';
import { formatDate } from '../utils/dates.js';
import PdfUploadModal from '../components/upload/PdfUploadModal.jsx';
import EditContractModal from '../components/edit/EditContractModal.jsx';

export default function Contracts() {
  var appCtx = useApp();
  var contracts = appCtx.contracts;
  var clients = appCtx.clients;
  var getClientById = appCtx.getClientById;

  var [search, setSearch] = useState('');
  var [filterClient, setFilterClient] = useState('');
  var [showUpload, setShowUpload] = useState(false);
  var [editingContract, setEditingContract] = useState(null);

  var filtered = contracts.filter(function(c) {
    if (filterClient && c.clienteId !== filterClient) return false;
    if (search && !c.nombreContrato.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Contratos</div>
          <div className="page-subtitle">{contracts.length} contratos</div>
        </div>
        <button className="btn btn-primary" onClick={function() { setShowUpload(true); }}>
          📄 Importar PDF
        </button>
      </div>

      {showUpload && (
        <PdfUploadModal tipo="contrato" onClose={function() { setShowUpload(false); }} />
      )}
      {editingContract && (
        <EditContractModal contract={editingContract} onClose={function() { setEditingContract(null); }} />
      )}

      <div className="filters-bar">
        <input
          className="form-input"
          placeholder="Buscar contrato..."
          value={search}
          onChange={function(e) { setSearch(e.target.value); }}
        />
        <select className="form-select" value={filterClient} onChange={function(e) { setFilterClient(e.target.value); }}>
          <option value="">Todos los clientes</option>
          {clients.map(function(c) { return <option key={c.id} value={c.id}>{c.nombre}</option>; })}
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Contrato</th>
                <th>Cliente</th>
                <th>Modalidad</th>
                <th>Monto total</th>
                <th>Periodo</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 40 }}>
                    Sin contratos
                  </td>
                </tr>
              )}
              {filtered.map(function(c) {
                var client = getClientById(c.clienteId);
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>
                      {c.nombreContrato}
                      {c.requiereRevisionHumana && (
                        <span className="ia-tag" style={{ marginLeft: 6 }}>⚠ IA</span>
                      )}
                    </td>
                    <td>{client ? client.nombre : c.clienteId}</td>
                    <td style={{ fontSize: 13 }}>{c.modalidadFacturacion}</td>
                    <td className="font-mono">{formatCurrency(c.montoTotal, c.moneda)}</td>
                    <td style={{ fontSize: 12 }}>
                      {formatDate(c.fechaInicio)} → {formatDate(c.fechaFin)}
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                        background: c.estado === 'activo' ? 'rgba(16,185,129,0.1)' : 'rgba(100,100,100,0.1)',
                        color: c.estado === 'activo' ? 'var(--status-cobrada)' : 'var(--color-text-muted)',
                      }}>
                        {c.estado || 'activo'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={function() { setEditingContract(c); }}
                          title="Editar contrato"
                        >
                          ✏ Editar
                        </button>
                        <Link to={'/contratos/' + c.id} className="btn btn-secondary btn-sm">
                          Ver →
                        </Link>
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
