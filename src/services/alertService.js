// alertService.js — Generacion de alertas automaticas

import { getEffectiveBillingDate, daysUntil } from '../utils/dates.js';

var BLOCKED_STATES = ['cobrada', 'cancelada', 'emitida', 'enviada_al_cliente'];

export function generatePreBillingAlerts(invoices, existingAlerts) {
  if (!existingAlerts) existingAlerts = [];
  var existingFacturaIds = new Set(
    existingAlerts
      .filter(function(a) { return a.tipo === 'validacion_lider_2dias' && a.estado === 'pendiente'; })
      .map(function(a) { return a.facturaId; })
  );

  var newAlerts = [];
  invoices.forEach(function(inv) {
    if (BLOCKED_STATES.indexOf(inv.estado) !== -1) return;
    if (existingFacturaIds.has(inv.id)) return;
    var effectiveDate = getEffectiveBillingDate(inv);
    var days = daysUntil(effectiveDate);
    if (days !== null && days >= 0 && days <= inv.diasAvisoPrevio) {
      newAlerts.push({
        id: 'alr-auto-' + inv.id,
        tipo: 'validacion_lider_2dias',
        prioridad: days === 0 ? 'critica' : 'alta',
        clienteId: inv.clienteId,
        facturaId: inv.id,
        contratoId: inv.contratoId,
        liderProyectoId: inv.liderProyectoId,
        destinatarioRol: 'lider_proyecto',
        mensaje: 'Factura ' + inv.id + ' (' + inv.descripcion + ') vence ' + (days === 0 ? 'HOY' : 'en ' + days + ' dia(s)') + ' (' + effectiveDate + '). Requiere confirmacion.',
        fechaAlerta: new Date().toISOString().split('T')[0],
        estado: 'pendiente',
        accionesDisponibles: ['confirmar_emision', 'reprogramar', 'marcar_requiere_revision'],
      });
    }
  });
  return newAlerts;
}

export function generateInvoiceAlerts(invoices) {
  var today = new Date().toISOString().split('T')[0];
  return invoices
    .filter(function(inv) {
      if (inv.estado !== 'emitida' && inv.estado !== 'enviada_al_cliente') return false;
      return inv.fechaVencimiento && inv.fechaVencimiento < today;
    })
    .map(function(inv) {
      return {
        id: 'alr-vencida-' + inv.id,
        tipo: 'factura_vencida',
        prioridad: 'critica',
        clienteId: inv.clienteId,
        facturaId: inv.id,
        contratoId: inv.contratoId,
        liderProyectoId: inv.liderProyectoId,
        destinatarioRol: 'administrativo',
        mensaje: 'Factura ' + (inv.numeroFactura || inv.id) + ' vencio el ' + inv.fechaVencimiento + ' sin registrar cobro.',
        fechaAlerta: today,
        estado: 'pendiente',
        accionesDisponibles: ['marcar_cobrada', 'contactar_cliente'],
      };
    });
}

export function generateLicenseRenewalAlerts(licenses) {
  var today = new Date().toISOString().split('T')[0];
  return licenses
    .filter(function(lic) {
      if (!lic.fechaRenovacion) return false;
      var days = daysUntil(lic.fechaRenovacion);
      return days !== null && days >= 0 && days <= lic.diasAlertaAntesRenovacion;
    })
    .map(function(lic) {
      var days = daysUntil(lic.fechaRenovacion);
      return {
        id: 'alr-lic-' + lic.id,
        tipo: 'renovacion_licencia',
        prioridad: days <= 15 ? 'alta' : 'media',
        clienteId: lic.clienteId,
        facturaId: null,
        contratoId: null,
        liderProyectoId: null,
        destinatarioRol: 'administrativo',
        mensaje: 'Licencia "' + lic.nombreLicencia + '" vence el ' + lic.fechaRenovacion + '. Quedan ' + days + ' dias para la renovacion.',
        fechaAlerta: today,
        estado: 'pendiente',
        accionesDisponibles: ['generar_factura_renovacion'],
      };
    });
}

export function generateScopeChangeAlerts(scopeChanges) {
  var today = new Date().toISOString().split('T')[0];
  return scopeChanges
    .filter(function(sc) { return sc.estado === 'aprobado' && sc.generaFacturacion && !sc.facturaGenerada; })
    .map(function(sc) {
      return {
        id: 'alr-ca-' + sc.id,
        tipo: 'cambio_alcance_no_facturado',
        prioridad: 'alta',
        clienteId: sc.clienteId,
        facturaId: null,
        contratoId: sc.contratoId,
        liderProyectoId: null,
        destinatarioRol: 'administrativo',
        mensaje: 'Cambio de alcance ' + sc.id + ' (' + sc.descripcion + ') esta aprobado desde ' + sc.fechaAprobacion + ' y no tiene factura generada.',
        fechaAlerta: today,
        estado: 'pendiente',
        accionesDisponibles: ['crear_factura'],
      };
    });
}

export function resolveAlert(alerts, alertId) {
  return alerts.map(function(a) {
    return a.id === alertId ? Object.assign({}, a, { estado: 'resuelta' }) : a;
  });
}

export function markAlertAsSeen(alerts, alertId) {
  return alerts.map(function(a) {
    return a.id === alertId ? Object.assign({}, a, { visto: true }) : a;
  });
}

export function countCriticalAlerts(alerts) {
  return alerts.filter(function(a) {
    return a.estado === 'pendiente' && a.prioridad === 'critica';
  }).length;
}
