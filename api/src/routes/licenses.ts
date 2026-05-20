// routes/licenses.ts — CRUD Licenses  (<300 LOC — Senda guideline)
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { all, one, run, newId, now } from '../lib/db';
import { ok, notFound } from '../lib/response';
import type { Bindings } from '../lib/types';

const app = new Hono<{ Bindings: Bindings }>();

const LicenseSchema = z.object({
  client_id: z.string().min(1),
  name: z.string().min(1),
  type: z.string().default('software'),
  user_count: z.number().int().optional(),
  annual_amount: z.number(),
  currency: z.enum(['USD', 'ARS']).default('USD'),
  start_date: z.string().optional(),
  renewal_date: z.string().optional(),
  status: z.enum(['activa', 'vencida', 'cancelada']).default('activa'),
  auto_billing: z.boolean().default(false),
  alert_days_before: z.number().int().default(30),
  requires_leader_validation: z.boolean().default(false),
  modules: z.array(z.string()).optional(),
  technical_contact: z.string().optional(),
  technical_contact_email: z.string().email().optional(),
  notes: z.string().optional(),
});

// GET /api/licenses?client_id=&status=
app.get('/', async (c) => {
  const { client_id, status } = c.req.query();
  let where = 'WHERE 1=1';
  const params: unknown[] = [];
  if (client_id) { where += ' AND client_id = ?'; params.push(client_id); }
  if (status)    { where += ' AND status = ?';    params.push(status); }
  const data = await all(
    c.env.DB,
    `SELECT * FROM licenses ${where} ORDER BY renewal_date ASC`,
    params
  );
  return ok(c, data);
});

// GET /api/licenses/:id
app.get('/:id', async (c) => {
  const lic = await one(c.env.DB, 'SELECT * FROM licenses WHERE id = ?', [c.req.param('id')]);
  if (!lic) return notFound(c);
  return ok(c, lic);
});

// POST /api/licenses
app.post('/', zValidator('json', LicenseSchema), async (c) => {
  const b = c.req.valid('json');
  const id = newId();
  const ts = now();
  await run(c.env.DB,
    `INSERT INTO licenses
     (id,client_id,name,type,user_count,annual_amount,currency,start_date,renewal_date,
      status,auto_billing,alert_days_before,requires_leader_validation,
      modules,technical_contact,technical_contact_email,notes,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, b.client_id, b.name, b.type, b.user_count ?? null, b.annual_amount, b.currency,
     b.start_date ?? null, b.renewal_date ?? null, b.status,
     b.auto_billing ? 1 : 0, b.alert_days_before, b.requires_leader_validation ? 1 : 0,
     b.modules ? JSON.stringify(b.modules) : null,
     b.technical_contact ?? null, b.technical_contact_email ?? null,
     b.notes ?? null, ts, ts]
  );
  const created = await one(c.env.DB, 'SELECT * FROM licenses WHERE id = ?', [id]);
  return ok(c, created, 201);
});

// PUT /api/licenses/:id
app.put('/:id', zValidator('json', LicenseSchema.partial()), async (c) => {
  const id = c.req.param('id');
  const existing = await one(c.env.DB, 'SELECT id FROM licenses WHERE id = ?', [id]);
  if (!existing) return notFound(c);
  const b = c.req.valid('json');
  const mapped: Record<string, unknown> = { ...b };
  if ('auto_billing' in b) mapped.auto_billing = b.auto_billing ? 1 : 0;
  if ('requires_leader_validation' in b) mapped.requires_leader_validation = b.requires_leader_validation ? 1 : 0;
  if ('modules' in b && Array.isArray(b.modules)) mapped.modules = JSON.stringify(b.modules);
  const fields = Object.keys(mapped).map(k => `${k} = ?`).join(', ');
  await run(c.env.DB,
    `UPDATE licenses SET ${fields}, updated_at = ? WHERE id = ?`,
    [...Object.values(mapped), now(), id]
  );
  const updated = await one(c.env.DB, 'SELECT * FROM licenses WHERE id = ?', [id]);
  return ok(c, updated);
});

// DELETE /api/licenses/:id
app.delete('/:id', async (c) => {
  const existing = await one(c.env.DB, 'SELECT id FROM licenses WHERE id = ?', [c.req.param('id')]);
  if (!existing) return notFound(c);
  await run(c.env.DB, 'DELETE FROM licenses WHERE id = ?', [c.req.param('id')]);
  return ok(c, { deleted: true });
});

export default app;
