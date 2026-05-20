-- Seed data for CBT — datos de prueba
-- Basados en los mocks originales del frontend

INSERT OR IGNORE INTO users (id, name, role, email, created_at) VALUES
  ('u-001', 'Diego Ramirez',   'director_proyecto', 'diego@moovingtech.com',  '2026-01-01T00:00:00Z'),
  ('u-002', 'Maria Gonzalez',  'lider_proyecto',    'maria@moovingtech.com',   '2026-01-01T00:00:00Z'),
  ('u-003', 'Ana Torres',      'administrativo',    'ana@moovingtech.com',     '2026-01-01T00:00:00Z');

INSERT OR IGNORE INTO clients (id, name, legal_name, tax_id, billing_email, client_type, preferred_currency, payment_terms, project_leader_id, status, created_at, updated_at) VALUES
  ('c-001', 'Supermercados Norte', 'Supermercados Norte SA', '30-12345678-9', 'admin@norte.com', 'empresa', 'ARS', 'NET30', 'u-002', 'activo', '2026-01-10T00:00:00Z', '2026-01-10T00:00:00Z'),
  ('c-002', 'Farmacia Del Sol',    'Farmacia Del Sol SRL',   '30-98765432-1', 'cont@delsol.com', 'empresa', 'USD', 'NET15', 'u-002', 'activo', '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  ('c-003', 'Constructora Andes',  'Constructora Andes SA',  '30-55566677-8', 'pagos@andes.com', 'empresa', 'USD', 'NET30', 'u-002', 'activo', '2026-02-01T00:00:00Z', '2026-02-01T00:00:00Z'),
  ('c-004', 'Logistica Sur',       'Logistica Sur SRL',      '30-44455566-7', 'cfo@lsur.com',    'empresa', 'ARS', 'NET60', 'u-002', 'activo', '2026-02-10T00:00:00Z', '2026-02-10T00:00:00Z'),
  ('c-005', 'Tech Retail SA',      'Tech Retail SA',         '30-11122233-4', 'fin@techretail.com','empresa','USD','NET30','u-002', 'activo', '2026-03-01T00:00:00Z', '2026-03-01T00:00:00Z');

INSERT OR IGNORE INTO contracts (id, client_id, description, total_amount, currency, start_date, end_date, status, billing_percentage, created_at, updated_at) VALUES
  ('ct-001', 'c-001', 'Implementacion ERP Modulo Ventas',       85000, 'USD', '2026-01-15', '2026-12-31', 'activo', 45, '2026-01-15T00:00:00Z', '2026-01-15T00:00:00Z'),
  ('ct-002', 'c-001', 'Soporte y Mantenimiento Anual 2026',     24000, 'ARS', '2026-01-01', '2026-12-31', 'activo', 33, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
  ('ct-003', 'c-002', 'Desarrollo App Mobile Farmacia',         42000, 'USD', '2026-02-01', '2026-09-30', 'activo', 60, '2026-02-01T00:00:00Z', '2026-02-01T00:00:00Z'),
  ('ct-004', 'c-003', 'Sistema de Gestion de Obras',            95000, 'USD', '2026-01-20', '2026-11-30', 'activo', 25, '2026-01-20T00:00:00Z', '2026-01-20T00:00:00Z'),
  ('ct-005', 'c-004', 'Plataforma Logistica Integrada',        180000, 'ARS', '2026-03-01', '2026-12-31', 'activo', 15, '2026-03-01T00:00:00Z', '2026-03-01T00:00:00Z');

INSERT OR IGNORE INTO invoices (id, client_id, contract_id, description, amount, currency, status, scheduled_date, rescheduled_date, invoice_number, project_leader_id, created_at, updated_at) VALUES
  ('inv-001', 'c-001', 'ct-001', 'Cuota 1 - Inicio proyecto ERP',       17000, 'USD', 'cobrada',      '2026-02-01', NULL,         'FA-0001', 'u-002', '2026-01-20T00:00:00Z', '2026-02-05T00:00:00Z'),
  ('inv-002', 'c-001', 'ct-001', 'Cuota 2 - Modulo ventas completado',  21250, 'USD', 'emitida',      '2026-04-01', NULL,         'FA-0012', 'u-002', '2026-03-15T00:00:00Z', '2026-04-01T00:00:00Z'),
  ('inv-003', 'c-001', 'ct-002', 'Soporte Q1 2026',                      6000, 'ARS', 'cobrada',      '2026-01-31', NULL,         'FA-0003', 'u-002', '2026-01-10T00:00:00Z', '2026-02-02T00:00:00Z'),
  ('inv-004', 'c-002', 'ct-003', 'Sprint 1-2 App Mobile',               12600, 'USD', 'enviada',      '2026-03-15', NULL,         'FA-0009', 'u-002', '2026-03-01T00:00:00Z', '2026-03-15T00:00:00Z'),
  ('inv-005', 'c-002', 'ct-003', 'Sprint 3-4 App Mobile',               12600, 'USD', 'pendiente',    '2026-05-15', NULL,         NULL,      'u-002', '2026-04-01T00:00:00Z', '2026-04-01T00:00:00Z'),
  ('inv-006', 'c-003', 'ct-004', 'Anticipo 25% Sistema Obras',          23750, 'USD', 'cobrada',      '2026-02-20', NULL,         'FA-0007', 'u-002', '2026-02-01T00:00:00Z', '2026-02-22T00:00:00Z'),
  ('inv-007', 'c-003', 'ct-004', 'Cuota 2 - Modulo planificacion',      23750, 'USD', 'reprogramada', '2026-04-01', '2026-05-01', NULL,      'u-002', '2026-03-15T00:00:00Z', '2026-04-15T00:00:00Z'),
  ('inv-008', 'c-004', 'ct-005', 'Cuota 1 Plataforma Logistica',        27000, 'ARS', 'pendiente',    '2026-05-20', NULL,         NULL,      'u-002', '2026-04-01T00:00:00Z', '2026-04-01T00:00:00Z'),
  ('inv-009', 'c-005', NULL,     'Consultoria Inicial Tech Retail',       8500, 'USD', 'vencida',      '2026-03-01', NULL,         NULL,      'u-002', '2026-02-15T00:00:00Z', '2026-03-15T00:00:00Z'),
  ('inv-010', 'c-001', 'ct-001', 'Cuota 3 - Integraciones',             21250, 'USD', 'pendiente',    '2026-06-01', NULL,         NULL,      'u-002', '2026-05-01T00:00:00Z', '2026-05-01T00:00:00Z');

INSERT OR IGNORE INTO licenses (id, client_id, name, type, user_count, annual_amount, currency, start_date, renewal_date, status, auto_billing, alert_days_before, requires_leader_validation, created_at, updated_at) VALUES
  ('lic-001', 'c-001', 'Microsoft 365 Business',  'software',    50,  12000, 'USD', '2025-06-01', '2026-06-01', 'activa',  1, 30, 0, '2025-06-01T00:00:00Z', '2025-06-01T00:00:00Z'),
  ('lic-002', 'c-001', 'Antivirus Corporativo',    'software',    50,   2400, 'USD', '2025-07-15', '2026-07-15', 'activa',  0, 45, 0, '2025-07-15T00:00:00Z', '2025-07-15T00:00:00Z'),
  ('lic-003', 'c-002', 'Adobe Creative Cloud',     'software',    10,   6600, 'USD', '2025-09-01', '2026-09-01', 'activa',  0, 30, 0, '2025-09-01T00:00:00Z', '2025-09-01T00:00:00Z'),
  ('lic-004', 'c-003', 'AutoCAD LT',               'software',     5,   4500, 'USD', '2025-05-15', '2026-05-15', 'activa',  1, 60, 1, '2025-05-15T00:00:00Z', '2025-05-15T00:00:00Z'),
  ('lic-005', 'c-004', 'WMS Logistica Premium',    'suscripcion', 20, 180000, 'ARS', '2026-01-01', '2027-01-01', 'activa',  0, 90, 1, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z');

INSERT OR IGNORE INTO scope_changes (id, client_id, contract_id, description, amount, currency, status, request_date, created_at, updated_at) VALUES
  ('sc-001', 'c-001', 'ct-001', 'Agregar modulo de reportes avanzados al ERP', 8500, 'USD', 'aprobado',  '2026-03-10', '2026-03-10T00:00:00Z', '2026-03-15T00:00:00Z'),
  ('sc-002', 'c-003', 'ct-004', 'Integracion con sistema de drones de inspeccion', 15000, 'USD', 'pendiente', '2026-04-20', '2026-04-20T00:00:00Z', '2026-04-20T00:00:00Z');

INSERT OR IGNORE INTO alerts (id, invoice_id, client_id, license_id, type, status, priority, recipient_role, created_at, updated_at) VALUES
  ('al-001', 'inv-009', 'c-005', NULL,    'factura_vencida',          'pendiente', 'critica', 'director_proyecto', '2026-03-15T00:00:00Z', '2026-03-15T00:00:00Z'),
  ('al-002', 'inv-005', 'c-002', NULL,    'validacion_lider_2dias',   'pendiente', 'alta',    'lider_proyecto',    '2026-05-13T00:00:00Z', '2026-05-13T00:00:00Z'),
  ('al-003', NULL,      'c-001', 'lic-001','licencia_por_vencer',     'pendiente', 'alta',    'administrativo',    '2026-05-01T00:00:00Z', '2026-05-01T00:00:00Z'),
  ('al-004', NULL,      'c-003', 'lic-004','licencia_por_vencer',     'pendiente', 'critica', 'director_proyecto', '2026-03-15T00:00:00Z', '2026-03-15T00:00:00Z');
