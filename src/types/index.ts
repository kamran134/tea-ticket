export type TicketStatus = 'Pending' | 'Confirmed' | 'Rejected';

export interface Ticket {
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

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface RegisterResult {
  id: string;
  status: TicketStatus;
}
