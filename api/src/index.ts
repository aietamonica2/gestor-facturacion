// CBT API — Hono + Cloudflare Workers  v1.1.0
// Sprint 2: + contracts, invoices (status only), scope-changes, alerts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Bindings } from './lib/types';
import health       from './routes/health';
import clients      from './routes/clients';
import licenses     from './routes/licenses';
import contracts    from './routes/contracts';
import invoices     from './routes/invoices';
import scopeChanges from './routes/scope-changes';
import alerts       from './routes/alerts';

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', logger());
app.use('/api/*', cors({
  origin: [
    'https://gestor-facturacion.aietamonica.workers.dev',
    'http://localhost:5173',
  ],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.route('/health',           health);
app.route('/api/clients',      clients);
app.route('/api/licenses',     licenses);
app.route('/api/contracts',    contracts);
app.route('/api/invoices',     invoices);
app.route('/api/scope-changes',scopeChanges);
app.route('/api/alerts',       alerts);

app.notFound((c) => c.json({ success: false, error: 'Route not found' }, 404));

export default app;
