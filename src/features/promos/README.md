# Promo foundation (Phase 4B)

No live codes, dashboard, provider integration, or production Sheet is included.

## Flow

- Payment UI sends only code and package ID to `POST /api/payments/promos/validate`.
- PromoService reads PromoRepository and resolves the original price from the existing Plans catalog. No frontend discount calculation exists.
- Preview returns only `pricing: { originalPrice, promoCode, discountAmount, finalPrice }`. It does not consume uses or guarantee a reservation.
- OrderService revalidates the promo at creation, checks the submitted final-price quote, and saves an immutable pricing snapshot. A retry reads the existing snapshot before contacting the promo repository.
- `packageSnapshot` remains the unchanged catalog package, including its existing advertised saving. `pricing.discountAmount` is the additional promo discount on the current catalog price, not on the crossed-out price. `payment.amountMinor` uses the final price in piastres.

## Rules

Codes are trimmed, case-insensitive ASCII letters/digits/underscore/hyphen, 1-64 characters, starting with a letter or digit. Empty allowedPackages means all packages. Dates are timezone-qualified ISO timestamps or null; start is inclusive and end exclusive. Null maxUses means unlimited; zero means unavailable. Invalid configuration fails closed.

Fixed values are EGP with at most two decimals. Percentage values are greater than zero and at most 100 with at most two decimals. Arithmetic uses integer piastres/basis points, rounds once half-up to a piastre, and caps the discount at the original price. A zero-price order is still pending/not_started; it is never marked paid automatically.

## Google Sheets contract

Use the same private payments endpoint/configuration as Orders, not the legacy lead endpoint. No configuration files or real Sheets are changed by this phase.

Promo Codes tab columns:

`Code | Discount_Type | Discount_Value | Active | Start_Date | End_Date | Usage_Limit | Description`

Discount Type contains Fixed or Percentage; it is not a second column. The backend normalizes it to fixed/percentage and returns typed JSON (numbers, boolean, timezone-qualified ISO dates or null). It derives `usedCount` from distinct booking-backed Promo Usage rows whose status still occupies capacity; there is no editable Used Count column. Released rows are historical audit records and do not count. A committed Booking missing its usage row is counted conservatively until idempotent retry repair. No allowedPackages column is required: absence means all packages. Legacy package restrictions, when explicitly supplied by a compatible backend, remain validated.

### Read action

Request: `{ domain: "payments", action: "get_promo", secret, payload: { code } }`

Response: `{ success: true, data: { promo: PromoCode | null } }`.

### Recoverable order redemption

All bookings use `create_order`, with payload `{ contractVersion: 3, order, event, booking, promoUsage, promo, notification }`. `promo` is the previously validated definition without usedCount, or null. The Promo Usage row contains its unique usage ID, creation time, promo code, booking ID, customer name and phone, discount amount, lifecycle status, deadline, and final/release audit fields. Booking ID is also a unique redemption key. The same normalized promo definition is stored privately in the immutable `Order_Snapshot` as `promoRedemption`; it is not exposed by `PublicOrder`.

The storage implementation must hold one shared lock across the following operation:

1. Find by exact idempotency hash first. Return an existing order without consuming a second use, even if the code is now expired/exhausted.
2. Read the current promo; recheck activity, dates, package eligibility and remaining uses. Compare its definition with the provided definition. Reject stale definitions as `promo_changed`.
3. Verify canonical order pricing against that definition. Lazily release expired `reserved` rows, then count `reserved`, `payment_in_progress`, `pending_review`, and `consumed` usage under the lock. `released` does not consume capacity.
4. Flush the Booking first, then ensure exactly one derived Promo Usage audit row. Return the complete `bookingCommit` acknowledgement only after both are durable. A retry of the same idempotency key repairs a missing audit row without making another Booking.

Controlled creation rejection uses `{ success: false, error: "promo_limit_reached" | "promo_expired" | "promo_inactive" | "promo_changed" | "promo_package_ineligible" }` with no writes. A later provider/admin continuation that cannot atomically reacquire the unchanged promo returns `promo_reservation_expired` and never changes `Final_Price`.

Locking alone is not crash atomicity. This is deliberately a booking-authoritative recovery model rather than an all-or-nothing Sheets transaction. A partial usage write does not free a promo use because a promo Booking without a usage row is counted conservatively. The separate `record_promo_usage` action is removed so an independent caller cannot consume a use. Tests exercise interruption/retry against an Apps Script stub; staging validation against the real deployment remains required.

Usage is reserved at order creation, not preview. Branch receives 72 hours; card/installments receive 60 minutes to start a hosted session. Because the current secure manual flow uploads proof before booking creation, InstaPay/wallet rows start as `pending_review`, store a blank `Reserved_Until`, and are never age-released while review is pending. Successful hosted sessions become `payment_in_progress`; only authoritative payment/admin approval becomes `consumed`; terminal rejection becomes `released`. Stale `reserved` rows release lazily during locked capacity checks. `payment_in_progress` is intentionally retained until a provider-authoritative terminal result exists; abandoned-session reconciliation remains separate work.

## Admin columns

`Promo Codes` uses exactly `Code`, `Discount_Type`, `Discount_Value`, `Active`, `Start_Date`, `End_Date`, `Usage_Limit`, and `Description`. Type the customer-facing code in `Code`; use `Fixed` or `Percentage`; `10` means 10% for a percentage code, while `500` means EGP 500 for a fixed code. A checked `Active` cell enables the code. Start/end dates are optional and retain inclusive-start/exclusive-end behavior. A configured `Usage_Limit` is the finite maximum accepted by the current parser. `Description` is an administrative note and never changes pricing.

Examples: `WELCOME10 | Percentage | 10 | TRUE` and `SAVE500 | Fixed | 500 | TRUE`.

`Promo Usage` uses exactly `Usage_ID`, `Created_At`, `Promo_Code`, `Booking_ID`, `Customer_Name`, `Customer_Phone`, `Discount_Amount`, `Status`, `Reserved_Until`, `Finalized_At`, `Released_At`, and `Release_Reason`.

## Tests

`node scripts/run-payment-foundation-tests.cjs` covers the service, preview API, pricing snapshots, strict consent gate, edited/expired-code retries, and a two-order last-use race. Test promos exist only inside that test script.
