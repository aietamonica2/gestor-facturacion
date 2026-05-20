// Cloudflare Workers bindings
export interface Bindings {
  DB: D1Database;
  API_VERSION: string;
}

// Pagination helper
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type Env = { Bindings: Bindings };
