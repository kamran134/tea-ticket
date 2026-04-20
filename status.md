# Tea-Ticket — Status

## Current Phase: ALL PHASES COMPLETE ✅

## What's Done

### Phase 1: Database Setup ✅
- [x] Google Sheet structure: `ID | Name | Phone | Zone | Price | Receipt_Link | Status | CheckedIn | CreatedAt`
- [x] SHEET_ID: `1EDoEFUxw4B09wwROIQqg5yAzVWyo09DMKRWipiZRvwk`
- [x] `initSheet()` executed — Tickets sheet created

### Phase 2: GAS API ✅
- [x] Type system: `TicketRow`, `ApiResponse<T>`, `RegisterPayload`, `CheckinPayload`
- [x] `doPost(register)` — creates ticket, generates unique ID, uploads receipt to Drive
- [x] `doGet(getTicket)` — returns ticket data by ID
- [x] `doPost(checkin)` — marks ticket as checked-in
- [x] `doGet(health)` — health-check endpoint
- [x] Deployed as Web App (v1)

### Phase 3: Public Landing ✅
- [x] Vite + Alpine.js + TypeScript + Tailwind CSS v4 project
- [x] Typed API service (`src/services/api.ts`)
- [x] Registration form component with:
  - Input validation (client-side)
  - Receipt file upload (JPEG/PNG/WebP/PDF, 5MB limit)
  - Image preview
  - Loading state + error display
  - Success screen with ticket ID

### Phase 4: Ticket View ✅
- [x] `/ticket.html?id=TT-XXX` — ticket page
- [x] QR code generation (qrcode lib) when Status = Confirmed
- [x] Status-dependent UI: Pending (⏳), Confirmed (QR), Rejected (❌)
- [x] Ticket info card: ID, name, phone, zone, price
- [x] Vite multi-page build config

### Phase 5: Admin Scanner ✅
- [x] `html5-qrcode` library for camera-based QR scanning
- [x] Admin scanner component with:
  - Camera activation (rear-facing preferred)
  - QR decode → API ticket lookup → auto check-in
  - Result states: ✅ success, ⚠️ already used, ❌ error
  - Ticket details display after scan
  - "Scan next" flow
- [x] `/admin.html` — dark-themed scanner page
- [x] Password protection (SHA-256 hash, client-side gate)

### Deployment ✅
- [x] `.gitignore` configured
- [x] Vite `base: '/tea-ticket/'` for GitHub Pages project site
- [x] GitHub Actions workflow (`.github/workflows/deploy.yml`)
- [x] `npm run build` passes (tsc + vite build)

## Status: PROJECT COMPLETE 🎉

All phases implemented. To deploy:
1. Push to `main` branch on GitHub
2. Enable GitHub Pages → Actions in repo settings
3. The workflow will build and deploy automatically

## Deploy Checklist (GAS — already done)
1. ✅ `clasp create` → scriptId configured
2. ✅ `npm run push` → code uploaded
3. ✅ `clasp deploy` → Web App live
4. ✅ GAS URL in `.env`
