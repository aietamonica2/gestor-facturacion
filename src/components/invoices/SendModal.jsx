import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { formatCurrency } from '../../utils/currency.js';

const SEND_CHANNELS = [
  { value: 'email', label: '📧 Email' },
  { value: 'portal', label: '🌐 Portal del cliente' },
  { value: 'fisico', label: '📮 Físico / Correo' },
  { value: 'whatsapp', label: '💬 WhatsApp / Mensajería' },
];

export default function SendModal({ invoice, onSend, onClose }) {
  const [canal, setCanal] = useState('email');
  const [destinatario, setDestinatario] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    onSend(invoice.id, canal, destinatario.trim() || null);
    onClose();
  }

  return (
    <Modal title="Enviar factura al cliente" onClose={onClose}>
      {/* Resumen */}
      <div style={{
        marginBottom: 16,
        padding: 14,
        background: 'var(--color-surface-2)',
        borderRadius: 8,
        border: '1px solid var(--color-border)',
      }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
          📄 {invoice.numeroFactura || invoice.id}
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 2 }}>
          {invoice.descripcion}
        </div>
        <div style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--color-text)' }}>
          {formatCurrency(invoice.monto, invoice.moneda)}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Canal de envío *</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SEND_CHANNELS.map((ch) => (
              <button
                key={ch.value}
                type="button"
                onClick={() => setCanal(ch.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: `1px solid ${canal === ch.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: canal === ch.value ? 'rgba(79,124,255,0.15)' : 'var(--color-surface-2)',
                  color: canal === ch.value ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: canal === ch.value ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {ch.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Destinatario (opcional)</label>
          <input
            type="text"
            className="form-input"
            placeholder={canal === 'email' ? 'ej: administracion@cliente.com' : 'ej: Juan Pérez — Área de Compras'}
            value={destinatario}
            onChange={(e) => setDestinatario(e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            📤 Confirmar envío
          </button>
        </div>
      </form>
    </Modal>
  );
}
