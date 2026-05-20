import { useState } from 'react';
import Modal from '../ui/Modal.jsx';

export default function IssueModal({ invoice, onIssue, onClose }) {
  const [invoiceNumber, setInvoiceNumber] = useState(
    `F-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999) + 100).padStart(4, '0')}`
  );

  function handleSubmit(e) {
    e.preventDefault();
    if (!invoiceNumber.trim()) return;
    onIssue(invoice.id, invoiceNumber);
    onClose();
  }

  return (
    <Modal title="Emitir factura" onClose={onClose}>
      <div style={{ marginBottom: 16, padding: '12px', background: 'var(--color-surface-2)', borderRadius: 8 }}>
        <div style={{ fontWeight: 600 }}>{invoice.descripcion}</div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
          {invoice.moneda} {invoice.monto.toLocaleString()}
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Número de factura *</label>
          <input
            type="text"
            className="form-input"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            required
          />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary">✅ Emitir</button>
        </div>
      </form>
    </Modal>
  );
}
