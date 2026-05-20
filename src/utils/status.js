// Utilidades de estado

export const INVOICE_STATES = {
  planificada: 'Planificada',
  pendiente_validacion_lider: 'Pendiente validación líder',
  pendiente_de_emitir: 'Pendiente de emitir',
  emitida: 'Emitida',
  enviada_al_cliente: 'Enviada al cliente',
  vencida: 'Vencida',
  cobrada: 'Cobrada',
  reprogramada: 'Reprogramada',
  requiere_revision: 'Requiere revisión',
  cancelada: 'Cancelada',
};

export const INVOICE_ORIGINS = {
  contrato: 'Contrato',
  hito: 'Hito',
  cuota: 'Cuota',
  cambio_de_alcance: 'Cambio de alcance',
  licenciamiento: 'Licenciamiento',
  renovacion: 'Renovación',
};

export const INVOICE_TYPES = {
  servicio_profesional: 'Servicio profesional',
  proyecto: 'Proyecto',
  hito: 'Hito',
  cuota: 'Cuota',
  licencia_anual: 'Licencia anual',
  renovacion: 'Renovación',
  cambio_de_alcance: 'Cambio de alcance',
  soporte: 'Soporte',
  mantenimiento: 'Mantenimiento',
};

export const ALERT_PRIORITIES = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítica',
};

export const SCOPE_CHANGE_STATES = {
  borrador: 'Borrador',
  enviado: 'Enviado',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  facturable: 'Facturable',
  facturado: 'Facturado',
};

export const LICENSE_STATES = {
  activa: 'Activa',
  proxima_a_vencer: 'Próxima a vencer',
  vencida: 'Vencida',
  cancelada: 'Cancelada',
};

/** True si el administrativo puede emitir esta factura */
export function canAdminEmit(invoice) {
  return invoice.estado === 'pendiente_de_emitir';
}

/** True si la factura está bloqueada para emisión */
export function isBlockedForEmission(invoice) {
  return ['reprogramada', 'requiere_revision', 'cancelada', 'cobrada', 'emitida', 'enviada_al_cliente'].includes(invoice.estado);
}

/** Clase CSS del badge según estado de factura */
export function getStatusBadgeClass(estado) {
  return `badge badge-${estado}`;
}

/** Clase CSS del badge según prioridad de alerta */
export function getPriorityBadgeClass(prioridad) {
  return `badge badge-prioridad-${prioridad}`;
}

/** Etiqueta legible para estado de licencia */
export function getLicenseStateLabel(estado) {
  return LICENSE_STATES[estado] || estado;
}
