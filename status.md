# Tea-Ticket — Status

## Current Phase: PHASE 2 IN PROGRESS

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
