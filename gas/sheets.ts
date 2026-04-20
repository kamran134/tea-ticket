// ──────────────────────────────────────────────
// Google Sheets data layer
// ──────────────────────────────────────────────

/**
 * Returns the "Tickets" sheet. Creates it with headers
 * and formatting if it doesn't exist yet.
 */
function getSheet(): GoogleAppsScript.Spreadsheet.Sheet {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow(SHEET_HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, SHEET_HEADERS.length)
      .setFontWeight('bold');
  }

  return sheet;
}

/**
 * Run once from the GAS editor to bootstrap the sheet.
 * Safe to call multiple times — skips if sheet already exists.
 */
function initSheet(): void {
  const sheet = getSheet();
  Logger.log(`Sheet "${sheet.getName()}" ready — ${sheet.getLastRow() - 1} tickets`);
}

// ──────────────────────────────────────────────
// CRUD operations
// ──────────────────────────────────────────────

function appendTicket(ticket: TicketRow): void {
  getSheet().appendRow([
    ticket.id,
    sanitizeForSheet(ticket.name),
    sanitizeForSheet(ticket.phone),
    sanitizeForSheet(ticket.zone),
    ticket.price,
    ticket.receiptLink,
    ticket.status,
    ticket.checkedIn,
    ticket.createdAt,
  ]);
}

function findTicketById(id: string): TicketRow | null {
  const data = getSheet().getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][COL.ID]) === id) {
      return rowToTicket(data[i]);
    }
  }

  return null;
}

/**
 * Returns the 1-based row index for a ticket, or -1 if not found.
 * (1-based because Sheets API uses 1-based indexing.)
 */
function findTicketRowIndex(id: string): number {
  const data = getSheet().getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][COL.ID]) === id) {
      return i + 1;
    }
  }

  return -1;
}

function updateTicketCheckedIn(id: string): TicketRow | null {
  const sheet = getSheet();
  const rowIndex = findTicketRowIndex(id);
  if (rowIndex === -1) return null;

  sheet.getRange(rowIndex, COL.CHECKED_IN + 1).setValue(true);

  return findTicketById(id);
}

// ──────────────────────────────────────────────
// Row ↔ Object mapping
// ──────────────────────────────────────────────

function rowToTicket(row: unknown[]): TicketRow {
  return {
    id:          String(row[COL.ID]),
    name:        String(row[COL.NAME]),
    phone:       String(row[COL.PHONE]),
    zone:        String(row[COL.ZONE]),
    price:       Number(row[COL.PRICE]),
    receiptLink: String(row[COL.RECEIPT_LINK]),
    status:      String(row[COL.STATUS]) as TicketStatus,
    checkedIn:   row[COL.CHECKED_IN] === true || row[COL.CHECKED_IN] === 'TRUE',
    createdAt:   String(row[COL.CREATED_AT]),
  };
}
