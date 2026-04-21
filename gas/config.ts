// ──────────────────────────────────────────────
// Project-wide constants
// ──────────────────────────────────────────────

const SHEET_ID = '1EDoEFUxw4B09wwROIQqg5yAzVWyo09DMKRWipiZRvwk';
const SHEET_NAME = 'Tickets';
const VENUES_SHEET_NAME = 'Venues';
const ZONES_SHEET_NAME = 'Zones';
const RECEIPT_FOLDER_NAME = 'tea-ticket-receipts';

/** How many minutes a Booked ticket is held before auto-expiry. */
const BOOKING_EXPIRY_MINUTES = 60;

/** Zero-based column indices for the Tickets sheet. */
const COL = {
  ID:           0,
  NAME:         1,
  PHONE:        2,
  VENUE_ID:     3,
  ZONE_ID:      4,
  ZONE_NAME:    5,
  PRICE:        6,
  RECEIPT_LINK: 7,
  STATUS:       8,
  CHECKED_IN:   9,
  CREATED_AT:   10,
  BOOKED_AT:    11,
  GROUP_ID:     12, // Shared ID for group tickets; equals ID for solo tickets
} as const;

const SHEET_HEADERS: string[] = [
  'ID', 'Name', 'Phone', 'VenueID', 'ZoneID', 'ZoneName', 'Price',
  'Receipt_Link', 'Status', 'CheckedIn', 'CreatedAt', 'BookedAt', 'GroupID',
];

/** Zero-based column indices for the Venues sheet. */
const VENUE_COL = {
  ID:     0,
  NAME:   1,
  DATE:   2,
  ACTIVE: 3,
} as const;

const VENUES_HEADERS: string[] = ['ID', 'Name', 'Date', 'Active'];

/** Zero-based column indices for the Zones sheet. */
const ZONE_COL = {
  ID:          0,
  VENUE_ID:    1,
  NAME:        2,
  PRICE:       3,
  CARD_NUMBER: 4,
  CAPACITY:    5,
  SORT_ORDER:  6,
} as const;

const ZONES_HEADERS: string[] = [
  'ID', 'VenueID', 'Name', 'Price', 'CardNumber', 'Capacity', 'SortOrder',
];
