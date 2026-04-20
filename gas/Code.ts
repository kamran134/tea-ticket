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

    case 'health':
      return successResponse({
        status: 'ok',
        timestamp: new Date().toISOString(),
      });

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
      case 'register':
        return handleRegister(body);

      case 'checkin':
        return handleCheckin(body);

      default:
        return errorResponse(`Unknown action: ${action}`);
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
      'Validation failed: name, phone, zone (string) and price (number > 0) are required',
    );
  }

  const payload = body as unknown as RegisterPayload;

  let receiptLink = '';
  if (payload.receiptBase64) {
    const filename = payload.receiptFilename || `receipt-${Date.now()}`;
    receiptLink = uploadReceiptToDrive(payload.receiptBase64, filename);
  }

  const ticket: TicketRow = {
    id:          generateTicketId(),
    name:        payload.name.trim(),
    phone:       payload.phone.trim(),
    zone:        payload.zone.trim(),
    price:       payload.price,
    receiptLink,
    status:      'Pending',
    checkedIn:   false,
    createdAt:   new Date().toISOString(),
  };

  appendTicket(ticket);

  const result: RegisterResult = { id: ticket.id, status: ticket.status };
  return successResponse(result);
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
