import type { ApiResponse, RegisterResult, Ticket } from '@/types';

const GAS_URL = import.meta.env.VITE_GAS_URL;

async function get<T>(action: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(GAS_URL);
  url.searchParams.set('action', action);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Server error: ${res.status}`);

  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Unknown error');

  return json.data as T;
}

async function post<T>(body: Record<string, unknown>): Promise<T> {
  // Send as text/plain to avoid CORS preflight (GAS doesn't handle OPTIONS)
  const res = await fetch(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Server error: ${res.status}`);

  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Unknown error');

  return json.data as T;
}

export const api = {
  health() {
    return get<{ status: string; timestamp: string }>('health');
  },

  getTicket(id: string) {
    return get<Ticket>('getTicket', { id });
  },

  register(payload: {
    name: string;
    phone: string;
    zone: string;
    price: number;
    receiptBase64?: string;
    receiptFilename?: string;
  }) {
    return post<RegisterResult>({ action: 'register', ...payload });
  },

  checkin(id: string) {
    return post<Ticket>({ action: 'checkin', id });
  },
};
