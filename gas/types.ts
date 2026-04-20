// ──────────────────────────────────────────────
// Ticket data model
// ──────────────────────────────────────────────

type TicketStatus = 'Pending' | 'Confirmed' | 'Rejected';

interface TicketRow {
  id: string;
  name: string;
  phone: string;
  zone: string;
  price: number;
  receiptLink: string;
  status: TicketStatus;
  checkedIn: boolean;
  createdAt: string;
}

// ──────────────────────────────────────────────
// API contracts
// ──────────────────────────────────────────────

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface RegisterPayload {
  name: string;
  phone: string;
  zone: string;
  price: number;
  receiptBase64?: string;
  receiptFilename?: string;
}

interface CheckinPayload {
  id: string;
}

interface RegisterResult {
  id: string;
  status: TicketStatus;
}
