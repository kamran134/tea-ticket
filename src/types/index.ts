export type TicketStatus = 'Booked' | 'Pending' | 'Confirmed' | 'Rejected' | 'Expired';

export interface Ticket {
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

export interface Zone {
  id: string;
  venueId: string;
  name: string;
  price: number;
  cardNumber: string;
  capacity: number;
  sortOrder: number;
  available: number;
}

export interface Venue {
  id: string;
  name: string;
  date: string;
  active: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface RegisterResult {
  id: string;
  status: TicketStatus;
  zone: Zone;
}
