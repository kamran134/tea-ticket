// ──────────────────────────────────────────────
// Google Sheets data layer
// ──────────────────────────────────────────────

// ── Sheet accessors ──────────────────────────

function getSpreadsheet(): GoogleAppsScript.Spreadsheet.Spreadsheet {
  return SpreadsheetApp.openById(SHEET_ID);
}

function getOrCreateSheet(
  name: string,
  headers: string[],
): GoogleAppsScript.Spreadsheet.Sheet {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
  return sheet;
}

function getSheet(): GoogleAppsScript.Spreadsheet.Sheet {
  return getOrCreateSheet(SHEET_NAME, SHEET_HEADERS);
}

function getVenuesSheet(): GoogleAppsScript.Spreadsheet.Sheet {
  return getOrCreateSheet(VENUES_SHEET_NAME, VENUES_HEADERS);
}

function getZonesSheet(): GoogleAppsScript.Spreadsheet.Sheet {
  return getOrCreateSheet(ZONES_SHEET_NAME, ZONES_HEADERS);
}

/**
 * Bootstrap all sheets. Run once from the GAS editor.
 */
function initSheet(): void {
  const tickets = getSheet();
  const venues  = getVenuesSheet();
  const zones   = getZonesSheet();
  Logger.log(`Tickets: ${tickets.getLastRow() - 1} rows`);
  Logger.log(`Venues:  ${venues.getLastRow()  - 1} rows`);
  Logger.log(`Zones:   ${zones.getLastRow()   - 1} rows`);
}

// ── Tickets CRUD ─────────────────────────────

function appendTicket(ticket: TicketRow): void {
  getSheet().appendRow([
    ticket.id,
    sanitizeForSheet(ticket.name),
    sanitizeForSheet(ticket.phone),
    ticket.venueId,
    ticket.zoneId,
    sanitizeForSheet(ticket.zoneName),
    ticket.price,
    ticket.receiptLink,
    ticket.status,
    ticket.checkedIn,
    ticket.createdAt,
    ticket.bookedAt,
    ticket.groupId,
  ]);
}

function findTicketById(id: string): TicketRow | null {
  const data = getSheet().getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][COL.ID]) === id) return rowToTicket(data[i]);
  }
  return null;
}

function findTicketRowIndex(id: string): number {
  const data = getSheet().getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][COL.ID]) === id) return i + 1;
  }
  return -1;
}

function updateTicketStatus(id: string, status: TicketStatus): TicketRow | null {
  const sheet = getSheet();
  const rowIndex = findTicketRowIndex(id);
  if (rowIndex === -1) return null;
  sheet.getRange(rowIndex, COL.STATUS + 1).setValue(status);
  return findTicketById(id);
}

function updateTicketReceiptAndStatus(
  id: string,
  receiptLink: string,
): TicketRow | null {
  const sheet = getSheet();
  const rowIndex = findTicketRowIndex(id);
  if (rowIndex === -1) return null;
  sheet.getRange(rowIndex, COL.RECEIPT_LINK + 1).setValue(receiptLink);
  sheet.getRange(rowIndex, COL.STATUS + 1).setValue('Pending');
  return findTicketById(id);
}

function updateTicketCheckedIn(id: string): TicketRow | null {
  const sheet = getSheet();
  const rowIndex = findTicketRowIndex(id);
  if (rowIndex === -1) return null;
  sheet.getRange(rowIndex, COL.CHECKED_IN + 1).setValue(true);
  return findTicketById(id);
}

/**
 * Checks in specific members of a group by their individual row IDs.
 * Returns all members of the group after the update.
 */
function checkinGroupMembers(groupId: string, personIds: string[]): GroupMember[] {
  const sheet = getSheet();
  const data  = sheet.getDataRange().getValues();
  const idSet = new Set(personIds);

  for (let i = 1; i < data.length; i++) {
    const rowGroupId  = String(data[i][COL.GROUP_ID]) || String(data[i][COL.ID]);
    const rowId       = String(data[i][COL.ID]);
    if (rowGroupId === groupId && idSet.has(rowId)) {
      sheet.getRange(i + 1, COL.CHECKED_IN + 1).setValue(true);
    }
  }

  return findMembersByGroupId(groupId);
}

