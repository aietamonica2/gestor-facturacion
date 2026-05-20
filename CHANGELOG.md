# Changelog tecnico

Todos los cambios relevantes del proyecto se documentan aqui.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

---

## [v1.4.0] - 2026-05-20

### Added
- `LicenseFormModal.jsx` -- modal unico para Alta y Modificacion de licencias
- Boton "Nueva licencia" en `Licenses.jsx`
- Botones "Editar" y "Eliminar" por fila en la tabla de licencias
- Dialogo de confirmacion antes de eliminar licencias
- `addLicense`, `updateLicense`, `deleteLicense` en AppContext

---

## [v1.3.0] - 2026-05-20

### Added
- `ClientFormModal.jsx` -- modal unico para Alta y Modificacion de clientes
- Boton "Nuevo cliente" en `Clients.jsx`
- Botones "Editar" y "Eliminar" por fila en la tabla de clientes
- Dialogo de confirmacion antes de eliminar (bloquea si hay facturas activas)
- `APP_VERSION` y `APP_NAME` en `src/version.js`
- `CHANGELOG.md` y `CHANGELOG_FUNCTIONAL.md`

### Fixed
- `main.jsx` truncado -- reescritura limpia
- `alertService.js` truncado -- funciones restauradas
- `projectionService.js` truncado -- funciones restauradas
- `invoiceService.js` truncado -- funcion `markInvoiceAsSent` restaurada
- `App.jsx` con bytes nulos -- limpieza con script Python

---

## [v1.2.0] - 2026-05-19

### Added
- `EditContractModal.jsx` -- edicion manual de contratos post-importacion IA
- `EditScopeChangeModal.jsx` -- edicion manual de cambios de alcance
- Boton "Editar" en tabla de Contratos y en panel de detalle de Cambios de Alcance

---

## [v1.1.0] - 2026-05-18

### Added
- `PdfUploadModal.jsx` -- modal multi-paso para importar PDFs
- Sidebar colapsable con estado persistido en localStorage

---

## [v1.0.0] - 2026-05-10

### Added
- Setup base: Vite 5 + React 18 + React Router v6
- Todos los modulos principales: Dashboard, Facturacion, Contratos, Clientes,
  Cambios de Alcance, Licencias, Alertas, Proyeccion de cobranzas
- Sistema de roles (Director / Lider / Administrativo)
