import { useEffect } from 'react';

export default function Modal({ title, onClose, children, maxWidth = 480 }) {
  // Cerrar con Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 className="modal-title" style={{ margin: 0 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