/**
 * Returns all member rows for a given groupId.
 * For legacy rows (no GroupID stored), falls back to a single-member result.
 */
function findMembersByGroupId(groupId: string): GroupMember[] {
  const data    = getSheet().getDataRange().getValues();
  const members: GroupMember[] = [];

  for (let i = 1; i < data.length; i++) {
    const rowGroupId = String(data[i][COL.GROUP_ID]) || String(data[i][COL.ID]);
    if (rowGroupId === groupId) {
      members.push({
        id:        String(data[i][COL.ID]),
        name:      String(data[i][COL.NAME]),
        checkedIn: data[i][COL.CHECKED_IN] === true || data[i][COL.CHECKED_IN] === 'TRUE',
      });
    }
  }

  return members;
}

/**
 * Marks Booked tickets older than BOOKING_EXPIRY_MINUTES as Expired.
 * Called by the time-driven trigger.
 */
function expireOldBookings(): void {
  const sheet = getSheet();
  const data  = sheet.getDataRange().getValues();
  const now   = Date.now();
  const limitMs = BOOKING_EXPIRY_MINUTES * 60 * 1000;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][COL.STATUS]) !== 'Booked') continue;
    const bookedAt = new Date(String(data[i][COL.BOOKED_AT])).getTime();
    if (now - bookedAt >= limitMs) {
      sheet.getRange(i + 1, COL.STATUS + 1).setValue('Expired');
    }
  }
}

// ── Row ↔ Object mapping ─────────────────────

function rowToTicket(row: unknown[]): TicketRow {
  const id = String(row[COL.ID]);
  return {
    id,
    name:        String(row[COL.NAME]),
    phone:       String(row[COL.PHONE]),
    venueId:     String(row[COL.VENUE_ID]),
    zoneId:      String(row[COL.ZONE_ID]),
    zoneName:    String(row[COL.ZONE_NAME]),
    price:       Number(row[COL.PRICE]),
    receiptLink: String(row[COL.RECEIPT_LINK]),
    status:      String(row[COL.STATUS]) as TicketStatus,
    checkedIn:   row[COL.CHECKED_IN] === true || row[COL.CHECKED_IN] === 'TRUE',
    createdAt:   String(row[COL.CREATED_AT]),
    bookedAt:    String(row[COL.BOOKED_AT]),
    // Backward compat: legacy rows have no GroupID — treat as solo (groupId = id)
    groupId:     String(row[COL.GROUP_ID] ?? '') || id,
  };
}

// ── Venues CRUD ──────────────────────────────

function appendVenue(venue: VenueRow): void {
  getVenuesSheet().appendRow([
    venue.id,
    sanitizeForSheet(venue.name),
    venue.date,
    venue.active,
  ]);
}

function getAllVenues(): VenueRow[] {
  const data = getVenuesSheet().getDataRange().getValues();
  const venues: VenueRow[] = [];
  for (let i = 1; i < data.length; i++) {
    venues.push(rowToVenue(data[i]));
  }
  return venues;
}

function findVenueById(id: string): VenueRow | null {
  const data = getVenuesSheet().getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][VENUE_COL.ID]) === id) return rowToVenue(data[i]);
  }
  return null;
}

function rowToVenue(row: unknown[]): VenueRow {
  return {
    id:     String(row[VENUE_COL.ID]),
    name:   String(row[VENUE_COL.NAME]),
    date:   String(row[VENUE_COL.DATE]),
    active: row[VENUE_COL.ACTIVE] === true || row[VENUE_COL.ACTIVE] === 'TRUE',
  };
}

// ── Zones CRUD ───────────────────────────────

