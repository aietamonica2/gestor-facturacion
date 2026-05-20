// CBT API — Hono + Cloudflare Workers
// Sprint 1: health + clients + licenses
// Sprints futuros: contracts, invoices, scope_changes, alerts, auth
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Bindings } from './lib/types';
import health from './routes/health';
import clients from './routes/clients';
import licenses from './routes/licenses';

const app = new Hono<{ Bindings: Bindings }>();

// Middlewares
app.use('*', logger());
app.use('/api/*', cors({
  origin: ['https://gestor-facturacion.aietamonica.workers.dev', 'http://localhost:5173'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Routes
app.route('/health', health);
app.route('/api/clients', clients);
app.route('/api/licenses', licenses);

// 404 catch-all
app.notFound((c) => c.json({ success: false, error: 'Route not found' }, 404));

export default app;
