// ──────────────────────────────────────────────
// Domain models
// ──────────────────────────────────────────────

type TicketStatus = 'Booked' | 'Pending' | 'Confirmed' | 'Rejected' | 'Expired';

interface TicketRow {
  id: string;
  name: string;
  phone: string;
  venueId: string;
  zoneId: string;
  zoneName: string;
  price: number;
  receiptLink: string;
  status: TicketStatus;
  checkedIn: boolean;
  createdAt: string;
  bookedAt: string;
}

interface VenueRow {
  id: string;
  name: string;
  date: string;
  active: boolean;
}

interface ZoneRow {
  id: string;
  venueId: string;
  name: string;
  price: number;
  cardNumber: string;
  capacity: number;
  sortOrder: number;
}

interface ZoneWithAvailability extends ZoneRow {
  available: number;
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
  venueId: string;
  zoneId: string;
}

interface UploadReceiptPayload {
  id: string;
  receiptBase64: string;
  receiptFilename?: string;
}

interface CheckinPayload {
  id: string;
}

interface CreateVenuePayload {
  name: string;
  date: string;
}

interface CreateZonePayload {
  venueId: string;
  name: string;
  price: number;
  cardNumber: string;
  capacity: number;
  sortOrder?: number;
}

interface UpdateZonePayload {
  id: string;
  name?: string;
  price?: number;
  cardNumber?: string;
  capacity?: number;
  sortOrder?: number;
}

interface RegisterResult {
  id: string;
  status: TicketStatus;
  zone: ZoneRow;
}
