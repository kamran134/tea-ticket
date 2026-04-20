// ──────────────────────────────────────────────
// Project-wide constants
// ──────────────────────────────────────────────

const SHEET_ID = '1EDoEFUxw4B09wwROIQqg5yAzVWyo09DMKRWipiZRvwk';
const SHEET_NAME = 'Tickets';
const RECEIPT_FOLDER_NAME = 'tea-ticket-receipts';

/** Zero-based column indices matching the sheet header row. */
const COL = {
  ID:           0,
  NAME:         1,
  PHONE:        2,
  ZONE:         3,
  PRICE:        4,
  RECEIPT_LINK: 5,
  STATUS:       6,
  CHECKED_IN:   7,
  CREATED_AT:   8,
} as const;

const SHEET_HEADERS: string[] = [
  'ID', 'Name', 'Phone', 'Zone', 'Price',
  'Receipt_Link', 'Status', 'CheckedIn', 'CreatedAt',
];
