# Tea-Ticket — Status

## Current Phase: GROUP TICKETS IMPLEMENTED

## What's Done

### Phase 1 — Original MVP (complete)
All original phases (DB, GAS API, Landing, Ticket View, Admin Scanner) complete.

### Phase 2 — Full Booking Flow (complete)
New booking flow: Booked → Pending (receipt) → Confirmed | Rejected | Expired

### Phase 3 — Group Tickets (complete, deploy pending)

- [x] **gas/config.ts** — Added `GROUP_ID: 12` column to Tickets sheet
- [x] **gas/types.ts** — `TicketRow.groupId`, `GroupMember`, `guests[]` in `RegisterPayload`, `CheckinGroupPayload`, `members[]` in `RegisterResult`
- [x] **gas/sheets.ts** — `appendTicket` writes groupId; `rowToTicket` reads with backward compat; `findMembersByGroupId()`; `checkinGroupMembers()`
- [x] **gas/Code.ts** — `handleRegister` creates buyer + N guest rows; `getTicketGroup` GET endpoint; `handleCheckinGroup` POST endpoint; `getTicket` now returns `members[]`
- [x] **src/types/index.ts** — `GroupMember` type; `groupId` + `members[]` in `Ticket`; `members[]` in `RegisterResult`
- [x] **src/services/api.ts** — `register` accepts `guests[]`; added `checkinGroup()`, `getTicketGroup()`
- [x] **src/components/registerForm.ts** — `guests[]` array; `addGuest()`/`removeGuest()`; `totalPrice()`; validation for group; submit sends `guests`
- [x] **src/components/adminScanner.ts** — detects group ticket; shows checkbox list; `togglePerson()`; `checkinSelectedMembers()`
- [x] **index.html** — guest name rows with + button; total price updated dynamically
- [x] **admin.html** — group check-in panel with checkboxes; summary after check-in
- [x] **ticket.html** — group members list; strikethrough for checked-in members

## Next Steps
- [ ] Build GAS (`npm run build` in gas/) and deploy via `clasp push && clasp deploy`
- [ ] Build frontend (`npm run build`) and deploy to GitHub Pages

## What's Done

### Phase 1 — Original MVP (complete)
All original phases (DB, GAS API, Landing, Ticket View, Admin Scanner) complete.

### Phase 2A — GAS Backend Refactor (complete)
New booking flow: Booked -> Pending (receipt) -> Confirmed | Rejected | Expired

- [x] config.ts — Venues / Zones sheets; updated Tickets columns (VenueID, ZoneID, ZoneName, BookedAt); VENUE_COL, ZONE_COL constants
- [x] types.ts — VenueRow, ZoneRow, ZoneWithAvailability; updated TicketRow; Booked/Expired statuses; new payload interfaces
- [x] sheets.ts — full refactor: CRUD for Venues and Zones; getZonesWithAvailability(); expireOldBookings(); updateTicketReceiptAndStatus()
- [x] utils.ts — generateVenueId(), generateZoneId(); updated register validation; new validators
- [x] Code.ts — new endpoints: getVenues, getZones, uploadReceipt, createVenue, createZone, updateZone, deleteZone; expireBookingsJob(); register returns zone with cardNumber
- [x] GAS TypeScript build passes (no errors)

## Next Steps

### Phase 2B — Registration form (index.html)
- [ ] Read ?venue=ID from URL
- [ ] Load zones via getZones?venueId=...
- [ ] Remove receipt upload from form
- [ ] Button "Zabronirovat mesto"
- [ ] After booking -> redirect to ticket.html?id=XXX

### Phase 2C — Ticket page (ticket.html)
- [ ] Status Booked -> zone, price, card number, 1h countdown timer, receipt upload form
- [ ] Status Pending -> "Receipt received, awaiting confirmation"
- [ ] Status Expired -> "Booking expired"

### Phase 2D — Management page (/manage.html)
- [ ] Auth gate
- [ ] Venues section
- [ ] Zones section (with card number)

### Deploy
- [ ] clasp push && clasp deploy new GAS version
- [ ] Set up time-driven trigger for expireBookingsJob (every 30 min)
