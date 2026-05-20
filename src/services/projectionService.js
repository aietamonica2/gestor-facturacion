// projectionService.js -- Calculos de proyeccion de cobranzas
// Campo de fecha efectiva: fechaReprogramada || fechaPrevistaFacturacion

function getFecha(inv) {
  return inv.fechaReprogramada || inv.fechaPrevistaFacturacion || null;
}

export function getMonthlyProjection(invoices, months) {
  if (!months) months = 6;
  var today = new Date();
  var result = [];
  for (var i = 0; i < months; i++) {
    var d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    var label = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
    var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    var monthInvoices = invoices.filter(function(inv) {
      var f = getFecha(inv);
      return f && f.startsWith(key);
    });
    var usd = monthInvoices.filter(function(i) { return i.moneda === 'USD'; }).reduce(function(a, i) { return a + i.monto; }, 0);
    var ars = monthInvoices.filter(function(i) { return i.moneda === 'ARS'; }).reduce(function(a, i) { return a + i.monto; }, 0);
    result.push({ label: label, key: key, usd: usd, ars: ars, invoices: monthInvoices });
  }
  return result;
}

export function getProjectionByClient(invoices, months) {
  if (!months) months = 6;
  var today = new Date();
  var limit = new Date(today.getFullYear(), today.getMonth() + months, 1);
  var limitKey = limit.getFullYear() + '-' + String(limit.getMonth() + 1).padStart(2, '0');
  var todayKey = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0');
  var pending = invoices.filter(function(inv) {
    var f = getFecha(inv);
    return f && f >= todayKey && f < limitKey && ['cobrada','cancelada'].indexOf(inv.estado) === -1;
  });
  var byClient = {};
  pending.forEach(function(inv) {
    if (!byClient[inv.clienteId]) byClient[inv.clienteId] = { clienteId: inv.clienteId, usd: 0, ars: 0, count: 0 };
    if (inv.moneda === 'USD') byClient[inv.clienteId].usd += inv.monto;
    else byClient[inv.clienteId].ars += inv.monto;
    byClient[inv.clienteId].count++;
  });
  return Object.values(byClient).sort(function(a, b) { return b.usd - a.usd; });
}

export function getCashflowRisk(invoices) {
  var today = new Date().toISOString().split('T')[0];
  var vencidas = invoices.filter(function(inv) {
    return inv.estado === 'vencida' || (inv.fechaVencimiento && inv.fechaVencimiento < today && ['cobrada','cancelada'].indexOf(inv.estado) === -1);
  });
  var totalUSD = vencidas.filter(function(i) { return i.moneda === 'USD'; }).reduce(function(a, i) { return a + i.monto; }, 0);
  var totalARS = vencidas.filter(function(i) { return i.moneda === 'ARS'; }).reduce(function(a, i) { return a + i.monto; }, 0);
  return { vencidas: vencidas, totalUSD: totalUSD, totalARS: totalARS };
}

export function getOverdueInvoices(invoices) {
  var today = new Date().toISOString().split('T')[0];
  return invoices.filter(function(inv) {
    return inv.fechaVencimiento && inv.fechaVencimiento < today && ['cobrada','cancelada'].indexOf(inv.estado) === -1;
  });
}

export function getUpcomingLicenseRenewals(licenses, days) {
  if (!days) days = 60;
  var today = new Date();
  var limit = new Date();
  limit.setDate(limit.getDate() + days);
  return licenses.filter(function(lic) {
    if (!lic.fechaRenovacion) return false;
    var d = new Date(lic.fechaRenovacion);
    return d >= today && d <= limit;
  });
}

export function getInvoicesDueSoon(invoices, days) {
  if (!days) days = 7;
  var today = new Date();
  var limit = new Date();
  limit.setDate(limit.getDate() + days);
  var todayStr = today.toISOString().split('T')[0];
  var limitStr = limit.toISOString().split('T')[0];
  return invoices.filter(function(inv) {
    if (['cobrada','cancelada'].indexOf(inv.estado) !== -1) return false;
    var f = getFecha(inv);
    return f && f >= todayStr && f <= limitStr;
  });
}

export function getInvoicesPendingLeaderValidation(invoices) {
  return invoices.filter(function(inv) { return inv.estado === 'pendiente_validacion_lider'; });
}

export function calculateCollectionProjection(invoices, months) {
  if (!months) months = 12;
  var today = new Date();
  var byMonth = {};
  var byClient = {};
  var totalReal = { USD: 0, ARS: 0 };
  var totalProjected = { USD: 0, ARS: 0 };
  var totalRisk = { USD: 0, ARS: 0 };

  for (var i = 0; i < months; i++) {
    var d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    byMonth[key] = { real: { USD: 0, ARS: 0 }, projected: { USD: 0, ARS: 0 }, risk: { USD: 0, ARS: 0 } };
  }

  invoices.forEach(function(inv) {
    var fecha = getFecha(inv);
    if (!fecha) return;
    var monthKey = fecha.slice(0, 7);
    if (!byMonth[monthKey]) return;
    var cur = inv.moneda === 'ARS' ? 'ARS' : 'USD';
    var monto = inv.monto || 0;

    if (inv.estado === 'cobrada') {
      byMonth[monthKey].real[cur] += monto;
      totalReal[cur] += monto;
    } else if (inv.estado === 'vencida') {
      byMonth[monthKey].risk[cur] += monto;
      totalRisk[cur] += monto;
    } else if (['cancelada'].indexOf(inv.estado) === -1) {
      byMonth[monthKey].projected[cur] += monto;
      totalProjected[cur] += monto;
    }

    if (!byClient[inv.clienteId]) {
      byClient[inv.clienteId] = { clienteId: inv.clienteId, real: { USD: 0, ARS: 0 }, projected: { USD: 0, ARS: 0 }, risk: { USD: 0, ARS: 0 } };
    }
    if (inv.estado === 'cobrada') byClient[inv.clienteId].real[cur] += monto;
    else if (inv.estado === 'vencida') byClient[inv.clienteId].risk[cur] += monto;
    else if (['cancelada'].indexOf(inv.estado) === -1) byClient[inv.clienteId].projected[cur] += monto;
  });

  return { byMonth: byMonth, byClient: Object.values(byClient), totalReal: totalReal, totalProjected: totalProjected, totalRisk: totalRisk };
}

export function calculateRescheduledImpact(invoices) {
  return invoices
    .filter(function(inv) { return inv.estado === 'reprogramada' || inv.fechaReprogramada; })
    .map(function(inv) {
      return {
        facturaId:         inv.id,
        clienteId:         inv.clienteId,
        descripcion:       inv.descripcion || '',
        monto:             inv.monto || 0,
        moneda:            inv.moneda || 'USD',
        fechaOriginal:     inv.fechaPrevistaFacturacion,
        fechaReprogramada: inv.fechaReprogramada || inv.fechaPrevistaFacturacion,
      };
    });
}
