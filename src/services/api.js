// api.js — Cliente HTTP base para llamadas a la API real
//
// COMO USAR:
//   1. Copiar .env.example a .env y configurar VITE_API_URL
//   2. Importar { api } en el service correspondiente
//   3. Reemplazar las funciones mock por llamadas a api.get/post/patch/delete
//
// EJEMPLO de migracion (invoiceService.js):
//
//   ANTES (mock):
//     export function markInvoiceAsIssued(invoices, invoiceId, ...) {
//       return invoices.map(inv => inv.id === invoiceId ? { ...inv, estado: 'emitida' } : inv);
//     }
//
//   DESPUES (API real):
//     export async function markInvoiceAsIssued(invoiceId, invoiceNumber) {
//       return api.patch('/facturas/' + invoiceId + '/emitir', { numeroFactura: invoiceNumber });
//     }
//
// El contexto (AppContext.jsx) debera usar React Query o useEffect + useState
// para cachear y revalidar los datos del servidor.

var BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:3001';

var TIMEOUT_MS = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_TIMEOUT)
  ? parseInt(import.meta.env.VITE_API_TIMEOUT, 10)
  : 10000;

function buildHeaders() {
  var headers = { 'Content-Type': 'application/json' };
  var token = localStorage.getItem('auth_token');
  if (token) headers['Authorization'] = 'Bearer ' + token;
  return headers;
}

async function request(method, path, body) {
  var controller = new AbortController();
  var timer = setTimeout(function() { controller.abort(); }, TIMEOUT_MS);

  try {
    var opts = {
      method: method,
      headers: buildHeaders(),
      signal: controller.signal,
    };
    if (body !== undefined) opts.body = JSON.stringify(body);

    var res = await fetch(BASE_URL + path, opts);
    clearTimeout(timer);

    if (!res.ok) {
      var err = await res.json().catch(function() { return {}; });
      var msg = err.message || 'Error ' + res.status;
      throw new Error(msg);
    }
    if (res.status === 204) return null;
    return res.json();
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') throw new Error('Timeout: el servidor no respondio en ' + TIMEOUT_MS + 'ms');
    throw e;
  }
}

export var api = {
  get:    function(path)        { return request('GET',    path); },
  post:   function(path, body)  { return request('POST',   path, body); },
  patch:  function(path, body)  { return request('PATCH',  path, body); },
  put:    function(path, body)  { return request('PUT',    path, body); },
  delete: function(path)        { return request('DELETE', path); },
};
