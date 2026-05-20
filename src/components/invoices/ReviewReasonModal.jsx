import { useState } from 'react';
import Modal from '../ui/Modal.jsx';

export default function ReviewReasonModal({ invoice, onRequireReview, onClose }) {
  const [reason, setReason] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!reason.trim()) return;
    onRequireReview(invoice.id, reason);
    onClose();
  }

  return (
    <Modal title="Marcar como requiere revisión" onClose={onClose}>
      <div style={{ marginBottom: 16, padding: 12, background: 'var(--status-revision-bg)', border: '1px solid var(--status-revision)', borderRadius: 8 }}>
        <div style={{ fontWeight: 600, color: 'var(--status-revision)' }}>⚠️ {invoice.descripcion}</div>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
          Esta factura no podrá emitirse hasta que sea confirmada nuevamente.
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Motivo de la revisión *</label>
          <textarea
            className="form-textarea"
            placeholder="Ej: Condiciones de penalidad ambiguas, requiere revisión legal..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-danger" disabled={!reason.trim()}>
            ⚠️ Marcar revisión
          </button>
        </div>
      </form>
    </Modal>
  );
}
