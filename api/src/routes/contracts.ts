// routes/contracts.ts — CRUD Contracts  (<300 LOC — Senda guideline)
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { all, one, run, newId, now } from '../lib/db';
import { ok, notFound, badRequest } from '../lib/response';
import type { Bindings } from '../lib/types';

const app = new Hono<{ Bindings: Bindings }>();

const ContractSchema = z.object({
  client_id: z.string().min(1),
  description: z.string().min(1),
  total_amount: z.number().default(0),
  currency: z.enum(['USD', 'ARS']).default('USD'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['activo', 'finalizado', 'suspendido']).default('activo'),
  billing_percentage: z.number().min(0).max(100).default(0),
});

// GET /api/contracts?client_id=&status=
app.get('/', async (c) => {
  const { client_id, status } = c.req.query();
  let where = 'WHERE 1=1';
  const params: unknown[] = [];
  if (client_id) { where += ' AND c.client_id = ?'; params.push(client_id); }
  if (status)    { where += ' AND c.status = ?';    params.push(status); }
  const data = await all(
    c.env.DB,
    `SELECT c.*, cl.name as client_name
     FROM contracts c
     LEFT JOIN clients cl ON cl.id = c.client_id
     ${where} ORDER BY c.created_at DESC`,
    params
  );
  return ok(c, data);
});

// GET /api/contracts/:id
app.get('/:id', async (c) => {
  const contract = await one(
    c.env.DB,
    `SELECT c.*, cl.name as client_name
     FROM contracts c
     LEFT JOIN clients cl ON cl.id = c.client_id
     WHERE c.id = ?`,
    [c.req.param('id')]
  );
  if (!contract) return notFound(c);
  return ok(c, contract);
});

// POST /api/contracts
app.post('/', zValidator('json', ContractSchema), async (c) => {
  const b = c.req.valid('json');
  // Verify client exists
  const client = await one(c.env.DB, 'SELECT id FROM clients WHERE id = ?', [b.client_id]);
  if (!client) return badRequest(c, 'Cliente no encontrado');
  const id = newId();
  const ts = now();
  await run(c.env.DB,
    `INSERT INTO contracts
     (id,client_id,description,total_amount,currency,start_date,end_date,status,billing_percentage,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [id, b.client_id, b.description, b.total_amount, b.currency,
     b.start_date ?? null, b.end_date ?? null, b.status, b.billing_percentage, ts, ts]
  );
  const created = await one(c.env.DB, 'SELECT * FROM contracts WHERE id = ?', [id]);
  return ok(c, created, 201);
});

// PUT /api/contracts/:id
app.put('/:id', zValidator('json', ContractSchema.partial()), async (c) => {
  const id = c.req.param('id');
  const existing = await one(c.env.DB, 'SELECT id FROM contracts WHERE id = ?', [id]);
  if (!existing) return notFound(c);
  const b = c.req.valid('json');
  const fields = Object.keys(b).map(k => `${k} = ?`).join(', ');
  await run(c.env.DB,
    `UPDATE contracts SET ${fields}, updated_at = ? WHERE id = ?`,
    [...Object.values(b), now(), id]
  );
  const updated = await one(c.env.DB, 'SELECT * FROM contracts WHERE id = ?', [id]);
  return ok(c, updated);
});

// DELETE /api/contracts/:id
app.delete('/:id', async (c) => {
  const existing = await one(c.env.DB, 'SELECT id FROM contracts WHERE id = ?', [c.req.param('id')]);
  if (!existing) return notFound(c);
  await run(c.env.DB, 'DELETE FROM contracts WHERE id = ?', [c.req.param('id')]);
  return ok(c, { deleted: true });
});

export default app;
