import { Hono } from 'hono';
import type { Bindings } from '../lib/types';

const app = new Hono<{ Bindings: Bindings }>();

// GET /health
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    version: c.env.API_VERSION ?? '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

export default app;
