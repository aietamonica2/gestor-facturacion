// AppContext -- Estado global de la aplicacion
// En produccion: reemplazar por React Query + llamadas API

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { mockInvoices } from '../data/mockInvoices.js';
import { mockClients } from '../data/mockClients.js';
import { mockContracts } from '../data/mockContracts.js';
import { mockLicenses } from '../data/mockLicenses.js';
import { mockScopeChanges } from '../data/mockScopeChanges.js';
import { mockAlerts } from '../data/mockAlerts.js';
import { mockUsers } from '../data/mockUsers.js';
import {
  rescheduleInvoice,
  confirmInvoiceForEmission,
  markInvoiceRequiresReview,
  markInvoiceAsIssued,
  markInvoiceAsCollected,
  markInvoiceAsSent,
} from '../services/invoiceService.js';
import {
  resolveAlert,
  markAlertAsSeen,
  generatePreBillingAlerts,
  generateInvoiceAlerts,
  generateLicenseRenewalAlerts,
  generateScopeChangeAlerts,
} from '../services/alertService.js';

var AppContext = createContext(null);

export var ROLES = {
  director: 'director_proyecto',
  lider: 'lider_proyecto',
  admin: 'administrativo',
};

function buildInitialAlerts(invoices, licenses, scopeChanges) {
  var autoPreBilling   = generatePreBillingAlerts(invoices, mockAlerts);
  var autoVencidas     = generateInvoiceAlerts(invoices);
  var autoLicenses     = generateLicenseRenewalAlerts(licenses);
  var autoScopeChanges = generateScopeChangeAlerts(scopeChanges);

  var existingKeys = new Set(
    mockAlerts.map(function(a) { return a.tipo + '__' + (a.facturaId || a.clienteId); })
  );

  var newAuto = autoPreBilling
    .concat(autoVencidas)
    .concat(autoLicenses)
    .concat(autoScopeChanges)
    .filter(function(a) {
      return !existingKeys.has(a.tipo + '__' + (a.facturaId || a.clienteId));
    });

  return mockAlerts.concat(newAuto);
}

