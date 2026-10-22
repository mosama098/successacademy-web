# Payment foundation

This module contains payment infrastructure and the booking checkout. The active storage contract is [Phase 4B](./PHASE4B.md); the customer-facing manual-payment presentation is documented in [Phase 5B](./PHASE5B.md), and authenticated downstream events are documented in [Phase 6A](./PHASE6_NOTIFICATIONS.md). Phase 4A is historical documentation only.

## Phase 3C: consent and promo pricing

Order creation now requires exactly `legalConsent.accepted: true` at the API and service boundaries. Missing/false consent returns HTTP 400 `legal_consent_required`, including when storage is not configured. The client cannot submit acceptance timestamps or policy versions.

Each new order stores the server timestamp, `termsVersion` and `privacyVersion` set to `current`, and `trainingTermsVersion` set to `2026-09-v1`. A repeated request preserves the original acceptance snapshot. The approved Arabic training-rules document is transcribed in `src/content/training-rules.ts` and appears at `/{locale}/legal#training-rules`, alongside the existing `#terms` and `#privacy` sections. Both locales display the approved Arabic wording; no unapproved translation is supplied. The payment checkbox links to all three documents and requires explicit acceptance. Existing orders retain their saved versions, including the previous `current` value.

`current` remains a placeholder for the unchanged terms/privacy policies, not a durable identifier for their text. Training rules now use the explicit revision `2026-09-v1`. Preserve published revisions when updating policies; this change does not claim legal sufficiency of a checkbox or alter the existing terms/privacy wording.

New orders also store `pricing: { originalPrice, promoCode, discountAmount, finalPrice }`; payment.amountMinor uses finalPrice. No-promo orders receive an explicit zero-discount snapshot. Existing orders lacking the new optional fields remain readable and are never migrated or repriced. The catalog/packageSnapshot is unchanged.

See `../promos/README.md` for the promo repository and redemption contract. The Bookings row stores visible pricing columns and the full Order Snapshot, including consent. No lead rows or placement records are changed.

## Trust boundaries

- Plans and prices are resolved from `src/features/plans/config.ts` on the server.
- A quoted browser price is checked for staleness/tampering but is never stored as the amount.
- Contact fields are validated on both client and server. Egyptian mobile numbers are normalized. Contact details are customer assertions, not verified identity or ownership.
- Existing lead association and placement-derived start level are read server-side only. Direct visitors receive a server-generated pseudonymous checkout ID; no lead or account is created. No browser-supplied customer ID or lead reference is accepted.
- Order creation requires an idempotency key. The repository must atomically return the existing order for a repeated key.
- Order status responses contain no customer or lead data and require a server-derived access token.
- The legacy generic callback route remains closed. PayTabs and EasyKash use provider-specific callbacks at `/api/payments/paytabs/callback` and `/api/payments/easykash/callback`.

## Phase 3B flow

`/{locale}/plans/checkout` preserves its review and attendance selection. Its Continue button opens `/{locale}/plans/payment` with the same plan identifiers and attendance. The payment page collects name, mobile, WhatsApp, email, age, optional notes, explicit legal consent and a payment-method preference. Age is stored as a whole number from 1 to 120 (input sanity bounds, not enrollment eligibility). Both attendance types require only those fields. No governorate, gender, address, national ID or learning-background fields are collected.

The promo input is always visible after the price summary, before the order action. It uses the existing server validation endpoint; original/discount/final values are displayed from its response and the validated final quote is sent to order creation for server revalidation. No frontend discount arithmetic is used.

The browser POSTs these fields plus a quoted price to `/api/payments/orders`. Price and snapshot always come from the existing Plans catalog. The preference is saved with `provider: null`, `payment.status: not_started`, and `order.status: pending` (displayed as Pending in Bookings). Manual methods optionally accept an HTTPS proof link, never confirmation of payment. Success requires a complete booking acknowledgement; a replay returns the original reference. Booking is not course activation. There is no payment redirect or purchase event. After persistence, Phase 6A emits an authenticated `booking.created` event; delivery failure is fail-open and n8n owns downstream channels and deduplication.

Retry keys are retained in sessionStorage for the selected plan, without contact details or access tokens. Reusing a key with changed contact/attendance/method returns a conflict. A different device, cleared sessionStorage, or new key is a new request; this is not cross-device customer deduplication. Direct checkout contact is not authentication. Future customer access/identity verification must be separate from this contact intake.

The new API limits JSON input to 16 KiB, rejects unknown identity/status/amount fields, checks origin, and limits each process to 20 requests per minute per forwarded IP. Production must set forwarded IP headers at a trusted proxy and provide an edge/shared rate limit before broad public use. This in-process limit is not a distributed abuse-control system.

