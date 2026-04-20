import QRCode from 'qrcode';
import { api } from '@/services/api';
import type { Ticket, TicketStatus } from '@/types';

interface TicketViewData {
  ticket: Ticket | null;
  loading: boolean;
  error: string | null;
  qrDataUrl: string | null;

  init(): Promise<void>;
  statusLabel: string;
  statusColor: string;
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  Pending: 'Ожидает подтверждения',
  Confirmed: 'Подтверждён',
  Rejected: 'Отклонён',
};

const STATUS_COLORS: Record<TicketStatus, string> = {
  Pending: 'text-amber-600 bg-amber-50',
  Confirmed: 'text-emerald-700 bg-emerald-50',
  Rejected: 'text-red-600 bg-red-50',
};

export function ticketView(): TicketViewData {
  return {
    ticket: null,
    loading: true,
    error: null,
    qrDataUrl: null,

    async init() {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');

      if (!id) {
        this.error = 'Не указан ID билета';
        this.loading = false;
        return;
      }

      try {
        this.ticket = await api.getTicket(id);

        if (this.ticket.status === 'Confirmed') {
          this.qrDataUrl = await QRCode.toDataURL(this.ticket.id, {
            width: 280,
            margin: 2,
            color: { dark: '#064e3b', light: '#ffffff' },
          });
        }
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Билет не найден';
      } finally {
        this.loading = false;
      }
    },

    get statusLabel(): string {
      return this.ticket ? STATUS_LABELS[this.ticket.status] : '';
    },

    get statusColor(): string {
      return this.ticket ? STATUS_COLORS[this.ticket.status] : '';
    },
  };
}
