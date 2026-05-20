// routes/scope-changes.ts — CRUD Scope Changes  (<300 LOC — Senda guideline)
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { all, one, run, newId, now } from '../lib/db';
import { ok, notFound, badRequest } from '../lib/response';
import type { Bindings } from '../lib/types';

const app = new Hono<{ Bindings: Bindings }>();

const ScopeChangeSchema = z.object({
  client_id: z.string().min(1),
  contract_id: z.string().optional(),
  description: z.string().min(1),
  amount: z.number().default(0),
  currency: z.enum(['USD', 'ARS']).default('USD'),
  status: z.enum(['pendiente', 'aprobado', 'rechazado']).default('pendiente'),
  request_date: z.string().optional(),
  approval_date: z.string().optional(),
});

// GET /api/scope-changes?client_id=&status=
app.get('/', async (c) => {
  const { client_id, status } = c.req.query();
  let where = 'WHERE 1=1';
  const params: unknown[] = [];
  if (client_id) { where += ' AND s.client_id = ?'; params.push(client_id); }
  if (status)    { where += ' AND s.status = ?';    params.push(status); }
  const data = await all(
    c.env.DB,
    `SELECT s.*, cl.name as client_name, co.description as contract_description
     FROM scope_changes s
     LEFT JOIN clients cl ON cl.id = s.client_id
     LEFT JOIN contracts co ON co.id = s.contract_id
     ${where} ORDER BY s.created_at DESC`,
    params
  );
  return ok(c, data);
});

// GET /api/scope-changes/:id
app.get('/:id', async (c) => {
  const sc = await one(
    c.env.DB,
    `SELECT s.*, cl.name as client_name
     FROM scope_changes s
     LEFT JOIN clients cl ON cl.id = s.client_id
     WHERE s.id = ?`,
    [c.req.param('id')]
  );
  if (!sc) return notFound(c);
  return ok(c, sc);
});

// POST /api/scope-changes
app.post('/', zValidator('json', ScopeChangeSchema), async (c) => {
  const b = c.req.valid('json');
  const client = await one(c.env.DB, 'SELECT id FROM clients WHERE id = ?', [b.client_id]);
  if (!client) return badRequest(c, 'Cliente no encontrado');
  const id = newId();
  const ts = now();
  await run(c.env.DB,
    `INSERT INTO scope_changes
     (id,client_id,contract_id,description,amount,currency,status,request_date,approval_date,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [id, b.client_id, b.contract_id ?? null, b.description, b.amount, b.currency,
     b.status, b.request_date ?? ts.slice(0,10), b.approval_date ?? null, ts, ts]
  );
  const created = await one(c.env.DB, 'SELECT * FROM scope_changes WHERE id = ?', [id]);
  return ok(c, created, 201);
});

// PUT /api/scope-changes/:id
app.put('/:id', zValidator('json', ScopeChangeSchema.partial()), async (c) => {
  const id = c.req.param('id');
  const existing = await one(c.env.DB, 'SELECT id FROM scope_changes WHERE id = ?', [id]);
  if (!existing) return notFound(c);
  const b = c.req.valid('json');
  const fields = Object.keys(b).map(k => `${k} = ?`).join(', ');
  await run(c.env.DB,
    `UPDATE scope_changes SET ${fields}, updated_at = ? WHERE id = ?`,
    [...Object.values(b), now(), id]
  );
  const updated = await one(c.env.DB, 'SELECT * FROM scope_changes WHERE id = ?', [id]);
  return ok(c, updated);
});

// DELETE /api/scope-changes/:id
app.delete('/:id', async (c) => {
  const existing = await one(c.env.DB, 'SELECT id FROM scope_changes WHERE id = ?', [c.req.param('id')]);
  if (!existing) return notFound(c);
  await run(c.env.DB, 'DELETE FROM scope_changes WHERE id = ?', [c.req.param('id')]);
  return ok(c, { deleted: true });
});

export default app;
