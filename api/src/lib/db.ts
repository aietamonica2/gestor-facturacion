import type { D1Database } from '@cloudflare/workers-types';

// Helper: run a SELECT that returns multiple rows
export async function all<T>(
  db: D1Database,
  query: string,
  params: unknown[] = []
): Promise<T[]> {
  const stmt = db.prepare(query);
  const result = await stmt.bind(...params).all<T>();
  return result.results;
}

// Helper: run a SELECT that returns one row
export async function one<T>(
  db: D1Database,
  query: string,
  params: unknown[] = []
): Promise<T | null> {
  const stmt = db.prepare(query);
  return await stmt.bind(...params).first<T>();
}

// Helper: run INSERT / UPDATE / DELETE
export async function run(
  db: D1Database,
  query: string,
  params: unknown[] = []
): Promise<D1Result> {
  return await db.prepare(query).bind(...params).run();
}

// Generate a UUID-like ID (crypto.randomUUID in Workers runtime)
export function newId(): string {
  return crypto.randomUUID();
}

// ISO timestamp
export function now(): string {
  return new Date().toISOString();
}
