import type { ApiResponse, RegisterResult, Ticket, Venue, Zone } from '@/types';

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

  getVenues() {
    return get<Venue[]>('getVenues');
  },

  getZones(venueId: string) {
    return get<Zone[]>('getZones', { venueId });
  },

  register(payload: { name: string; phone: string; venueId: string; zoneId: string; guests?: string[] }) {
    return post<RegisterResult>({ action: 'register', ...payload });
  },

  uploadReceipt(payload: { id: string; receiptBase64: string; receiptFilename?: string }) {
    return post<Ticket>({ action: 'uploadReceipt', ...payload });
  },

  checkin(id: string) {
    return post<Ticket>({ action: 'checkin', id });
  },

  checkinGroup(groupId: string, personIds: string[]) {
    return post<{ groupId: string; members: import('@/types').GroupMember[] }>({
      action: 'checkinGroup',
      groupId,
      personIds,
    });
  },

  getTicketGroup(groupId: string) {
    return get<Ticket>('getTicketGroup', { groupId });
  },

  // Admin: venues
  createVenue(payload: { name: string; date: string }) {
    return post<Venue>({ action: 'createVenue', ...payload });
  },

  // Admin: zones
  createZone(payload: {
    venueId: string;
    name: string;
    price: number;
    cardNumber: string;
    capacity: number;
    sortOrder?: number;
  }) {
    return post<Zone>({ action: 'createZone', ...payload });
  },

  updateZone(payload: {
    id: string;
    name?: string;
    price?: number;
    cardNumber?: string;
    capacity?: number;
    sortOrder?: number;
  }) {
    return post<Zone>({ action: 'updateZone', ...payload });
  },

  deleteZone(id: string) {
    return post<{ deleted: boolean }>({ action: 'deleteZone', id });
  },
};
