import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { formatCurrency } from '../../utils/currency.js';
import { formatDate } from '../../utils/dates.js';

export default function CollectModal({ invoice, onCollect, onClose }) {
  const today = new Date().toISOString().split('T')[0];
  const [collectDate, setCollectDate] = useState(today);

  function handleSubmit(e) {
    e.preventDefault();
    if (!collectDate) return;
    onCollect(invoice.id, collectDate);
    onClose();
  }

  const diasDesdeEmision = invoice.fechaEmision
    ? Math.floor((new Date(collectDate) - new Date(invoice.fechaEmision)) / 86400000)
    : null;

  return (
    <Modal title="Registrar cobro" onClose={onClose}>
      {/* Resumen de la factura */}
      <div style={{
        marginBottom: 16,
        padding: 14,
        background: 'var(--status-cobrada-bg)',
        border: '1px solid var(--status-cobrada)',
        borderRadius: 8,
      }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--status-cobrada)', marginBottom: 4 }}>
          💵 {formatCurrency(invoice.monto, invoice.moneda)}
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text)', marginBottom: 2 }}>
          {invoice.descripcion}
        </div>
        {invoice.numeroFactura && (
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Nro. factura: <strong style={{ fontFamily: 'monospace' }}>{invoice.numeroFactura}</strong>
          </div>
        )}
        {invoice.fechaVencimiento && (
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
            Vencimiento: {formatDate(invoice.fechaVencimiento)}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Fecha de cobro efectivo *</label>
          <input
            type="date"
            className="form-input"
            value={collectDate}
            max={today}
            onChange={(e) => setCollectDate(e.target.value)}
            required
          />
          {diasDesdeEmision !== null && collectDate && (
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
              {diasDesdeEmision >= 0
                ? `${diasDesdeEmision} días desde la emisión`
                : 'Fecha anterior a la emisión'}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-success" disabled={!collectDate}>
            💵 Confirmar cobro
          </button>
        </div>
      </form>
    </Modal>
  );
}
