// ──────────────────────────────────────────────
// ID generation
// ──────────────────────────────────────────────

function generateTicketId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `TT-${timestamp}-${random}`.toUpperCase();
}

function generateVenueId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 5);
  return `V-${timestamp}-${random}`.toUpperCase();
}

function generateZoneId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 5);
  return `Z-${timestamp}-${random}`.toUpperCase();
}

// ──────────────────────────────────────────────
// Response helpers
// ──────────────────────────────────────────────

function jsonResponse<T>(payload: ApiResponse<T>): GoogleAppsScript.Content.TextOutput {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function successResponse<T>(data: T): GoogleAppsScript.Content.TextOutput {
  return jsonResponse({ success: true, data });
}

function errorResponse(error: string): GoogleAppsScript.Content.TextOutput {
  return jsonResponse({ success: false, error });
}

// ──────────────────────────────────────────────
// Input validation
// ──────────────────────────────────────────────

function validateRegisterPayload(body: Record<string, unknown>): boolean {
  const { name, phone, venueId, zoneId } = body;
  return (
    typeof name    === 'string' && name.trim().length    > 0 &&
    typeof phone   === 'string' && phone.trim().length   > 0 &&
    typeof venueId === 'string' && venueId.trim().length > 0 &&
    typeof zoneId  === 'string' && zoneId.trim().length  > 0
  );
}

function validateUploadReceiptPayload(body: Record<string, unknown>): boolean {
  const { id, receiptBase64 } = body;
  return (
    typeof id            === 'string' && id.trim().length            > 0 &&
    typeof receiptBase64 === 'string' && receiptBase64.trim().length > 0
  );
}

function validateCreateVenuePayload(body: Record<string, unknown>): boolean {
  const { name, date } = body;
  return (
    typeof name === 'string' && name.trim().length > 0 &&
    typeof date === 'string' && date.trim().length > 0
  );
}

function validateCreateZonePayload(body: Record<string, unknown>): boolean {
  const { venueId, name, price, cardNumber, capacity } = body;
  return (
    typeof venueId    === 'string' && venueId.trim().length    > 0 &&
    typeof name       === 'string' && name.trim().length       > 0 &&
    typeof price      === 'number' && price                    >= 0 &&
    typeof cardNumber === 'string' && cardNumber.trim().length > 0 &&
    typeof capacity   === 'number' && capacity                 >  0
  );
}

// ──────────────────────────────────────────────
// Security: prevent Google Sheets formula injection
// ──────────────────────────────────────────────

/**
 * Prefixes values starting with formula-triggering characters
 * (=, +, -, @) with a single quote so Sheets treats them as text.
 */
function sanitizeForSheet(value: string): string {
  if (/^[=+\-@]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

// ──────────────────────────────────────────────
// Google Drive: receipt upload
// ──────────────────────────────────────────────

/**
 * Decodes a base64 data-URI and saves the file to a dedicated
 * Google Drive folder. Returns the shareable file URL.
 */
function uploadReceiptToDrive(base64Data: string, filename: string): string {
  const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid receipt data: expected a base64 data-URI');
  }

  const mimeType = matches[1];
  const decoded  = Utilities.base64Decode(matches[2]);
  const blob     = Utilities.newBlob(decoded, mimeType, filename);

  const folder = getOrCreateFolder(RECEIPT_FOLDER_NAME);
  const file   = folder.createFile(blob);

  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

/** Returns an existing folder or creates a new one. */
function getOrCreateFolder(name: string): GoogleAppsScript.Drive.Folder {
  const folders = DriveApp.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : DriveApp.createFolder(name);
}
