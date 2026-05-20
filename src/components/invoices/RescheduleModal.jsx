import { useState } from 'react';
import Modal from '../ui/Modal.jsx';

export default function RescheduleModal({ invoice, onReschedule, onClose }) {
  const [newDate, setNewDate] = useState('');
  const [reason, setReason] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!newDate || !reason.trim()) return;
    onReschedule(invoice.id, newDate, reason);
    onClose();
  }

  return (
    <Modal title="Reprogramar factura" onClose={onClose}>
      <div style={{ marginBottom: 16, padding: '12px', background: 'var(--color-surface-2)', borderRadius: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Factura</div>
        <div style={{ fontWeight: 600 }}>{invoice.descripcion}</div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
          Fecha prevista: {invoice.fechaReprogramada || invoice.fechaPrevistaFacturacion}
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Nueva fecha de facturación *</label>
          <input
            type="date"
            className="form-input"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Motivo de la reprogramación *</label>
          <textarea
            className="form-textarea"
            placeholder="Ej: El cliente solicitó revisión antes de la emisión..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-warning" disabled={!newDate || !reason.trim()}>
            ⏰ Reprogramar
          </button>
        </div>
      </form>
    </Modal>
  );
}