`tracking.ts` exposes browser-only checkout preparation hooks. It cannot represent or emit `Purchase`; order creation, provider initiation, redirect, return and success-page loading are not purchases. `server/meta-purchase.ts` defines an inert server-only Meta CAPI extension point. PayTabs and EasyKash callbacks can invoke it only after an authenticated, correlated successful callback has committed the first transition to `paid`, using deterministic event ID `meta:purchase:<Booking_ID>`. No CAPI sink or credentials are configured in this repository, so the extension point currently sends nothing. Manual approvals continue through Apps Script and do not emit Meta Purchase.

## Local validation and activation requirements

Run `node scripts/run-payment-foundation-tests.cjs` for isolated service/API/adapter tests, then the existing Placement suite, TypeScript, and build. Tests use an in-memory repository or an injected fetch stub; they never write live customer data.

Live order creation requires the dedicated payment Apps Script and server variables `PAYMENTS_SHEETS_WEBHOOK_URL`, `PAYMENTS_SHEETS_WEBHOOK_SECRET`, and a minimum-32-character `PAYMENTS_ORDER_ACCESS_SECRET`. The Apps Script alone holds `PAYMENTS_SPREADSHEET_ID` and `PAYMENT_PROOFS_DRIVE_FOLDER_ID`. Never point this at the legacy lead webhook. Missing configuration returns a friendly unavailable state, not simulated success. See `GOOGLE_SHEETS_SETUP.md`.

Apps Script must retain normalized domain data on reads (including phone numbers); spreadsheet formula protection must not change the reconstructed Order. For duplicate-key requests it must return the original order, not overwrite contact details or append another row. Validate that behavior under concurrent requests before live activation. Keep Sheets access restricted because contact data is stored there.

## Google Apps Script contract

`GoogleSheetsOrderRepository` sends POST requests to `PAYMENTS_SHEETS_WEBHOOK_URL` with a separate `PAYMENTS_SHEETS_WEBHOOK_SECRET` and one of these actions:

- `create_order`: contractVersion 3, one Bookings row and optional Promo Usage row. No separate Customers, Orders, event, audit or outbox tabs are required.
- Promo Usage is a booking-backed reservation lifecycle row; there is no independent `record_promo_usage` write action.
- `upload_payment_proof`: stores an idempotently named JPEG, PNG, or WebP in the configured private Drive folder and returns only its Drive URL.
- `find_order_by_idempotency`: return `{ order }` or `{ order: null }`.
- `get_order`: return `{ order }` or `{ order: null }`.
- `ensure_promo_reservation`: under ScriptLock, confirm or safely reacquire an unchanged promo before an automated provider request.
- `commit_booking_transition`: compare expected prior status and update mutable Bookings payment fields. `Order_Snapshot` remains the immutable creation snapshot. No public status-changing endpoint is exposed.
- `get_customer_for_order`: server-only compatibility lookup of contact columns from Bookings by exact booking/order ID, not a CRM lookup.
- `create_payment_verification` / `update_payment_verification`: existing future adapter interfaces; when implemented, update the same booking's proof/review fields. No verification endpoint or automation is activated in this phase.

Every successful response must use `{ "success": true, "data": { ... } }`. The backend serializes booking/promo writes under one lock and counts only capacity-occupying Promo Usage states, while conservatively counting a committed promo Booking whose lifecycle row is missing. It flushes the Booking before the usage row; retrying the same key repairs a missing row. Locking and retry repair provide logical consistency, not a Sheets transaction.

## Sheets

Only Bookings, Promo Codes and Promo Usage are required. Exact columns and typed row mapping are in `server/sheets-schema.ts` and `server/booking-sheet.ts`. Customer details and proof URLs are in the Bookings row; proof bytes stay in private Google Drive. The live Promo Usage tab is already aligned to the documented 12-column lifecycle schema and has no historical rows requiring backfill.

InstaPay and Wallet require a validated image upload. The browser receives a signed, expiring receipt, never a selectable proof URL. The server verifies that receipt and stores its trusted Drive URL in Bookings. Neither the URL nor the receipt verifies that money was received; staff must review the transfer separately.

## Automated providers

- PayTabs Hosted Payment Page implements card payments in `server/paytabs-provider.ts`.
- EasyKash Hosted Direct Payment implements installments in `server/easykash-provider.ts`.

## PayTabs Egypt card payments

Card checkout creates the durable booking first, then calls `/api/payments/paytabs/initiate` with the existing order-access bearer token. The server loads the authoritative order and customer record, requests a Hosted Payment Page from `https://secure-egypt.paytabs.com/payment/request`, persists `paytabs`, `tran_ref`, redirect URL and `waiting_payment`, and returns only the validated redirect URL.

