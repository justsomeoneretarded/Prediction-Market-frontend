export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

function csrf(): string {
  if (typeof document === 'undefined') return '';
  return document.cookie.split('; ').find((c) => c.startsWith('tb_csrf='))?.split('=')[1] ?? '';
}

async function ensureCsrf() {
  if (!csrf()) await fetch('/api/auth/me', { credentials: 'include' });
}

export async function api<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const method = init.method ?? (init.body !== undefined ? 'POST' : 'GET');
  if (method !== 'GET') await ensureCsrf();
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'include',
      headers: { ...(init.body !== undefined ? { 'content-type': 'application/json' } : {}), ...(method !== 'GET' ? { 'x-csrf-token': csrf() } : {}) },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError('Network error — check your connection. If you were trading, refresh to see whether it went through.', 0, 'NETWORK');
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(data?.message ?? res.statusText, res.status, data?.error);
  return data as T;
}

export const fetcher = <T,>(path: string) => api<T>(path);
