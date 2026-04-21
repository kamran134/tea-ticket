// ──────────────────────────────────────────────
// HTTP entry points
// ──────────────────────────────────────────────
//
// GAS web-app triggers:
//   doGet  → GET  requests (read data)
//   doPost → POST requests (write data)
//
// NOTE: Frontend must send POST with Content-Type: text/plain
// to avoid CORS preflight (GAS doesn't support OPTIONS).
// The body is still valid JSON — we parse it manually.
// ──────────────────────────────────────────────

function doGet(
  e: GoogleAppsScript.Events.DoGet,
): GoogleAppsScript.Content.TextOutput {
  const action = e.parameter.action;

  switch (action) {
    case 'getTicket': {
      const id = e.parameter.id;
      if (!id) return errorResponse('Missing parameter: id');
      const ticket = findTicketById(id);
      if (!ticket) return errorResponse('Ticket not found');
      return successResponse(ticket);
    }

    case 'getVenues':
      return successResponse(getAllVenues());

    case 'getZones': {
      const venueId = e.parameter.venueId;
      if (!venueId) return errorResponse('Missing parameter: venueId');
      return successResponse(getZonesWithAvailability(venueId));
    }

    case 'health':
      return successResponse({ status: 'ok', timestamp: new Date().toISOString() });

    default:
      return errorResponse(`Unknown action: ${action}`);
  }
}

function doPost(
  e: GoogleAppsScript.Events.DoPost,
): GoogleAppsScript.Content.TextOutput {
  try {
    const body: Record<string, unknown> = JSON.parse(e.postData.contents);
    const action = body.action;

    switch (action) {
      case 'register':       return handleRegister(body);
      case 'uploadReceipt':  return handleUploadReceipt(body);
      case 'checkin':        return handleCheckin(body);
      case 'createVenue':    return handleCreateVenue(body);
      case 'createZone':     return handleCreateZone(body);
      case 'updateZone':     return handleUpdateZone(body);
      case 'deleteZone':     return handleDeleteZone(body);
      default:               return errorResponse(`Unknown action: ${action}`);
    }
  } catch (err) {
    return errorResponse(`Invalid request: ${(err as Error).message}`);
  }
}

// ──────────────────────────────────────────────
// Action handlers
// ──────────────────────────────────────────────

function handleRegister(
  body: Record<string, unknown>,
): GoogleAppsScript.Content.TextOutput {
  if (!validateRegisterPayload(body)) {
    return errorResponse(
      'Validation failed: name, phone, venueId, zoneId (strings) are required',
    );
  }

  const payload = body as unknown as RegisterPayload;

  const zone = findZoneById(payload.zoneId);
  if (!zone) return errorResponse('Zone not found');
  if (zone.venueId !== payload.venueId) return errorResponse('Zone does not belong to venue');

  const availability = getZonesWithAvailability(payload.venueId);
  const zoneAvail    = availability.find(z => z.id === payload.zoneId);
  if (!zoneAvail || zoneAvail.available <= 0) {
    return errorResponse('No seats available in the selected zone');
  }

  const now = new Date().toISOString();
  const ticket: TicketRow = {
    id:          generateTicketId(),
    name:        payload.name.trim(),
    phone:       payload.phone.trim(),
    venueId:     payload.venueId,
    zoneId:      payload.zoneId,
    zoneName:    zone.name,
    price:       zone.price,
    receiptLink: '',
    status:      'Booked',
    checkedIn:   false,
    createdAt:   now,
    bookedAt:    now,
  };

  appendTicket(ticket);

  const result: RegisterResult = { id: ticket.id, status: ticket.status, zone };
  return successResponse(result);
}

function handleUploadReceipt(
  body: Record<string, unknown>,
): GoogleAppsScript.Content.TextOutput {
  if (!validateUploadReceiptPayload(body)) {
    return errorResponse('Validation failed: id and receiptBase64 are required');
  }

  const payload = body as unknown as UploadReceiptPayload;

  const ticket = findTicketById(payload.id);
  if (!ticket) return errorResponse('Ticket not found');

  if (ticket.status !== 'Booked') {
    return errorResponse(
      `Cannot upload receipt: ticket status is "${ticket.status}", expected "Booked"`,
    );
  }

  const filename = payload.receiptFilename || `receipt-${payload.id}-${Date.now()}`;
  const receiptLink = uploadReceiptToDrive(payload.receiptBase64, filename);

  const updated = updateTicketReceiptAndStatus(payload.id, receiptLink);
  return successResponse(updated);
}

function handleCheckin(
  body: Record<string, unknown>,
): GoogleAppsScript.Content.TextOutput {
  const id = body.id;
  if (!id || typeof id !== 'string') {
    return errorResponse('Missing or invalid field: id');
  }

  const ticket = findTicketById(id);
  if (!ticket) return errorResponse('Ticket not found');

  if (ticket.status !== 'Confirmed') {
    return errorResponse(
      `Cannot check in: ticket status is "${ticket.status}", expected "Confirmed"`,
    );
  }

  if (ticket.checkedIn) {
    return errorResponse('Ticket already checked in');
  }

  const updated = updateTicketCheckedIn(id);
  return successResponse(updated);
}

function handleCreateVenue(
  body: Record<string, unknown>,
): GoogleAppsScript.Content.TextOutput {
  if (!validateCreateVenuePayload(body)) {
    return errorResponse('Validation failed: name and date (strings) are required');
  }

  const payload = body as unknown as CreateVenuePayload;
  const venue: VenueRow = {
    id:     generateVenueId(),
    name:   payload.name.trim(),
    date:   payload.date.trim(),
    active: true,
  };

  appendVenue(venue);
  return successResponse(venue);
}

function handleCreateZone(
  body: Record<string, unknown>,
): GoogleAppsScript.Content.TextOutput {
  if (!validateCreateZonePayload(body)) {
    return errorResponse(
      'Validation failed: venueId, name, price, cardNumber, capacity are required',
    );
  }

  const payload = body as unknown as CreateZonePayload;

  if (!findVenueById(payload.venueId)) {
    return errorResponse('Venue not found');
  }

  const zone: ZoneRow = {
    id:         generateZoneId(),
    venueId:    payload.venueId,
    name:       payload.name.trim(),
    price:      payload.price,
    cardNumber: payload.cardNumber.trim(),
    capacity:   payload.capacity,
    sortOrder:  payload.sortOrder ?? 0,
  };

  appendZone(zone);
  return successResponse(zone);
}

function handleUpdateZone(
  body: Record<string, unknown>,
): GoogleAppsScript.Content.TextOutput {
  const id = body.id;
  if (!id || typeof id !== 'string') {
    return errorResponse('Missing or invalid field: id');
  }

  const updated = updateZoneFields(body as unknown as UpdateZonePayload);
  if (!updated) return errorResponse('Zone not found');
  return successResponse(updated);
}

function handleDeleteZone(
  body: Record<string, unknown>,
): GoogleAppsScript.Content.TextOutput {
  const id = body.id;
  if (!id || typeof id !== 'string') {
    return errorResponse('Missing or invalid field: id');
  }

  const deleted = deleteZoneById(id);
  if (!deleted) return errorResponse('Zone not found');
  return successResponse({ deleted: true });
}

// ──────────────────────────────────────────────
// Time-driven trigger: expire stale bookings
// ──────────────────────────────────────────────

/**
 * Attach this function to a time-driven trigger in GAS:
 * Triggers → Add trigger → expireBookingsJob → Time-driven → Every 30 minutes
 */
function expireBookingsJob(): void {
  expireOldBookings();
  Logger.log('expireBookingsJob done: ' + new Date().toISOString());
}
