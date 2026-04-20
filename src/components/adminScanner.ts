import { Html5Qrcode } from 'html5-qrcode';
import { api } from '@/services/api';
import type { Ticket } from '@/types';

type ScanResult = {
  type: 'success' | 'already' | 'error';
  message: string;
  ticket?: Ticket;
};

interface AdminScannerData {
  authenticated: boolean;
  passwordInput: string;
  authError: string | null;
  scanning: boolean;
  loading: boolean;
  result: ScanResult | null;
  lastScannedId: string | null;

  checkPassword(): void;
  init(): void;
  startScanner(): Promise<void>;
  stopScanner(): Promise<void>;
  handleScan(ticketId: string): Promise<void>;
  reset(): void;
  destroy(): void;
}

const ADMIN_PASSWORD_HASH = '413f07f6c18aee3ea6568595e1507352e506f0c0090a14a59e8b09cbede7639c';

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

let scanner: Html5Qrcode | null = null;

export function adminScanner(): AdminScannerData {
  return {
    authenticated: false,
    passwordInput: '',
    authError: null,
    scanning: false,
    loading: false,
    result: null,
    lastScannedId: null,

    async checkPassword() {
      const hash = await sha256(this.passwordInput);
      if (hash === ADMIN_PASSWORD_HASH) {
        this.authenticated = true;
        this.authError = null;
        this.startScanner();
      } else {
        this.authError = 'Неверный пароль';
      }
    },

    init() {
      // Scanner starts after authentication
    },

    async startScanner() {
      this.result = null;

      try {
        scanner = new Html5Qrcode('qr-reader');
        this.scanning = true;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            // Prevent duplicate scans of same ticket
            if (decodedText === this.lastScannedId) return;
            this.lastScannedId = decodedText;
            this.handleScan(decodedText);
          },
          () => {
            // QR not detected — ignore
          },
        );
      } catch (err) {
        this.scanning = false;
        this.result = {
          type: 'error',
          message: err instanceof Error
            ? err.message
            : 'Не удалось запустить камеру. Проверьте разрешения.',
        };
      }
    },

    async stopScanner() {
      if (scanner) {
        try {
          await scanner.stop();
          scanner.clear();
        } catch {
          // Already stopped
        }
        scanner = null;
      }
      this.scanning = false;
    },

    async handleScan(ticketId: string) {
      await this.stopScanner();
      this.loading = true;

      try {
        // First check ticket status
        const ticket = await api.getTicket(ticketId);

        if (ticket.status !== 'Confirmed') {
          this.result = {
            type: 'error',
            message: `Билет не подтверждён (статус: ${ticket.status})`,
            ticket,
          };
          return;
        }

        if (ticket.checkedIn) {
          this.result = {
            type: 'already',
            message: 'Этот билет уже использован!',
            ticket,
          };
          return;
        }

        // Check in
        const updated = await api.checkin(ticketId);
        this.result = {
          type: 'success',
          message: 'Вход подтверждён!',
          ticket: updated,
        };
      } catch (err) {
        this.result = {
          type: 'error',
          message: err instanceof Error ? err.message : 'Ошибка проверки билета',
        };
      } finally {
        this.loading = false;
      }
    },

    reset() {
      this.result = null;
      this.lastScannedId = null;
      this.startScanner();
    },

    destroy() {
      this.stopScanner();
    },
  };
}
