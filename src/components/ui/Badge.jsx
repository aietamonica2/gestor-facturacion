import { getStatusBadgeClass, getPriorityBadgeClass, INVOICE_STATES, ALERT_PRIORITIES } from '../../utils/status.js';

export function StatusBadge({ estado }) {
  return (
    <span className={getStatusBadgeClass(estado)}>
      {INVOICE_STATES[estado] || estado}
    </span>
  );
}

export function PriorityBadge({ prioridad }) {
  return (
    <span className={getPriorityBadgeClass(prioridad)}>
      {ALERT_PRIORITIES[prioridad] || prioridad}
    </span>
  );
}

export function LicenseBadge({ estado }) {
  const map = {
    activa: { label: 'Activa', cls: 'badge badge-cobrada' },
    proxima_a_vencer: { label: 'Próxima a vencer', cls: 'badge badge-reprogramada' },
    vencida: { label: 'Vencida', cls: 'badge badge-vencida' },
    cancelada: { label: 'Cancelada', cls: 'badge badge-cancelada' },
  };
  const item = map[estado] || { label: estado, cls: 'badge badge-planificada' };
  return <span className={item.cls}>{item.label}</span>;
}

export function ScopeChangeBadge({ estado }) {
  const map = {
    borrador: { label: 'Borrador', cls: 'badge badge-planificada' },
    enviado: { label: 'Enviado', cls: 'badge badge-pendiente_de_emitir' },
    aprobado: { label: 'Aprobado', cls: 'badge badge-cobrada' },
    rechazado: { label: 'Rechazado', cls: 'badge badge-cancelada' },
    facturable: { label: 'Facturable', cls: 'badge badge-reprogramada' },
    facturado: { label: 'Facturado', cls: 'badge badge-emitida' },
  };
  const item = map[estado] || { label: estado, cls: 'badge' };
  return <span className={item.cls}>{item.label}</span>;
}
