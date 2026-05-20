-- Migration 0001: Initial schema for CBT (Contract Billing Tracker)
-- All table/column names in English (Senda guideline)

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL CHECK(role IN ('director_proyecto','lider_proyecto','administrativo')),
  email       TEXT,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clients (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  legal_name          TEXT,
  tax_id              TEXT,
  billing_email       TEXT,
  client_type         TEXT NOT NULL DEFAULT 'empresa',
  preferred_currency  TEXT NOT NULL DEFAULT 'USD',
  payment_terms       TEXT,
  project_leader_id   TEXT REFERENCES users(id),
  status              TEXT NOT NULL DEFAULT 'activo',
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contracts (
  id                  TEXT PRIMARY KEY,
  client_id           TEXT NOT NULL REFERENCES clients(id),
  description         TEXT NOT NULL,
  total_amount        REAL NOT NULL DEFAULT 0,
  currency            TEXT NOT NULL DEFAULT 'USD',
  start_date          TEXT,
  end_date            TEXT,
  status              TEXT NOT NULL DEFAULT 'activo',
  billing_percentage  REAL DEFAULT 0,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
  id                  TEXT PRIMARY KEY,
  client_id           TEXT NOT NULL REFERENCES clients(id),
  contract_id         TEXT REFERENCES contracts(id),
  description         TEXT NOT NULL,
  amount              REAL NOT NULL DEFAULT 0,
  currency            TEXT NOT NULL DEFAULT 'USD',
  status              TEXT NOT NULL DEFAULT 'pendiente',
  scheduled_date      TEXT,
  rescheduled_date    TEXT,
  issued_date         TEXT,
  collected_date      TEXT,
  invoice_number      TEXT,
  project_leader_id   TEXT REFERENCES users(id),
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);

-- Composite index for frequent invoice queries (Senda: no full table scans)
CREATE INDEX IF NOT EXISTS idx_invoices_client_date
  ON invoices(client_id, created_at);

CREATE INDEX IF NOT EXISTS idx_invoices_status
  ON invoices(status);

CREATE TABLE IF NOT EXISTS licenses (
  id                          TEXT PRIMARY KEY,
  client_id                   TEXT NOT NULL REFERENCES clients(id),
  name                        TEXT NOT NULL,
  type                        TEXT NOT NULL DEFAULT 'software',
  user_count                  INTEGER,
  annual_amount               REAL NOT NULL DEFAULT 0,
  currency                    TEXT NOT NULL DEFAULT 'USD',
  start_date                  TEXT,
  renewal_date                TEXT,
  status                      TEXT NOT NULL DEFAULT 'activa',
  auto_billing                INTEGER NOT NULL DEFAULT 0,
  alert_days_before           INTEGER DEFAULT 30,
  requires_leader_validation  INTEGER DEFAULT 0,
  modules                     TEXT,
  technical_contact           TEXT,
  technical_contact_email     TEXT,
  notes                       TEXT,
  created_at                  TEXT NOT NULL,
  updated_at                  TEXT NOT NULL
);

-- Index for license renewal alerts
CREATE INDEX IF NOT EXISTS idx_licenses_renewal
  ON licenses(renewal_date, status);

CREATE TABLE IF NOT EXISTS scope_changes (
  id             TEXT PRIMARY KEY,
  client_id      TEXT NOT NULL REFERENCES clients(id),
  contract_id    TEXT REFERENCES contracts(id),
  description    TEXT NOT NULL,
  amount         REAL DEFAULT 0,
  currency       TEXT DEFAULT 'USD',
  status         TEXT NOT NULL DEFAULT 'pendiente',
  request_date   TEXT,
  approval_date  TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS alerts (
  id              TEXT PRIMARY KEY,
  invoice_id      TEXT REFERENCES invoices(id),
  client_id       TEXT REFERENCES clients(id),
  license_id      TEXT REFERENCES licenses(id),
  type            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pendiente',
  priority        TEXT NOT NULL DEFAULT 'media',
  recipient_role  TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

-- Composite index for alert queries
CREATE INDEX IF NOT EXISTS idx_alerts_status_role
  ON alerts(status, recipient_role);
