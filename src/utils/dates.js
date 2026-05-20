// Utilidades de fechas

/** Devuelve la fecha efectiva de facturación: fechaReprogramada si existe, sino fechaPrevista */
export function getEffectiveBillingDate(invoice) {
  return invoice.fechaReprogramada || invoice.fechaPrevistaFacturacion;
}

/** Cuántos días faltan desde hoy hasta una fecha (puede ser negativo si ya pasó) */
export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

/** Formatea una fecha 'YYYY-MM-DD' a 'DD/MM/YYYY' */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

/** Formatea una fecha a 'MMM YYYY' (ej: 'May 2026') */
export function formatMonthYear(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
}

/** Devuelve 'YYYY-MM' de una fecha */
export function toMonthKey(dateStr) {
  if (!dateStr) return null;
  return dateStr.substring(0, 7);
}

/** True si la fecha ya pasó respecto a hoy */
export function isPast(dateStr) {
  return daysUntil(dateStr) < 0;
}

/** True si la factura necesita aviso al líder (dentro de los próximos N días) */
export function needsLeaderNotification(invoice) {
  const BLOCKED_STATES = ['cobrada', 'cancelada', 'emitida', 'enviada_al_cliente'];
  if (BLOCKED_STATES.includes(invoice.estado)) return false;
  const effectiveDate = getEffectiveBillingDate(invoice);
  const days = daysUntil(effectiveDate);
  return days !== null && days >= 0 && days <= invoice.diasAvisoPrevio;
}

/** Genera clave de mes 'YYYY-MM' para agrupar */
export function getMonthKey(invoice) {
  const date = getEffectiveBillingDate(invoice);
  return toMonthKey(date);
}

/** Lista de próximos N meses como 'YYYY-MM' */
export function nextMonths(n = 6) {
  const months = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}
