import { Context } from 'hono';

export function ok<T>(c: Context, data: T, status: 200 | 201 = 200) {
  return c.json({ success: true, data }, status);
}

export function notFound(c: Context, message = 'Not found') {
  return c.json({ success: false, error: message }, 404);
}

export function badRequest(c: Context, message: string) {
  return c.json({ success: false, error: message }, 400);
}

export function conflict(c: Context, message: string) {
  return c.json({ success: false, error: message }, 409);
}

export function serverError(c: Context, message = 'Internal server error') {
  return c.json({ success: false, error: message }, 500);
}
