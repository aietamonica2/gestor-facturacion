// routes/clients.ts — CRUD Clients  (<300 LOC — Senda guideline)
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { all, one, run, newId, now } from '../lib/db';
import { ok, notFound, badRequest, conflict } from '../lib/response';
import type { Bindings } from '../lib/types';

const app = new Hono<{ Bindings: Bindings }>();

const ClientSchema = z.object({
  name: z.string().min(1),
  legal_name: z.string().optional(),
  tax_id: z.string().optional(),
  billing_email: z.string().email().optional(),
  client_type: z.enum(['empresa', 'persona']).default('empresa'),
  preferred_currency: z.enum(['USD', 'ARS']).default('USD'),
  payment_terms: z.string().optional(),
  project_leader_id: z.string().optional(),
  status: z.enum(['activo', 'inactivo']).default('activo'),
});

// GET /api/clients?page=1&pageSize=20&status=activo
app.get('/', async (c) => {
  const { page = '1', pageSize = '20', status } = c.req.query();
  const pg = Math.max(1, parseInt(page));
  const ps = Math.min(100, parseInt(pageSize));
  const offset = (pg - 1) * ps;

  let where = 'WHERE 1=1';
  const params: unknown[] = [];
  if (status) { where += ' AND status = ?'; params.push(status); }

  const total = await one<{ count: number }>(
    c.env.DB,
    `SELECT COUNT(*) as count FROM clients ${where}`,
    params
  );
  const data = await all(
    c.env.DB,
    `SELECT * FROM clients ${where} ORDER BY name ASC LIMIT ? OFFSET ?`,
    [...params, ps, offset]
  );
  return ok(c, { data, total: total?.count ?? 0, page: pg, pageSize: ps });
});

// GET /api/clients/:id
app.get('/:id', async (c) => {
  const client = await one(c.env.DB, 'SELECT * FROM clients WHERE id = ?', [c.req.param('id')]);
  if (!client) return notFound(c);
  return ok(c, client);
});

// POST /api/clients
app.post('/', zValidator('json', ClientSchema), async (c) => {
  const body = c.req.valid('json');
  const id = newId();
  const ts = now();
  await run(c.env.DB,
    `INSERT INTO clients (id,name,legal_name,tax_id,billing_email,client_type,
     preferred_currency,payment_terms,project_leader_id,status,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, body.name, body.legal_name ?? null, body.tax_id ?? null,
     body.billing_email ?? null, body.client_type, body.preferred_currency,
     body.payment_terms ?? null, body.project_leader_id ?? null,
     body.status, ts, ts]
  );
  const created = await one(c.env.DB, 'SELECT * FROM clients WHERE id = ?', [id]);
  return ok(c, created, 201);
});

// PUT /api/clients/:id
app.put('/:id', zValidator('json', ClientSchema.partial()), async (c) => {
  const id = c.req.param('id');
  const existing = await one(c.env.DB, 'SELECT id FROM clients WHERE id = ?', [id]);
  if (!existing) return notFound(c);
  const body = c.req.valid('json');
  const fields = Object.keys(body).map(k => `${k} = ?`).join(', ');
  const values = Object.values(body);
  await run(c.env.DB,
    `UPDATE clients SET ${fields}, updated_at = ? WHERE id = ?`,
    [...values, now(), id]
  );
  const updated = await one(c.env.DB, 'SELECT * FROM clients WHERE id = ?', [id]);
  return ok(c, updated);
});

// DELETE /api/clients/:id — block if active invoices exist
app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const existing = await one(c.env.DB, 'SELECT id FROM clients WHERE id = ?', [id]);
  if (!existing) return notFound(c);
  const active = await one<{ count: number }>(
    c.env.DB,
    `SELECT COUNT(*) as count FROM invoices
     WHERE client_id = ? AND status NOT IN ('cobrada','cancelada')`,
    [id]
  );
  if ((active?.count ?? 0) > 0) {
    return conflict(c, 'El cliente tiene facturas activas. Resolvalas antes de eliminar.');
  }
  await run(c.env.DB, 'DELETE FROM clients WHERE id = ?', [id]);
  return ok(c, { deleted: true });
});

export default app;