function appendZone(zone: ZoneRow): void {
  getZonesSheet().appendRow([
    zone.id,
    zone.venueId,
    sanitizeForSheet(zone.name),
    zone.price,
    sanitizeForSheet(zone.cardNumber),
    zone.capacity,
    zone.sortOrder,
  ]);
}

function getZonesByVenue(venueId: string): ZoneRow[] {
  const data  = getZonesSheet().getDataRange().getValues();
  const zones: ZoneRow[] = [];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][ZONE_COL.VENUE_ID]) === venueId) {
      zones.push(rowToZone(data[i]));
    }
  }
  return zones.sort((a, b) => a.sortOrder - b.sortOrder);
}

function findZoneById(id: string): ZoneRow | null {
  const data = getZonesSheet().getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][ZONE_COL.ID]) === id) return rowToZone(data[i]);
  }
  return null;
}

function findZoneRowIndex(id: string): number {
  const data = getZonesSheet().getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][ZONE_COL.ID]) === id) return i + 1;
  }
  return -1;
}

function updateZoneFields(payload: UpdateZonePayload): ZoneRow | null {
  const sheet    = getZonesSheet();
  const rowIndex = findZoneRowIndex(payload.id);
  if (rowIndex === -1) return null;

  const updates: Array<{ col: number; value: unknown }> = [];
  if (payload.name       !== undefined) updates.push({ col: ZONE_COL.NAME,        value: sanitizeForSheet(payload.name) });
  if (payload.price      !== undefined) updates.push({ col: ZONE_COL.PRICE,       value: payload.price });
  if (payload.cardNumber !== undefined) updates.push({ col: ZONE_COL.CARD_NUMBER, value: sanitizeForSheet(payload.cardNumber) });
  if (payload.capacity   !== undefined) updates.push({ col: ZONE_COL.CAPACITY,    value: payload.capacity });
  if (payload.sortOrder  !== undefined) updates.push({ col: ZONE_COL.SORT_ORDER,  value: payload.sortOrder });

  for (const u of updates) {
    sheet.getRange(rowIndex, u.col + 1).setValue(u.value);
  }

  return findZoneById(payload.id);
}

function deleteZoneById(id: string): boolean {
  const sheet    = getZonesSheet();
  const rowIndex = findZoneRowIndex(id);
  if (rowIndex === -1) return false;
  sheet.deleteRow(rowIndex);
  return true;
}

function rowToZone(row: unknown[]): ZoneRow {
  return {
    id:         String(row[ZONE_COL.ID]),
    venueId:    String(row[ZONE_COL.VENUE_ID]),
    name:       String(row[ZONE_COL.NAME]),
    price:      Number(row[ZONE_COL.PRICE]),
    cardNumber: String(row[ZONE_COL.CARD_NUMBER]),
    capacity:   Number(row[ZONE_COL.CAPACITY]),
    sortOrder:  Number(row[ZONE_COL.SORT_ORDER]),
  };
}

/**
 * Returns zones for a venue with the number of available (unoccupied) spots.
 * Occupied = tickets with status Booked, Pending, or Confirmed.
 */
function getZonesWithAvailability(venueId: string): ZoneWithAvailability[] {
  const zones   = getZonesByVenue(venueId);
  const tickets = getSheet().getDataRange().getValues();

  const bookedCountByZone: Record<string, number> = {};
  for (let i = 1; i < tickets.length; i++) {
    const tVenueId = String(tickets[i][COL.VENUE_ID]);
    const tZoneId  = String(tickets[i][COL.ZONE_ID]);
    const tStatus  = String(tickets[i][COL.STATUS]);
    if (tVenueId !== venueId) continue;
    if (tStatus === 'Booked' || tStatus === 'Pending' || tStatus === 'Confirmed') {
      bookedCountByZone[tZoneId] = (bookedCountByZone[tZoneId] || 0) + 1;
    }
  }

  return zones.map(z => ({
    ...z,
    available: Math.max(0, z.capacity - (bookedCountByZone[z.id] || 0)),
  }));
}
