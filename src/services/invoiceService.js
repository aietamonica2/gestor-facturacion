// invoiceService.js — Logica de negocio para facturas
// En produccion: estas funciones harian llamadas a la API REST

export function rescheduleInvoice(invoices, invoiceId, newDate, reason, usuario) {
  if (!usuario) usuario = 'Sistema';
  return invoices.map(function(inv) {
    if (inv.id !== invoiceId) return inv;
    var now = new Date().toISOString().split('T')[0];
    return Object.assign({}, inv, {
      fechaEmisionPrevista: newDate,
      estado: 'reprogramada',
      historialEstados: inv.historialEstados.concat([{
        fecha: now,
        estadoAnterior: inv.estado,
        estadoNuevo: 'reprogramada',
        usuario: usuario,
        comentario: reason || 'Reprogramada sin motivo',
      }]),
    });
  });
}

export function confirmInvoiceForEmission(invoices, invoiceId, usuario) {
  if (!usuario) usuario = 'Lider';
  return invoices.map(function(inv) {
    if (inv.id !== invoiceId) return inv;
    var now = new Date().toISOString().split('T')[0];
    return Object.assign({}, inv, {
      estado: 'confirmada',
      historialEstados: inv.historialEstados.concat([{
        fecha: now,
        estadoAnterior: inv.estado,
        estadoNuevo: 'confirmada',
        usuario: usuario,
        comentario: 'Confirmada para emision',
      }]),
    });
  });
}

export function markInvoiceRequiresReview(invoices, invoiceId, reason, usuario) {
  if (!usuario) usuario = 'Lider';
  return invoices.map(function(inv) {
    if (inv.id !== invoiceId) return inv;
    var now = new Date().toISOString().split('T')[0];
    return Object.assign({}, inv, {
      estado: 'requiere_revision',
      historialEstados: inv.historialEstados.concat([{
        fecha: now,
        estadoAnterior: inv.estado,
        estadoNuevo: 'requiere_revision',
        usuario: usuario,
        comentario: reason || 'Requiere revision',
      }]),
    });
  });
}

export function markInvoiceAsIssued(invoices, invoiceId, invoiceNumber, usuario) {
  if (!usuario) usuario = 'Administrativo';
  return invoices.map(function(inv) {
    if (inv.id !== invoiceId) return inv;
    var now = new Date().toISOString().split('T')[0];
    return Object.assign({}, inv, {
      estado: 'emitida',
      numeroFactura: invoiceNumber || inv.numeroFactura,
      fechaEmision: now,
      historialEstados: inv.historialEstados.concat([{
        fecha: now,
        estadoAnterior: inv.estado,
        estadoNuevo: 'emitida',
        usuario: usuario,
        comentario: 'Factura emitida' + (invoiceNumber ? ' N ' + invoiceNumber : ''),
      }]),
    });
  });
}

export function markInvoiceAsCollected(invoices, invoiceId, collectionDate, usuario) {
  if (!collectionDate) collectionDate = null;
  if (!usuario) usuario = 'Administrativo';
  return invoices.map(function(inv) {
    if (inv.id !== invoiceId) return inv;
    var now = new Date().toISOString().split('T')[0];
    var fecha = collectionDate || now;
    return Object.assign({}, inv, {
      estado: 'cobrada',
      fechaCobro: fecha,
      historialEstados: inv.historialEstados.concat([{
        fecha: now,
        estadoAnterior: inv.estado,
        estadoNuevo: 'cobrada',
        usuario: usuario,
        comentario: 'Cobro registrado el ' + fecha,
      }]),
    });
  });
}

export function markInvoiceAsSent(invoices, invoiceId, usuario, canal, destinatario) {
  if (!usuario) usuario = 'Administrativo';
  if (!canal) canal = null;
  if (!destinatario) destinatario = null;
  return invoices.map(function(inv) {
    if (inv.id !== invoiceId) return inv;
    var now = new Date().toISOString().split('T')[0];
    var canalLabels = {
      email: 'email',
      portal: 'portal del cliente',
      fisico: 'correo fisico',
      whatsapp: 'mensajeria',
    };
    var comentario = 'Factura enviada';
    if (canal) comentario += ' por ' + (canalLabels[canal] || canal);
    if (destinatario) comentario += ' a ' + destinatario;
    return Object.assign({}, inv, {
      estado: 'enviada',
      fechaEnvio: now,
      canalEnvio: canal,
      destinatarioEnvio: destinatario,
      historialEstados: inv.historialEstados.concat([{
        fecha: now,
        estadoAnterior: inv.estado,
        estadoNuevo: 'enviada',
        usuario: usuario,
        comentario: comentario,
      }]),
    });
  });
}
