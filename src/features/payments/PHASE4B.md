# Phase 4B: minimal booking operations

## Local activation status

The application uses a dedicated version-3 payment webhook contract. Live booking storage still requires manual deployment of the bound Apps Script and runtime secrets described in `GOOGLE_SHEETS_SETUP.md`. Missing configuration or an incomplete acknowledgement returns unavailable, never fake success. Do not reuse or modify the lead/placement webhook.

## Booking flow

Payment form -> existing Order API -> shared validation -> OrderService -> OrderRepository -> GoogleSheetsOrderRepository.

Required: full name, Egyptian mobile, Egyptian WhatsApp, email, age, valid attendance and existing legal consent. Optional: notes, capped at 1,000 characters. Age is a whole number from 1 to 120; Arabic/Persian digits are normalized, and these are sanity bounds rather than course eligibility rules. No governorate, gender, full address, national ID or learning-history fields are accepted. Course identifiers are validated against the unchanged server catalog; course calculations are read-only. Existing placement-derived start locking is unchanged.

CustomerService remains a small per-booking snapshot helper, not a customer CRM. Its repository reads contact fields from the Bookings row. No separate Customers tab is required. New Order snapshots retain opaque customer IDs and null legacy contact fields; contact details are stored once in the Bookings columns.

## Exactly three tabs

### Bookings

Booking_ID, Created_At, Full_Name, Phone, WhatsApp, Email, Age, Package, Start_Level, Target_Level, Hours, Sessions, Attendance_Type, Original_Price, Promo_Code, Discount_Amount, Final_Price, Payment_Method, Payment_Status, Payment_Verification, Payment_Proof_URL, Admin_Notes, Customer_Notes, plus the private snapshot and idempotency columns defined in `server/sheets-schema.ts`.

Age replaces Governorate for new bookings. No live sheet or historical record is migrated here. The private customer reader still accepts older records without age, returning null rather than inventing an age or exposing the removed governorate field. New booking creation always requires age.

Customer Notes is a separate optional column so customer input cannot populate Admin Notes.

Three protected technical columns preserve the existing architecture: Order Snapshot (JSON, including course hours/sessions/duration, price, consent versions/time and payment state), Idempotency Key Hash, Request Fingerprint. These are necessary for immutable reads/retries, not another database or CRM. Hiding columns is convenience, not access control; protect the sheet itself.

### Promo Codes

Code, Discount_Type, Discount_Value, Active, Start_Date, End_Date, Usage_Limit, Description.

Discount Type is Fixed or Percentage. Blank dates/limit map to null. Convert Sheet dates to explicit timezone-qualified ISO timestamps using the agreed Sheet/business timezone. The service uses inclusive start/exclusive end; a date-only inclusive end date must become the next local day's start. Never pass ambiguous date display strings to JavaScript date parsing. No live example codes are seeded.

### Promo Usage

Usage_ID, Created_At, Promo_Code, Booking_ID, Customer_Name, Customer_Phone, Discount_Amount.

One usage per Booking ID. Backend reads derive usedCount from distinct committed usages. No separate counter is required. Quote validation never consumes usage; confirmed booking creation reserves it. There is no automatic release for abandoned/cancelled bookings in this phase.

## Atomic storage contract

Request uses the existing private payment endpoint and secret:

`{ secret, domain: "payments", action: "create_order", payload: { contractVersion: 3, order, event, booking, promoUsage, promo, notification } }`

- Validate the authenticated request and relationships. Use exact IDs, never approximate phone/name matching.
- Under a shared lock, resolve the idempotency hash first. A replay returns the saved booking; a changed fingerprint conflicts. Do not append usage twice.
- Revalidate the promo definition, activity, date, usage capacity and server amount. The provided promo quote is not a reservation.
- Atomically write Bookings and optional Promo Usage in the same operation. Sequential appendRow calls plus a lock are not crash-atomic. Use a single validated Sheets batch, then test timeout/retry and last-use concurrency before activation.
- Preserve formula-safe strings and reconstruct normalized domain values on reads. Do not return an added spreadsheet-escape apostrophe as part of a phone number. Write snapshot JSON as literal text, not formulas.
- Acknowledge only a complete write. No fallback to the older order-only or multi-tab contracts.

