// routes/invoices.ts — Invoices (read + status updates only, no creation)
// Invoices are created in Finnegans Go and synced here
// (<300 LOC — Senda guideline)
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { all, one, run, now } from '../lib/db';
import { ok, notFound, badRequest } from '../lib/response';
import type { Bindings } from '../lib/types';

const app = new Hono<{ Bindings: Bindings }>();

const VALID_STATUSES = ['pendiente','emitida','enviada','cobrada','vencida','reprogramada','cancelada'] as const;

const StatusUpdateSchema = z.object({
  status: z.enum(VALID_STATUSES),
  rescheduled_date: z.string().optional(),
  issued_date: z.string().optional(),
  collected_date: z.string().optional(),
  invoice_number: z.string().optional(),
  reason: z.string().optional(),
});

// GET /api/invoices?client_id=&status=&month=2026-05
app.get('/', async (c) => {
  const { client_id, status, month } = c.req.query();
  let where = 'WHERE 1=1';
  const params: unknown[] = [];
  if (client_id) { where += ' AND i.client_id = ?';          params.push(client_id); }
  if (status)    { where += ' AND i.status = ?';              params.push(status); }
  if (month)     { where += ' AND strftime("%Y-%m", COALESCE(i.rescheduled_date, i.scheduled_date)) = ?'; params.push(month); }
  const data = await all(
    c.env.DB,
    `SELECT i.*, cl.name as client_name, co.description as contract_description
     FROM invoices i
     LEFT JOIN clients cl ON cl.id = i.client_id
     LEFT JOIN contracts co ON co.id = i.contract_id
     ${where} ORDER BY COALESCE(i.rescheduled_date, i.scheduled_date) ASC`,
    params
  );
  return ok(c, data);
});

// GET /api/invoices/:id
app.get('/:id', async (c) => {
  const inv = await one(
    c.env.DB,
    `SELECT i.*, cl.name as client_name
     FROM invoices i
     LEFT JOIN clients cl ON cl.id = i.client_id
     WHERE i.id = ?`,
    [c.req.param('id')]
  );
  if (!inv) return notFound(c);
  return ok(c, inv);
});

// PATCH /api/invoices/:id/status — update status only (no full edit)
app.patch('/:id/status', zValidator('json', StatusUpdateSchema), async (c) => {
  const id = c.req.param('id');
  const existing = await one<{ status: string }>(
    c.env.DB, 'SELECT id, status FROM invoices WHERE id = ?', [id]
  );
  if (!existing) return notFound(c);
  const b = c.req.valid('json');

  // Build dynamic update
  const updates: Record<string, unknown> = { status: b.status, updated_at: now() };
  if (b.rescheduled_date) updates.rescheduled_date = b.rescheduled_date;
  if (b.issued_date)      updates.issued_date      = b.issued_date;
  if (b.collected_date)   updates.collected_date   = b.collected_date;
  if (b.invoice_number)   updates.invoice_number   = b.invoice_number;

  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  await run(c.env.DB,
    `UPDATE invoices SET ${fields} WHERE id = ?`,
    [...Object.values(updates), id]
  );
  const updated = await one(c.env.DB, 'SELECT * FROM invoices WHERE id = ?', [id]);
  return ok(c, updated);
});

export default app;
