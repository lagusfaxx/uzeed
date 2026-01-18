export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function apiFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);

  const isForm = typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (!isForm && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}
