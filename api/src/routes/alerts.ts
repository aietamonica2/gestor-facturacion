// routes/alerts.ts — Alerts CRUD + bulk resolve  (<300 LOC — Senda guideline)
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { all, one, run, newId, now } from '../lib/db';
import { ok, notFound } from '../lib/response';
import type { Bindings } from '../lib/types';

const app = new Hono<{ Bindings: Bindings }>();

const AlertStatusSchema = z.object({
  status: z.enum(['pendiente', 'vista', 'resuelta']),
});

const BulkResolveSchema = z.object({
  ids: z.array(z.string()).min(1),
});

// GET /api/alerts?status=pendiente&role=director_proyecto
app.get('/', async (c) => {
  const { status, role } = c.req.query();
  let where = 'WHERE 1=1';
  const params: unknown[] = [];
  if (status) { where += ' AND a.status = ?';         params.push(status); }
  if (role)   { where += ' AND a.recipient_role = ?'; params.push(role); }
  const data = await all(
    c.env.DB,
    `SELECT a.*,
       cl.name as client_name,
       i.description as invoice_description,
       i.amount as invoice_amount,
       i.currency as invoice_currency,
       l.name as license_name
     FROM alerts a
     LEFT JOIN clients cl ON cl.id = a.client_id
     LEFT JOIN invoices i  ON i.id  = a.invoice_id
     LEFT JOIN licenses l  ON l.id  = a.license_id
     ${where} ORDER BY
       CASE a.priority WHEN 'critica' THEN 1 WHEN 'alta' THEN 2 WHEN 'media' THEN 3 ELSE 4 END,
       a.created_at DESC`,
    params
  );
  return ok(c, data);
});

// GET /api/alerts/:id
app.get('/:id', async (c) => {
  const alert = await one(c.env.DB, 'SELECT * FROM alerts WHERE id = ?', [c.req.param('id')]);
  if (!alert) return notFound(c);
  return ok(c, alert);
});

// PATCH /api/alerts/:id — mark seen or resolved
app.patch('/:id', zValidator('json', AlertStatusSchema), async (c) => {
  const id = c.req.param('id');
  const existing = await one(c.env.DB, 'SELECT id FROM alerts WHERE id = ?', [id]);
  if (!existing) return notFound(c);
  const { status } = c.req.valid('json');
  await run(c.env.DB,
    'UPDATE alerts SET status = ?, updated_at = ? WHERE id = ?',
    [status, now(), id]
  );
  const updated = await one(c.env.DB, 'SELECT * FROM alerts WHERE id = ?', [id]);
  return ok(c, updated);
});

// POST /api/alerts/bulk-resolve — resolve multiple alerts at once
// Uses db.batch() — no N+1 queries (Senda guideline)
app.post('/bulk-resolve', zValidator('json', BulkResolveSchema), async (c) => {
  const { ids } = c.req.valid('json');
  const ts = now();
  const statements = ids.map(id =>
    c.env.DB.prepare('UPDATE alerts SET status = ?, updated_at = ? WHERE id = ?')
      .bind('resuelta', ts, id)
  );
  await c.env.DB.batch(statements);
  return ok(c, { resolved: ids.length });
});

export default app;
