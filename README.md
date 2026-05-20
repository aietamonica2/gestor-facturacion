# Gestor de Facturacion Contractual (CBT)

Aplicacion web para gestionar el ciclo completo de facturacion contractual: desde la planificacion de facturas hasta el registro de cobros, con seguimiento de licencias, cambios de alcance y proyeccion de cobranzas.

---

## Instalacion rapida

```bash
# Requisitos: Node.js >= 18
cd gestor-facturacion
npm install
cp .env.example .env        # configurar VITE_API_URL si aplica
npm run dev                 # http://localhost:5173
```

### Comandos disponibles

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con hot-reload |
| `npm run build` | Build de produccion en `dist/` |
| `npm run preview` | Preview del build de produccion |

---

## Estructura del proyecto

```
src/
├── context/
│   └── AppContext.jsx        Estado global (facturas, alertas, clientes, roles)
├── router/
│   └── AppRouter.jsx         Definicion de rutas con React Router v6
├── layouts/
│   └── MainLayout.jsx        Shell: sidebar + header + outlet
├── pages/
│   ├── Dashboard.jsx          KPIs ejecutivos + acciones del dia
│   ├── Clients.jsx            Listado de clientes con semaforo de salud
│   ├── ClientDetail.jsx       Detalle de cliente: contratos, facturas, licencias
│   ├── Contracts.jsx          Listado de contratos
│   ├── ContractDetail.jsx     Barra de progreso de facturacion por contrato
│   ├── Invoices.jsx           Gestion completa del ciclo de facturas
│   ├── Licenses.jsx           Licencias anuales con alertas de vencimiento
│   ├── ScopeChanges.jsx       Cambios de alcance con extraccion IA
│   ├── Alerts.jsx             Centro de alertas con resolucion masiva
│   └── CollectionsProjection.jsx  Proyeccion mensual USD/ARS + grafico por cliente
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx        Navegacion lateral colapsable por rol
│   │   └── Header.jsx         Barra superior con selector de rol
│   ├── invoices/
│   │   ├── InvoiceActions.jsx Acciones disponibles segun estado de factura
│   │   ├── RescheduleModal.jsx
│   │   ├── IssueModal.jsx
│   │   ├── ReviewReasonModal.jsx
│   │   ├── CollectModal.jsx
│   │   └── SendModal.jsx
│   └── ui/
│       ├── Badge.jsx          StatusBadge con colores por estado
│       └── Modal.jsx          Wrapper de modal reutilizable
├── services/
│   ├── api.js                 Cliente HTTP base (fetch + timeout + auth header)
│   ├── invoiceService.js      Logica de estados de facturas
│   ├── alertService.js        Generacion y gestion de alertas
│   ├── projectionService.js   Calculo de proyeccion de cobranzas
│   └── aiService.js           Extraccion de terminos comerciales con IA
├── data/
│   └── mock*.js               Datos de prueba (reemplazar por llamadas API)
├── utils/
│   ├── currency.js            formatCurrency (USD / ARS)
│   ├── dates.js               formatDate, formatMonthYear, getEffectiveBillingDate
│   └── status.js              Labels y constantes de estados
└── styles/
    └── global.css             Estilos globales + variables CSS de colores de estado
```

---

## Roles de usuario

| Rol | Acceso |
|-----|--------|
| **Director de Proyecto** | Todo: dashboard, clientes, contratos, alcance, facturas, licencias, alertas, proyeccion |
| **Lider de Proyecto** | Dashboard, clientes propios, cambios de alcance, facturacion (validacion), alertas |
| **Administrativo** | Dashboard, facturacion (emision/cobro), licencias, alertas, proyeccion |

El rol se selecciona desde el header (modo demo). En produccion, se reemplaza por autenticacion JWT.

---

## Ciclo de vida de una factura

```
planificada
   └→ pendiente_validacion_lider  (2 dias antes de fecha prevista)
         └→ pendiente_de_emitir   (lider confirma)
               └→ emitida          (admin emite con numero de factura)
                     └→ enviada_al_cliente  (admin envia por email/portal/etc)
                           └→ cobrada        (admin registra cobro con fecha)

En cualquier punto:
   └→ reprogramada    (lider/director pospone con motivo)
   └→ requiere_revision
   └→ vencida         (auto: fecha de vencimiento superada y no cobrada)
```

---

## Migracion a backend real

La app esta construida con una separacion clara entre logica de negocio (servicios) y estado (contexto), lo que permite migrar a una API real por modulos.

**Paso 1** — Configurar la URL:
```bash
# .env
VITE_API_URL=https://api.tudominio.com
```

**Paso 2** — Usar el cliente HTTP:
```js
import { api } from './services/api.js';
// GET /facturas
const facturas = await api.get('/facturas');
// PATCH /facturas/:id/emitir
await api.patch('/facturas/' + id + '/emitir', { numeroFactura: 'F-001' });
```

**Paso 3** — Reemplazar Context por React Query:
```js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
const { data: invoices } = useQuery(['invoices'], () => api.get('/facturas'));
```

Cada archivo `src/services/*.js` incluye comentarios detallados con los endpoints sugeridos para cada operacion.

---

## Stack tecnologico

| Tecnologia | Version | Uso |
|------------|---------|-----|
| React | 18.3 | UI reactiva con hooks |
| React Router | 6.26 | Navegacion SPA |
| Recharts | 2.13 | Graficos de barras y proyeccion |
| Vite | 5.4 | Build tool y dev server |
| CSS Custom Properties | — | Theming y colores de estado |

Sin TypeScript por decision de proyecto. Sin librerías de UI externa (control total de estilos).