export function AppProvider({ children }) {
  var [invoices, setInvoices]       = useState(mockInvoices);
  var [clients, setClients]         = useState(mockClients);
  var [contracts, setContracts]     = useState(mockContracts);
  var [licenses, setLicenses]       = useState(mockLicenses);
  var [scopeChanges, setScopeChanges] = useState(mockScopeChanges);
  var [users]                       = useState(mockUsers);
  var [currentRole, setCurrentRole] = useState(ROLES.director);

  var [alerts, setAlerts] = useState(function() {
    return buildInitialAlerts(mockInvoices, mockLicenses, mockScopeChanges);
  });

  // --- Acciones de factura ---

  var reschedule = useCallback(function(invoiceId, newDate, reason) {
    setInvoices(function(prev) {
      var updated = rescheduleInvoice(prev, invoiceId, newDate, reason, getCurrentUserName(currentRole));
      setAlerts(function(prevAlerts) {
        return prevAlerts.map(function(a) {
          return (a.facturaId === invoiceId && a.tipo === 'validacion_lider_2dias')
            ? Object.assign({}, a, { estado: 'resuelta' }) : a;
        });
      });
      return updated;
    });
  }, [currentRole]);

  var confirmEmission = useCallback(function(invoiceId) {
    setInvoices(function(prev) {
      var updated = confirmInvoiceForEmission(prev, invoiceId, getCurrentUserName(currentRole));
      setAlerts(function(prevAlerts) {
        return prevAlerts.map(function(a) {
          return (a.facturaId === invoiceId && a.tipo === 'validacion_lider_2dias')
            ? Object.assign({}, a, { estado: 'resuelta' }) : a;
        });
      });
      return updated;
    });
  }, [currentRole]);

  var requireReview = useCallback(function(invoiceId, reason) {
    setInvoices(function(prev) {
      var updated = markInvoiceRequiresReview(prev, invoiceId, reason, getCurrentUserName(currentRole));
      setAlerts(function(prevAlerts) {
        return prevAlerts.map(function(a) {
          return (a.facturaId === invoiceId && a.tipo === 'validacion_lider_2dias')
            ? Object.assign({}, a, { estado: 'resuelta' }) : a;
        });
      });
      return updated;
    });
  }, [currentRole]);

  var issueInvoice = useCallback(function(invoiceId, invoiceNumber) {
    setInvoices(function(prev) {
      return markInvoiceAsIssued(prev, invoiceId, invoiceNumber, getCurrentUserName(currentRole));
    });
  }, [currentRole]);

  var collectInvoice = useCallback(function(invoiceId, date) {
    setInvoices(function(prev) {
      return markInvoiceAsCollected(prev, invoiceId, date, getCurrentUserName(currentRole));
    });
  }, [currentRole]);

  var sendInvoice = useCallback(function(invoiceId, canal, destinatario) {
    if (!canal) canal = null;
    if (!destinatario) destinatario = null;
    setInvoices(function(prev) {
      return markInvoiceAsSent(prev, invoiceId, getCurrentUserName(currentRole), canal, destinatario);
    });
  }, [currentRole]);

  // --- ABM Contratos ---

  var addContract = useCallback(function(contract) {
    setContracts(function(prev) { return [contract].concat(prev); });
  }, []);

  var updateContract = useCallback(function(id, changes) {
    setContracts(function(prev) {
      return prev.map(function(c) {
        return c.id === id ? Object.assign({}, c, changes) : c;
      });
    });
  }, []);

  var deleteContract = useCallback(function(id) {
    setContracts(function(prev) { return prev.filter(function(c) { return c.id !== id; }); });
  }, []);

  // --- ABM Cambios de alcance ---

  var addScopeChange = useCallback(function(sc) {
    setScopeChanges(function(prev) { return [sc].concat(prev); });
  }, []);

  var updateScopeChange = useCallback(function(id, changes) {
    setScopeChanges(function(prev) {
      return prev.map(function(s) {
        return s.id === id ? Object.assign({}, s, changes) : s;
      });
    });
  }, []);

  var deleteScopeChange = useCallback(function(id) {
    setScopeChanges(function(prev) { return prev.filter(function(s) { return s.id !== id; }); });
  }, []);

  // --- ABM Licencias ---

  var addLicense = useCallback(function(license) {
    setLicenses(function(prev) { return [license].concat(prev); });
  }, []);

  var updateLicense = useCallback(function(id, changes) {
    setLicenses(function(prev) {
      return prev.map(function(l) {
        return l.id === id ? Object.assign({}, l, changes) : l;
      });
    });
  }, []);

  var deleteLicense = useCallback(function(id) {
    setLicenses(function(prev) { return prev.filter(function(l) { return l.id !== id; }); });
  }, []);

  // --- ABM Clientes ---

  var addClient = useCallback(function(client) {
    setClients(function(prev) { return [client].concat(prev); });
  }, []);

  var updateClient = useCallback(function(id, changes) {
    setClients(function(prev) {
      return prev.map(function(c) {
        return c.id === id ? Object.assign({}, c, changes) : c;
      });
    });
  }, []);

  var deleteClient = useCallback(function(id) {
    setClients(function(prev) { return prev.filter(function(c) { return c.id !== id; }); });
  }, []);

  // --- Acciones de alerta ---

  var dismissAlert = useCallback(function(alertId) {
    setAlerts(function(prev) { return resolveAlert(prev, alertId); });
  }, []);

  var seeAlert = useCallback(function(alertId) {
    setAlerts(function(prev) { return markAlertAsSeen(prev, alertId); });
  }, []);

  // --- Selectores ---

  var getClientById = useCallback(function(id) {
    return clients.find(function(c) { return c.id === id; });
  }, [clients]);

  var getContractById = useCallback(function(id) {
    return contracts.find(function(c) { return c.id === id; });
  }, [contracts]);

  var getInvoiceById = useCallback(function(id) {
    return invoices.find(function(i) { return i.id === id; });
  }, [invoices]);

  var visibleInvoices = useMemo(function() {
    if (currentRole === ROLES.lider) {
      var liderUser = users.find(function(u) { return u.rol === 'lider_proyecto'; });
      return invoices.filter(function(i) {
        return i.liderProyectoId === (liderUser && liderUser.id) || true;
      });
    }
    return invoices;
  }, [invoices, currentRole, users]);

  var visibleAlerts = useMemo(function() {
    if (currentRole === ROLES.director) return alerts;
    if (currentRole === ROLES.lider) {
      return alerts.filter(function(a) {
        return ['lider_proyecto', 'director_proyecto'].indexOf(a.destinatarioRol) !== -1;
      });
    }
    if (currentRole === ROLES.admin) {
      return alerts.filter(function(a) {
        return ['administrativo', 'director_proyecto'].indexOf(a.destinatarioRol) !== -1;
      });
    }
    return alerts;
  }, [alerts, currentRole]);

  var getInvoicesByClient = useCallback(function(clientId) {
    return invoices.filter(function(i) { return i.clienteId === clientId; });
  }, [invoices]);

  var getContractsByClient = useCallback(function(clientId) {
    return contracts.filter(function(c) { return c.clienteId === clientId; });
  }, [contracts]);

  var getLicensesByClient = useCallback(function(clientId) {
    return licenses.filter(function(l) { return l.clienteId === clientId; });
  }, [licenses]);

  var getScopeChangesByClient = useCallback(function(clientId) {
    return scopeChanges.filter(function(s) { return s.clienteId === clientId; });
  }, [scopeChanges]);

  var getPendingAlerts = useCallback(function() {
    return visibleAlerts.filter(function(a) { return a.estado === 'pendiente'; });
  }, [visibleAlerts]);

  var value = {
    invoices: visibleInvoices,
    allInvoices: invoices,
    clients: clients,
    contracts: contracts,
    licenses: licenses,
    scopeChanges: scopeChanges,
    alerts: visibleAlerts,
    users: users,
    currentRole: currentRole,
    setCurrentRole: setCurrentRole,
    // Facturas
    reschedule: reschedule,
    confirmEmission: confirmEmission,
    requireReview: requireReview,
    issueInvoice: issueInvoice,
    collectInvoice: collectInvoice,
    sendInvoice: sendInvoice,
    // ABM Contratos
    addContract: addContract,
    updateContract: updateContract,
    deleteContract: deleteContract,
    // ABM Licencias
    addLicense: addLicense,
    updateLicense: updateLicense,
    deleteLicense: deleteLicense,
    // ABM Cambios de alcance
    addScopeChange: addScopeChange,
    updateScopeChange: updateScopeChange,
    deleteScopeChange: deleteScopeChange,
    // ABM Clientes
    addClient: addClient,
    updateClient: updateClient,
    deleteClient: deleteClient,
    // Alertas
    dismissAlert: dismissAlert,
    seeAlert: seeAlert,
    // Selectores
    getClientById: getClientById,
    getContractById: getContractById,
    getInvoiceById: getInvoiceById,
    getInvoicesByClient: getInvoicesByClient,
    getContractsByClient: getContractsByClient,
    getLicensesByClient: getLicensesByClient,
    getScopeChangesByClient: getScopeChangesByClient,
    getPendingAlerts: getPendingAlerts,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  var ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

function getCurrentUserName(role) {
  var map = {
    director_proyecto: 'Diego Ramirez',
    lider_proyecto: 'Maria Gonzalez',
    administrativo: 'Ana Torres',
  };
  return map[role] || 'Usuario';
}
