import QRCode from 'qrcode';
import { api } from '@/services/api';
import type { Ticket, TicketStatus } from '@/types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const BOOKING_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

interface TicketViewData {
  ticket: Ticket | null;
  loading: boolean;
  error: string | null;
  qrDataUrl: string | null;

  // Booked state
  cardNumber: string | null;
  timeLeftMs: number;
  timerInterval: ReturnType<typeof setInterval> | null;

  // Receipt upload
  receiptFile: File | null;
  receiptPreview: string | null;
  uploadLoading: boolean;
  uploadError: string | null;
  uploadDone: boolean;

  init(): Promise<void>;
  destroy(): void;
  startTimer(): void;
  formattedTime(): string;
  handleFileSelect(event: Event): void;
  removeFile(): void;
  submitReceipt(): Promise<void>;

  get statusLabel(): string;
  get statusColor(): string;
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  Booked:    'Забронирован — ожидает оплаты',
  Pending:   'Ожидает подтверждения',
  Confirmed: 'Подтверждён',
  Rejected:  'Отклонён',
  Expired:   'Бронь истекла',
};

const STATUS_COLORS: Record<TicketStatus, string> = {
  Booked:    'text-blue-700 bg-blue-50',
  Pending:   'text-amber-600 bg-amber-50',
  Confirmed: 'text-emerald-700 bg-emerald-50',
  Rejected:  'text-red-600 bg-red-50',
  Expired:   'text-gray-500 bg-gray-100',
};

export function ticketView(): TicketViewData {
  return {
    ticket: null,
    loading: true,
    error: null,
    qrDataUrl: null,

    cardNumber: null,
    timeLeftMs: 0,
    timerInterval: null,

    receiptFile: null,
    receiptPreview: null,
    uploadLoading: false,
    uploadError: null,
    uploadDone: false,

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

        if (this.ticket.status === 'Booked') {
          // Load card number from zone
          try {
            const zones = await api.getZones(this.ticket.venueId);
            const zone = zones.find(z => z.id === this.ticket!.zoneId);
            this.cardNumber = zone?.cardNumber ?? null;
          } catch {
            // Non-critical — still show the rest of the page
          }

          this.timeLeftMs = BOOKING_EXPIRY_MS - (Date.now() - new Date(this.ticket.bookedAt).getTime());
          if (this.timeLeftMs > 0) this.startTimer();
        }
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Билет не найден';
      } finally {
        this.loading = false;
      }
    },

    destroy() {
      if (this.timerInterval) clearInterval(this.timerInterval);
    },

    startTimer() {
      this.timerInterval = setInterval(() => {
        this.timeLeftMs -= 1000;
        if (this.timeLeftMs <= 0) {
          this.timeLeftMs = 0;
          clearInterval(this.timerInterval!);
          this.timerInterval = null;
          // Reload page so status updates from the server
          window.location.reload();
        }
      }, 1000);
    },

    formattedTime(): string {
      if (this.timeLeftMs <= 0) return '00:00';
      const totalSec = Math.ceil(this.timeLeftMs / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    },

    handleFileSelect(event: Event) {
      const input = event.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;

      if (!ALLOWED_TYPES.includes(file.type)) {
        this.uploadError = 'Допустимые форматы: JPEG, PNG, WebP, PDF';
        input.value = '';
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        this.uploadError = 'Максимальный размер файла — 5 МБ';
        input.value = '';
        return;
      }

      this.uploadError = null;
      this.receiptFile = file;

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => { this.receiptPreview = e.target?.result as string; };
        reader.readAsDataURL(file);
      } else {
        this.receiptPreview = null;
      }
    },

    removeFile() {
      this.receiptFile = null;
      this.receiptPreview = null;
    },

    async submitReceipt() {
      if (!this.receiptFile || !this.ticket) return;

      this.uploadLoading = true;
      this.uploadError = null;

      try {
        const receiptBase64 = await fileToBase64(this.receiptFile);
        await api.uploadReceipt({
          id: this.ticket.id,
          receiptBase64,
          receiptFilename: this.receiptFile.name,
        });
        this.uploadDone = true;
        // Reload to show Pending status
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        this.uploadError = err instanceof Error ? err.message : 'Ошибка загрузки';
      } finally {
        this.uploadLoading = false;
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Ошибка чтения файла'));
    reader.readAsDataURL(file);
  });
}

