export type TicketStatus = 'Booked' | 'Pending' | 'Confirmed' | 'Rejected' | 'Expired';

export interface GroupMember {
  id: string;
  name: string;
  checkedIn: boolean;
}

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
  /** Shared group ID. Equals id for solo tickets. */
  groupId: string;
  /** All members of the group, including the buyer. */
  members: GroupMember[];
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
  members: GroupMember[];
}
