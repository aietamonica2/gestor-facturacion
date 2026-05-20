// PdfUploadModal.jsx
// Modal multi-paso para importar contratos y cambios de alcance desde PDF.
// Paso 1: seleccion / drag-drop del archivo
// Paso 2: extraccion de texto + analisis IA (spinner)
// Paso 3: formulario de revision con campos pre-completados por IA
// Al confirmar: llama onAdd(nuevoRegistro) y cierra el modal.

import { useState, useRef, useCallback } from 'react';
import Modal from '../ui/Modal.jsx';
import { useApp } from '../../context/AppContext.jsx';
import {
  extractCommercialTermsFromDocument,
  extractCommercialTermsFromScopeChange,
} from '../../services/aiService.js';

// --- Extraccion basica de texto de un PDF binario ---
// Funciona con PDFs que tienen capa de texto (la mayoria).
// Para PDFs escaneados (imagen) no habra texto extraible — el mock IA lo maneja igual.
function extractTextFromPdfBuffer(arrayBuffer) {
  try {
    var bytes = new Uint8Array(arrayBuffer);
    var latin = '';
    for (var i = 0; i < bytes.length; i++) {
      var b = bytes[i];
      if ((b >= 32 && b <= 126) || b === 10 || b === 13) {
        latin += String.fromCharCode(b);
      }
    }
    // Extraer strings visibles entre parentesis (formato PDF)
    var matches = latin.match(/\(([^)]{4,200})\)/g) || [];
    var fromParens = matches.map(function(s) { return s.slice(1, -1); }).join(' ');
    // Tambien incluir texto plano ASCII legible (palabras de 4+ chars)
    var words = latin.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑ]{4,}/g) || [];
    return fromParens + ' ' + words.join(' ');
  } catch (e) {
    return '';
  }
}

// --- Generacion de IDs ---
function genId(prefix) {
  return prefix + '-' + Date.now().toString(36);
}

