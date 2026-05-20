// aiService.js — Extracción simulada de condiciones comerciales con IA
// En producción: reemplazar por llamadas a Claude API o modelo LLM propio
// Endpoint futuro: VITE_AI_API_URL env variable

/**
 * Simula la extracción de condiciones comerciales desde el texto de un contrato.
 * Devuelve un objeto estructurado con los campos detectados.
 */
export async function extractCommercialTermsFromDocument(documentText = '') {
  // Simulación de latencia de API
  await delay(1800);

  const text = documentText.toLowerCase();

  // Detección heurística simple para demo
  const isUSD = text.includes('usd') || text.includes('dólares') || text.includes('dollar');
  const currency = isUSD ? 'USD' : 'ARS';
  const hasInstallments = text.includes('cuota') || text.includes('installment');
  const hasMilestones = text.includes('hito') || text.includes('milestone') || text.includes('entregable');
  const hasLicense = text.includes('licencia') || text.includes('license') || text.includes('licenciamiento');

  return {
    iaGenerado: true,
    requiereRevisionHumana: true,
    confianzaGeneralPct: 82,
    clienteDetectado: extractClient(text) || 'No detectado',
    fechaInicio: '2026-01-01',
    fechaFin: '2026-12-31',
    moneda: currency,
    montoTotal: isUSD ? 120000 : 8500000,
    modalidadFacturacion: hasInstallments ? 'cuotas' : hasMilestones ? 'hitos' : 'mensual',
    condicionesPago: '30 días fecha factura',
    hitosFacturables: hasMilestones
      ? [
          { nombre: 'Inicio del proyecto', porcentaje: 30, monto: isUSD ? 36000 : 2550000, fechaEstimadaFacturacion: '2026-02-01' },
          { nombre: 'Entrega parcial', porcentaje: 40, monto: isUSD ? 48000 : 3400000, fechaEstimadaFacturacion: '2026-06-01' },
          { nombre: 'Entrega final', porcentaje: 30, monto: isUSD ? 36000 : 2550000, fechaEstimadaFacturacion: '2026-11-01' },
        ]
      : [],
    cuotas: hasInstallments
      ? [
          { cuotaNumero: 1, totalCuotas: 3, monto: isUSD ? 40000 : 2833333, fechaPrevistaFacturacion: '2026-02-01' },
          { cuotaNumero: 2, totalCuotas: 3, monto: isUSD ? 40000 : 2833333, fechaPrevistaFacturacion: '2026-06-01' },
          { cuotaNumero: 3, totalCuotas: 3, monto: isUSD ? 40000 : 2833333, fechaPrevistaFacturacion: '2026-10-01' },
        ]
      : [],
    licenciamiento: hasLicense
      ? {
          incluido: true,
          tipoLicencia: 'Enterprise',
          montoAnual: isUSD ? 25000 : 3000000,
          fechaRenovacion: '2027-01-01',
        }
      : { incluido: false },
    penalidades: text.includes('penalidad') || text.includes('mora') ? 'Detectadas — requieren revisión' : 'No especificadas',
    descuentos: text.includes('descuento') ? 'Detectados — revisar porcentaje' : 'Sin descuentos detectados',
    riesgosDetectados: buildRisks(text),
    informacionFaltante: buildMissingInfo(text),
    condicionesQueRequierenRevision: [
      'Fecha exacta de cada hito sujeta a aprobación del cliente',
      'Penalidades por mora no cuantificadas',
      'Condiciones de rescisión no detectadas',
    ],
  };
}

/**
 * Extracción desde texto de cambio de alcance.
 */
export async function extractCommercialTermsFromScopeChange(scopeChangeText = '') {
  await delay(1200);
  const text = scopeChangeText.toLowerCase();
  return {
    iaGenerado: true,
    requiereRevisionHumana: true,
    confianzaGeneralPct: 75,
    descripcionDetectada: scopeChangeText.slice(0, 200) || 'No detectada',
    montoAdicional: 0,
    moneda: text.includes('usd') ? 'USD' : 'ARS',
    impactoEnPlazo: 'No especificado — requiere revisión',
    modalidadFacturacion: 'cuota_unica',
    riesgosDetectados: ['Monto adicional no detectado — ingrese manualmente'],
  };
}

// --- Helpers internos ---
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractClient(text) {
  const patterns = [
    /cliente[:\s]+([a-záéíóúñ\s]+)/i,
    /contratante[:\s]+([a-záéíóúñ\s]+)/i,
    /entre\s+.+\s+y\s+([a-záéíóúñ\s]+)\s+s\.a/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim().slice(0, 50);
  }
  return null;
}

function buildRisks(text) {
  const risks = [];
  if (!text.includes('penalidad') && !text.includes('mora')) risks.push('No se especifica penalidad por mora');
  if (!text.includes('rescisión') && !text.includes('rescision')) risks.push('No se detecta cláusula de rescisión');
  if (text.includes('según')) risks.push('Cláusula condicional detectada — requiere revisión humana');
  if (text.length < 100) risks.push('Texto muy corto — extracción puede ser incompleta');
  return risks.length ? risks : ['Sin riesgos críticos detectados'];
}

function buildMissingInfo(text) {
  const missing = [];
  if (!text.includes('fecha')) missing.push('Fechas de inicio/fin no encontradas');
  if (!text.includes('monto') && !text.includes('valor') && !text.includes('precio')) missing.push('Monto total no detectado');
  return missing;
}