Configure server-only `PAYTABS_PROFILE_ID`, `PAYTABS_SERVER_KEY`, and `PAYTABS_BASE_URL=https://secure-egypt.paytabs.com`. `NEXT_PUBLIC_SITE_URL` is the existing canonical public origin used to build callback and return URLs. PayTabs callbacks require that origin to be publicly reachable over HTTPS; local development needs a separately managed HTTPS tunnel and no tunnel is created by this project.

The callback verifies `Signature` against the exact raw request body with HMAC-SHA256 and the Server Key before parsing JSON. It then verifies profile, cart/order ID, `tran_ref`, EGP currency and authoritative amount before an idempotent transition. The browser return endpoint only redirects to the existing secure status page and cannot mark an order paid.

## EasyKash hosted installments

Installment checkout creates the durable booking first, then calls `/api/payments/easykash/initiate` with the existing order-access bearer token. The server loads the authoritative order and customer record, requests Hosted Direct Payment from `https://back.easykash.net/api/directpayv1/pay`, persists `easykash`, the hosted redirect URL, any reference returned at initiation, and `waiting_payment`, then returns only the validated EasyKash URL.

Configure server-only `EASYKASH_API_KEY` and `EASYKASH_BASE_URL=https://back.easykash.net`. Hosted Direct Payment requests intentionally omit `paymentOptions`, allowing EasyKash to present every payment method currently enabled for the production business account. `EASYKASH_HMAC_SECRET` is optional but must contain a real merchant HMAC secret when set: never use the API key or the dashboard string `Null`. `EASYKASH_INSTALLMENT_PAYMENT_METHODS` is an optional comma-separated allowlist of callback `PaymentMethod` labels. While the allowlist is empty, a non-empty method is accepted only from a signed callback or authenticated inquiry for the already-persisted EasyKash session.

Configure the merchant callback URL in EasyKash as `${NEXT_PUBLIC_SITE_URL}/api/payments/easykash/callback`. When a real HMAC secret exists, the callback verifies `signatureHash` using HMAC-SHA512 over `ProductCode + Amount + ProductType + PaymentMethod + status + easykashRef + customerReference`. When no HMAC secret exists, callback fields are untrusted and only trigger `POST https://back.easykash.net/api/cash-api/inquire` using the server-side API key in the raw `authorization` header and `{ customerReference }` body. Only the inquiry response supplies status, amount, method and EasyKash reference; a callback reference, when supplied, must match it. The result is correlated with the existing installment order before an idempotent transition. Inquiry failure or ambiguity leaves the order waiting and retryable. `PAID` can commit paid; `NEW`/pending states remain waiting; terminal failure, expiry, cancellation and refund signals never become Purchase. The browser return endpoint only redirects to the secure status page and cannot mark an order paid.

Local callbacks require a separately managed public HTTPS endpoint; this project does not create a tunnel. Before live testing, enable the intended payment methods for the production business account in EasyKash, optionally configure their callback method labels in `EASYKASH_INSTALLMENT_PAYMENT_METHODS`, and ensure the deployed Apps Script includes the EasyKash provider transition validation in this repository.

The checkout shows a compact, informational provider grid for NBE (6/12/18 months), ValU, Aman, Souhoola, Contact, Tru, and Klivvr. These cards are deliberately non-interactive and never select a provider or modify the EasyKash request. EasyKash is shown only as the hosted payment gateway. The observed EasyKash hosted-page provider-selection limitation remains separate merchant/integration work.

## WhatsApp assistance

`src/lib/utm.ts` owns the single WhatsApp destination fallback and the Arabic/English page-context message builder. Normal customer pages render one floating control through `SitePageShell`; the standalone home, placement-test, and thank-you shells use the same component and builder. Contexts cover home, plans, package review, payment, customer-visible order status, placement test, blog/article, business, legal, and thank-you. Optional package/article text is length-limited and normalized, and order status accepts only a customer-visible `SA-XXXXXXXX` reference. Access tokens, proof URLs, snapshots, hashes, and provider secrets are never passed to this builder.

`NEXT_PUBLIC_WHATSAPP_NUMBER` remains the optional centralized deployment override. When it is absent, the established repository fallback is `201204006361`. Do not add page-local destination numbers.

The `Bookings` contract ends with these protected provider fields in this exact order: `Payment_Provider`, `Provider_Transaction_ID`, `Payment_Redirect_URL`, `Payment_Updated_At`. Program type remains explicit in the immutable `Order_Snapshot`; it is not duplicated as a standalone Sheet column. Historical snapshots without `programType` normalize to `group` when read, and the original `Order_Snapshot` is never rewritten.
- Manual payment verification transitions an order to `waiting_verification`; staff approval supplies a transaction/verification reference before `paid`.
- Email, WhatsApp Business, and Calendar integrations implement `NotificationService` and run only after a durable order transition.
- A paid order can produce an `EnrollmentDraft`; payment and enrollment remain separate records.
- PostgreSQL can replace `GoogleSheetsOrderRepository` without changing `OrderService`.
