// Utilidades de moneda

/** Formatea un número como moneda según la moneda indicada */
export function formatCurrency(amount, currency = 'USD') {
  if (amount === null || amount === undefined) return '—';
  const localeMap = { USD: 'en-US', ARS: 'es-AR' };
  const locale = localeMap[currency] || 'es-AR';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Suma todos los montos de un array de facturas (misma moneda) */
export function sumAmounts(invoices) {
  return invoices.reduce((acc, inv) => acc + (inv.monto || 0), 0);
}

/** Agrupa facturas por moneda y suma */
export function sumByCurrency(invoices) {
  return invoices.reduce((acc, inv) => {
    acc[inv.moneda] = (acc[inv.moneda] || 0) + inv.monto;
    return acc;
  }, {});
}

/** Conversión mock para mostrar total unificado (no usar en producción) */
export function toUSDMock(amount, currency) {
  if (currency === 'USD') return amount;
  if (currency === 'ARS') return amount / 1200; // tipo de cambio ficticio para demo
  return amount;
}