// --- Formato de bytes ---
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ============================================================
// Componente principal
// tipo: 'contrato' | 'cambio_alcance'
// onAdd(registro): funcion que agrega el registro al contexto
// onClose(): cierra el modal
// ============================================================
export default function PdfUploadModal({ tipo, onClose }) {
  var appCtx = useApp();
  var clients = appCtx.clients;
  var contracts = appCtx.contracts;
  var users = appCtx.users;
  var addContract = appCtx.addContract;
  var addScopeChange = appCtx.addScopeChange;

  var isContrato = tipo === 'contrato';

  // Pasos: 'select' | 'analyzing' | 'review' | 'done'
  var [step, setStep] = useState('select');
  var [dragOver, setDragOver] = useState(false);
  var [selectedFile, setSelectedFile] = useState(null);
  var [analyzeError, setAnalyzeError] = useState(null);
  var [analyzePhase, setAnalyzePhase] = useState('');

  // Campos del formulario de revision (contrato)
  var [form, setForm] = useState({
    // Campos comunes
    clienteId: clients[0] ? clients[0].id : '',
    // Contrato
    nombreContrato: '',
    fechaInicio: '',
    fechaFin: '',
    moneda: 'USD',
    montoTotal: '',
    modalidadFacturacion: 'cuotas',
    condicionesPago: '30 dias fecha factura',
    liderProyectoId: '',
    // Cambio de alcance
    contratoId: contracts[0] ? contracts[0].id : '',
    descripcion: '',
    montoAdicional: '',
    impactoEnPlazo: '',
    estado: 'enviado',
  });
  var [iaResult, setIaResult] = useState(null);

  var fileInputRef = useRef(null);

  // --- Handlers de seleccion de archivo ---
  function handleFileSelect(file) {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setAnalyzeError('Solo se admiten archivos PDF.');
      return;
    }
    setAnalyzeError(null);
    setSelectedFile(file);
    startAnalysis(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    var file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  // --- Analisis del PDF ---
  function startAnalysis(file) {
    setStep('analyzing');
    setAnalyzePhase('Leyendo archivo PDF...');

    var reader = new FileReader();
    reader.onload = function(e) {
      setAnalyzePhase('Extrayendo texto del documento...');
      var text = extractTextFromPdfBuffer(e.target.result);
      // Agregar el nombre del archivo como pista adicional para el mock IA
      var fullText = file.name + ' ' + text;

      setAnalyzePhase('Analizando condiciones comerciales con IA...');

      var analyzePromise = isContrato
        ? extractCommercialTermsFromDocument(fullText)
        : extractCommercialTermsFromScopeChange(fullText);

      analyzePromise.then(function(result) {
        setIaResult(result);
        // Pre-completar el formulario con lo que extrajo la IA
        if (isContrato) {
          setForm(function(prev) {
            var today = new Date().toISOString().split('T')[0];
            var nextYear = (new Date().getFullYear() + 1) + '-12-31';
            return Object.assign({}, prev, {
              nombreContrato: file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '),
              fechaInicio: result.fechaInicio || today,
              fechaFin: result.fechaFin || nextYear,
              moneda: result.moneda || 'USD',
              montoTotal: result.montoTotal ? String(result.montoTotal) : '',
              modalidadFacturacion: result.modalidadFacturacion || 'cuotas',
              condicionesPago: result.condicionesPago || '30 dias fecha factura',
              liderProyectoId: (users.find(function(u) { return u.rol === 'lider_proyecto'; }) || {}).id || '',
            });
          });
        } else {
          setForm(function(prev) {
            return Object.assign({}, prev, {
              descripcion: result.descripcionDetectada || '',
              montoAdicional: result.montoAdicional ? String(result.montoAdicional) : '',
              moneda: result.moneda || 'USD',
              impactoEnPlazo: result.impactoEnPlazo || '',
              modalidadFacturacion: result.modalidadFacturacion || 'cuota_unica',
            });
          });
        }
        setStep('review');
      }).catch(function(err) {
        setAnalyzeError('Error al analizar el PDF: ' + err.message);
        setStep('select');
      });
    };
    reader.onerror = function() {
      setAnalyzeError('No se pudo leer el archivo.');
      setStep('select');
    };
    reader.readAsArrayBuffer(file);
  }

  // --- Cambios en el formulario ---
  function handleChange(field, value) {
    setForm(function(prev) {
      var next = Object.assign({}, prev);
      next[field] = value;
      // Si cambia contrato, actualizar clienteId automaticamente
      if (field === 'contratoId') {
        var contrato = contracts.find(function(c) { return c.id === value; });
        if (contrato) next.clienteId = contrato.clienteId;
      }
      return next;
    });
  }

  // --- Confirmar e importar ---
  function handleConfirm(e) {
    e.preventDefault();
    var now = new Date().toISOString().split('T')[0];

    if (isContrato) {
      var lider = users.find(function(u) { return u.id === form.liderProyectoId; });
      var newContract = {
        id: genId('con'),
        clienteId: form.clienteId,
        nombreContrato: form.nombreContrato || (selectedFile ? selectedFile.name : 'Contrato importado'),
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
        moneda: form.moneda,
        montoTotal: parseFloat(form.montoTotal) || 0,
        modalidadFacturacion: form.modalidadFacturacion,
        condicionesPago: form.condicionesPago,
        estado: 'activo',
        documentoOriginal: selectedFile ? selectedFile.name : null,
        resumenIA: iaResult ? (iaResult.resumenIA || 'Importado desde PDF. Revision manual requerida.') : null,
        condicionesComercialesExtraidas: iaResult || null,
        requiereRevisionHumana: iaResult ? (iaResult.requiereRevisionHumana !== false) : true,
        liderProyectoId: form.liderProyectoId,
        liderProyectoNombre: lider ? lider.nombre : '',
        importadoEn: now,
        origenImportacion: 'pdf',
      };
      addContract(newContract);
    } else {
      var contrato = contracts.find(function(c) { return c.id === form.contratoId; });
      var newScopeChange = {
        id: genId('ca'),
        clienteId: form.clienteId || (contrato ? contrato.clienteId : ''),
        contratoId: form.contratoId,
        descripcion: form.descripcion || 'Cambio de alcance importado desde PDF',
        fechaSolicitud: now,
        fechaAprobacion: null,
        montoAdicional: parseFloat(form.montoAdicional) || 0,
        moneda: form.moneda,
        impactoEnPlazo: form.impactoEnPlazo || 'No especificado',
        generaFacturacion: true,
        modalidadFacturacion: form.modalidadFacturacion || 'cuota_unica',
        cantidadCuotas: 1,
        estado: form.estado || 'enviado',
        requiereRevisionHumana: true,
        facturaGenerada: null,
        documentoOriginal: selectedFile ? selectedFile.name : null,
        condicionesComercialesExtraidas: iaResult || null,
        importadoEn: now,
        origenImportacion: 'pdf',
      };
      addScopeChange(newScopeChange);
    }
    setStep('done');
  }

  // --- Render por paso ---
  if (step === 'done') {
    return (
      <Modal title={isContrato ? 'Contrato importado' : 'Cambio de alcance importado'} onClose={onClose} maxWidth={480}>
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
            {isContrato ? 'Contrato agregado correctamente' : 'Cambio de alcance agregado correctamente'}
          </div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 24 }}>
            El documento fue analizado por IA y aparece ahora en la lista.
            {iaResult && iaResult.requiereRevisionHumana !== false && (
              <div style={{ marginTop: 8, color: 'var(--status-reprogramada)', fontWeight: 600 }}>
                ⚠ Requiere revision humana de los datos extraidos.
              </div>
            )}
          </div>
          <button className="btn btn-primary" onClick={onClose}>Cerrar</button>
        </div>
      </Modal>
    );
  }

  if (step === 'analyzing') {
    return (
      <Modal title={'Analizando PDF con IA'} onClose={onClose} maxWidth={420}>
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div className="upload-spinner" />
          <div style={{ fontWeight: 600, fontSize: 14, marginTop: 20, marginBottom: 8 }}>
            {selectedFile ? selectedFile.name : 'Archivo PDF'}
          </div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{analyzePhase}</div>
        </div>
      </Modal>
    );
  }

  if (step === 'review') {
    return (
      <Modal
        title={isContrato ? 'Revisar datos del contrato' : 'Revisar cambio de alcance'}
        onClose={onClose}
        maxWidth={620}
      >
        <div style={{ marginBottom: 16 }}>
          <div className="upload-ia-banner">
            <span style={{ fontWeight: 700 }}>IA extrajo los datos del PDF.</span>
            {' '}Revisa y corrige los campos antes de importar.
            {iaResult && iaResult.confianzaGeneralPct && (
              <span style={{ marginLeft: 8, opacity: 0.8 }}>
                Confianza: {iaResult.confianzaGeneralPct}%
              </span>
            )}
          </div>
          {selectedFile && (
            <div className="upload-file-chip">
              📄 {selectedFile.name} ({formatBytes(selectedFile.size)})
            </div>
          )}
        </div>

        <form onSubmit={handleConfirm}>
          {isContrato ? (
            <ContratoForm form={form} onChange={handleChange} clients={clients} users={users} />
          ) : (
            <ScopeChangeForm form={form} onChange={handleChange} clients={clients} contracts={contracts} />
          )}

          {iaResult && iaResult.riesgosDetectados && iaResult.riesgosDetectados.length > 0 && (
            <div className="upload-risks-box">
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6 }}>⚠ Riesgos detectados por IA:</div>
              {iaResult.riesgosDetectados.map(function(r, i) {
                return <div key={i} style={{ fontSize: 12, marginBottom: 2 }}>• {r}</div>;
              })}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary">
              {isContrato ? '✓ Importar contrato' : '✓ Importar cambio de alcance'}
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  // Paso 'select' (default)
  return (
    <Modal
      title={isContrato ? 'Importar contrato desde PDF' : 'Importar cambio de alcance desde PDF'}
      onClose={onClose}
      maxWidth={480}
    >
      {analyzeError && (
        <div className="upload-error-banner">{analyzeError}</div>
      )}

      <div
        className={'pdf-upload-zone' + (dragOver ? ' dragover' : '')}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={function() { fileInputRef.current && fileInputRef.current.click(); }}
      >
        <div className="upload-zone-icon">📄</div>
        <div className="upload-zone-title">Arrastra tu PDF aqui</div>
        <div className="upload-zone-sub">o haz clic para seleccionar</div>
        <div className="upload-zone-hint">Solo archivos .pdf</div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        style={{ display: 'none' }}
        onChange={function(e) {
          var file = e.target.files && e.target.files[0];
          if (file) handleFileSelect(file);
          e.target.value = '';
        }}
      />

      <div style={{ marginTop: 20, fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
        <strong>¿Qué hace la IA?</strong> Extrae automaticamente: nombre, cliente, fechas, montos,
        modalidad de facturacion, condiciones de pago y riesgos.
        Podrás revisar y corregir antes de guardar.
      </div>
    </Modal>
  );
}

// --- Sub-formulario: Contrato ---
function ContratoForm({ form, onChange, clients, users }) {
  var lideres = users.filter(function(u) { return u.rol === 'lider_proyecto' || u.rol === 'director_proyecto'; });
  return (
    <div className="upload-field-grid">
      <Field label="Nombre del contrato *" span={2}>
        <input className="form-input" value={form.nombreContrato} onChange={function(e) { onChange('nombreContrato', e.target.value); }} required placeholder="Ej: Implementacion Plataforma Core 2026" />
      </Field>
      <Field label="Cliente *">
        <select className="form-select" value={form.clienteId} onChange={function(e) { onChange('clienteId', e.target.value); }} required>
          {clients.map(function(c) { return <option key={c.id} value={c.id}>{c.nombre}</option>; })}
        </select>
      </Field>
      <Field label="Lider de proyecto">
        <select className="form-select" value={form.liderProyectoId} onChange={function(e) { onChange('liderProyectoId', e.target.value); }}>
          <option value="">Sin asignar</option>
          {lideres.map(function(u) { return <option key={u.id} value={u.id}>{u.nombre}</option>; })}
        </select>
      </Field>
      <Field label="Fecha inicio">
        <input type="date" className="form-input" value={form.fechaInicio} onChange={function(e) { onChange('fechaInicio', e.target.value); }} />
      </Field>
      <Field label="Fecha fin">
        <input type="date" className="form-input" value={form.fechaFin} onChange={function(e) { onChange('fechaFin', e.target.value); }} />
      </Field>
      <Field label="Moneda">
        <select className="form-select" value={form.moneda} onChange={function(e) { onChange('moneda', e.target.value); }}>
          <option value="USD">USD</option>
          <option value="ARS">ARS</option>
        </select>
      </Field>
      <Field label="Monto total">
        <input type="number" className="form-input" value={form.montoTotal} onChange={function(e) { onChange('montoTotal', e.target.value); }} placeholder="0" min="0" />
      </Field>
      <Field label="Modalidad de facturacion">
        <select className="form-select" value={form.modalidadFacturacion} onChange={function(e) { onChange('modalidadFacturacion', e.target.value); }}>
          <option value="cuotas">Cuotas</option>
          <option value="hitos">Hitos / Entregables</option>
          <option value="mensual">Mensual</option>
          <option value="trimestral">Trimestral</option>
          <option value="anual">Anual</option>
          <option value="unica">Pago unico</option>
        </select>
      </Field>
      <Field label="Condiciones de pago" span={2}>
        <input className="form-input" value={form.condicionesPago} onChange={function(e) { onChange('condicionesPago', e.target.value); }} placeholder="Ej: 30 dias fecha factura" />
      </Field>
    </div>
  );
}

// --- Sub-formulario: Cambio de alcance ---
function ScopeChangeForm({ form, onChange, contracts }) {
  return (
    <div className="upload-field-grid">
      <Field label="Contrato asociado *" span={2}>
        <select className="form-select" value={form.contratoId} onChange={function(e) { onChange('contratoId', e.target.value); }} required>
          <option value="">Seleccionar contrato...</option>
          {contracts.map(function(c) { return <option key={c.id} value={c.id}>{c.nombreContrato}</option>; })}
        </select>
      </Field>
      <Field label="Descripcion *" span={2}>
        <textarea
          className="form-input"
          value={form.descripcion}
          onChange={function(e) { onChange('descripcion', e.target.value); }}
          required
          rows={3}
          placeholder="Describe el cambio de alcance..."
          style={{ resize: 'vertical' }}
        />
      </Field>
      <Field label="Moneda">
        <select className="form-select" value={form.moneda} onChange={function(e) { onChange('moneda', e.target.value); }}>
          <option value="USD">USD</option>
          <option value="ARS">ARS</option>
        </select>
      </Field>
      <Field label="Monto adicional">
        <input type="number" className="form-input" value={form.montoAdicional} onChange={function(e) { onChange('montoAdicional', e.target.value); }} placeholder="0" min="0" />
      </Field>
      <Field label="Impacto en plazo" span={2}>
        <input className="form-input" value={form.impactoEnPlazo} onChange={function(e) { onChange('impactoEnPlazo', e.target.value); }} placeholder="Ej: 15 dias adicionales" />
      </Field>
      <Field label="Modalidad de facturacion">
        <select className="form-select" value={form.modalidadFacturacion} onChange={function(e) { onChange('modalidadFacturacion', e.target.value); }}>
          <option value="cuota_unica">Cuota unica</option>
          <option value="cuotas">Cuotas</option>
          <option value="hitos">Hitos</option>
          <option value="mensual">Mensual</option>
        </select>
      </Field>
      <Field label="Estado inicial">
        <select className="form-select" value={form.estado} onChange={function(e) { onChange('estado', e.target.value); }}>
          <option value="enviado">Enviado al cliente</option>
          <option value="aprobado">Aprobado</option>
          <option value="en_revision">En revision</option>
          <option value="facturable">Facturable</option>
        </select>
      </Field>
    </div>
  );
}

// --- Campo del formulario ---
function Field({ label, children, span }) {
  return (
    <div style={{ gridColumn: span === 2 ? '1 / -1' : undefined }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 5, letterSpacing: '0.4px' }}>
        {label}
      </label>
      {children}
    </div>
  );
}