```json
{
  "success": true,
  "data": {
    "order": "<stored Order object>",
    "created": true,
    "bookingCommit": {
      "version": 2,
      "orderId": "<saved booking id>",
      "requestFingerprint": "<saved fingerprint>",
      "bookingSaved": true,
      "promoUsageBookingId": "<saved booking id when a promo was used, otherwise null>"
    }
  }
}
```

`created: false` returns the original order, including original consent time and prices. A timeout is an unknown outcome; retry the same key, not a new booking. Existing historical data is not migrated, deleted or repriced by this phase.

## Payment-review preparation

InstaPay, wallet and branch preferences can include an optional HTTPS proof link. Card/installment preferences reject proof links. The server never fetches the link; no transfer instructions, file upload, verification or provider integration is added. Proof is private operational data, omitted from public order responses. Staff must treat external links as untrusted; URL checks do not certify their contents.

Every new booking is Pending, including a booking with a proof or a zero final price. Internal order/payment states remain unchanged. Sheet projection: not_started/waiting_payment/waiting_verification -> Pending; paid -> Paid; failed -> Rejected; cancelled -> Cancelled. The last label preserves the existing cancellation state.

No admin endpoint is added. Future authorized review uses the existing OrderService transition rules: queue manual review with waiting_verification, then approve as paid with a verified reference or reject as failed. Update the visible Payment Status and Order Snapshot together. Never edit only the displayed status cell: that would leave API reads inconsistent. `commit_booking_transition` requires expectedStatus and returns `transitionCommit: { orderId, statusSaved: true }`. Existing verification interfaces are reserved for updates to the same booking, not new tabs.

## Notifications and safety

The existing preparation hook can build a plain-text admin notification from a durable booking: name, phone, email, package, final amount, method, booking ID, levels, attendance, status and date. It rejects mismatched booking/contact pairs. No recipient, email send, WhatsApp send, Calendar event, notification outbox or delivery claim is introduced.

Server catalog prices and promo arithmetic are authoritative. Store immutable pricing and consent snapshots. Reject unknown price/status/identity fields, require same-origin requests and existing access tokens, limit body sizes and retain the existing rate limit. No body/PII/proof URL logging is added. Restrict spreadsheet permissions and future staff access.

Idempotency prevents duplicate retries with the same key, including concurrent retries; a different key/device can still create a new booking. This is not identity verification or cross-device deduplication. Sheet atomicity and distributed abuse protection must be verified before real customers. Tests use only in-memory repositories and injected HTTP stubs; no production data is touched.

## Local validation

- Placement/Plans suite: 62 passed, unchanged.
- Payment/booking suite: 60/60 passed, including required age, Arabic digits, historical reads, visible promo UI event handlers, server-validated final-price submission, immutable snapshots, duplicate retries, manual proof and existing manual-review transitions.
- TypeScript and webpack production build passed.
- Arabic RTL and English LTR were checked at 390px and 1440px: no form horizontal overflow; five required customer fields plus optional notes; manual proof appears only for manual methods.
- The development browser reports the existing React eval/CSP debugging warning. The security policy was not weakened; the production build passed.
- No live Sheet write, real order, payment, notification, commit, push or deployment was performed.

## Files changed in this phase

All paths below are relative to this isolated worktree. Existing unrelated uncommitted work is excluded from this list.

- scripts/run-payment-foundation-tests.cjs
- src/features/customers/copy.ts
- src/features/customers/google-sheets-customer-repository.ts
- src/features/customers/types.ts
- src/features/customers/validation.ts
- src/features/payments/PHASE4A.md (superseded notice only)
- src/features/payments/PHASE4B.md (new)
- src/features/payments/README.md
- src/features/payments/components/customer-enrollment-fields.tsx
- src/features/payments/components/payment-checkout.tsx
- src/features/payments/copy.ts
- src/features/payments/server/booking-records.ts
- src/features/payments/server/booking-sheet.ts (new)
- src/features/payments/server/create-order-handler.ts
- src/features/payments/server/google-sheets-order-repository.ts
- src/features/payments/server/order-service.ts
- src/features/payments/server/sheets-schema.ts
- src/features/payments/types.ts
- src/features/payments/validation.ts
- src/features/promos/README.md
- src/features/promos/google-sheets-promo-repository.ts
- src/features/promos/promo-service.ts
- src/features/promos/types.ts
